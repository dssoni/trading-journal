package com.dhruv.trading_journal.repository;

import com.dhruv.trading_journal.model.TradeFill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TradeFillRepository extends JpaRepository<TradeFill, Long> {
    List<TradeFill> findByTradeIdOrderByExecutedAtAsc(Long tradeId);
}
