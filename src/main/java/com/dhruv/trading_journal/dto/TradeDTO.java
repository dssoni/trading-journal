package com.dhruv.trading_journal.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public final class TradeDTO {

    public record Create(
            @NotNull Long userId,
            @NotNull Long accountId,
            @NotNull Long instrumentId,
            BigDecimal entryQty,
            BigDecimal entryPrice,
            OffsetDateTime entryAt,
            String status,
            String notes
    ) {}

    public record Update(
            String status,
            String notes
    ) {}

    public record View(
            Long id,
            Long userId,
            Long accountId,
            Long instrumentId,
            BigDecimal entryQty,
            BigDecimal entryPrice,
            OffsetDateTime entryAt,
            BigDecimal remainingQty,
            BigDecimal realizedGrossPnl,
            BigDecimal realizedNetPnl,
            String status,
            String notes
    ) {}
}
