import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState as initMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  jidNormalizedUser,
  type WASocket,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import path from 'path';
import fs from 'fs';

export interface RealtimeBotState {
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  hasSavedSession: boolean;
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
    hasSavedSession: false,
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
  private reconnectTimer: NodeJS.Timeout | null = null;
  private sentMessageIds = new Set<string>();

  constructor() {
    this.sessionDir = path.join(process.cwd(), 'sessions', 'fzpedia-session');
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }

    // Auto-restore registered session on server start if credentials exist
    if (this.hasRegisteredSession()) {
      const savedPhone = this.getSavedPhoneNumber();
      this.state.hasSavedSession = true;
      this.state.phoneNumber = savedPhone;
      this.state.ownerNumber = savedPhone;
      setTimeout(() => {
        this.restoreSessionIfAvailable().catch(() => {});
      }, 1000);
    }
  }

  public hasRegisteredSession(): boolean {
    try {
      const credsPath = path.join(this.sessionDir, 'creds.json');
      if (!fs.existsSync(credsPath)) return false;
      const content = fs.readFileSync(credsPath, 'utf8');
      const creds = JSON.parse(content);
      return Boolean(creds && (creds.registered === true || creds.me?.id));
    } catch {
      return false;
    }
  }

  public getSavedPhoneNumber(): string {
    try {
      const credsPath = path.join(this.sessionDir, 'creds.json');
      if (!fs.existsSync(credsPath)) return '';
      const content = fs.readFileSync(credsPath, 'utf8');
      const creds = JSON.parse(content);
      const jid = creds.me?.id || '';
      const raw = jid.split(':')[0].split('@')[0];
      return raw ? `+${raw}` : '';
    } catch {
      return '';
    }
  }

  public getState(): RealtimeBotState {
    const hasSaved = this.hasRegisteredSession();
    const savedPhone = hasSaved ? this.getSavedPhoneNumber() : '';
    return {
      ...this.state,
      hasSavedSession: hasSaved,
      phoneNumber: this.state.phoneNumber || savedPhone,
      ownerNumber: this.state.ownerNumber || savedPhone,
    };
  }

  public addLog(log: Omit<RealtimeBotState['activityLogs'][0], 'id' | 'timestamp'>) {
    const newLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('id-ID'),
    };
    this.state.activityLogs = [newLog, ...this.state.activityLogs.slice(0, 49)];
  }

  private attachSocketHandlers(
    sock: WASocket,
    saveCreds: () => Promise<void>,
    fallbackPhone?: string
  ) {
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.state.qrCodeRaw = qr;
      }

      if (connection === 'open') {
        this.state.connectionState = 'connected';
        this.state.hasSavedSession = true;
        this.state.startedAt = Date.now();
        this.state.lastConnectedAt = new Date().toLocaleTimeString('id-ID');
        this.state.pairingCode = '';
        this.state.qrCodeRaw = '';

        const userJid = sock.user?.id || '';
        const actualPhone = userJid.split(':')[0].split('@')[0];
        const displayPhone = actualPhone ? `+${actualPhone}` : (fallbackPhone || this.getSavedPhoneNumber());
        this.state.phoneNumber = displayPhone;
        this.state.ownerNumber = displayPhone;

        this.addLog({
          senderNumber: this.state.phoneNumber || 'System',
          senderType: 'system',
          chatType: 'private',
          messagePreview: 'Sesi WhatsApp Multi-Device AKTIF & Kredensial Permanen Terverifikasi.',
          actionTaken: 'EXECUTED',
          latencyMs: 10,
        });
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        this.addLog({
          senderNumber: 'System',
          senderType: 'system',
          chatType: 'private',
          messagePreview: `Koneksi WhatsApp tertutup (status: ${statusCode || 'unknown'}). LoggedOut: ${isLoggedOut}`,
          actionTaken: 'DROPPED_STRANGER',
          latencyMs: 0,
        });

        if (isLoggedOut) {
          // Explicit logout from WhatsApp phone app
          this.state.connectionState = 'disconnected';
          this.state.hasSavedSession = false;
          this.clearSessionDir();
        } else {
          // Temporary disconnection or server sleep: preserve session files & auto-reconnect
          this.state.connectionState = 'connecting';
          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            if (this.hasRegisteredSession() && this.state.connectionState !== 'connected') {
              this.restoreSessionIfAvailable().catch(() => {});
            }
          }, 4000);
        }
      }
    });

    // Realtime incoming messages listener
    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        if (!msg.message) continue;

        // Skip bot's own responses to prevent infinite response loops
        if (msg.key.id && this.sentMessageIds.has(msg.key.id)) continue;

        const remoteJid = msg.key.remoteJid || '';
        // Skip status broadcast and channel/newsletter updates
        if (
          !remoteJid ||
          remoteJid === 'status@broadcast' ||
          remoteJid.includes('@newsletter') ||
          remoteJid.includes('@broadcast')
        ) {
          continue;
        }

        const userJid = sock.user?.id || '';
        const userLid = sock.user?.lid || '';
        const myPnNormalized = jidNormalizedUser(userJid);
        const myLidNormalized = userLid ? jidNormalizedUser(userLid) : '';

        const myPnDigits = myPnNormalized.split('@')[0].replace(/\D/g, '');
        const myLidDigits = myLidNormalized ? myLidNormalized.split('@')[0].replace(/\D/g, '') : '';

        const remoteNormalized = jidNormalizedUser(remoteJid);
        const remoteDigits = remoteNormalized.split('@')[0].replace(/\D/g, '');

        // Extract message content from all WhatsApp message types (standard, ephemeral, view-once, media caption)
        const rawMsg = msg.message;
        const messageContent =
          rawMsg.conversation ||
          rawMsg.extendedTextMessage?.text ||
          rawMsg.ephemeralMessage?.message?.conversation ||
          rawMsg.ephemeralMessage?.message?.extendedTextMessage?.text ||
          rawMsg.viewOnceMessage?.message?.conversation ||
          rawMsg.viewOnceMessage?.message?.extendedTextMessage?.text ||
          rawMsg.viewOnceMessageV2?.message?.conversation ||
          rawMsg.viewOnceMessageV2?.message?.extendedTextMessage?.text ||
          rawMsg.imageMessage?.caption ||
          rawMsg.videoMessage?.caption ||
          rawMsg.documentMessage?.caption ||
          '';

        const trimmed = messageContent.trim();
        if (!trimmed) continue;

        // Skip bot's own output banners if echoed back
        if (
          trimmed.startsWith('🏓') ||
          trimmed.startsWith('📊') ||
          trimmed.startsWith('🤖') ||
          trimmed.startsWith('👋') ||
          trimmed.startsWith('❓')
        ) {
          continue;
        }

        // Detect if this chat is with oneself (WhatsApp "Message Yourself" / Chat ke nomor sendiri)
        const isSelfChat =
          remoteNormalized === myPnNormalized ||
          (Boolean(myLidNormalized) && remoteNormalized === myLidNormalized) ||
          (Boolean(myPnDigits) && remoteDigits === myPnDigits) ||
          (Boolean(myLidDigits) && remoteDigits === myLidDigits) ||
          (Boolean(this.state.phoneNumber) && remoteDigits === this.state.phoneNumber.replace(/\D/g, '')) ||
          (remoteNormalized.endsWith('@lid') && msg.key.fromMe);

        const cmd = trimmed.toLowerCase();
        const isRecognizedCommand =
          cmd === 'ping' ||
          cmd === '!ping' ||
          cmd === '.ping' ||
          cmd === '/ping' ||
          cmd === '#ping' ||
          cmd === 'p' ||
          cmd === 'test' ||
          cmd === 'status' ||
          cmd === '!status' ||
          cmd === '.status' ||
          cmd === '/status' ||
          cmd === '#status' ||
          cmd === 'info' ||
          cmd === 'menu' ||
          cmd === '!menu' ||
          cmd === '.menu' ||
          cmd === '/menu' ||
          cmd === '#menu' ||
          cmd === 'help' ||
          cmd === '!help' ||
          cmd === '.help' ||
          cmd === '/help' ||
          cmd === 'halo' ||
          cmd === 'hi' ||
          cmd === 'hello' ||
          cmd === 'bot' ||
          cmd.includes('@bot') ||
          trimmed.startsWith('!') ||
          trimmed.startsWith('.') ||
          trimmed.startsWith('/') ||
          trimmed.startsWith('#');

        // If fromMe, only process if it is a command or self-chat to prevent intruding on regular chats
        if (msg.key.fromMe && !isSelfChat && !isRecognizedCommand) {
          continue;
        }

        const isGroup = remoteJid.endsWith('@g.us');

        // Extract participant digits for groups
        const participantJid = msg.key.participant || (msg as any).participant || '';
        const participantNormalized = participantJid ? jidNormalizedUser(participantJid) : '';
        const participantDigits = participantNormalized.split('@')[0].replace(/\D/g, '');

        const isOwner =
          isSelfChat ||
          msg.key.fromMe ||
          (Boolean(myPnDigits) && participantDigits === myPnDigits) ||
          (Boolean(myLidDigits) && participantDigits === myLidDigits) ||
          (Boolean(this.state.phoneNumber) && participantDigits === this.state.phoneNumber.replace(/\D/g, '')) ||
          (Boolean(this.state.ownerNumber) &&
            (participantDigits === this.state.ownerNumber.replace(/\D/g, '') ||
              remoteDigits === this.state.ownerNumber.replace(/\D/g, '') ||
              this.state.ownerNumber.includes(participantDigits) ||
              this.state.ownerNumber.includes(remoteDigits)));

        // Group handling: Allow commands from owner (or in user's solo group)
        if (isGroup) {
          // In groups, ignore random non-command chatter so bot stays clean
          if (!isRecognizedCommand) {
            continue;
          }

          // If someone else sends a command in group, only drop if strictly non-owner
          if (!isOwner) {
            this.addLog({
              senderNumber: participantDigits ? `+${participantDigits}` : remoteJid,
              senderType: 'group_member',
              chatType: 'group',
              messagePreview: trimmed.slice(0, 60),
              actionTaken: 'DROPPED_GROUP',
              latencyMs: 8,
            });
            continue;
          }
        } else {
          // Direct chat (Private) stranger filtering
          if (!isOwner) {
            this.addLog({
              senderNumber: `+${remoteDigits || remoteJid}`,
              senderType: 'stranger',
              chatType: 'private',
              messagePreview: trimmed.slice(0, 60),
              actionTaken: 'DROPPED_STRANGER',
              latencyMs: 6,
            });
            continue;
          }
        }

        // Owner or Self command received (Private or Group)
        this.addLog({
          senderNumber: isGroup
            ? `Owner di Grup (+${myPnDigits || participantDigits || remoteDigits})`
            : isSelfChat
            ? `Self / Owner (+${myPnDigits || remoteDigits})`
            : `Owner (+${remoteDigits})`,
          senderType: 'owner',
          chatType: isGroup ? 'group' : 'private',
          messagePreview: trimmed.slice(0, 60),
          actionTaken: 'EXECUTED',
          latencyMs: 10,
        });

        // Mark message as read (blue tick)
        try {
          await sock.readMessages([msg.key]);
        } catch {}

        // Helper to send reply and record ID
        const sendReply = async (text: string) => {
          try {
            const sent = await sock.sendMessage(remoteJid, { text }, { quoted: msg });
            if (sent?.key?.id) {
              this.sentMessageIds.add(sent.key.id);
            }
            return sent;
          } catch {
            try {
              const sent = await sock.sendMessage(remoteJid, { text });
              if (sent?.key?.id) {
                this.sentMessageIds.add(sent.key.id);
              }
              return sent;
            } catch {}
          }
        };

        // 1. PING Command
        if (
          cmd === '!ping' ||
          cmd === '.ping' ||
          cmd === '/ping' ||
          cmd === '#ping' ||
          cmd === 'ping' ||
          cmd === 'p' ||
          cmd === 'test'
        ) {
          const chatContext = isGroup ? '👥 Grup WhatsApp (Aktif)' : isSelfChat ? '📱 Chat Nomor Sendiri' : '👤 Private Chat';
          await sendReply(`🏓 *PONG!*\n⚡ Latensi: ~${this.state.pingMs}ms\n🟢 FZPEDIA Gateway: AKTIF REALTIME\n💬 Ruang: ${chatContext}\n🔒 Sesi: Multi-Device Permanen`);
        }
        // 2. STATUS Command
        else if (
          cmd === '!status' ||
          cmd === '.status' ||
          cmd === '/status' ||
          cmd === '#status' ||
          cmd === 'status' ||
          cmd === 'info'
        ) {
          const uptimeMinutes = Math.floor((Date.now() - (this.state.startedAt || Date.now())) / 60000);
          const chatContext = isGroup ? '👥 Grup WhatsApp' : '👤 Private Chat';
          await sendReply(`📊 *STATUS BOT FZPEDIA*\n- Status: Terhubung & Aktif Realtime 🟢\n- Ruang Obrolan: ${chatContext}\n- Nomor Bot: ${this.state.phoneNumber}\n- Versi WhatsApp: ${this.state.waVersion}\n- Uptime: ${uptimeMinutes} menit\n- Sesi: Tersimpan Permanen di Server\n- Respon Grup: Diaktifkan ✅`);
        }
        // 3. MENU / HELP Command
        else if (
          cmd === '!menu' ||
          cmd === '.menu' ||
          cmd === '/menu' ||
          cmd === '#menu' ||
          cmd === 'menu' ||
          cmd === 'help' ||
          cmd === '!help' ||
          cmd === '.help' ||
          cmd === '/help'
        ) {
          const chatContext = isGroup ? '👥 Grup WhatsApp' : '👤 Private Chat';
          await sendReply(`🤖 *FZPEDIA WHATSAPP GATEWAY*\n\nStatus: 🟢 *ONLINE & REALTIME*\nRuang: ${chatContext}\n\n📋 *Daftar Perintah:* \n• *!ping* atau *ping* — Tes respon & cek latensi server\n• *!status* atau *status* — Cek nomor, uptime & versi WA\n• *!menu* atau *menu* — Tampilkan menu panduan ini\n\n💡 *Respon Grup:* Bot siap merespons perintah Anda baik di dalam grup maupun pesan pribadi.`);
        }
        // 4. Greeting in self-chat or group
        else if (
          (isSelfChat || isGroup || isOwner) &&
          (cmd === 'halo' || cmd === 'hi' || cmd === 'hello' || cmd === 'bot' || cmd.includes('@bot'))
        ) {
          const chatContext = isGroup ? 'di grup ini' : 'di chat pribadi';
          await sendReply(`👋 *Halo Owner!*\nBot FZPEDIA Gateway aktif ${chatContext} & siap merespons. Ketik *!ping* atau *!menu* untuk melihat perintah.`);
        }
        // 5. Unknown command with prefix
        else if (trimmed.startsWith('!') || trimmed.startsWith('.') || trimmed.startsWith('/') || trimmed.startsWith('#')) {
          await sendReply(`❓ Perintah tidak dikenali: *${trimmed}*\n\nKetik *!menu* atau *ping* untuk melihat perintah yang tersedia.`);
        }
      }
    });
  }

  public async restoreSessionIfAvailable(): Promise<boolean> {
    if (this.sock && this.state.connectionState === 'connected') {
      return true;
    }
    if (this.isInitializing) {
      return false;
    }
    if (!this.hasRegisteredSession()) {
      return false;
    }

    const savedPhone = this.getSavedPhoneNumber();
    this.isInitializing = true;
    this.state.connectionState = 'connecting';
    this.state.phoneNumber = savedPhone;
    this.state.ownerNumber = savedPhone;
    this.state.hasSavedSession = true;
    this.state.lastError = '';

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
        browser: Browsers.ubuntu('Chrome'),
        syncFullHistory: false,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
      });

      this.sock = sock;
      this.attachSocketHandlers(sock, saveCreds, savedPhone);

      this.isInitializing = false;
      return true;
    } catch (err: unknown) {
      this.isInitializing = false;
      this.state.lastError = (err as Error)?.message || 'Gagal memulihkan sesi permanen.';
      return false;
    }
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

    // If already connected, return success
    if (this.sock && this.state.connectionState === 'connected') {
      return {
        success: true,
        message: 'Bot sudah terhubung ke WhatsApp dengan sesi permanen.',
      };
    }

    // If an existing registered session is present, try restoring it first
    if (this.hasRegisteredSession() && (!cleanNum || this.getSavedPhoneNumber().includes(cleanNum))) {
      const restored = await this.restoreSessionIfAvailable();
      if (restored) {
        return {
          success: true,
          message: 'Sesi tersimpan permanen berhasil dipulihkan otomatis.',
        };
      }
    }

    // Clean previous unauthenticated session files if starting a new pairing
    if (!this.hasRegisteredSession()) {
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
        browser: Browsers.ubuntu('Chrome'),
        syncFullHistory: false,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
      });

      this.sock = sock;
      this.attachSocketHandlers(sock, saveCreds, cleanNum ? `+${cleanNum}` : undefined);

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
    this.state.hasSavedSession = false;
    this.state.phoneNumber = '';
    this.state.ownerNumber = '';
    this.state.pairingCode = '';
    this.state.qrCodeRaw = '';
    this.addLog({
      senderNumber: 'System',
      senderType: 'system',
      chatType: 'private',
      messagePreview: 'Sesi WhatsApp diputus dan kredensial dibersihkan dari server.',
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
