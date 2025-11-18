package com.dhruv.trading_journal.service;

import com.dhruv.trading_journal.dto.AccountDTO;
import com.dhruv.trading_journal.model.Account;
import com.dhruv.trading_journal.model.UserAuth;
import com.dhruv.trading_journal.repository.AccountRepository;
import com.dhruv.trading_journal.repository.UserAuthRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accounts;
    private final UserAuthRepository users;

    @Transactional
    public AccountDTO.View create(AccountDTO.Create in) {
        UserAuth user = users.findById(in.userId())
                .orElseThrow(() -> new EntityNotFoundException("user not found"));
        if (accounts.existsByUserAndName(user, in.name())) {
            throw new IllegalArgumentException("account name already exists for user");
        }
        Account a = Account.builder()
                .user(user)
                .name(in.name())
                .broker(in.broker())
                .baseCurrency(in.baseCurrency())
                .costBasisMethod(in.costBasisMethod())
                .timezone(in.timezone())
                .isActive(in.isActive())
                .build();
        accounts.save(a);
        return toView(a);
    }

    @Transactional(readOnly = true)
    public List<AccountDTO.View> listByUser(Long userId) {
        return accounts.findByUserId(userId).stream().map(this::toView).toList();
    }

    @Transactional(readOnly = true)
    public AccountDTO.View get(Long id) {
        Account a = accounts.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("account not found"));
        return toView(a);
    }

    @Transactional
    public AccountDTO.View update(Long id, AccountDTO.Update in) {
        Account a = accounts.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("account not found"));
        if (in.name() != null) a.setName(in.name());
        if (in.broker() != null) a.setBroker(in.broker());
        if (in.baseCurrency() != null) a.setBaseCurrency(in.baseCurrency());
        if (in.costBasisMethod() != null) a.setCostBasisMethod(in.costBasisMethod());
        if (in.timezone() != null) a.setTimezone(in.timezone());
        if (in.isActive() != null) a.setIsActive(in.isActive());
        return toView(a);
    }

    @Transactional
    public void delete(Long id) {
        accounts.deleteById(id);
    }

    private AccountDTO.View toView(Account a) {
        return new AccountDTO.View(
                a.getId(),
                a.getUser().getId(),
                a.getName(),
                a.getBroker(),
                a.getBaseCurrency(),
                a.getCostBasisMethod(),
                a.getTimezone(),
                a.getIsActive()
        );
    }
}
