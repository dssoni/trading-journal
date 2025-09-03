package com.dhruv.trading_journal.repository;

import com.dhruv.trading_journal.model.Trade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TradeRepository extends JpaRepository<Trade, Long> {
    // Add custom queries here if needed
}
