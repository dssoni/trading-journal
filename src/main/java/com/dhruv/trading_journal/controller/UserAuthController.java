package com.dhruv.trading_journal.controller;

import com.dhruv.trading_journal.dto.LoginRequest;
import com.dhruv.trading_journal.dto.LoginResponse;
import com.dhruv.trading_journal.model.UserAuth;
import com.dhruv.trading_journal.repository.UserAuthRepository;
import com.dhruv.trading_journal.service.EmailService;
import com.dhruv.trading_journal.service.JwtUtil;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth") // URLs start with /api/auth/...
public class UserAuthController {

    private final UserAuthRepository userAuthRepo;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Value("${app.base-url}")
    private String baseUrl;

    // Constructor injection for clean wiring and testability
    public UserAuthController(UserAuthRepository userAuthRepo, JwtUtil jwtUtil, EmailService emailService) {
        this.userAuthRepo = userAuthRepo;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    /**
     * POST /api/auth/request-link
     * Called from your sign-in form. User types email/name, submits.
     * This endpoint:
     *  1. Finds existing user by email or creates new user.
     *  2. Creates a magic login token (JWT) valid for 10 mins.
     *  3. Emails the token as a clickable sign-in link to user.
     *  4. Always responds with success message (never exposes if email exists).
     */
    @PostMapping("/request-link")
    public ResponseEntity<LoginResponse> requestMagicLink(@RequestBody LoginRequest req) {
        // Find or create the user for this email
        UserAuth user = userAuthRepo.findByEmail(req.getEmail())
                .orElseGet(() -> userAuthRepo.save(
                        new UserAuth(
                                null, // id auto-generated
                                req.getEmail(),
                                req.getName(),
                                true, // isActive
                                null, // add fields as needed for your entity
                                null
                        )
                ));

        // Create JWT token for login magic link - expires in 10 min
        String token = jwtUtil.createLoginToken(user.getId(), user.getEmail());

        // Construct login link. In production, use your real domain.
        String link = baseUrl + "/api/auth/verify-link?token=" + token;

        // Send magic link to user's email inbox
        emailService.send(user.getEmail(), "Sign in to Trading Journal", "Click here to sign in: " + link);

        // Respond to frontend (NEVER reveal if email is valid/known)
        return ResponseEntity.ok(new LoginResponse("Magic login link sent. Check your email!"));
    }

    /**
     * GET /api/auth/verify-link?token=xyz
     * Called when user clicks the magic link from their email.
     * This endpoint:
     *  1. Verifies and parses the JWT token.
     *  2. Gets user info from DB, ensures user exists.
     *  3. Sets secure session token cookie (JWT).
     *  4. Responds OK or fails with a message.
     */
    @GetMapping("/verify-link")
    public void verifyMagicLink(
            @RequestParam("token") String token,
            HttpServletResponse response
    ) throws IOException {
        // STEP 1: Validate/Decode the login token
        JwtUtil.JwtPayload payload = jwtUtil.verifyLoginToken(token);

        // STEP 2: Find user using userId from payload
        Optional<UserAuth> userOpt = userAuthRepo.findById(payload.getUserId());
        if (userOpt.isEmpty()) {
            // Set a short error cookie and redirect to a login error page
            response.addHeader("Set-Cookie",
                    "login_error=invalid; Path=/; HttpOnly; Max-Age=30; SameSite=Strict");
            response.sendRedirect("/login?error=invalid_token");
            return;
        }

        // STEP 3: Create secure session JWT
        UserAuth user = userOpt.get();
        String sessionJwt = jwtUtil.createSessionToken(user.getId(), user.getEmail());

        // STEP 4: Set the session JWT as an HttpOnly, Secure cookie
        String cookie =
                "session=" + sessionJwt +
                        "; HttpOnly; Secure; SameSite=Strict; Path=/";
        response.addHeader("Set-Cookie", cookie);

        // STEP 5: Redirect to dashboard/home (SPA should pick up session cookie)
        response.sendRedirect("/index.html");
    }

    @GetMapping("/me")
    public ResponseEntity<UserAuth> getMe(@CookieValue(value = "session", required = false) String sessionJwt) {
        if (sessionJwt == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        JwtUtil.JwtPayload payload;
        try {
            payload = jwtUtil.verifySessionToken(sessionJwt);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<UserAuth> userOpt = userAuthRepo.findById(payload.getUserId());
        return userOpt.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    @PostMapping("/logout")
    public void logout(HttpServletResponse response) {
        // Invalidate cookie by setting Max-Age=0 (delete it)
        response.addHeader("Set-Cookie",
                "session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict");
        response.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

}
