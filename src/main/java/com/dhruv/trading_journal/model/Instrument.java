package com.dhruv.trading_journal.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "instrument", indexes = {
        @Index(name = "idx_instrument_type_symbol", columnList = "type, symbol"),
        @Index(name = "idx_instrument_opt_combo", columnList = "type, underlying_symbol, option_right, strike, expiration")
})
public class Instrument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String type; // 'EQUITY' | 'OPTION'

    @Column(name = "series_key", unique = true)
    private String seriesKey;

    private String symbol;               // equity
    @Column(name = "underlying_symbol")
    private String underlyingSymbol;     // option
    @Column(name = "option_right")
    private String optionRight;          // 'CALL' | 'PUT'

    private BigDecimal strike;           // option
    private LocalDate expiration;        // option

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime updatedAt;
}
