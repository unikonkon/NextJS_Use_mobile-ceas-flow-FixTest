import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  noBottomPadding?: boolean;
}

export function PageContainer({
  children,
  className,
  noPadding = false,
  noBottomPadding = false,
}: PageContainerProps) {
  return (
    <main
      className={cn(
        'min-h-screen w-full',
        !noPadding && 'px-4',
        !noBottomPadding && 'pb-24',
        className
      )}
    >
      {children}
    </main>
  );
}
