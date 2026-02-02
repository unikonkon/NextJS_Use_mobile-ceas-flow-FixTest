'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/lib/stores';
import { PlusCircle, Smartphone, Info } from 'lucide-react';

export function AutoOpenSettingCard() {
  const autoOpenTransaction = useSettingsStore((s) => s.autoOpenTransaction);
  const setAutoOpenTransaction = useSettingsStore((s) => s.setAutoOpenTransaction);

  return (
    <Card className="group relative overflow-hidden border-border bg-card transition-all duration-300 hover:shadow-soft">
      {/* Decorative gradient background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          background:
            'radial-gradient(ellipse at top right, var(--primary) 0%, transparent 50%), radial-gradient(ellipse at bottom left, var(--accent) 0%, transparent 50%)',
        }}
      />

      <CardContent className="relative p-5">
        {/* Header */}
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/5">
            <PlusCircle className="size-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">เปิดหน้าเพิ่มรายการอัตโนมัติ</h3>
            <p className="text-xs text-muted-foreground">สำหรับการใช้งานจาก Mobile App</p>
          </div>
        </div>

        {/* Toggle Setting */}
        <div className="rounded-xl bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Smartphone className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">เปิดอัตโนมัติ</span>
                <span className="text-xs text-muted-foreground">
                  เมื่อเข้า webapp จะเปิดหน้าเพิ่มรายการทันที
                </span>
              </div>
            </div>
            <Switch
              checked={autoOpenTransaction}
              onCheckedChange={setAutoOpenTransaction}
              className={cn(
                'data-[state=checked]:bg-primary',
                'transition-colors duration-200'
              )}
            />
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-accent/50 p-3 text-xs">
          <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <p className="leading-relaxed text-muted-foreground">
            เหมาะสำหรับผู้ที่เปิด webapp จาก shortcut บน mobile app
            เพื่อบันทึกรายการได้เร็วขึ้น ค่าตั้งค่าจะถูกบันทึกไว้ในเครื่อง
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
