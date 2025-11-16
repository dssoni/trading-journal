package com.dhruv.trading_journal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public final class TradeFillDTO {

    public record Create(
            @NotNull Long tradeId,
            @NotBlank String side, // BUY or SELL
            @NotNull BigDecimal qty,
            @NotNull BigDecimal price,
            BigDecimal commission,
            BigDecimal fees,
            OffsetDateTime executedAt
    ) {}

    public record View(
            Long id,
            Long tradeId,
            String side,
            BigDecimal qty,
            BigDecimal price,
            OffsetDateTime executedAt,
            BigDecimal commission,
            BigDecimal fees,
            BigDecimal realizedGrossPnl,
            BigDecimal realizedNetPnl,
            BigDecimal remainingAfterFill
    ) {}
}
