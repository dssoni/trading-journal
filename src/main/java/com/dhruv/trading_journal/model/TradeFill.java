package com.dhruv.trading_journal.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "trade_fill", indexes = {
        @Index(name = "idx_trade_fill_trade_time", columnList = "trade_id, executed_at"),
        @Index(name = "idx_trade_fill_executed_at", columnList = "executed_at")
})
public class TradeFill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trade_id", nullable = false)
    private Trade trade;

    @Column(nullable = false)
    private String side; // 'BUY' | 'SELL'

    @Column(nullable = false)
    private BigDecimal qty;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "executed_at")
    private OffsetDateTime executedAt;

    private BigDecimal commission;
    private BigDecimal fees;

    @Column(name = "realized_gross_pnl")
    private BigDecimal realizedGrossPnl;

    @Column(name = "realized_net_pnl")
    private BigDecimal realizedNetPnl;

    @Column(name = "remaining_after_fill")
    private BigDecimal remainingAfterFill;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;
}
