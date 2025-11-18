package com.dhruv.trading_journal.service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.JWTVerifier;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Date;

@Service
public class JwtUtil {
    private static final String SECRET = "your-super-secret-key"; // replace with env var!
    private static final Algorithm ALG = Algorithm.HMAC256(SECRET);

    // Creates a short-lived token for login magic link
    public String createLoginToken(Long userId, String email) {
        Instant now = Instant.now();
        // expires in 10 minutes
        Instant exp = now.plusSeconds(600);
        return JWT.create()
                .withSubject(email)
                .withClaim("userId", userId)
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(exp))
                .sign(ALG);
    }

    // Verifies token for login magic link
    public JwtPayload verifyLoginToken(String token) {
        try {
            JWTVerifier verifier = JWT.require(ALG).build();
            DecodedJWT jwt = verifier.verify(token);
            // read claims
            Long userId = jwt.getClaim("userId").asLong();
            String email = jwt.getSubject();
            return new JwtPayload(userId, email);
        } catch (Exception e) {
            throw new RuntimeException("Invalid or expired token");
        }
    }

    // For setting session cookie; expires in 7 days (example)
    public String createSessionToken(Long userId, String email) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(60*60*24*2);
        return JWT.create()
                .withSubject(email)
                .withClaim("userId", userId)
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(exp))
                .sign(ALG);
    }

    // Verifies token for session cookie
    public JwtPayload verifySessionToken(String token) {
        try {
            JWTVerifier verifier = JWT.require(ALG).build();
            DecodedJWT jwt = verifier.verify(token);
            Long userId = jwt.getClaim("userId").asLong();
            String email = jwt.getSubject();
            return new JwtPayload(userId, email);
        } catch (Exception e) {
            throw new RuntimeException("Invalid or expired session token");
        }
    }


    public static class JwtPayload {
        private final Long userId;
        private final String email;

        public JwtPayload(Long userId, String email) {
            this.userId = userId;
            this.email = email;
        }
        public Long getUserId() { return userId; }
        public String getEmail() { return email; }
    }
}
