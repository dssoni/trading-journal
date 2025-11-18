package com.dhruv.trading_journal.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "trade", indexes = {
        @Index(name = "idx_trade_user_acct_instr_status", columnList = "user_id, account_id, instrument_id, status"),
        @Index(name = "idx_trade_acct_instr_entry_at", columnList = "account_id, instrument_id, entry_at")
})
public class Trade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAuth user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "instrument_id", nullable = false)
    private Instrument instrument;

    @Column(name = "entry_qty")
    private BigDecimal entryQty;

    @Column(name = "entry_price")
    private BigDecimal entryPrice;

    @Column(name = "entry_at")
    private OffsetDateTime entryAt;

    @Column(name = "remaining_qty")
    private BigDecimal remainingQty;

    @Column(name = "realized_gross_pnl", insertable = false)
    private BigDecimal realizedGrossPnl;

    @Column(name = "realized_net_pnl", insertable = false)
    private BigDecimal realizedNetPnl;

    @Column(nullable = false)
    private String status; // 'OPEN' | 'PARTIAL' | 'CLOSED'

    private String notes;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime updatedAt;
}
