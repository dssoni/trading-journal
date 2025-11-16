package com.dhruv.trading_journal.dto;

import java.math.BigDecimal;

public final class PositionDTO {
    public record View(
            Long id,
            Long accountId,
            Long instrumentId,
            BigDecimal qty,
            BigDecimal avgCost
    ) {}
}
