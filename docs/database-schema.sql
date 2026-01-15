-- ============================================================
-- RIKSA UJI DATABASE SCHEMA
-- Aircraft Inspection Management System - MVP Phase 1
-- ============================================================
-- Execute this SQL in Supabase SQL Editor to set up the database
-- All tables, indexes, RLS policies, and seed data are included
-- ============================================================

-- 1. PROFILES TABLE (Role Management)
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nama_lengkap TEXT,
  role TEXT NOT NULL CHECK (role IN ('marketing', 'admin_dokumen', 'admin_ru', 'inspektur', 'kadiv_ru', 'admin_keuangan', 'manager_operasional')),
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. CLIENTS TABLE (Master Data)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_client TEXT NOT NULL,
  pic_name TEXT,
  pic_phone TEXT,
  email TEXT,
  alamat TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. AIRCRAFT TYPES TABLE (Master Data)
CREATE TABLE IF NOT EXISTS aircrafttypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jenis_pesawat TEXT NOT NULL UNIQUE,
  manufacturer TEXT,
  form_checklist JSONB, -- array of {id, name, isRequired}
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. SPK TABLE (Surat Perintah Kerja / Service Order)
CREATE TABLE IF NOT EXISTS spks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_spk TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES clients(id),
  aircraft_type_id UUID NOT NULL REFERENCES aircrafttypes(id),
  tanggal_spk DATE NOT NULL,
  deskripsi_pekerjaan TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'verified')) DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. SPK DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS spkdocuments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spk_id UUID NOT NULL REFERENCES spks(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  filename TEXT NOT NULL,
  fileurl TEXT NOT NULL,
  mimetype TEXT,
  filesize INTEGER,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_notes TEXT,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- 6. NOTIFICATIONS TABLE (MVP: simple alert log)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spk_id UUID NOT NULL REFERENCES spks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- PROFILES TABLE POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage profiles" ON profiles
  USING (auth.role() = 'service_role');

-- SPK TABLE POLICIES
ALTER TABLE spks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Marketing can create SPK" ON spks
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'marketing')
  );

CREATE POLICY "Users can view SPK" ON spks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('marketing', 'admin_dokumen'))
  );

CREATE POLICY "Admin Dokumen can update SPK" ON spks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin_dokumen')
  );

-- SPK DOCUMENTS TABLE POLICIES
ALTER TABLE spkdocuments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view related documents" ON spkdocuments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM spks WHERE spks.id = spkdocuments.spk_id AND spks.created_by = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin_dokumen')
  );

CREATE POLICY "Users can upload to own SPK" ON spkdocuments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM spks WHERE spks.id = spkdocuments.spk_id AND spks.created_by = auth.uid())
  );

CREATE POLICY "Admin Dokumen can verify documents" ON spkdocuments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin_dokumen')
  );

-- NOTIFICATIONS TABLE POLICIES
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- MASTER DATA POLICIES
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE aircrafttypes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view clients" ON clients
  FOR SELECT USING (TRUE);

CREATE POLICY "Everyone can view aircrafttypes" ON aircrafttypes
  FOR SELECT USING (TRUE);

-- ============================================================
-- INDEXES (for performance)
-- ============================================================

CREATE INDEX idx_spks_client_id ON spks(client_id);
CREATE INDEX idx_spks_status ON spks(status);
CREATE INDEX idx_spks_created_by ON spks(created_by);
CREATE INDEX idx_spkdocuments_spk_id ON spkdocuments(spk_id);
CREATE INDEX idx_spkdocuments_verification_status ON spkdocuments(verification_status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- ============================================================
-- SEED DATA (Sample master data for testing)
-- ============================================================

-- Insert sample aircraft types with required document checklists
INSERT INTO aircrafttypes (jenis_pesawat, manufacturer, form_checklist) VALUES
(
  'Boeing 737-800',
  'Boeing',
  '[
    {"id": "doc_1", "name": "Surat Izin Operasional", "isRequired": true},
    {"id": "doc_2", "name": "Laporan Pemeriksaan Terakhir", "isRequired": true},
    {"id": "doc_3", "name": "Dokumentasi Maintenance", "isRequired": true},
    {"id": "doc_4", "name": "Foto Kondisi Pesawat", "isRequired": true}
  ]'::jsonb
),
(
  'Airbus A320',
  'Airbus',
  '[
    {"id": "doc_1", "name": "Surat Izin Operasional", "isRequired": true},
    {"id": "doc_2", "name": "Laporan Pemeriksaan Terakhir", "isRequired": true},
    {"id": "doc_3", "name": "Catatan Servis", "isRequired": true}
  ]'::jsonb
),
(
  'Cessna 172',
  'Cessna',
  '[
    {"id": "doc_1", "name": "Airworthiness Certificate", "isRequired": true},
    {"id": "doc_2", "name": "Maintenance Log", "isRequired": true}
  ]'::jsonb
);

-- Insert sample client
INSERT INTO clients (nama_client, pic_name, pic_phone, email, alamat) VALUES
(
  'PT Garuda Indonesia',
  'Budi Santoso',
  '08123456789',
  'budi@garuda.co.id',
  'Jl. Merpati No. 1, Jakarta'
),
(
  'PT Lion Air',
  'Siti Nurhaliza',
  '08987654321',
  'siti@lionair.co.id',
  'Jl. Bandara No. 2, Jakarta'
);

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- Schema created successfully!
-- Next steps:
-- 1. Create test users in Supabase Auth
-- 2. Create profile records for each user
-- 3. Create storage bucket 'documents' (private)
-- 4. Run the app: npm run dev
-- ============================================================
