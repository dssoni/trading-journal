package com.dhruv.trading_journal.controller;

import com.dhruv.trading_journal.dto.UserDTO;
import com.dhruv.trading_journal.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserService users;

    @PostMapping
    public ResponseEntity<UserDTO.View> create(@RequestBody @Valid UserDTO.Create in) {
        return ResponseEntity.ok(users.create(in));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO.View> get(@PathVariable Long id) {
        return ResponseEntity.ok(users.get(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<UserDTO.View> update(@PathVariable Long id,
                                               @RequestBody @Valid UserDTO.Update in) {
        return ResponseEntity.ok(users.update(id, in));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        users.delete(id);
        return ResponseEntity.noContent().build();
    }
}
