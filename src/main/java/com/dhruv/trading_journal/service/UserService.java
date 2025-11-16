package com.dhruv.trading_journal.service;

import com.dhruv.trading_journal.dto.UserDTO;
import com.dhruv.trading_journal.model.UserAuth;
import com.dhruv.trading_journal.repository.UserAuthRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserAuthRepository users;

    @Transactional
    public UserDTO.View create(UserDTO.Create in) {
        if (users.existsByEmail(in.email())) {
            throw new IllegalArgumentException("email already exists");
        }
        UserAuth u = UserAuth.builder()
                .email(in.email())
                .name(in.name())
                .password(in.password())  // plain for now; hash later
                .isActive(in.isActive() == null ? Boolean.TRUE : in.isActive())
                .build();
        users.save(u);
        return toView(u);
    }

    @Transactional(readOnly = true)
    public UserDTO.View get(Long id) {
        return users.findById(id).map(this::toView)
                .orElseThrow(() -> new EntityNotFoundException("user not found"));
    }

    @Transactional
    public UserDTO.View update(Long id, UserDTO.Update in) {
        UserAuth u = users.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("user not found"));
        if (in.name() != null) u.setName(in.name());
        if (in.password() != null) u.setPassword(in.password());
        if (in.isActive() != null) u.setIsActive(in.isActive());
        return toView(u);
    }

    @Transactional
    public void delete(Long id) {
        users.deleteById(id);
    }

    private UserDTO.View toView(UserAuth u) {
        return new UserDTO.View(u.getId(), u.getEmail(), u.getName(), u.getIsActive());
    }
}
