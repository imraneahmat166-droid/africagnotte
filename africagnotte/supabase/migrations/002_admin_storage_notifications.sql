-- =====================================================
-- AfriCagnotte — Migration 002
-- Admin, Storage, Stats avancées, Rôles, OTP
-- Exécuter après 001_initial_schema.sql
-- =====================================================

-- ─── Colonnes supplémentaires ────────────────────────────────────────────────

-- Profils: rôle + vérification
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role         text NOT NULL DEFAULT 'user'
                                          CHECK (role IN ('user','moderator','admin')),
  ADD COLUMN IF NOT EXISTS verified     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at  timestamptz,
  ADD COLUMN IF NOT EXISTS bio          text,
  ADD COLUMN IF NOT EXISTS avatar_url   text;

-- Cagnottes: approbation + images
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS cover_image_url  text,
  ADD COLUMN IF NOT EXISTS approved_at      timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by      uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS suspension_reason text;

-- Fraude: résolution
ALTER TABLE fraud_flags
  ADD COLUMN IF NOT EXISTS resolved_by  uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS resolved_at  timestamptz;

-- ─── Table OTP (vérification SMS) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_codes (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone       text NOT NULL,
  code        text NOT NULL,
  purpose     text NOT NULL DEFAULT 'verify', -- verify | login | withdrawal
  used        boolean DEFAULT false,
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS otp_phone_idx ON otp_codes(phone);

-- ─── Table Notifications ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        text NOT NULL, -- donation_received | campaign_approved | withdrawal_done | etc.
  title       text NOT NULL,
  body        text,
  read        boolean DEFAULT false,
  data        jsonb,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notif_user_idx   ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notif_read_idx   ON notifications(read);

-- ─── Table Partages ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_shares (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  platform    text, -- facebook | whatsapp | twitter | copy
  created_at  timestamptz DEFAULT now()
);

-- ─── Supabase Storage — Bucket campaign-images ───────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-images',
  'campaign-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: lecture publique
CREATE POLICY "Images lisibles publiquement"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'campaign-images');

-- Policy: upload par utilisateur authentifié
CREATE POLICY "Upload par utilisateur authentifié"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'campaign-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: suppression par propriétaire
CREATE POLICY "Suppression par propriétaire"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'campaign-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── Fonction: dons par jour ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION donations_by_day(p_since timestamptz)
RETURNS TABLE(day date, total_amount numeric, count bigint)
LANGUAGE sql AS $$
  SELECT
    DATE(created_at) AS day,
    SUM(amount)      AS total_amount,
    COUNT(*)         AS count
  FROM transactions
  WHERE status = 'completed'
    AND created_at >= p_since
  GROUP BY DATE(created_at)
  ORDER BY day;
$$;

-- ─── Fonction: créer une notification ────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type    text,
  p_title   text,
  p_body    text DEFAULT NULL,
  p_data    jsonb DEFAULT '{}'
)
RETURNS void LANGUAGE sql AS $$
  INSERT INTO notifications(user_id, type, title, body, data)
  VALUES (p_user_id, p_type, p_title, p_body, p_data);
$$;

-- ─── Trigger: notification automatique sur nouveau don ───────────────────────
CREATE OR REPLACE FUNCTION notify_organizer_on_donation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_organizer_id uuid;
  v_campaign_title text;
BEGIN
  SELECT organizer_id, title
  INTO v_organizer_id, v_campaign_title
  FROM campaigns WHERE id = NEW.campaign_id;

  PERFORM create_notification(
    v_organizer_id,
    'donation_received',
    'Nouveau don reçu !',
    'Don de ' || NEW.amount || ' ' || NEW.currency || ' pour "' || v_campaign_title || '"',
    jsonb_build_object('campaign_id', NEW.campaign_id, 'amount', NEW.amount)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_donation ON donations;
CREATE TRIGGER trg_notify_on_donation
  AFTER INSERT ON donations
  FOR EACH ROW EXECUTE FUNCTION notify_organizer_on_donation();

-- ─── RLS sur nouvelles tables ────────────────────────────────────────────────
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_shares  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notif visible par propriétaire"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Notif modifiable par propriétaire"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Partages lisibles par tous"
  ON campaign_shares FOR SELECT USING (true);

CREATE POLICY "Partages insérables par tous"
  ON campaign_shares FOR INSERT WITH CHECK (true);

-- ─── Index supplémentaires ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS campaigns_raised_idx ON campaigns(raised_amount DESC);
CREATE INDEX IF NOT EXISTS transactions_completed_idx ON transactions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);

-- ─── Insérer admin par défaut (mettre à jour l'email) ────────────────────────
-- UPDATE profiles SET role = 'admin' WHERE email = 'votre@email.com';
