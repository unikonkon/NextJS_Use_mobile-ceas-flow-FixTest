'use client';

import { useState } from 'react';
import { Header, PageContainer } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { User, Palette, ChevronRight, Check, Database, FileSpreadsheet, FileText, PlusCircle, Bell, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeStore, type ThemeType } from '@/lib/stores/theme-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { StorageInfoCard, ExportDataCard, ExportTxtCard, AutoOpenSettingCard, SettingAlertPriceCard } from './MoreTabComponent';

interface SettingsMenuItemProps {
  icon: React.ReactNode;
  title: string;
  isOpen?: boolean;
  onClick?: () => void;
}

function SettingsMenuItem({ icon, title, isOpen, onClick }: SettingsMenuItemProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200',
        'hover:shadow-soft hover:scale-[1.02]',
        'active:scale-[0.98]',
        'bg-card border-border'
      )}
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-lg bg-accent text-accent-foreground">
            {icon}
          </div>
          <span className="font-medium text-foreground">{title}</span>
        </div>
        <ChevronRight className={cn(
          'size-7 text-muted-foreground transition-transform duration-200',
          isOpen && 'rotate-90'
        )} />
      </CardContent>
    </Card>
  );
}

interface ThemeOptionProps {
  theme: ThemeType;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

function ThemeOption({ theme, label, isSelected, onClick }: ThemeOptionProps) {
  // Color previews for each theme
  const themeColors: Record<ThemeType, string> = {
    light: 'linear-gradient(135deg, oklch(0.98 0.005 90) 0%, oklch(0.45 0.15 160) 100%)',
    dark: 'linear-gradient(135deg, oklch(0.08 0.015 260) 0%, oklch(0.35 0.14 155) 100%)',
    zinc: 'linear-gradient(135deg, oklch(0.98 0.002 260) 0%, oklch(0.50 0.02 260) 100%)',
    stone: 'linear-gradient(135deg, oklch(0.98 0.003 50) 0%, oklch(0.48 0.08 50) 100%)',
    cyan: 'linear-gradient(135deg, oklch(0.98 0.005 200) 0%, oklch(0.55 0.20 200) 100%)',
    sky: 'linear-gradient(135deg, oklch(0.98 0.006 220) 0%, oklch(0.52 0.18 220) 100%)',
    teal: 'linear-gradient(135deg, oklch(0.98 0.005 180) 0%, oklch(0.50 0.18 180) 100%)',
    gray: 'linear-gradient(135deg, oklch(0.25 0.005 260) 0%, oklch(0.55 0.01 260) 100%)',
    neutral: 'linear-gradient(135deg, oklch(0.22 0.003 80) 0%, oklch(0.50 0.01 80) 100%)',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 relative overflow-hidden',
        'hover:shadow-soft hover:scale-[1.02]',
        'active:scale-[0.98]',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        'bg-card border-border'
      )}
      onClick={handleClick}
    >
      <CardContent className="px-4">
        <div className="flex flex-col items-center gap-3">
          {/* Color Preview */}
          <div
            className="size-16 rounded-lg border-2 border-border shadow-sm"
            style={{ background: themeColors[theme] }}
          />
          {/* Label */}
          <span className={cn(
            'text-sm font-medium',
            isSelected ? 'text-primary' : 'text-foreground'
          )}>
            {label}
          </span>
          {/* Check Icon */}
          {isSelected && (
            <div className="absolute top-2 right-2 flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground">
              <Check className="size-4" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ThemeSelector() {
  const currentTheme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const themes: { value: ThemeType; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'zinc', label: 'Zinc' },
    { value: 'stone', label: 'Stone' },
    { value: 'cyan', label: 'Cyan' },
    { value: 'sky', label: 'Sky' },
    { value: 'teal', label: 'Teal' },
    { value: 'dark', label: 'Dark' },
    { value: 'gray', label: 'Gray' },
    { value: 'neutral', label: 'Neutral' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">เลือกธีมสี</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {themes.map((theme) => (
          <ThemeOption
            key={theme.value}
            theme={theme.value}
            label={theme.label}
            isSelected={currentTheme === theme.value}
            onClick={() => setTheme(theme.value)}
          />
        ))}
      </div>
    </div>
  );
}

export function MoreTab() {
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showStorageInfo, setShowStorageInfo] = useState(false);
  const [showExportData, setShowExportData] = useState(false);
  const [showAutoOpenSetting, setShowAutoOpenSetting] = useState(false);
  const [showExportTxt, setShowExportTxt] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const frequentOnHome = useSettingsStore((s) => s.frequentOnHome);
  const setFrequentOnHome = useSettingsStore((s) => s.setFrequentOnHome);
  const frequentOnAddSheet = useSettingsStore((s) => s.frequentOnAddSheet);
  const setFrequentOnAddSheet = useSettingsStore((s) => s.setFrequentOnAddSheet);
  const handleAccountClick = () => {
    // TODO: Navigate to account settings
    console.log('Account settings clicked');
  };

  const handleThemeClick = () => {
    setShowThemeSelector(!showThemeSelector);
  };

  const handleStorageClick = () => {
    setShowStorageInfo(!showStorageInfo);
  };

  const handleExportClick = () => {
    setShowExportData(!showExportData);
  };

  const handleAutoOpenClick = () => {
    setShowAutoOpenSetting(!showAutoOpenSetting);
  };

  const handleExportTxtClick = () => {
    setShowExportTxt(!showExportTxt);
  };

  const handleAlertClick = () => {
    setShowAlert(!showAlert);
  };

  return (
    <>
      <Header title="การตั้งค่า" />

      <PageContainer className="my-4">
        {/* <div className="flex flex-col pt-3">
          <SettingsMenuItem
            icon={<User className="size-5" />}
            title="บัญชี"
            onClick={handleAccountClick}
          />
        </div> */}

        <div className="flex flex-col pt-3">
          <SettingsMenuItem
            icon={<Palette className="size-5" />}
            title="การตั้งค่า ธีมสี"
            isOpen={showThemeSelector}
            onClick={handleThemeClick}
          />
        </div>

        {/* Theme Selector */}
        {showThemeSelector && (
          <Card className="bg-card border-border animate-slide-up mt-1">
            <CardContent className="p-2">
              <ThemeSelector />
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col pt-3">
          <SettingsMenuItem
            icon={<PlusCircle className="size-5" />}
            title="ตั้งค่าการเพิ่มรายการ"
            isOpen={showAutoOpenSetting}
            onClick={handleAutoOpenClick}
          />
        </div>

        {/* Auto Open Setting Card + Frequent Transactions Toggles */}
        {showAutoOpenSetting && (
          <div className="animate-slide-up mt-1 space-y-2">
            <AutoOpenSettingCard />

            {/* Frequent Transactions Toggles */}
            <Card className="bg-card border-border overflow-hidden">
              <CardContent className="p-0">
                {/* Toggle 1: หน้าหลัก (HomeTab) */}
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer active:bg-muted/30 transition-colors"
                  onClick={() => setFrequentOnHome(!frequentOnHome)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-10 rounded-lg bg-accent text-accent-foreground">
                      <Repeat className="size-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">รายการใช้ซ้ำ - หน้าหลัก</span>
                      <span className="text-xs text-muted-foreground">
                        แสดงรายการใช้ซ้ำในหน้าหลัก
                      </span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0',
                      frequentOnHome ? 'bg-primary' : 'bg-muted'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                        frequentOnHome ? 'translate-x-5.5' : 'translate-x-0.5'
                      )}
                    />
                  </div>
                </div>

                <div className="border-t border-border/30 mx-4" />

                {/* Toggle 2: หน้าเพิ่มรายการ (AddTransactionSheet) */}
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer active:bg-muted/30 transition-colors"
                  onClick={() => setFrequentOnAddSheet(!frequentOnAddSheet)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-10 rounded-lg bg-accent text-accent-foreground">
                      <Repeat className="size-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">รายการใช้ซ้ำ - เพิ่มรายการ</span>
                      <span className="text-xs text-muted-foreground">
                        แสดงรายการใช้ซ้ำในหน้าเพิ่มรายการ
                      </span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0',
                      frequentOnAddSheet ? 'bg-primary' : 'bg-muted'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                        frequentOnAddSheet ? 'translate-x-5.5' : 'translate-x-0.5'
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex flex-col pt-3">
          <SettingsMenuItem
            icon={<FileSpreadsheet className="size-5" />}
            title="ส่งออกข้อมูล Excel"
            isOpen={showExportData}
            onClick={handleExportClick}
          />
        </div>

        {/* Export Data Card */}
        {showExportData && (
          <div className="animate-slide-up mt-1">
            <ExportDataCard />
          </div>
        )}

        <div className="flex flex-col pt-3">
          <SettingsMenuItem
            icon={<FileText className="size-5" />}
            title="ส่งออกข้อมูล TXT"
            isOpen={showExportTxt}
            onClick={handleExportTxtClick}
          />
        </div>

        {/* Export TXT Card */}
        {showExportTxt && (
          <div className="animate-slide-up mt-1">
            <ExportTxtCard />
          </div>
        )}

        <div className="flex flex-col pt-3">
          <SettingsMenuItem
            icon={<Database className="size-5" />}
            title="ข้อมูล Storage"
            isOpen={showStorageInfo}
            onClick={handleStorageClick}
          />
        </div>

        {/* Storage Info Card */}
        {showStorageInfo && (
          <div className="animate-slide-up mt-1">
            <StorageInfoCard />
          </div>
        )}


        <div className="flex flex-col pt-3">
          <SettingsMenuItem
            icon={<Bell className="size-5" />}
            title="แจ้งเตือนรายจ่าย"
            isOpen={showAlert}
            onClick={handleAlertClick}
          />
        </div>

        {/* Alert Card */}
        {showAlert && (
          <div className="animate-slide-up mt-1">
            <SettingAlertPriceCard />
          </div>
        )}

      </PageContainer>
    </>
  );
}
