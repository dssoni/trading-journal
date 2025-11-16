-- Seed a single default user_auth (adjust values if you want)
INSERT INTO user_auth(email, name, password, is_active, created_at, updated_at)
VALUES ('me@local', 'Me', 'changeme', TRUE, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;
