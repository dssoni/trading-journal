package com.dhruv.trading_journal.service;

import com.dhruv.trading_journal.dto.TradeDTO;
import com.dhruv.trading_journal.dto.TradeFillDTO;
import com.dhruv.trading_journal.model.*;
import com.dhruv.trading_journal.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TradeService {

    private final TradeRepository trades;
    private final TradeFillRepository fills;
    private final UserAuthRepository users;
    private final AccountRepository accounts;
    private final InstrumentRepository instruments;
    private final PositionRepository positions;

    private static final MathContext MC = MathContext.DECIMAL64;

    @Transactional
    public TradeDTO.View create(TradeDTO.Create in) {
        UserAuth user = users.findById(in.userId()).orElseThrow(() -> new EntityNotFoundException("user not found"));
        Account account = accounts.findById(in.accountId()).orElseThrow(() -> new EntityNotFoundException("account not found"));
        Instrument instrument = instruments.findById(in.instrumentId()).orElseThrow(() -> new EntityNotFoundException("instrument not found"));

        Trade t = Trade.builder()
                .user(user)
                .account(account)
                .instrument(instrument)
                .entryQty(in.entryQty())
                .entryPrice(in.entryPrice())
                .entryAt(in.entryAt() != null ? in.entryAt() : OffsetDateTime.now())
                .remainingQty(in.entryQty())
                .status(in.status() == null ? "OPEN" : in.status())
                .notes(in.notes())
                .build();
        trades.save(t);
        return toView(t);
    }

    @Transactional(readOnly = true)
    public TradeDTO.View get(Long id) {
        Trade t = trades.findById(id).orElseThrow(() -> new EntityNotFoundException("trade not found"));
        return toView(t);
    }

    @Transactional
    public TradeDTO.View update(Long id, TradeDTO.Update in) {
        Trade t = trades.findById(id).orElseThrow(() -> new EntityNotFoundException("trade not found"));
        if (in.status() != null) t.setStatus(in.status());
        if (in.notes() != null) t.setNotes(in.notes());
        return toView(t);
    }

    public List<TradeDTO.View> listByUser(Long userId) {
        return trades.findByUserId(userId)
                .stream()
                .map(this::toView)
                .collect(Collectors.toList());
    }

    @Transactional
    public TradeFillDTO.View addFill(TradeFillDTO.Create in) {
        Trade t = trades.findById(in.tradeId()).orElseThrow(() -> new EntityNotFoundException("trade not found"));
        BigDecimal qty = in.qty();
        BigDecimal price = in.price();
        BigDecimal commission = in.commission() == null ? BigDecimal.ZERO : in.commission();
        BigDecimal fees = in.fees() == null ? BigDecimal.ZERO : in.fees();
        OffsetDateTime ts = in.executedAt() != null ? in.executedAt() : OffsetDateTime.now();

        BigDecimal gross = BigDecimal.ZERO;
        if ("SELL".equalsIgnoreCase(in.side()) && t.getEntryPrice() != null && qty != null) {
            gross = price.subtract(t.getEntryPrice(), MC).multiply(qty, MC);
        }
        BigDecimal net = gross.subtract(commission, MC).subtract(fees, MC);

        BigDecimal remaining = t.getRemainingQty() == null ? BigDecimal.ZERO : t.getRemainingQty();
        if ("SELL".equalsIgnoreCase(in.side())) {
            remaining = remaining.subtract(qty, MC);
        } else if ("BUY".equalsIgnoreCase(in.side())) {
            remaining = remaining.add(qty, MC);
        }
        t.setRemainingQty(remaining);

        BigDecimal realizedGross = t.getRealizedGrossPnl() == null ? BigDecimal.ZERO : t.getRealizedGrossPnl();
        BigDecimal realizedNet   = t.getRealizedNetPnl() == null ? BigDecimal.ZERO : t.getRealizedNetPnl();
        realizedGross = realizedGross.add(gross, MC);
        realizedNet   = realizedNet.add(net, MC);
        t.setRealizedGrossPnl(realizedGross);
        t.setRealizedNetPnl(realizedNet);

        if (remaining.signum() == 0) t.setStatus("CLOSED");
        else t.setStatus("PARTIAL");

        TradeFill f = TradeFill.builder()
                .trade(t)
                .side(in.side().toUpperCase())
                .qty(qty)
                .price(price)
                .commission(commission)
                .fees(fees)
                .executedAt(ts)
                .realizedGrossPnl(gross)
                .realizedNetPnl(net)
                .remainingAfterFill(remaining)
                .build();
        fills.save(f);

        upsertPosition(t, in.side(), qty, price);

        return new TradeFillDTO.View(
                f.getId(), t.getId(), f.getSide(), f.getQty(), f.getPrice(), f.getExecutedAt(),
                f.getCommission(), f.getFees(), f.getRealizedGrossPnl(), f.getRealizedNetPnl(), f.getRemainingAfterFill()
        );
    }

    private void upsertPosition(Trade t, String side, BigDecimal qty, BigDecimal price) {
        Position pos = positions.findByAccountAndInstrument(t.getAccount(), t.getInstrument())
                .orElse(Position.builder().account(t.getAccount()).instrument(t.getInstrument())
                        .qty(BigDecimal.ZERO).avgCost(BigDecimal.ZERO).build());

        BigDecimal oldQty = pos.getQty() == null ? BigDecimal.ZERO : pos.getQty();
        BigDecimal oldAvg = pos.getAvgCost() == null ? BigDecimal.ZERO : pos.getAvgCost();

        if ("BUY".equalsIgnoreCase(side)) {
            BigDecimal newQty = oldQty.add(qty, MC);
            BigDecimal newCost = (oldAvg.multiply(oldQty, MC)).add(price.multiply(qty, MC), MC);
            BigDecimal newAvg = newQty.signum() == 0 ? BigDecimal.ZERO : newCost.divide(newQty, MC);
            pos.setQty(newQty);
            pos.setAvgCost(newAvg);
        } else if ("SELL".equalsIgnoreCase(side)) {
            BigDecimal newQty = oldQty.subtract(qty, MC);
            pos.setQty(newQty);
            if (newQty.signum() == 0) pos.setAvgCost(BigDecimal.ZERO);
        }

        positions.save(pos);
    }

    @Transactional(readOnly = true)
    public List<TradeFillDTO.View> listFills(Long tradeId) {
        return fills.findByTradeIdOrderByExecutedAtAsc(tradeId).stream().map(f ->
                new TradeFillDTO.View(
                        f.getId(), f.getTrade().getId(), f.getSide(), f.getQty(), f.getPrice(), f.getExecutedAt(),
                        f.getCommission(), f.getFees(), f.getRealizedGrossPnl(), f.getRealizedNetPnl(), f.getRemainingAfterFill()
                )).toList();
    }

    private TradeDTO.View toView(Trade t) {
        return new TradeDTO.View(
                t.getId(),
                t.getUser().getId(),
                t.getAccount().getId(),
                t.getInstrument().getId(),
                t.getEntryQty(),
                t.getEntryPrice(),
                t.getEntryAt(),
                t.getRemainingQty(),
                t.getRealizedGrossPnl(),
                t.getRealizedNetPnl(),
                t.getStatus(),
                t.getNotes()
        );
    }
}
