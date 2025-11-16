-- V1: schema matching your design, with safe best-practice additions:
--  • FKs reference user_auth(id)
--  • DEFAULT NOW() on created_at/updated_at
--  • Trigger to auto-maintain updated_at
--  • CHECK constraints for enum-like fields
--  • Sensible defaults for is_active and some numeric fields
--  • "right" renamed to option_right to avoid reserved word

-- utility trigger/function for updated_at
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- user_auth
CREATE TABLE IF NOT EXISTS user_auth (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_user_auth_updated
  BEFORE UPDATE ON user_auth
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- account
CREATE TABLE IF NOT EXISTS account (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES user_auth(id),
  name TEXT NOT NULL,
  broker TEXT,
  base_currency TEXT,
  cost_basis_method TEXT,
  timezone TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_account_user_name UNIQUE (user_id, name)
);
CREATE TRIGGER trg_account_updated
  BEFORE UPDATE ON account
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- instrument
CREATE TABLE IF NOT EXISTS instrument (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type TEXT NOT NULL,               -- 'EQUITY' | 'OPTION'
  series_key TEXT UNIQUE,
  symbol TEXT,                      -- equity
  underlying_symbol TEXT,           -- option
  option_right TEXT,                -- 'CALL' | 'PUT'
  strike NUMERIC(18,6),             -- option
  expiration DATE,                  -- option
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_instrument_type CHECK (type IN ('EQUITY','OPTION')),
  CONSTRAINT chk_instrument_right CHECK (option_right IS NULL OR option_right IN ('CALL','PUT'))
);
CREATE INDEX IF NOT EXISTS idx_instrument_type_symbol
  ON instrument(type, symbol);
CREATE INDEX IF NOT EXISTS idx_instrument_opt_combo
  ON instrument(type, underlying_symbol, expiration, option_right, strike);
CREATE TRIGGER trg_instrument_updated
  BEFORE UPDATE ON instrument
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- trade
CREATE TABLE IF NOT EXISTS trade (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES user_auth(id),
  account_id BIGINT NOT NULL REFERENCES account(id),
  instrument_id BIGINT NOT NULL REFERENCES instrument(id),
  entry_qty NUMERIC(18,6),
  entry_price NUMERIC(18,6),
  entry_at TIMESTAMPTZ,
  remaining_qty NUMERIC(18,6),
  realized_gross_pnl NUMERIC(18,6) NOT NULL DEFAULT 0,
  realized_net_pnl   NUMERIC(18,6) NOT NULL DEFAULT 0,
  status TEXT NOT NULL,   -- 'OPEN' | 'PARTIAL' | 'CLOSED'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_trade_status CHECK (status IN ('OPEN','PARTIAL','CLOSED'))
);
CREATE INDEX IF NOT EXISTS idx_trade_user_acct_instr_status
  ON trade(user_id, account_id, instrument_id, status);
CREATE INDEX IF NOT EXISTS idx_trade_acct_instr_entry_at
  ON trade(account_id, instrument_id, entry_at);
CREATE TRIGGER trg_trade_updated
  BEFORE UPDATE ON trade
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- trade_fill
CREATE TABLE IF NOT EXISTS trade_fill (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  trade_id BIGINT NOT NULL REFERENCES trade(id),
  side TEXT NOT NULL,        -- 'SELL' (future 'BUY')
  qty NUMERIC(18,6),
  price NUMERIC(18,6),
  executed_at TIMESTAMPTZ,
  commission NUMERIC(18,6) NOT NULL DEFAULT 0,
  fees NUMERIC(18,6) NOT NULL DEFAULT 0,
  realized_gross_pnl NUMERIC(18,6),
  realized_net_pnl NUMERIC(18,6),
  remaining_after_fill NUMERIC(18,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_fill_side CHECK (side IN ('BUY','SELL'))
);
CREATE INDEX IF NOT EXISTS idx_trade_fill_trade_time
  ON trade_fill(trade_id, executed_at);
CREATE INDEX IF NOT EXISTS idx_trade_fill_executed_at
  ON trade_fill(executed_at);

-- position
CREATE TABLE IF NOT EXISTS position (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES account(id),
  instrument_id BIGINT NOT NULL REFERENCES instrument(id),
  qty NUMERIC(18,6),
  avg_cost NUMERIC(18,6),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_position_account_instrument UNIQUE (account_id, instrument_id)
);
CREATE TRIGGER trg_position_updated
  BEFORE UPDATE ON position
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
