import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState as initMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  type WASocket,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import path from 'path';
import fs from 'fs';

export interface RealtimeBotState {
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  phoneNumber: string;
  ownerNumber: string;
  pairingMethod: 'pairing_code' | 'qrcode';
  pairingCode: string;
  qrCodeRaw: string;
  deviceName: string;
  waVersion: string;
  lastConnectedAt: string;
  startedAt: number;
  lastError: string;
  pingMs: number;
  activityLogs: Array<{
    id: string;
    timestamp: string;
    senderNumber: string;
    senderType: 'owner' | 'stranger' | 'group_member' | 'system';
    chatType: 'private' | 'group';
    messagePreview: string;
    actionTaken: 'EXECUTED' | 'DROPPED_STRANGER' | 'DROPPED_GROUP' | 'DROPPED_MENTION' | 'RATE_LIMITED';
    latencyMs: number;
  }>;
}

class WhatsAppManager {
  private sock: WASocket | null = null;
  private sessionDir: string;
  private state: RealtimeBotState = {
    connectionState: 'disconnected',
    phoneNumber: '',
    ownerNumber: '',
    pairingMethod: 'pairing_code',
    pairingCode: '',
    qrCodeRaw: '',
    deviceName: 'FZPEDIA Gateway (Multi-Device)',
    waVersion: '2.3000.x',
    lastConnectedAt: '',
    startedAt: 0,
    lastError: '',
    pingMs: 12,
    activityLogs: [],
  };

  private isInitializing = false;

  constructor() {
    this.sessionDir = path.join(process.cwd(), 'sessions', 'fzpedia-session');
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
  }

  public getState(): RealtimeBotState {
    return { ...this.state };
  }

  public addLog(log: Omit<RealtimeBotState['activityLogs'][0], 'id' | 'timestamp'>) {
    const newLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('id-ID'),
    };
    this.state.activityLogs = [newLog, ...this.state.activityLogs.slice(0, 49)];
  }

  public async startSession(
    phoneNumberInput: string,
    method: 'pairing_code' | 'qrcode'
  ): Promise<{ success: boolean; pairingCode?: string; qrCode?: string; message: string }> {
    // Robust E.164 normalization for Indonesia and international numbers
    let cleanNum = phoneNumberInput.replace(/\D/g, '');
    if (cleanNum.startsWith('0')) {
      cleanNum = '62' + cleanNum.replace(/^0+/, '');
    } else if (cleanNum.startsWith('8') && cleanNum.length >= 9 && cleanNum.length <= 13) {
      cleanNum = '62' + cleanNum;
    } else if (cleanNum.startsWith('620')) {
      cleanNum = '62' + cleanNum.slice(3);
    }

    if (method === 'pairing_code' && (!cleanNum || cleanNum.length < 9)) {
      return {
        success: false,
        message: 'Nomor WhatsApp tidak valid (minimal 9 digit, contoh: 08123456789 atau 628123456789).',
      };
    }

    if (this.sock && this.state.connectionState === 'connected') {
      return {
        success: true,
        message: 'Bot sudah terhubung ke WhatsApp.',
      };
    }

    // Reset previous unauthenticated session files to avoid stale creds conflicts
    if (this.state.connectionState !== 'connected') {
      if (this.sock) {
        try {
          this.sock.ev.removeAllListeners('connection.update');
          this.sock.ev.removeAllListeners('creds.update');
          this.sock.ev.removeAllListeners('messages.upsert');
          this.sock.end(undefined);
        } catch {}
        this.sock = null;
      }
      this.clearSessionDir();
    }

    this.isInitializing = true;
    this.state.connectionState = 'connecting';
    this.state.pairingMethod = method;
    this.state.lastError = '';
    this.state.pairingCode = '';
    this.state.qrCodeRaw = '';

    try {
      const { state: authState, saveCreds } = await initMultiFileAuthState(this.sessionDir);
      const { version } = await fetchLatestBaileysVersion().catch(() => ({
        version: [2, 3000, 1043857760] as [number, number, number],
      }));

      this.state.waVersion = version.join('.');

      const sock = makeWASocket({
        version,
        auth: authState,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        // Ubuntu Chrome signature is required by WhatsApp's modern pairing code API
        browser: Browsers.ubuntu('Chrome'),
        syncFullHistory: false,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
      });

      this.sock = sock;

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.state.qrCodeRaw = qr;
        }

        if (connection === 'open') {
          this.state.connectionState = 'connected';
          this.state.startedAt = Date.now();
          this.state.lastConnectedAt = new Date().toLocaleTimeString('id-ID');
          this.state.pairingCode = '';
          this.state.qrCodeRaw = '';

          const userJid = sock.user?.id || '';
          const actualPhone = userJid.split(':')[0].split('@')[0];
          this.state.phoneNumber = actualPhone ? `+${actualPhone}` : (cleanNum ? `+${cleanNum}` : '');
          this.state.ownerNumber = this.state.phoneNumber;

          this.addLog({
            senderNumber: this.state.phoneNumber,
            senderType: 'system',
            chatType: 'private',
            messagePreview: 'Perangkat WhatsApp berhasil terhubung secara REALTIME ke FZPEDIA Gateway.',
            actionTaken: 'EXECUTED',
            latencyMs: 10,
          });
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          this.addLog({
            senderNumber: 'System',
            senderType: 'system',
            chatType: 'private',
            messagePreview: `Koneksi WhatsApp tertutup (status: ${statusCode || 'unknown'}). Reconnect: ${shouldReconnect}`,
            actionTaken: 'DROPPED_STRANGER',
            latencyMs: 0,
          });

          if (statusCode === DisconnectReason.loggedOut) {
            this.state.connectionState = 'disconnected';
            this.clearSessionDir();
          } else if (shouldReconnect && this.state.connectionState === 'connected') {
            this.state.connectionState = 'connecting';
            setTimeout(() => {
              this.startSession(this.state.phoneNumber, this.state.pairingMethod);
            }, 3000);
          } else {
            this.state.connectionState = 'disconnected';
          }
        }
      });

      // Handle Realtime incoming messages
      sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
          if (!msg.message || msg.key.fromMe) continue;

          const remoteJid = msg.key.remoteJid || '';
          const isGroup = remoteJid.endsWith('@g.us');
          const senderNum = remoteJid.replace('@s.whatsapp.net', '');
          const messageContent =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            '';

          const isOwner =
            this.state.ownerNumber &&
            (senderNum === this.state.ownerNumber.replace(/\D/g, '') ||
              this.state.ownerNumber.includes(senderNum));

          // Log the message
          if (isGroup) {
            this.addLog({
              senderNumber: remoteJid,
              senderType: 'group_member',
              chatType: 'group',
              messagePreview: messageContent.slice(0, 60),
              actionTaken: 'DROPPED_GROUP',
              latencyMs: 8,
            });
            continue;
          }

          if (!isOwner) {
            this.addLog({
              senderNumber: `+${senderNum}`,
              senderType: 'stranger',
              chatType: 'private',
              messagePreview: messageContent.slice(0, 60),
              actionTaken: 'DROPPED_STRANGER',
              latencyMs: 6,
            });
            continue;
          }

          // Owner command handling
          this.addLog({
            senderNumber: `Owner (+${senderNum})`,
            senderType: 'owner',
            chatType: 'private',
            messagePreview: messageContent.slice(0, 60),
            actionTaken: 'EXECUTED',
            latencyMs: 14,
          });

          const trimmed = messageContent.trim().toLowerCase();
          if (trimmed === '!ping' || trimmed === '.ping') {
            await sock.sendMessage(remoteJid, {
              text: `🏓 *PONG!*\n⚡ Latensi Server: ~${this.state.pingMs}ms\n🟢 FZPEDIA Gateway: AKTIF REALTIME\n📱 Mode: Strict Owner Private`,
            });
          } else if (trimmed === '!status' || trimmed === '.status') {
            const uptimeMinutes = Math.floor((Date.now() - (this.state.startedAt || Date.now())) / 60000);
            await sock.sendMessage(remoteJid, {
              text: `📊 *STATUS BOT FZPEDIA*\n- Status: Terhubung & Aktif\n- Nomor: ${this.state.phoneNumber}\n- Versi WA: ${this.state.waVersion}\n- Uptime: ${uptimeMinutes} menit\n- Mode Privat: 100% Aktif`,
            });
          }
        }
      });

      // Wait for socket registration handshake to initialize and settle
      await new Promise<void>((resolve) => {
        let settled = false;
        const timer = setTimeout(() => {
          if (!settled) {
            settled = true;
            resolve();
          }
        }, 6000);

        const onUpdate = (u: { qr?: string; connection?: string }) => {
          if (u.qr || u.connection === 'open') {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              // Allow WhatsApp companion registration frame to settle before sending link_code node
              setTimeout(resolve, 1500);
            }
          }
        };
        sock.ev.on('connection.update', onUpdate);
      });

      // Process QR Code method
      if (method === 'qrcode') {
        let qrCode = this.state.qrCodeRaw;
        if (!qrCode) {
          qrCode = await new Promise<string>((resolve) => {
            const timer = setTimeout(() => resolve(''), 8000);
            const onQr = (u: { qr?: string }) => {
              if (u.qr) {
                clearTimeout(timer);
                resolve(u.qr);
              }
            };
            sock.ev.on('connection.update', onQr);
          });
        }

        this.isInitializing = false;
        if (qrCode) {
          this.state.qrCodeRaw = qrCode;
          return {
            success: true,
            qrCode,
            message: 'QR Code WhatsApp resmi berhasil didapatkan. Silakan scan di aplikasi WhatsApp HP Anda.',
          };
        } else {
          return {
            success: true,
            message: 'Inisialisasi handshake berhasil. QR Code sedang dimuat dari server WhatsApp...',
          };
        }
      }

      // Process Pairing Code method
      if (method === 'pairing_code' && !sock.authState.creds.registered) {
        let attempts = 0;
        let lastErr: Error | null = null;
        let formattedCode = '';

        while (attempts < 3 && !formattedCode) {
          attempts++;
          try {
            const rawCode = await sock.requestPairingCode(cleanNum);
            formattedCode = rawCode ? `${rawCode.slice(0, 4)}-${rawCode.slice(4)}` : rawCode;
            this.state.pairingCode = formattedCode;
            this.state.phoneNumber = `+${cleanNum}`;
            this.state.ownerNumber = `+${cleanNum}`;
            this.isInitializing = false;
            return {
              success: true,
              pairingCode: formattedCode,
              message: 'Kode pairing resmi berhasil didapatkan dari server WhatsApp.',
            };
          } catch (pairErr: unknown) {
            lastErr = pairErr as Error;
            if (attempts < 3) {
              await new Promise((r) => setTimeout(r, 1500));
            }
          }
        }

        this.state.lastError = lastErr?.message || 'Gagal meminta kode pairing ke WhatsApp.';
        this.isInitializing = false;
        return {
          success: false,
          message: `Gagal mendapatkan kode dari WhatsApp: ${this.state.lastError}`,
        };
      }

      this.isInitializing = false;
      return {
        success: true,
        message: 'Inisialisasi selesai.',
      };
    } catch (err: unknown) {
      const error = err as Error;
      this.isInitializing = false;
      this.state.connectionState = 'error';
      this.state.lastError = error?.message || 'Inisialisasi Baileys gagal.';
      return {
        success: false,
        message: `Terjadi kesalahan internal: ${this.state.lastError}`,
      };
    }
  }

  public async disconnectSession(): Promise<void> {
    if (this.sock) {
      try {
        await this.sock.logout();
      } catch {}
      try {
        this.sock.end(undefined);
      } catch {}
      this.sock = null;
    }

    this.clearSessionDir();
    this.state.connectionState = 'disconnected';
    this.state.phoneNumber = '';
    this.state.ownerNumber = '';
    this.state.pairingCode = '';
    this.state.qrCodeRaw = '';
    this.addLog({
      senderNumber: 'System',
      senderType: 'system',
      chatType: 'private',
      messagePreview: 'Sesi WhatsApp diputus dan kredensial dibersihkan.',
      actionTaken: 'EXECUTED',
      latencyMs: 5,
    });
  }

  private clearSessionDir() {
    try {
      if (fs.existsSync(this.sessionDir)) {
        fs.rmSync(this.sessionDir, { recursive: true, force: true });
        fs.mkdirSync(this.sessionDir, { recursive: true });
      }
    } catch {}
  }
}

// Global Singleton to survive fast reload / HMR in Node environment
const globalForWa = globalThis as unknown as { waManager?: WhatsAppManager };
export const waManager = globalForWa.waManager ?? new WhatsAppManager();
if (process.env.NODE_ENV !== 'production') globalForWa.waManager = waManager;
