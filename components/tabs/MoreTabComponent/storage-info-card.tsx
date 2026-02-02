// ยังไม่ได้ใช้ ในตอนนี้ ใช้ StorageInfoCard.tsx แทน
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  getDeviceStorageInfo,
  formatBytes,
  type StorageEstimate,
} from '@/lib/utils/device-storage-info';
import {
  Database,
  Smartphone,
  Monitor,
  Globe,
  HardDrive,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  Cpu,
  Chrome,
  Compass,
  AlertTriangle,
  Shield,
  Clock,
} from 'lucide-react';

// ============================================================================
// IndexedDB Storage Limits Data (Based on official documentation 2024-2025)
// ============================================================================

interface BrowserStorageLimits {
  browser: string;
  theoretical: string;
  practical: string;
  notes: string;
  evictionPolicy?: string;
  persistentStorage?: string;
  warning?: string;
}

const BROWSER_STORAGE_LIMITS: Record<string, BrowserStorageLimits> = {
  chrome: {
    browser: 'Chrome',
    theoretical: '60% ของพื้นที่ดิสก์ทั้งหมด',
    practical: '6-10 GB ต่อ origin',
    notes:
      'Chrome ใช้ระบบ quota แบบ dynamic ตามพื้นที่ว่างในดิสก์ ' +
      'แต่ละ origin สามารถใช้ได้ถึง 60% ของพื้นที่ดิสก์รวม',
    evictionPolicy: 'LRU (Least Recently Used)',
    persistentStorage: 'รองรับ - อนุมัติอัตโนมัติ',
  },
  firefox: {
    browser: 'Firefox',
    theoretical: '50% ของพื้นที่ดิสก์ (Persistent)',
    practical: '~10 GiB ต่อ origin',
    notes:
      'Best-effort: 10% ของดิสก์ หรือ 10 GiB (อันไหนน้อยกว่า) | ' +
      'Persistent: 50% ของดิสก์ สูงสุด 8 TiB',
    evictionPolicy: 'LRU',
    persistentStorage: 'รองรับ - ต้องขอ permission',
  },
  safari: {
    browser: 'Safari',
    theoretical: '60% ของพื้นที่ดิสก์ (Safari 17+)',
    practical: '500 MB - 1 GB (iOS), มากกว่าบน macOS',
    notes:
      'Safari 17.0+: Origin quota ~60% สำหรับ browser apps | ' +
      'Overall quota 80% ของดิสก์รวม',
    evictionPolicy: '7-day eviction policy',
    persistentStorage: 'รองรับ - ตาม heuristics',
    warning:
      '⚠️ ข้อมูลจะถูกลบหลัง 7 วันที่ไม่มี user interaction (ยกเว้น PWA)',
  },
  'safari-ios': {
    browser: 'Safari iOS',
    theoretical: '60% ของพื้นที่ดิสก์',
    practical: '500 MB - 1 GB',
    notes:
      'iOS Safari มีข้อจำกัดมากกว่า macOS | ' +
      'พื้นที่ว่าง > 1 GB = quota 500 MB',
    evictionPolicy: '7-day eviction policy',
    persistentStorage: 'จำกัด - PWA ได้ 1 GB',
    warning:
      '⚠️ Private mode: IndexedDB ถูกปิดใช้งาน | 7 วันไม่ใช้งาน = ลบข้อมูล',
  },
  edge: {
    browser: 'Microsoft Edge',
    theoretical: '60% ของพื้นที่ดิสก์ทั้งหมด',
    practical: '6-10 GB ต่อ origin',
    notes: 'Edge ใช้ Chromium engine จึงมี quota เหมือน Chrome',
    evictionPolicy: 'LRU',
    persistentStorage: 'รองรับ - อนุมัติอัตโนมัติ',
  },
  opera: {
    browser: 'Opera',
    theoretical: '60% ของพื้นที่ดิสก์ทั้งหมด',
    practical: '6-10 GB ต่อ origin',
    notes: 'Opera ใช้ Chromium engine มี quota เหมือน Chrome',
    evictionPolicy: 'LRU',
    persistentStorage: 'รองรับ',
  },
  samsung: {
    browser: 'Samsung Internet',
    theoretical: '60% ของพื้นที่ดิสก์ทั้งหมด',
    practical: '6-10 GB ต่อ origin',
    notes: 'Samsung Internet ใช้ Chromium engine เหมือน Chrome บน Android',
    evictionPolicy: 'LRU',
    persistentStorage: 'รองรับ',
  },
  'webkit-ios': {
    browser: 'iOS Browser (WebKit)',
    theoretical: '60% ของพื้นที่ดิสก์',
    practical: '500 MB - 1 GB',
    notes:
      '⚠️ ทุกเบราว์เซอร์บน iOS ใช้ WebKit engine ดังนั้นมีข้อจำกัดเหมือน Safari iOS',
    evictionPolicy: '7-day eviction policy',
    persistentStorage: 'จำกัด',
    warning: 'Chrome/Firefox บน iOS มี quota เหมือน Safari (ไม่ใช่ desktop)',
  },
};

function getIndexedDBLimits(
  browser: string,
  platform: string
): BrowserStorageLimits {
  const browserLower = browser.toLowerCase();
  const isIOS = platform === 'ios';

  // iOS browsers all use WebKit
  if (isIOS) {
    if (browserLower.includes('safari')) {
      return BROWSER_STORAGE_LIMITS['safari-ios'];
    }
    // All iOS browsers use WebKit
    return {
      ...BROWSER_STORAGE_LIMITS['webkit-ios'],
      browser: `${browser} (iOS)`,
    };
  }

  // Desktop/Android browsers
  if (browserLower.includes('chrome') && !browserLower.includes('edge')) {
    return BROWSER_STORAGE_LIMITS.chrome;
  }
  if (browserLower.includes('firefox')) {
    return BROWSER_STORAGE_LIMITS.firefox;
  }
  if (browserLower.includes('safari')) {
    return BROWSER_STORAGE_LIMITS.safari;
  }
  if (browserLower.includes('edge')) {
    return BROWSER_STORAGE_LIMITS.edge;
  }
  if (browserLower.includes('opera')) {
    return BROWSER_STORAGE_LIMITS.opera;
  }
  if (browserLower.includes('samsung')) {
    return BROWSER_STORAGE_LIMITS.samsung;
  }

  // Default fallback
  return {
    browser: browser || 'Unknown',
    theoretical: 'ไม่ทราบ',
    practical: '~1 GB (ค่าเฉลี่ย)',
    notes:
      'ไม่สามารถระบุข้อจำกัดที่แน่นอนได้ แนะนำให้ใช้ Storage API estimate() ตรวจสอบ',
  };
}

// ============================================================================
// Custom SVG Icons
// ============================================================================

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function AndroidIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-1.44-.65-3.06-1.01-4.76-1.01-1.7 0-3.32.36-4.76 1.01L5.07 5.67c-.18-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85L5.82 9.5C2.73 11.27.93 14.16.93 17.5h22.14c0-3.34-1.8-6.23-4.89-8zm-11.1 4c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    </svg>
  );
}

function SafariIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm3.5-12.5l-5 2-2 5 5-2 2-5z" />
    </svg>
  );
}

function FirefoxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  );
}

function EdgeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 12c0-1.54-.37-3-.99-4.3-.08.06-4.43 2.85-4.43 2.85s-1.13-.47-2.33-.52c-1.57-.07-3.07.54-4.15 1.56-.97.92-1.56 2.27-1.56 3.74 0 1.43.52 2.73 1.38 3.73-1.44-.2-2.75-.83-3.81-1.77C3.8 15.94 3 14.08 3 12c0-4.97 4.03-9 9-9 4.17 0 7.67 2.83 8.69 6.69.21.69.31 1.41.31 2.16v.15zM12 21c-2.76 0-5.21-1.24-6.85-3.19.24.03.48.04.73.04 1.53 0 2.94-.52 4.07-1.39.93.85 2.17 1.38 3.53 1.38.74 0 1.44-.15 2.07-.43-.19 1.01-.6 1.95-1.2 2.76-.91 1.1-2.19 1.83-3.64 1.83H12z" />
    </svg>
  );
}

function SamsungIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
    </svg>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function StorageGauge({
  used,
  total,
  percentUsed,
}: {
  used: number;
  total: number;
  percentUsed: number;
}) {
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercent(percentUsed);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentUsed]);

  const getStatusColor = (percent: number) => {
    if (percent >= 90) return 'var(--expense)';
    if (percent >= 70) return 'oklch(0.75 0.18 85)';
    return 'var(--income)';
  };

  const statusColor = getStatusColor(percentUsed);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset =
    circumference - (animatedPercent / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative size-32">
        <svg className="size-full -rotate-90 transform" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted/30"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke={statusColor}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 8px ${statusColor})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-2xl font-bold tabular-nums"
            style={{ color: statusColor }}
          >
            {animatedPercent.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">ใช้งานแล้ว</span>
        </div>
      </div>

      <div className="mt-4 flex w-full justify-between text-sm">
        <div className="flex flex-col items-center">
          <span className="text-muted-foreground">ใช้งาน</span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatBytes(used)}
          </span>
        </div>
        <div className="h-full w-px bg-border" />
        <div className="flex flex-col items-center">
          <span className="text-muted-foreground">ความจุ</span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatBytes(total)}
          </span>
        </div>
      </div>
    </div>
  );
}

function PlatformIcon({
  platform,
  className,
}: {
  platform: string;
  className?: string;
}) {
  switch (platform) {
    case 'ios':
      return <AppleIcon className={className} />;
    case 'android':
      return <AndroidIcon className={className} />;
    case 'desktop':
      return <Monitor className={className} />;
    default:
      return <Smartphone className={className} />;
  }
}

function BrowserIcon({
  browser,
  className,
}: {
  browser: string;
  className?: string;
}) {
  const browserLower = browser.toLowerCase();
  if (browserLower.includes('chrome')) return <Chrome className={className} />;
  if (browserLower.includes('safari'))
    return <SafariIcon className={className} />;
  if (browserLower.includes('firefox'))
    return <FirefoxIcon className={className} />;
  if (browserLower.includes('edge')) return <EdgeIcon className={className} />;
  if (browserLower.includes('samsung'))
    return <SamsungIcon className={className} />;
  if (browserLower.includes('opera')) return <Compass className={className} />;
  return <Globe className={className} />;
}

function InfoRow({
  icon,
  label,
  value,
  subValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        {icon}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="truncate font-medium text-foreground">{value}</span>
        {subValue && (
          <span className="truncate text-xs text-muted-foreground">
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Browser Comparison Table Component
// ============================================================================

function BrowserLimitsTable() {
  const browsers = [
    { key: 'chrome', name: 'Chrome', icon: <Chrome className="size-4" /> },
    { key: 'firefox', name: 'Firefox', icon: <FirefoxIcon className="size-4" /> },
    { key: 'safari', name: 'Safari', icon: <SafariIcon className="size-4" /> },
    { key: 'safari-ios', name: 'Safari iOS', icon: <AppleIcon className="size-4" /> },
    { key: 'edge', name: 'Edge', icon: <EdgeIcon className="size-4" /> },
    { key: 'samsung', name: 'Samsung', icon: <SamsungIcon className="size-4" /> },
  ];

  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
      <h4 className="mb-3 flex items-center gap-2 font-medium text-foreground">
        <Globe className="size-4 text-primary" />
        เปรียบเทียบความจุ IndexedDB ทุกเบราว์เซอร์
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50">
              <th className="pb-2 text-left font-medium text-muted-foreground">
                Browser
              </th>
              <th className="pb-2 text-left font-medium text-muted-foreground">
                Theoretical
              </th>
              <th className="pb-2 text-left font-medium text-muted-foreground">
                Practical
              </th>
              <th className="pb-2 text-left font-medium text-muted-foreground">
                Eviction
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {browsers.map(({ key, name, icon }) => {
              const limits = BROWSER_STORAGE_LIMITS[key];
              const hasWarning = !!limits.warning;
              return (
                <tr key={key} className={cn(hasWarning && 'bg-amber-500/5')}>
                  <td className="py-2">
                    <div className="flex items-center gap-1.5">
                      {icon}
                      <span className="font-medium">{name}</span>
                      {hasWarning && (
                        <AlertTriangle className="size-3 text-amber-500" />
                      )}
                    </div>
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {limits.theoretical}
                  </td>
                  <td className="py-2 font-medium text-income">
                    {limits.practical}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {limits.evictionPolicy || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* iOS Warning */}
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 p-2.5 text-xs">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
        <p className="leading-relaxed text-amber-700 dark:text-amber-300">
          <strong>iOS สำคัญ:</strong> ทุกเบราว์เซอร์บน iOS (Chrome, Firefox,
          Edge) ใช้ WebKit engine ของ Apple ดังนั้นมีข้อจำกัดเหมือน Safari iOS
          (~500 MB - 1 GB)
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function StorageInfoCard() {
  const [storageInfo, setStorageInfo] = useState<StorageEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStorageInfo = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const info = await getDeviceStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Failed to get storage info:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStorageInfo();
  }, [fetchStorageInfo]);

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-border bg-card">
        <CardContent className="p-5">
          <div className="flex animate-pulse flex-col items-center gap-4">
            <div className="size-32 rounded-full bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!storageInfo) {
    return (
      <Card className="overflow-hidden border-border bg-card">
        <CardContent className="p-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <Database className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              ไม่สามารถเข้าถึงข้อมูล Storage ได้
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { device, storage } = storageInfo;

  // Get browser-specific limits
  const browserLimits = getIndexedDBLimits(device.browser, device.platform);

  return (
    <Card className="group relative overflow-hidden border-border bg-card transition-all duration-300 hover:shadow-soft">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          background:
            'radial-gradient(ellipse at top right, var(--primary) 0%, transparent 50%), radial-gradient(ellipse at bottom left, var(--accent) 0%, transparent 50%)',
        }}
      />

      <CardContent className="relative p-5">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/5">
              <Database className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                IndexedDB Storage
              </h3>
              <p className="text-xs text-muted-foreground">
                ข้อมูลท้องถิ่นของแอป
              </p>
            </div>
          </div>
          <button
            onClick={fetchStorageInfo}
            disabled={isRefreshing}
            className={cn(
              'flex size-9 items-center justify-center rounded-lg',
              'bg-accent text-accent-foreground',
              'transition-all duration-200 hover:bg-accent/80',
              'active:scale-95 disabled:opacity-50',
              isRefreshing && 'animate-spin'
            )}
          >
            <RefreshCw className="size-4" />
          </button>
        </div>

        {/* Storage Gauge */}
        <div className="mb-5 rounded-xl bg-linear-to-b from-muted/30 to-muted/10 p-5">
          <StorageGauge
            used={storage.usage}
            total={storage.quota}
            percentUsed={storage.percentUsed}
          />
        </div>

        {/* Device Info */}
        <div className="space-y-1 rounded-xl bg-muted/30 p-3">
          <InfoRow
            icon={<PlatformIcon platform={device.platform} className="size-4" />}
            label="แพลตฟอร์ม"
            value={
              device.platform === 'ios'
                ? 'iOS'
                : device.platform === 'android'
                  ? 'Android'
                  : device.platform === 'desktop'
                    ? 'Desktop'
                    : 'Unknown'
            }
            subValue={
              device.deviceModel +
              (device.platformVersion ? ` (${device.platformVersion})` : '')
            }
          />
          <div className="mx-9 border-b border-border/50" />
          <InfoRow
            icon={<BrowserIcon browser={device.browser} className="size-4" />}
            label="เบราว์เซอร์"
            value={device.browser}
            subValue={
              device.browserVersion ? `Version ${device.browserVersion}` : undefined
            }
          />
          {device.isStandalone && (
            <>
              <div className="mx-9 border-b border-border/50" />
              <InfoRow
                icon={<Cpu className="size-4" />}
                label="โหมดการทำงาน"
                value="PWA (Standalone)"
                subValue="ติดตั้งเป็นแอป"
              />
            </>
          )}
        </div>

        {/* Expandable Details */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg py-2',
            'text-sm font-medium text-muted-foreground',
            'transition-colors hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <Info className="size-4" />
          <span>ข้อมูลเพิ่มเติมเกี่ยวกับ Storage</span>
          {isExpanded ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-3 animate-slide-up space-y-4">
            {/* Current Browser Limits */}
            <div className="rounded-xl border border-border/50 bg-linear-to-br from-primary/5 to-transparent p-4">
              <div className="mb-3 flex items-center gap-2">
                <HardDrive className="size-4 text-primary" />
                <h4 className="font-medium text-foreground">
                  ความจุ IndexedDB สำหรับ {browserLimits.browser}
                </h4>
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ความจุทางทฤษฎี:</span>
                  <span className="font-medium text-foreground">
                    {browserLimits.theoretical}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">แนะนำให้ใช้:</span>
                  <span className="font-medium text-income">
                    {browserLimits.practical}
                  </span>
                </div>
                {browserLimits.evictionPolicy && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="size-3" />
                      Eviction Policy:
                    </span>
                    <span className="font-medium text-foreground">
                      {browserLimits.evictionPolicy}
                    </span>
                  </div>
                )}
                {browserLimits.persistentStorage && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Shield className="size-3" />
                      Persistent Storage:
                    </span>
                    <span className="font-medium text-foreground">
                      {browserLimits.persistentStorage}
                    </span>
                  </div>
                )}
                <p className="mt-3 rounded-lg bg-muted/50 p-2.5 text-xs leading-relaxed text-muted-foreground">
                  {browserLimits.notes}
                </p>
                {browserLimits.warning && (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-2.5 text-xs">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                    <p className="leading-relaxed text-amber-700 dark:text-amber-300">
                      {browserLimits.warning}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Browser Comparison Table */}
            <BrowserLimitsTable />

            {/* Usage Details */}
            {storage.usageDetails && (
              <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                <h4 className="mb-3 font-medium text-foreground">
                  รายละเอียดการใช้งาน
                </h4>
                <div className="space-y-2 text-sm">
                  {storage.usageDetails.indexedDB !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IndexedDB:</span>
                      <span className="font-medium tabular-nums">
                        {formatBytes(storage.usageDetails.indexedDB)}
                      </span>
                    </div>
                  )}
                  {storage.usageDetails.caches !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Cache Storage:
                      </span>
                      <span className="font-medium tabular-nums">
                        {formatBytes(storage.usageDetails.caches)}
                      </span>
                    </div>
                  )}
                  {storage.usageDetails.serviceWorkerRegistrations !==
                    undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Service Workers:
                      </span>
                      <span className="font-medium tabular-nums">
                        {formatBytes(
                          storage.usageDetails.serviceWorkerRegistrations
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info Note */}
            <div className="flex items-start gap-2 rounded-lg bg-accent/50 p-3 text-xs">
              <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <p className="leading-relaxed text-muted-foreground">
                ค่าที่แสดงเป็นการประมาณจาก Storage API ของเบราว์เซอร์
                ความจุจริงอาจแตกต่างกันขึ้นอยู่กับพื้นที่ว่างในอุปกรณ์
                และนโยบายของแต่ละเบราว์เซอร์
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
