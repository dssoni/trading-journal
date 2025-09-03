package com.dhruv.trading_journal.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Trade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String symbol;

    @Enumerated(EnumType.STRING)
    private AssetType assetType;

    @Enumerated(EnumType.STRING)
    private OptionType optionType; // Nullable if assetType is STOCK

    private LocalDate entryDate;
    private LocalTime entryTime;

    private BigDecimal stockPriceAtEntry; // Display purpose

    private BigDecimal entryPrice; // Per contract/share
    private Integer positionSize;

    private LocalDate exitDate;
    private LocalTime exitTime;
    private BigDecimal exitPrice;

    private Integer daysHeld; // Derived field

    @Enumerated(EnumType.STRING)
    private Broker broker;

    private BigDecimal commission; // Optional, default logic can be applied if null

    private BigDecimal profitLoss; // System-calculated
    private Boolean winLoss;       // System-calculated
    private BigDecimal investment; // System-calculated

    @Enumerated(EnumType.STRING)
    private TradeStatus tradeStatus;

    @Column(length = 1000)
    private String notes;

    // Add method to calculate derived values like profitLoss, investment, etc. in the service layer
}
