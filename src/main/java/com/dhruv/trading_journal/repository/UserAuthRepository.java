package com.dhruv.trading_journal.repository;

import com.dhruv.trading_journal.model.UserAuth;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserAuthRepository extends JpaRepository<UserAuth, Long> {
    Optional<UserAuth> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<UserAuth> findByEmailAndPassword(String email, String password); // dev-only plaintext
}
