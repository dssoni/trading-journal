package com.dhruv.trading_journal.controller;

import com.dhruv.trading_journal.dto.AccountDTO;
import com.dhruv.trading_journal.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accounts;

    @PostMapping
    public ResponseEntity<AccountDTO.View> create(@RequestBody @Valid AccountDTO.Create in) {
        return ResponseEntity.ok(accounts.create(in));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountDTO.View> get(@PathVariable Long id) {
        return ResponseEntity.ok(accounts.get(id));
    }

    @GetMapping("/by-user/{userId}")
    public ResponseEntity<List<AccountDTO.View>> listByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(accounts.listByUser(userId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<AccountDTO.View> update(@PathVariable Long id,
                                                  @RequestBody @Valid AccountDTO.Update in) {
        return ResponseEntity.ok(accounts.update(id, in));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        accounts.delete(id);
        return ResponseEntity.noContent().build();
    }
}
