package com.dhruv.trading_journal.repository;

import com.dhruv.trading_journal.model.Account;
import com.dhruv.trading_journal.model.UserAuth;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountRepository extends JpaRepository<Account, Long> {
    boolean existsByUserAndName(UserAuth user, String name);
    List<Account> findByUserId(Long userId);
}
