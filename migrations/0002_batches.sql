-- Fewer writes: the Cloudflare free plan allows 100,000 row writes a day across the
-- account, and every index on a table costs a write per row. On 26 Nov 2026 the stats
-- used them all up and the scoreboard couldn't save. So:
--  * keep one index (game, type): every query and clear-out filters by game
--  * games now store each batch of events they send as ONE row, type = 'batch', with
--    data = a JSON array of { n, t, type, d } (seq/t on the row are the first event's)
--  * the view event_rows shows batches and older single-event rows alike as one row per
--    event, with the same columns as events. Query event_rows; clear out from events.
DROP INDEX IF EXISTS idx_events_game_session;
DROP INDEX IF EXISTS idx_events_game_received;
DROP INDEX IF EXISTS idx_events_game_device;
CREATE VIEW IF NOT EXISTS event_rows AS
  SELECT e.id, e.game, e.device_id, e.session_id,
         CAST(json_extract(j.value, '$.n') AS INTEGER) AS seq,
         json_extract(j.value, '$.t') AS t,
         json_extract(j.value, '$.type') AS type,
         json_extract(j.value, '$.d') AS data,
         e.version, e.received_at
  FROM events e, json_each(e.data) j
  WHERE e.type = 'batch'
  UNION ALL
  SELECT id, game, device_id, session_id, seq, t, type, data, version, received_at
  FROM events WHERE type <> 'batch';
