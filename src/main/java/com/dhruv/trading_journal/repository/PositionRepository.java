package com.dhruv.trading_journal.repository;

import com.dhruv.trading_journal.model.Account;
import com.dhruv.trading_journal.model.Instrument;
import com.dhruv.trading_journal.model.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PositionRepository extends JpaRepository<Position, Long> {
    Optional<Position> findByAccountAndInstrument(Account account, Instrument instrument);
}
