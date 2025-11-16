package com.dhruv.trading_journal.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Entity
@Table(name = "account", uniqueConstraints = {
        @UniqueConstraint(name = "uq_account_user_name", columnNames = {"user_id", "name"})
})
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // IMPORTANT: references user_auth(id)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "account_user_id_fkey"))
    private UserAuth user;

    @Column(nullable = false)
    private String name;

    private String broker;
    private String baseCurrency;
    private String costBasisMethod;
    private String timezone;
    private Boolean isActive;

    @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
    private OffsetDateTime createdAt;
    @Column(name = "updated_at", nullable = false, updatable = false, insertable = false)
    private OffsetDateTime updatedAt;
}
