package com.dhruv.trading_journal.service;

import com.dhruv.trading_journal.dto.InstrumentDTO;
import com.dhruv.trading_journal.model.Instrument;
import com.dhruv.trading_journal.repository.InstrumentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InstrumentService {

    private final InstrumentRepository instruments;

    @Transactional
    public InstrumentDTO.View create(InstrumentDTO.Create in) {
        Instrument i = Instrument.builder()
                .type(in.type())
                .seriesKey(in.seriesKey())
                .symbol(in.symbol())
                .underlyingSymbol(in.underlyingSymbol())
                .optionRight(in.optionRight())
                .strike(in.strike())
                .expiration(in.expiration())
                .build();
        instruments.save(i);
        return toView(i);
    }

    @Transactional(readOnly = true)
    public InstrumentDTO.View get(Long id) {
        Instrument i = instruments.findById(id).orElseThrow(() -> new EntityNotFoundException("instrument not found"));
        return toView(i);
    }

    @Transactional
    public InstrumentDTO.View update(Long id, InstrumentDTO.Update in) {
        Instrument i = instruments.findById(id).orElseThrow(() -> new EntityNotFoundException("instrument not found"));
        if (in.seriesKey() != null) i.setSeriesKey(in.seriesKey());
        if (in.symbol() != null) i.setSymbol(in.symbol());
        if (in.underlyingSymbol() != null) i.setUnderlyingSymbol(in.underlyingSymbol());
        if (in.optionRight() != null) i.setOptionRight(in.optionRight());
        if (in.strike() != null) i.setStrike(in.strike());
        if (in.expiration() != null) i.setExpiration(in.expiration());
        return toView(i);
    }

    public List<InstrumentDTO.View> getAll() {
        // Return all instruments.
        return instruments.findAll().stream().map(this::toView).collect(Collectors.toList());
    }

    private InstrumentDTO.View toView(Instrument i) {
        return new InstrumentDTO.View(i.getId(), i.getType(), i.getSeriesKey(), i.getSymbol(),
                i.getUnderlyingSymbol(), i.getOptionRight(), i.getStrike(), i.getExpiration());
    }
}
