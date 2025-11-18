package com.dhruv.trading_journal.controller;

import com.dhruv.trading_journal.dto.InstrumentDTO;
import com.dhruv.trading_journal.service.InstrumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/instruments")
public class InstrumentController {

    private final InstrumentService instruments;

    @PostMapping
    public ResponseEntity<InstrumentDTO.View> create(@RequestBody @Valid InstrumentDTO.Create in) {
        return ResponseEntity.ok(instruments.create(in));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InstrumentDTO.View> get(@PathVariable Long id) {
        return ResponseEntity.ok(instruments.get(id));
    }

    @GetMapping("/all")
    public ResponseEntity<List<InstrumentDTO.View>> getAll() {
        return ResponseEntity.ok(instruments.getAll());
    }


    @PatchMapping("/{id}")
    public ResponseEntity<InstrumentDTO.View> update(@PathVariable Long id,
                                                     @RequestBody @Valid InstrumentDTO.Update in) {
        return ResponseEntity.ok(instruments.update(id, in));
    }
}
