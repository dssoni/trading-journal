package com.dhruv.trading_journal.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;

public final class InstrumentDTO {

    public record Create(
            @NotBlank String type,
            String seriesKey,
            String symbol,
            String underlyingSymbol,
            String optionRight,
            BigDecimal strike,
            LocalDate expiration
    ) {}

    public record Update(
            String seriesKey,
            String symbol,
            String underlyingSymbol,
            String optionRight,
            BigDecimal strike,
            LocalDate expiration
    ) {}

    public record View(
            Long id,
            String type,
            String seriesKey,
            String symbol,
            String underlyingSymbol,
            String optionRight,
            BigDecimal strike,
            LocalDate expiration
    ) {}
}
