package com.dhruv.trading_journal.controller;

import com.dhruv.trading_journal.dto.TradeDTO;
import com.dhruv.trading_journal.dto.TradeFillDTO;
import com.dhruv.trading_journal.service.TradeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/trades")
public class TradeController {

    private final TradeService trades;

    @PostMapping
    public ResponseEntity<TradeDTO.View> create(@RequestBody @Valid TradeDTO.Create in) {
        return ResponseEntity.ok(trades.create(in));
    }

    @GetMapping("/by-user/{userId}")
    public ResponseEntity<List<TradeDTO.View>> listByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(trades.listByUser(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TradeDTO.View> get(@PathVariable Long id) {
        return ResponseEntity.ok(trades.get(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TradeDTO.View> update(@PathVariable Long id,
                                                @RequestBody @Valid TradeDTO.Update in) {
        return ResponseEntity.ok(trades.update(id, in));
    }

    @PostMapping("/{id}/fills")
    public ResponseEntity<TradeFillDTO.View> addFill(@PathVariable Long id,
                                                     @RequestBody @Valid TradeFillDTO.Create in) {
        if (in.tradeId() == null || !in.tradeId().equals(id)) {
            in = new TradeFillDTO.Create(id, in.side(), in.qty(), in.price(), in.commission(), in.fees(), in.executedAt());
        }
        return ResponseEntity.ok(trades.addFill(in));
    }

    @GetMapping("/{id}/fills")
    public ResponseEntity<List<TradeFillDTO.View>> listFills(@PathVariable Long id) {
        return ResponseEntity.ok(trades.listFills(id));
    }
}
