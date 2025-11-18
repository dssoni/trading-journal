package com.dhruv.trading_journal.repository;

import com.dhruv.trading_journal.model.Instrument;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InstrumentRepository extends JpaRepository<Instrument, Long> {
    Optional<Instrument> findBySeriesKey(String seriesKey);
}
