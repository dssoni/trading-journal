-- changed auth style to SSO/Email-link login
ALTER TABLE user_auth
DROP COLUMN password;
