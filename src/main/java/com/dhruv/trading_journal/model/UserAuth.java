package com.dhruv.trading_journal.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Entity
@Table(name = "user_auth", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_auth_email", columnNames = {"email"})
})
public class UserAuth {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) // unique handled by table constraint
    private String email;

    private String name;

    // NOTE: plain text for now; we'll add hashing later
    private String password;

    @Column(nullable = false)
    private Boolean isActive = Boolean.TRUE;

    // managed in DB via defaults/triggers; keep nullable in JPA
    @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
    private OffsetDateTime createdAt;
    @Column(name = "updated_at", nullable = false, updatable = false, insertable = false)
    private OffsetDateTime updatedAt;
}
