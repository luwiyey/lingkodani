'use client';

import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { HoverTooltip } from './hover-tooltip';

interface HelpDialogProps {
  title: string;
  children: React.ReactNode;
}

export function HelpDialog({ title, children }: HelpDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <HoverTooltip text={`Tulong para sa: ${title}`}>
          <Button variant="ghost" size="icon" className="h-7 w-7 ml-1 self-center shrink-0">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <span className="sr-only">Tulong: {title}</span>
          </Button>
        </HoverTooltip>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-6 text-sm text-foreground/80 space-y-4 leading-relaxed">
          {children}
        </div>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button>Naiintindihan</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
