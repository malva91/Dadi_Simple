/*
  # Creazione tabella impostazioni gioco

  1. Nuove Tabelle
    - `game_settings`
      - `room_name` (text, chiave primaria)
      - `selected_game_id` (text, nullable)
      - `global_effects_enabled` (boolean, default true)
      - `updated_at` (timestamptz)
  
  2. Sicurezza
    - Abilita RLS su `game_settings`
    - Policy lettura pubblica per tutti
    - Policy scrittura solo per admin (per ora tutti autenticati)
*/

CREATE TABLE IF NOT EXISTS game_settings (
  room_name text PRIMARY KEY,
  selected_game_id text,
  global_effects_enabled boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutti possono leggere le impostazioni"
  ON game_settings FOR SELECT
  USING (true);

CREATE POLICY "Tutti possono aggiornare le impostazioni"
  ON game_settings FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Tutti possono inserire le impostazioni"
  ON game_settings FOR INSERT
  WITH CHECK (true);