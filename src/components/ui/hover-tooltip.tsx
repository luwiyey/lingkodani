'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HoverTooltipProps {
  children: React.ReactNode;
  text?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function HoverTooltip({ children, text, side }: HoverTooltipProps) {
    if (!text) {
        return <>{children}</>;
    }
    
    return (
        <TooltipProvider>
            <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                <TooltipContent side={side}>
                    <p>{text}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
