'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-96 w-96 rounded-full bg-expense/5 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Icon */}
        <div className="mb-6 flex size-24 items-center justify-center rounded-3xl bg-muted/50 shadow-lg">
          <WifiOff className="size-12 text-muted-foreground" />
        </div>

        {/* Title */}
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          ไม่มีการเชื่อมต่ออินเทอร์เน็ต
        </h1>

        {/* Description */}
        <p className="mb-8 max-w-sm text-muted-foreground">
          ดูเหมือนว่าคุณออฟไลน์อยู่ กรุณาตรวจสอบการเชื่อมต่อของคุณแล้วลองอีกครั้ง
        </p>

        {/* Retry Button */}
        <Button
          onClick={handleRefresh}
          size="lg"
          className="gap-2 rounded-xl shadow-lg"
        >
          <RefreshCw className="size-5" />
          ลองอีกครั้ง
        </Button>

        {/* App Info */}
        <div className="mt-12 flex items-center gap-2 text-xs text-muted-foreground/60">
          <span className="text-xl">📒</span>
            <span>Pay Flow</span>
        </div>
      </div>
    </div>
  );
}
