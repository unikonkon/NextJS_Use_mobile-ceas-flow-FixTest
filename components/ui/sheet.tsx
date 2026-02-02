"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
}) {
  const [dragY, setDragY] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startY, setStartY] = React.useState(0);
  const [lastY, setLastY] = React.useState(0);
  const [velocity, setVelocity] = React.useState(0);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const velocityTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const closeThreshold = 120; // pixels to drag before closing (increased for mobile)
  const velocityThreshold = 0.5; // velocity threshold for closing

  const handleDragStart = (clientY: number) => {
    if (side !== "bottom") return;
    setIsDragging(true);
    setStartY(clientY);
    setLastY(clientY);
    setDragY(0);
    setVelocity(0);
  };

  const handleDragMove = (clientY: number) => {
    if (side !== "bottom" || !isDragging) return;
    const deltaY = clientY - startY;
    const deltaVelocity = clientY - lastY;

    // Only allow dragging down (positive deltaY)
    if (deltaY > 0) {
      setDragY(deltaY);
      setVelocity(deltaVelocity);
      setLastY(clientY);

      // Clear previous timer
      if (velocityTimerRef.current) {
        clearTimeout(velocityTimerRef.current);
      }

      // Reset velocity after a short delay
      velocityTimerRef.current = setTimeout(() => {
        setVelocity(0);
      }, 50);
    }
  };

  const handleDragEnd = () => {
    if (side !== "bottom" || !isDragging) return;

    // Clear velocity timer
    if (velocityTimerRef.current) {
      clearTimeout(velocityTimerRef.current);
    }

    // Close if dragged past threshold or has high downward velocity
    // Increased minimum drag distance for velocity-based closing (from 50 to 100)
    if (dragY > closeThreshold || (dragY > 75 && velocity > velocityThreshold)) {
      // Close the sheet
      const closeButton = contentRef.current?.querySelector('[data-slot="sheet-close"]') as HTMLElement;
      closeButton?.click();
    }

    setIsDragging(false);
    setDragY(0);
    setStartY(0);
    setLastY(0);
    setVelocity(0);
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only start drag from top area or handle
    const target = e.target as HTMLElement;
    const isTopArea = target.closest('[data-drag-handle]') ||
      target.closest('[data-slot="sheet-header"]') ||
      (contentRef.current && e.touches[0].clientY - contentRef.current.getBoundingClientRect().top < 150);

    if (isTopArea) {
      handleDragStart(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      e.preventDefault(); // Prevent scrolling while dragging
      handleDragMove(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Pointer events for desktop
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only start drag from the top area (handle bar region)
    const target = e.target as HTMLElement;
    const isTopArea = target.closest('[data-drag-handle]') ||
      target.closest('[data-slot="sheet-header"]') ||
      (contentRef.current && e.clientY - contentRef.current.getBoundingClientRect().top < 100);

    if (isTopArea) {
      handleDragStart(e.clientY);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      handleDragMove(e.clientY);
    }
  };

  const handlePointerUp = () => {
    handleDragEnd();
  };

  // Reset drag state when sheet closes
  React.useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const observer = new MutationObserver(() => {
      const state = element.getAttribute('data-state');
      if (state === 'closed') {
        setIsDragging(false);
        setDragY(0);
      }
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ['data-state'],
    });

    return () => {
      observer.disconnect();
      if (velocityTimerRef.current) {
        clearTimeout(velocityTimerRef.current);
      }
    };
  }, []);

  // คำนวณค่าความโปร่งใส (opacity) ตามระยะทางที่ลาก
  const maxDrag = 200; // ระยะทางสูงสุดที่ลากเพื่อให้เปลี่ยน opacity เต็มที่
  const overlayOpacity = side === "bottom" && isDragging && dragY > 0
    ? Math.max(0, 0.5 - (dragY / maxDrag) * 0.5)
    : undefined;

  const transformStyle = side === "bottom" && dragY > 0
    ? {
      transform: `translateY(${dragY}px)`,
      transition: isDragging ? 'none' : 'transform 0.2s ease-out'
    }
    : {};

  return (
    <SheetPortal>
      <SheetOverlay
        style={overlayOpacity !== undefined ? { opacity: overlayOpacity } : undefined}
        className={cn(
          side === "bottom" && isDragging && "transition-opacity duration-75"
        )}
      />
      <SheetPrimitive.Content
        ref={contentRef}
        data-slot="sheet-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-100 data-[state=open]:duration-200",
          side === "right" &&
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          side === "left" &&
          "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "top" &&
          "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" &&
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          side === "bottom" && isDragging && "transition-none",
          className
        )}
        style={transformStyle}
        onTouchStart={side === "bottom" ? handleTouchStart : undefined}
        onTouchMove={side === "bottom" ? handleTouchMove : undefined}
        onTouchEnd={side === "bottom" ? handleTouchEnd : undefined}
        onPointerDown={side === "bottom" ? handlePointerDown : undefined}
        onPointerMove={side === "bottom" ? handlePointerMove : undefined}
        onPointerUp={side === "bottom" ? handlePointerUp : undefined}
        {...props}
      >
        {children}
        <SheetPrimitive.Close
          data-slot="sheet-close"
          className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-6" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
