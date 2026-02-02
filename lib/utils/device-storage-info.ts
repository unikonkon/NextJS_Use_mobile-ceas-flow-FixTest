'use client';

// ============================================
// Device & Browser Detection
// ============================================

export interface DeviceInfo {
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
  platformVersion: string;
  browser: string;
  browserVersion: string;
  isStandalone: boolean; // PWA mode
  deviceModel: string;
}

export interface StorageInfo {
  quota: number; // Total quota in bytes
  usage: number; // Current usage in bytes
  usageDetails?: {
    indexedDB?: number;
    caches?: number;
    serviceWorkerRegistrations?: number;
  };
  percentUsed: number;
  isEstimate: boolean;
}

export interface StorageEstimate {
  device: DeviceInfo;
  storage: StorageInfo;
  indexedDBLimits: {
    theoretical: string;
    practical: string;
    notes: string;
  };
}

// Detect device platform
function detectPlatform(): { platform: DeviceInfo['platform']; version: string; model: string } {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { platform: 'unknown', version: '', model: '' };
  }

  const ua = navigator.userAgent;
  const uaData = (navigator as any).userAgentData;

  // iOS detection
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    const match = ua.match(/OS (\d+[_\d]*)/);
    const version = match ? match[1].replace(/_/g, '.') : '';
    const modelMatch = ua.match(/(iPad|iPhone|iPod)/);
    const model = modelMatch ? modelMatch[1] : 'iOS Device';
    return { platform: 'ios', version, model };
  }

  // Android detection
  if (/Android/.test(ua)) {
    const match = ua.match(/Android (\d+\.?\d*)/);
    const version = match ? match[1] : '';
    // Try to extract device model
    const modelMatch = ua.match(/;\s*([^;)]+)\s*Build/);
    const model = modelMatch ? modelMatch[1].trim() : 'Android Device';
    return { platform: 'android', version, model };
  }

  // Desktop fallback
  if (uaData?.platform) {
    return { platform: 'desktop', version: '', model: uaData.platform };
  }

  if (/Windows/.test(ua)) {
    const match = ua.match(/Windows NT (\d+\.?\d*)/);
    return { platform: 'desktop', version: match ? match[1] : '', model: 'Windows' };
  }

  if (/Mac OS X/.test(ua)) {
    const match = ua.match(/Mac OS X (\d+[_\d]*)/);
    return { platform: 'desktop', version: match ? match[1].replace(/_/g, '.') : '', model: 'macOS' };
  }

  if (/Linux/.test(ua)) {
    return { platform: 'desktop', version: '', model: 'Linux' };
  }

  return { platform: 'unknown', version: '', model: 'Unknown Device' };
}

// Detect browser
function detectBrowser(): { browser: string; version: string } {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { browser: 'Unknown', version: '' };
  }

  const ua = navigator.userAgent;

  // Check for specific browsers (order matters!)

  // Samsung Browser
  if (/SamsungBrowser/i.test(ua)) {
    const match = ua.match(/SamsungBrowser\/(\d+\.?\d*)/);
    return { browser: 'Samsung Internet', version: match ? match[1] : '' };
  }

  // Opera/OPR
  if (/OPR\/|Opera/i.test(ua)) {
    const match = ua.match(/(?:OPR|Opera)\/(\d+\.?\d*)/);
    return { browser: 'Opera', version: match ? match[1] : '' };
  }

  // Edge (Chromium-based)
  if (/Edg\//.test(ua)) {
    const match = ua.match(/Edg\/(\d+\.?\d*)/);
    return { browser: 'Microsoft Edge', version: match ? match[1] : '' };
  }

  // Edge (Legacy)
  if (/Edge\//.test(ua)) {
    const match = ua.match(/Edge\/(\d+\.?\d*)/);
    return { browser: 'Microsoft Edge (Legacy)', version: match ? match[1] : '' };
  }

  // Firefox
  if (/Firefox/i.test(ua)) {
    const match = ua.match(/Firefox\/(\d+\.?\d*)/);
    return { browser: 'Firefox', version: match ? match[1] : '' };
  }

  // Chrome (must come after Edge check)
  if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) {
    const match = ua.match(/Chrome\/(\d+\.?\d*)/);
    return { browser: 'Chrome', version: match ? match[1] : '' };
  }

  // Chromium
  if (/Chromium/i.test(ua)) {
    const match = ua.match(/Chromium\/(\d+\.?\d*)/);
    return { browser: 'Chromium', version: match ? match[1] : '' };
  }

  // Safari (must come after Chrome check)
  if (/Safari/i.test(ua) && /Apple/i.test(navigator.vendor)) {
    const match = ua.match(/Version\/(\d+\.?\d*)/);
    return { browser: 'Safari', version: match ? match[1] : '' };
  }

  // WebView detection
  if (/wv\)|WebView/i.test(ua)) {
    return { browser: 'WebView', version: '' };
  }

  return { browser: 'Unknown Browser', version: '' };
}

// Check if running as PWA
function isPWA(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

// Get IndexedDB storage limits info based on platform/browser
function getIndexedDBLimits(device: DeviceInfo): StorageEstimate['indexedDBLimits'] {
  const { platform, browser } = device;

  // iOS Safari limits
  if (platform === 'ios') {
    if (browser === 'Safari') {
      return {
        theoretical: '~1 GB',
        practical: '~500 MB recommended',
        notes: 'iOS Safari มีข้อจำกัดที่ประมาณ 1GB ต่อ origin และอาจถูกล้างข้อมูลอัตโนมัติหากพื้นที่ไม่พอ',
      };
    }
    // iOS WebView (Chrome on iOS uses WebKit)
    return {
      theoretical: '~500 MB',
      practical: '~200 MB recommended',
      notes: 'เบราว์เซอร์บน iOS ใช้ WebKit engine จึงมีข้อจำกัดคล้าย Safari',
    };
  }

  // Android
  if (platform === 'android') {
    if (browser === 'Chrome' || browser === 'Chromium') {
      return {
        theoretical: '~80% ของพื้นที่ว่าง',
        practical: '~60% ของพื้นที่ว่าง',
        notes: 'Chrome บน Android อนุญาตใช้งานได้สูงสุดถึง 80% ของพื้นที่ว่างทั้งหมด',
      };
    }
    if (browser === 'Samsung Internet') {
      return {
        theoretical: '~80% ของพื้นที่ว่าง',
        practical: '~60% ของพื้นที่ว่าง',
        notes: 'Samsung Internet มีความจุใกล้เคียงกับ Chrome',
      };
    }
    if (browser === 'Firefox') {
      return {
        theoretical: '~50% ของพื้นที่ว่าง',
        practical: '~40% ของพื้นที่ว่าง',
        notes: 'Firefox บน Android มีการจัดการ quota แบบ dynamic',
      };
    }
  }

  // Desktop browsers
  if (browser === 'Chrome' || browser === 'Chromium' || browser === 'Microsoft Edge') {
    return {
      theoretical: '~80% ของพื้นที่ว่าง',
      practical: '~60% ของพื้นที่ว่าง',
      notes: 'เบราว์เซอร์ Chromium-based อนุญาตใช้งานได้สูงสุดถึง 80% ของพื้นที่ว่าง',
    };
  }

  if (browser === 'Firefox') {
    return {
      theoretical: '~50% ของพื้นที่ว่าง (สูงสุด 2GB)',
      practical: '~1.5 GB recommended',
      notes: 'Firefox มี quota limit ที่ 50% ของพื้นที่ว่าง แต่ไม่เกิน 2GB',
    };
  }

  if (browser === 'Safari') {
    return {
      theoretical: '~1 GB',
      practical: '~500 MB recommended',
      notes: 'Safari บน macOS มีข้อจำกัดคล้าย iOS Safari',
    };
  }

  return {
    theoretical: 'ไม่ทราบ',
    practical: '~100 MB recommended',
    notes: 'ไม่สามารถระบุข้อจำกัดที่แน่ชัดสำหรับเบราว์เซอร์นี้ได้',
  };
}

// Get storage estimate using Storage API
async function getStorageEstimate(): Promise<StorageInfo> {
  if (typeof window === 'undefined' || !navigator.storage?.estimate) {
    return {
      quota: 0,
      usage: 0,
      percentUsed: 0,
      isEstimate: true,
    };
  }

  try {
    const estimate = await navigator.storage.estimate();
    const quota = estimate.quota || 0;
    const usage = estimate.usage || 0;
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

    // Try to get usage breakdown if available
    const usageDetails = (estimate as any).usageDetails;

    return {
      quota,
      usage,
      usageDetails: usageDetails ? {
        indexedDB: usageDetails.indexedDB,
        caches: usageDetails.caches,
        serviceWorkerRegistrations: usageDetails.serviceWorkerRegistrations,
      } : undefined,
      percentUsed,
      isEstimate: true,
    };
  } catch (error) {
    console.error('Failed to get storage estimate:', error);
    return {
      quota: 0,
      usage: 0,
      percentUsed: 0,
      isEstimate: true,
    };
  }
}

// Format bytes to human readable
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Main function to get all device and storage info
export async function getDeviceStorageInfo(): Promise<StorageEstimate> {
  const platformInfo = detectPlatform();
  const browserInfo = detectBrowser();

  const device: DeviceInfo = {
    platform: platformInfo.platform,
    platformVersion: platformInfo.version,
    browser: browserInfo.browser,
    browserVersion: browserInfo.version,
    isStandalone: isPWA(),
    deviceModel: platformInfo.model,
  };

  const storage = await getStorageEstimate();
  const indexedDBLimits = getIndexedDBLimits(device);

  return {
    device,
    storage,
    indexedDBLimits,
  };
}

// Get platform icon name
export function getPlatformIcon(platform: DeviceInfo['platform']): string {
  switch (platform) {
    case 'ios':
      return 'apple';
    case 'android':
      return 'android';
    case 'desktop':
      return 'monitor';
    default:
      return 'smartphone';
  }
}

// Get browser icon based on browser name
export function getBrowserIcon(browser: string): string {
  const browserLower = browser.toLowerCase();
  if (browserLower.includes('chrome')) return 'chrome';
  if (browserLower.includes('safari')) return 'safari';
  if (browserLower.includes('firefox')) return 'firefox';
  if (browserLower.includes('edge')) return 'edge';
  if (browserLower.includes('opera')) return 'opera';
  if (browserLower.includes('samsung')) return 'samsung';
  return 'globe';
}
