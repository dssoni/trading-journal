package com.dhruv.trading_journal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AccountDTO {

    public record Create(
            @NotNull Long userId,
            @NotBlank String name,
            String broker,
            String baseCurrency,
            String costBasisMethod,
            String timezone,
            Boolean isActive
    ) { }

    public record Update(
            String name,
            String broker,
            String baseCurrency,
            String costBasisMethod,
            String timezone,
            Boolean isActive
    ) { }

    public record View(
            Long id,
            Long userId,
            String name,
            String broker,
            String baseCurrency,
            String costBasisMethod,
            String timezone,
            Boolean isActive
    ) { }
}
