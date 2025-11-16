package com.dhruv.trading_journal.repository;

import com.dhruv.trading_journal.model.Trade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TradeRepository extends JpaRepository<Trade, Long> {
    // in TradeRepository.java
    List<Trade> findByUserId(Long userId);

}
