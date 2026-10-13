'use client';

import React, { useState, useEffect } from 'react';
import { FzHeader } from '@/components/fz-header';
import { FzLanding } from '@/components/fz-landing';
import { PairingGateway } from '@/components/pairing-gateway';
import { ConnectionDashboard } from '@/components/connection-dashboard';
import { BotManagement } from '@/components/bot-management';
import { ServerAndQuota } from '@/components/server-and-quota';
import { RealtimeAnalytics } from '@/components/realtime-analytics';
import { DatabaseSchemaViewer } from '@/components/database-schema-viewer';
import { HelpCenter } from '@/components/help-center';
import { Footer } from '@/components/footer';
import { SoftAurora } from '@/components/ui/soft-aurora';
import {
  BotInstance,
  PrivacyConfig,
  ServerConfig,
  NotificationSettings,
  ActivityLog,
} from '@/types/bot';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('hero');
  const [realLatency, setRealLatency] = useState<number>(14);

  useEffect(() => {
    let isCancelled = false;
    const fetchPing = async () => {
      const t0 = performance.now();
      try {
        const res = await fetch('/api/server-ping');
        if (res.ok && !isCancelled) {
          const ping = Math.max(8, Math.round(performance.now() - t0));
          setRealLatency(ping);
        }
      } catch {
        // fallback
      }
    };

    const initialTimer = setTimeout(fetchPing, 100);
    const interval = setInterval(fetchPing, 10000);
    return () => {
      isCancelled = true;
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  const [bot, setBot] = useState<BotInstance>({
    id: 'bot-instance-live',
    name: 'FZPEDIA Gateway Bot',
    phoneNumber: '',
    ownerNumber: '',
    pairingMethod: 'pairing_code',
    pairingCode: '',
    connectionState: 'disconnected',
    deviceName: 'WhatsApp Multi-Device Gateway',
    waVersion: '2.24.12.54 Multi-Device',
    batteryLevel: 94,
    isCharging: true,
    pingMs: 14,
    uptimeSeconds: 0,
    lastConnectedAt: '',
    createdAt: '2026-10-13',
  });

  const [privacyConfig, setPrivacyConfig] = useState<PrivacyConfig>({
    strictPrivateMode: true,
    ignoreStrangers: true,
    ignoreGroupMentions: true,
    ignoreGroupChats: true,
    autoReadMessages: true,
    showTypingStatus: true,
    customPrefix: '!',
    whitelistNumbers: [],
  });

  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    selectedNode: 'srv-jkt-01',
    speedMode: 'turbo',
    dailyQuotaLimit: 5000,
    usedQuotaToday: 0,
    rateLimitPerMinute: 30,
    quotaResetTime: '00:00 WIB',
    autoThrottleOnHighLoad: true,
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    alertOnServerDown: true,
    alertOnQuotaThreshold: true,
    alertOnDisconnect: true,
    alertOnUnauthorizedAccess: true,
    notifyOwnerNumber: true,
    webhookUrl: '',
    recentAlerts: [],
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const handleUpdateBot = (updated: Partial<BotInstance>) => {
    setBot((prev) => ({ ...prev, ...updated }));
  };

  const handleUpdatePrivacy = (updated: Partial<PrivacyConfig>) => {
    setPrivacyConfig((prev) => ({ ...prev, ...updated }));
  };

  const handleUpdateServerConfig = (updated: Partial<ServerConfig>) => {
    setServerConfig((prev) => ({ ...prev, ...updated }));
  };

  const handleUpdateNotificationSettings = (updated: Partial<NotificationSettings>) => {
    setNotificationSettings((prev) => ({ ...prev, ...updated }));
  };

  const handleLogActivity = (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newLog: ActivityLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('id-ID'),
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    if (log.actionTaken === 'EXECUTED') {
      setServerConfig((prev) => ({
        ...prev,
        usedQuotaToday: prev.usedQuotaToday + 1,
      }));
    }
  };

  const handleClearLogs = () => {
    setActivityLogs([]);
  };

  const handleSimulateMessage = (type: 'owner' | 'stranger' | 'group') => {
    if (type === 'owner') {
      handleLogActivity({
        senderNumber: bot.ownerNumber || 'Owner (+62 812-xxxx-xxxx)',
        senderType: 'owner',
        chatType: 'private',
        messagePreview: '!status',
        actionTaken: 'EXECUTED',
        latencyMs: realLatency || 14,
      });
    } else if (type === 'stranger') {
      handleLogActivity({
        senderNumber: '+62 878-1122-3344',
        senderType: 'stranger',
        chatType: 'private',
        messagePreview: 'Halo kak, minta nomor admin',
        actionTaken: 'DROPPED_STRANGER',
        latencyMs: 3,
      });
    } else {
      handleLogActivity({
        senderNumber: 'Grup Komunitas (12036301@g.us)',
        senderType: 'group_member',
        chatType: 'group',
        messagePreview: '@bot cek stok',
        actionTaken: 'DROPPED_MENTION',
        latencyMs: 2,
      });
    }
  };

  const isConnected = bot.connectionState === 'connected';

  return (
    <div className="relative min-h-screen bg-[#07070a] text-slate-100 flex flex-col selection:bg-yellow-400 selection:text-black font-['Plus_Jakarta_Sans',sans-serif] overflow-x-hidden">
      {/* Global SoftAurora background across entire page */}
      <SoftAurora
        className="fixed inset-0 z-0 opacity-100 pointer-events-none"
        color1="#f7f7f7"
        color2="#e100ff"
        speed={0.45}
        scale={1.4}
      />

      <FzHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
      />

      <main className="flex-1 relative z-10">
        {activeTab === 'hero' && (
          <FzLanding
            onStartConnect={() => setActiveTab('gateway')}
            onOpenManagement={() => setActiveTab('management')}
            isConnected={isConnected}
            botPhoneNumber={bot.phoneNumber || 'Belum ditautkan'}
          />
        )}

        {activeTab === 'gateway' && (
          <PairingGateway
            bot={bot}
            onUpdateBot={handleUpdateBot}
            onNavigateToDashboard={() => setActiveTab('dashboard')}
            onNavigateToManagement={() => setActiveTab('management')}
            realLatency={realLatency}
          />
        )}

        {activeTab === 'dashboard' && (
          <ConnectionDashboard
            bot={bot}
            onUpdateBot={handleUpdateBot}
            onNavigateToPairing={() => setActiveTab('gateway')}
            onNavigateToServer={() => setActiveTab('server')}
            realLatency={realLatency}
          />
        )}

        {activeTab === 'management' && (
          <BotManagement
            privacyConfig={privacyConfig}
            onUpdatePrivacy={handleUpdatePrivacy}
            ownerNumber={bot.ownerNumber}
            onLogActivity={handleLogActivity}
            realLatency={realLatency}
          />
        )}

        {activeTab === 'server' && (
          <ServerAndQuota
            serverConfig={serverConfig}
            onUpdateServerConfig={handleUpdateServerConfig}
            notificationSettings={notificationSettings}
            onUpdateNotificationSettings={handleUpdateNotificationSettings}
            ownerNumber={bot.ownerNumber}
            realLatency={realLatency}
          />
        )}

        {activeTab === 'analytics' && (
          <RealtimeAnalytics
            activityLogs={activityLogs}
            onClearLogs={handleClearLogs}
            ownerNumber={bot.ownerNumber}
            onSimulateMessage={handleSimulateMessage}
            realLatency={realLatency}
          />
        )}

        {activeTab === 'schema' && <DatabaseSchemaViewer />}

        {activeTab === 'help' && <HelpCenter />}
      </main>

      <Footer onNavigate={setActiveTab} />
    </div>
  );
}
