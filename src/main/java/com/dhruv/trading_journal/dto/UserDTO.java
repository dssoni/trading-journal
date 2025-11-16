package com.dhruv.trading_journal.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class UserDTO {

    public record Create(
            @NotBlank @Email String email,
            String name,
            @NotBlank String password,
            Boolean isActive
    ) { }

    public record Update(
            String name,
            String password,
            Boolean isActive
    ) { }

    public record View(
            Long id,
            String email,
            String name,
            Boolean isActive
    ) { }
}
