import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

// Tipos para a funcionalidade de swipe
interface SwipeHandler {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

const SwipeableSheet = SheetPrimitive.Root;
const SwipeableSheetTrigger = SheetPrimitive.Trigger;
const SwipeableSheetClose = SheetPrimitive.Close;
const SwipeableSheetPortal = SheetPrimitive.Portal;

const SwipeableSheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
));
SwipeableSheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
);

interface SwipeableSheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

const SwipeableSheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SwipeableSheetContentProps
>(
  (
    { side = "bottom", className, children, onSwipeUp, onSwipeDown, ...props },
    ref
  ) => {
    const [startY, setStartY] = React.useState(0);
    const [currentY, setCurrentY] = React.useState(0);
    const [isSwiping, setIsSwiping] = React.useState(false);
    const contentRef = React.useRef<HTMLDivElement>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
      if (side === "bottom" || side === "top") {
        setStartY(e.touches[0].clientY);
        setCurrentY(e.touches[0].clientY);
        setIsSwiping(true);
      }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!isSwiping) return;
      
      const touchY = e.touches[0].clientY;
      const diffY = touchY - startY;
      
      if (side === "bottom" && diffY < 0) {
        // Swipe para cima (fechar o sheet)
        setCurrentY(touchY);
        if (contentRef.current) {
          contentRef.current.style.transform = `translateY(${Math.max(diffY, -50)}px)`;
        }
      } else if (side === "top" && diffY > 0) {
        // Swipe para baixo (fechar o sheet superior)
        setCurrentY(touchY);
        if (contentRef.current) {
          contentRef.current.style.transform = `translateY(${Math.min(diffY, 50)}px)`;
        }
      }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      if (!isSwiping) return;
      
      const diffY = currentY - startY;
      const threshold = 50; // Limite para considerar como swipe completo
      
      if (Math.abs(diffY) > threshold) {
        if (side === "bottom" && diffY < 0) {
          // Swipe para cima completo - fechar sheet
          if (onSwipeUp) onSwipeUp();
        } else if (side === "top" && diffY > 0) {
          // Swipe para baixo completo - fechar sheet superior
          if (onSwipeDown) onSwipeDown();
        }
      } else {
        // Swipe não completo - retornar à posição original
        if (contentRef.current) {
          contentRef.current.style.transform = "";
        }
      }
      
      setIsSwiping(false);
      setStartY(0);
      setCurrentY(0);
    };

    const handleSwipeUp = () => {
      if (side === "bottom" && onSwipeUp) {
        onSwipeUp();
      }
    };

    const handleSwipeDown = () => {
      if (side === "top" && onSwipeDown) {
        onSwipeDown();
      }
    };

    React.useEffect(() => {
      if (contentRef.current) {
        contentRef.current.style.transition = isSwiping ? "none" : "transform 0.3s ease";
      }
    }, [isSwiping]);

    return (
      <SwipeableSheetPortal>
        <SwipeableSheetOverlay />
        <SheetPrimitive.Content
          ref={(el) => {
            contentRef.current = el as HTMLDivElement;
            if (typeof ref === "function") {
              ref(el);
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLDivElement>).current = el as HTMLDivElement;
            }
          }}
          className={cn(sheetVariants({ side }), className)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          {...props}
        >
          {side === "bottom" && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted rounded-full" />
          )}
          {side === "top" && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted rounded-full" />
          )}
          {children}
          <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        </SheetPrimitive.Content>
      </SwipeableSheetPortal>
    );
  }
);
SwipeableSheetContent.displayName = "SwipeableSheetContent";

const SwipeableSheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
SwipeableSheetHeader.displayName = "SwipeableSheetHeader";

const SwipeableSheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
SwipeableSheetFooter.displayName = "SwipeableSheetFooter";

const SwipeableSheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
SwipeableSheetTitle.displayName = SheetPrimitive.Title.displayName;

const SwipeableSheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SwipeableSheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  SwipeableSheet,
  SwipeableSheetPortal,
  SwipeableSheetOverlay,
  SwipeableSheetTrigger,
  SwipeableSheetClose,
  SwipeableSheetContent,
  SwipeableSheetHeader,
  SwipeableSheetFooter,
  SwipeableSheetTitle,
  SwipeableSheetDescription,
};
