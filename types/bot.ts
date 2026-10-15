export type PairingMethod = 'pairing_code' | 'qrcode';
export type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error';
export type BotSpeedMode = 'turbo' | 'balanced' | 'safe';
export type ServerNodeId = 'srv-jkt-01' | 'srv-sg-01' | 'srv-tky-01';

export interface BotInstance {
  id: string;
  name: string;
  phoneNumber: string;
  ownerNumber: string;
  pairingMethod: PairingMethod;
  pairingCode?: string;
  qrCodeData?: string;
  connectionState: ConnectionState;
  deviceName: string;
  waVersion: string;
  batteryLevel: number;
  isCharging: boolean;
  pingMs: number;
  uptimeSeconds: number;
  lastConnectedAt: string;
  createdAt: string;
  hasSavedSession?: boolean;
}

export interface PrivacyConfig {
  strictPrivateMode: boolean; // Only obeys owner number
  ignoreStrangers: boolean;   // Silently drops non-owner DMs
  ignoreGroupMentions: boolean; // Ignores @bot mentions in groups
  ignoreGroupChats: boolean;    // Ignores all group chatter
  autoReadMessages: boolean;   // Mark owner messages as read
  showTypingStatus: boolean;   // Send typing indicator before replying
  customPrefix: string;        // Trigger prefix e.g. ! or .
  whitelistNumbers: string[];  // Trusted numbers permitted to command
}

export interface ServerConfig {
  selectedNode: ServerNodeId;
  speedMode: BotSpeedMode;
  dailyQuotaLimit: number;     // e.g. 5000 requests per day
  usedQuotaToday: number;      // e.g. 1420
  rateLimitPerMinute: number;  // e.g. 30 msgs/min
  quotaResetTime: string;      // e.g. "00:00 WIB"
  autoThrottleOnHighLoad: boolean;
}

export interface ServerNode {
  id: ServerNodeId;
  name: string;
  location: string;
  flag: string;
  pingMs: number;
  status: 'optimal' | 'stable' | 'maintenance';
  loadPercentage: number;
  uptime: string;
  ip: string;
}

export interface NotificationSettings {
  alertOnServerDown: boolean;
  alertOnQuotaThreshold: boolean; // >80% & >95%
  alertOnDisconnect: boolean;
  alertOnUnauthorizedAccess: boolean;
  notifyOwnerNumber: boolean;
  webhookUrl: string;
  recentAlerts: ServerAlert[];
}

export interface ServerAlert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  timestamp: string;
  read: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  senderNumber: string;
  senderType: 'owner' | 'stranger' | 'group_member' | 'system';
  chatType: 'private' | 'group';
  messagePreview: string;
  actionTaken: 'EXECUTED' | 'DROPPED_STRANGER' | 'DROPPED_GROUP' | 'DROPPED_MENTION' | 'RATE_LIMITED';
  latencyMs: number;
}

export interface CustomCommand {
  id: string;
  trigger: string;
  response: string;
  description: string;
  enabled: boolean;
  isSystem?: boolean;
}
