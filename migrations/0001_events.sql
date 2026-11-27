-- Copy of family-games/telemetry/migrations/0001_events.sql, for local dev only
-- (npx wrangler d1 migrations apply family-telemetry --local). The live table is managed there.
-- Shared pilot stats for every family game: one row per logged event, tagged with the
-- game's board id. Lives in the `family-telemetry` D1 database, not the scoreboard.
CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  game        TEXT    NOT NULL,   -- board id: 'big-pour', 'ed-time', ...
  device_id   TEXT,               -- random id kept on the phone (empty in some early rows)
  session_id  TEXT    NOT NULL,   -- random id per page load
  seq         INTEGER NOT NULL,
  t           REAL    NOT NULL,   -- seconds since the page loaded
  type        TEXT    NOT NULL,
  data        TEXT,               -- JSON
  version     TEXT,               -- the game's VERSION
  received_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_game_type ON events (game, type);
CREATE INDEX IF NOT EXISTS idx_events_game_session ON events (game, session_id, seq);
CREATE INDEX IF NOT EXISTS idx_events_game_received ON events (game, received_at);
CREATE INDEX IF NOT EXISTS idx_events_game_device ON events (game, device_id);
