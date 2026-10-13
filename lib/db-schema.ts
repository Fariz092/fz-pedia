export interface SchemaColumn {
  name: string;
  type: string;
  constraints: string;
  description: string;
}

export interface SchemaTable {
  tableName: string;
  category: string;
  description: string;
  columns: SchemaColumn[];
  indexes: string[];
}

export const DATABASE_SCHEMA_TABLES: SchemaTable[] = [
  {
    tableName: 'bot_instances',
    category: 'Core Gateway',
    description: 'Menyimpan identitas instans bot WhatsApp, nomor terdaftar, sesi pairing, dan status perangkat.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT gen_random_uuid()', description: 'ID unik bot gateway' },
      { name: 'user_id', type: 'VARCHAR(64)', constraints: 'NOT NULL', description: 'ID pemilik akun / pengguna' },
      { name: 'phone_number', type: 'VARCHAR(20)', constraints: 'NOT NULL UNIQUE', description: 'Nomor WhatsApp bot (format internasional e.g. 6281234567890)' },
      { name: 'owner_number', type: 'VARCHAR(20)', constraints: 'NOT NULL', description: 'Nomor WhatsApp pemilik (hanya nomor ini yang dipatuhi)' },
      { name: 'device_name', type: 'VARCHAR(100)', constraints: 'DEFAULT \'WhatsApp Web Gateway\'', description: 'Nama label perangkat tertaut' },
      { name: 'session_token', type: 'TEXT', constraints: 'NULL', description: 'Kunci enkripsi sesi multi-device terenkripsi' },
      { name: 'pairing_method', type: 'VARCHAR(20)', constraints: 'DEFAULT \'pairing_code\'', description: '\'pairing_code\' atau \'qrcode\'' },
      { name: 'connection_status', type: 'VARCHAR(20)', constraints: 'DEFAULT \'disconnected\'', description: '\'connected\', \'connecting\', \'disconnected\', \'error\'' },
      { name: 'battery_level', type: 'SMALLINT', constraints: 'DEFAULT 100', description: 'Persentase baterai ponsel bot (0-100)' },
      { name: 'is_charging', type: 'BOOLEAN', constraints: 'DEFAULT false', description: 'Status sedang mengisi daya' },
      { name: 'last_connected_at', type: 'TIMESTAMPTZ', constraints: 'NULL', description: 'Waktu koneksi aktif terakhir' },
      { name: 'created_at', type: 'TIMESTAMPTZ', constraints: 'DEFAULT NOW()', description: 'Waktu pendaftaran bot' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', constraints: 'DEFAULT NOW()', description: 'Waktu pembaruan data' },
    ],
    indexes: [
      'CREATE INDEX idx_bot_phone_number ON bot_instances (phone_number);',
      'CREATE INDEX idx_bot_owner_number ON bot_instances (owner_number);',
      'CREATE INDEX idx_bot_status ON bot_instances (connection_status);',
    ],
  },
  {
    tableName: 'bot_privacy_configs',
    category: 'Privacy & Security Guard',
    description: 'Konfigurasi proteksi bot privat: membatasi akses hanya untuk nomor owner dan mengabaikan pesan asing/grup.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT gen_random_uuid()', description: 'ID unik konfigurasi' },
      { name: 'bot_id', type: 'UUID', constraints: 'NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE', description: 'Foreign Key ke bot_instances' },
      { name: 'strict_private_mode', type: 'BOOLEAN', constraints: 'DEFAULT true', description: 'Jika true, bot mutlak hanya mematuhi nomor owner' },
      { name: 'ignore_strangers', type: 'BOOLEAN', constraints: 'DEFAULT true', description: 'Mengabaikan DM dari nomor selain owner' },
      { name: 'ignore_group_mentions', type: 'BOOLEAN', constraints: 'DEFAULT true', description: 'Mengabaikan tag/sebutan @bot di dalam grup' },
      { name: 'ignore_group_chats', type: 'BOOLEAN', constraints: 'DEFAULT true', description: 'Mengabaikan semua obrolan grup WhatsApp' },
      { name: 'auto_read_owner_msgs', type: 'BOOLEAN', constraints: 'DEFAULT true', description: 'Kirim tanda centang biru (read receipt) hanya ke owner' },
      { name: 'show_typing_status', type: 'BOOLEAN', constraints: 'DEFAULT true', description: 'Simulasikan status "mengetik..." sebelum menjawab' },
      { name: 'trigger_prefix', type: 'VARCHAR(5)', constraints: 'DEFAULT \'!\'', description: 'Awalan perintah (e.g. !, ., /, #)' },
      { name: 'whitelist_numbers', type: 'JSONB', constraints: 'DEFAULT \'[]\'::jsonb', description: 'Daftar nomor cadangan yang diizinkan (JSON array)' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', constraints: 'DEFAULT NOW()', description: 'Waktu perubahan konfigurasi' },
    ],
    indexes: [
      'CREATE UNIQUE INDEX idx_privacy_bot_id ON bot_privacy_configs (bot_id);',
    ],
  },
  {
    tableName: 'bot_server_configs',
    category: 'Server & Quota Management',
    description: 'Pengaturan node server gateway, kecepatan respons bot, dan batasan kuota harian API.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT gen_random_uuid()', description: 'ID unik konfigurasi server' },
      { name: 'bot_id', type: 'UUID', constraints: 'NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE', description: 'Foreign Key ke bot_instances' },
      { name: 'server_node_id', type: 'VARCHAR(50)', constraints: 'DEFAULT \'srv-jkt-01\'', description: 'Node server aktif (e.g. srv-jkt-01, srv-sg-01)' },
      { name: 'speed_mode', type: 'VARCHAR(20)', constraints: 'DEFAULT \'turbo\'', description: '\'turbo\' (<300ms), \'balanced\' (~600ms), \'safe\' (~1.2s)' },
      { name: 'daily_quota_limit', type: 'INTEGER', constraints: 'DEFAULT 5000', description: 'Batas kuota pesan API per hari' },
      { name: 'used_quota_today', type: 'INTEGER', constraints: 'DEFAULT 0', description: 'Jumlah kuota yang telah terpakai hari ini' },
      { name: 'rate_limit_per_minute', type: 'INTEGER', constraints: 'DEFAULT 30', description: 'Maksimal pesan per menit (mencegah banned)' },
      { name: 'quota_reset_hour', type: 'VARCHAR(10)', constraints: 'DEFAULT \'00:00 WIB\'', description: 'Jadwal reset otomatis harian' },
      { name: 'last_quota_reset_at', type: 'TIMESTAMPTZ', constraints: 'DEFAULT NOW()', description: 'Waktu terakhir kuota di-reset' },
    ],
    indexes: [
      'CREATE UNIQUE INDEX idx_server_cfg_bot_id ON bot_server_configs (bot_id);',
      'CREATE INDEX idx_server_node ON bot_server_configs (server_node_id);',
    ],
  },
  {
    tableName: 'server_nodes',
    category: 'Infrastructure',
    description: 'Katalog server gateway yang tersedia untuk pemrosesan pesan WhatsApp.',
    columns: [
      { name: 'id', type: 'VARCHAR(50)', constraints: 'PRIMARY KEY', description: 'Kode server e.g. srv-jkt-01' },
      { name: 'name', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Nama server e.g. Server Jakarta ID-01' },
      { name: 'location', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Lokasi data center e.g. Jakarta, Indonesia' },
      { name: 'ip_address', type: 'VARCHAR(45)', constraints: 'NOT NULL', description: 'IP Server Gateway' },
      { name: 'status', type: 'VARCHAR(20)', constraints: 'DEFAULT \'optimal\'', description: '\'optimal\', \'stable\', \'maintenance\'' },
      { name: 'latency_ms', type: 'INTEGER', constraints: 'DEFAULT 14', description: 'Rata-rata latensi round-trip (ms)' },
      { name: 'cpu_usage', type: 'SMALLINT', constraints: 'DEFAULT 24', description: 'Beban CPU saat ini (%)' },
      { name: 'memory_usage', type: 'SMALLINT', constraints: 'DEFAULT 42', description: 'Beban RAM saat ini (%)' },
      { name: 'active_sessions', type: 'INTEGER', constraints: 'DEFAULT 180', description: 'Jumlah bot yang terhubung ke server ini' },
    ],
    indexes: [
      'CREATE INDEX idx_server_status ON server_nodes (status);',
    ],
  },
  {
    tableName: 'notification_settings',
    category: 'Alerting System',
    description: 'Pengaturan notifikasi otomatis saat terjadi perubahan status server, RTO, atau kuota menipis.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT gen_random_uuid()', description: 'ID unik notifikasi' },
      { name: 'bot_id', type: 'UUID', constraints: 'NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE', description: 'Foreign Key ke bot_instances' },
      { name: 'alert_on_server_down', type: 'BOOLEAN', constraints: 'DEFAULT true', description: 'Notifikasi saat server mengalami downtime/RTO' },
      { name: 'alert_on_quota_threshold', type: 'BOOLEAN', constraints: 'DEFAULT true', description: 'Notifikasi saat pemakaian mencapai >80% dan >95%' },
      { name: 'alert_on_disconnect', type: 'BOOLEAN', constraints: 'DEFAULT true', description: 'Notifikasi jika bot terputus dari WhatsApp Web' },
      { name: 'alert_on_unauthorized_access', type: 'BOOLEAN', constraints: 'DEFAULT true', description: 'Notifikasi jika ada spammer mencoba akses perintah' },
      { name: 'notify_owner_number', type: 'BOOLEAN', constraints: 'DEFAULT true', description: 'Kirim alert langsung ke WhatsApp owner' },
      { name: 'webhook_url', type: 'TEXT', constraints: 'NULL', description: 'URL webhook eksternal untuk Discord / Telegram / API' },
    ],
    indexes: [
      'CREATE UNIQUE INDEX idx_notif_bot_id ON notification_settings (bot_id);',
    ],
  },
  {
    tableName: 'bot_activity_logs',
    category: 'Telemetry & Audit Logs',
    description: 'Catatan real-time seluruh pesan masuk, tindakan bot (dieksekusi vs diabaikan), dan latensi.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT gen_random_uuid()', description: 'ID log' },
      { name: 'bot_id', type: 'UUID', constraints: 'NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE', description: 'Foreign Key ke bot_instances' },
      { name: 'sender_number', type: 'VARCHAR(20)', constraints: 'NOT NULL', description: 'Nomor pengirim pesan' },
      { name: 'sender_type', type: 'VARCHAR(20)', constraints: 'NOT NULL', description: '\'owner\', \'stranger\', \'group_member\', \'system\'' },
      { name: 'chat_type', type: 'VARCHAR(20)', constraints: 'NOT NULL', description: '\'private\' atau \'group\'' },
      { name: 'message_preview', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Potongan pesan yang diproses' },
      { name: 'action_taken', type: 'VARCHAR(30)', constraints: 'NOT NULL', description: '\'EXECUTED\', \'DROPPED_STRANGER\', \'DROPPED_GROUP\', \'DROPPED_MENTION\', \'RATE_LIMITED\'' },
      { name: 'latency_ms', type: 'INTEGER', constraints: 'DEFAULT 0', description: 'Waktu pemrosesan pesan (milidetik)' },
      { name: 'created_at', type: 'TIMESTAMPTZ', constraints: 'DEFAULT NOW()', description: 'Timestamp pencatatan log' },
    ],
    indexes: [
      'CREATE INDEX idx_log_bot_created ON bot_activity_logs (bot_id, created_at DESC);',
      'CREATE INDEX idx_log_action ON bot_activity_logs (action_taken);',
    ],
  },
];

export const SQL_SCHEMA_EXPORT = `-- =========================================================
-- FZPEDIA - WhatsApp Bot Gateway & Private Management Platform
-- Database Schema Definition (PostgreSQL 15+ / Supabase / Cloud SQL)
-- Copyright: ©2026 FZPEDIA | Velicia Inc.
-- =========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Table: bot_instances
CREATE TABLE IF NOT EXISTS bot_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(64) NOT NULL,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    owner_number VARCHAR(20) NOT NULL,
    device_name VARCHAR(100) DEFAULT 'WhatsApp Web Gateway',
    session_token TEXT NULL,
    pairing_method VARCHAR(20) DEFAULT 'pairing_code',
    connection_status VARCHAR(20) DEFAULT 'disconnected',
    battery_level SMALLINT DEFAULT 100 CHECK (battery_level BETWEEN 0 AND 100),
    is_charging BOOLEAN DEFAULT false,
    last_connected_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_phone_number ON bot_instances (phone_number);
CREATE INDEX IF NOT EXISTS idx_bot_owner_number ON bot_instances (owner_number);
CREATE INDEX IF NOT EXISTS idx_bot_status ON bot_instances (connection_status);

-- 3. Table: bot_privacy_configs
CREATE TABLE IF NOT EXISTS bot_privacy_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
    strict_private_mode BOOLEAN DEFAULT true,
    ignore_strangers BOOLEAN DEFAULT true,
    ignore_group_mentions BOOLEAN DEFAULT true,
    ignore_group_chats BOOLEAN DEFAULT true,
    auto_read_owner_msgs BOOLEAN DEFAULT true,
    show_typing_status BOOLEAN DEFAULT true,
    trigger_prefix VARCHAR(5) DEFAULT '!',
    whitelist_numbers JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_privacy_bot_id UNIQUE (bot_id)
);

-- 4. Table: bot_server_configs
CREATE TABLE IF NOT EXISTS bot_server_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
    server_node_id VARCHAR(50) DEFAULT 'srv-jkt-01',
    speed_mode VARCHAR(20) DEFAULT 'turbo',
    daily_quota_limit INTEGER DEFAULT 5000 CHECK (daily_quota_limit > 0),
    used_quota_today INTEGER DEFAULT 0 CHECK (used_quota_today >= 0),
    rate_limit_per_minute INTEGER DEFAULT 30 CHECK (rate_limit_per_minute > 0),
    quota_reset_hour VARCHAR(10) DEFAULT '00:00 WIB',
    last_quota_reset_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_server_bot_id UNIQUE (bot_id)
);

CREATE INDEX IF NOT EXISTS idx_server_node ON bot_server_configs (server_node_id);

-- 5. Table: server_nodes
CREATE TABLE IF NOT EXISTS server_nodes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    status VARCHAR(20) DEFAULT 'optimal',
    latency_ms INTEGER DEFAULT 14,
    cpu_usage SMALLINT DEFAULT 24 CHECK (cpu_usage BETWEEN 0 AND 100),
    memory_usage SMALLINT DEFAULT 42 CHECK (memory_usage BETWEEN 0 AND 100),
    active_sessions INTEGER DEFAULT 180
);

-- 6. Table: notification_settings
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
    alert_on_server_down BOOLEAN DEFAULT true,
    alert_on_quota_threshold BOOLEAN DEFAULT true,
    alert_on_disconnect BOOLEAN DEFAULT true,
    alert_on_unauthorized_access BOOLEAN DEFAULT true,
    notify_owner_number BOOLEAN DEFAULT true,
    webhook_url TEXT NULL,
    CONSTRAINT uq_notif_bot_id UNIQUE (bot_id)
);

-- 7. Table: bot_activity_logs
CREATE TABLE IF NOT EXISTS bot_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
    sender_number VARCHAR(20) NOT NULL,
    sender_type VARCHAR(20) NOT NULL,
    chat_type VARCHAR(20) NOT NULL,
    message_preview VARCHAR(255) NOT NULL,
    action_taken VARCHAR(30) NOT NULL,
    latency_ms INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_log_bot_created ON bot_activity_logs (bot_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_action ON bot_activity_logs (action_taken);

-- Seed Default Server Nodes
INSERT INTO server_nodes (id, name, location, ip_address, status, latency_ms, cpu_usage, memory_usage, active_sessions)
VALUES 
('srv-jkt-01', 'Server Jakarta ID-01 (Primary Ultra-Low Latency)', 'Jakarta, ID', '103.145.22.18', 'optimal', 12, 28, 44, 342),
('srv-sg-01', 'Server Singapore SG-01 (High-Availability Backup)', 'Singapore, SG', '128.199.198.81', 'optimal', 19, 34, 51, 410),
('srv-tky-01', 'Server Tokyo JP-01 (Global Relay Node)', 'Tokyo, JP', '139.162.112.54', 'stable', 58, 19, 38, 120)
ON CONFLICT (id) DO NOTHING;
`;
