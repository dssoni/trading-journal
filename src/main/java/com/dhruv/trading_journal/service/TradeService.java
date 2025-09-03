package com.dhruv.trading_journal.service;

import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.stereotype.Service;

import com.dhruv.trading_journal.model.Trade;
import com.dhruv.trading_journal.model.TradeStatus;
import com.dhruv.trading_journal.repository.TradeRepository;

@Service
public class TradeService {

    private final TradeRepository tradeRepository;

    public TradeService(TradeRepository tradeRepository) {
        this.tradeRepository = tradeRepository;
    }

    // Create new trade
    public Trade createTrade(Trade trade) {
        // TODO ...
        // Calculate daysHeld if exitDate present
        // set trade status
        // set defaults - entry date, time etc.
        calculateDaysHeld(trade);
        trade.setTradeStatus(TradeStatus.OPEN);
        return tradeRepository.save(trade);
    }

    // Get all trades
    public List<Trade> getAllTrades() {
        return tradeRepository.findAll();
    }

    // Get trade by id
    public Trade getTradeById(Long id) {
        return tradeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trade not found with id: " + id));
    }

    // Update trade
    public Trade updateTrade(Long id, Trade trade) {
        Trade existingTrade = tradeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trade not found with id: " + id));

        existingTrade.setSymbol(trade.getSymbol());
        existingTrade.setEntryDate(trade.getEntryDate());
        existingTrade.setEntryPrice(trade.getEntryPrice());
        existingTrade.setEntryTime(trade.getEntryTime());
        existingTrade.setPositionSize(trade.getPositionSize());
        existingTrade.setExitDate(trade.getExitDate());
        existingTrade.setExitPrice(trade.getExitPrice());
        existingTrade.setExitTime(trade.getExitTime());
        existingTrade.setCommission(trade.getCommission());
        existingTrade.setBroker(trade.getBroker());
        existingTrade.setTradeStatus(trade.getTradeStatus());
        existingTrade.setNotes(trade.getNotes());
        existingTrade.setOptionType(trade.getOptionType());
        existingTrade.setAssetType(trade.getAssetType());

        // Recalculate daysHeld on update
        calculateDaysHeld(existingTrade);

        return tradeRepository.save(existingTrade);
    }

    // Close trade by id
    public Trade closeTrade(Long id) {
        Trade existingTrade = tradeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trade not found with id: " + id));
        existingTrade.setTradeStatus(TradeStatus.CLOSED);
        // TODO ...
        // SET P&L
        // OPEN POPUP TO ENTER MORE DETAILS ETC.
        return tradeRepository.save(existingTrade);
    }

    // Delete trade by id
    public void deleteTrade(Long id) {
        Trade trade = tradeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trade not found with id: " + id));
        tradeRepository.delete(trade);
    }

    // Private helper to calculate days held
    private void calculateDaysHeld(Trade trade) {
        if (trade.getEntryDate() != null && trade.getExitDate() != null) {
            long daysHeld = ChronoUnit.DAYS.between(trade.getEntryDate(), trade.getExitDate());
            trade.setDaysHeld((int) daysHeld);
        } else {
            trade.setDaysHeld(null);
        }
    }

}
