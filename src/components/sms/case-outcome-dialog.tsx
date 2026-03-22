"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SMS_CASE_OUTCOME_META } from "@/lib/sms-case-outcomes";
import type { SmsCaseOutcomeStatus } from "@/lib/types";

const outcomeOptions = Object.keys(
  SMS_CASE_OUTCOME_META
) as SmsCaseOutcomeStatus[];

export function CaseOutcomeDialog({
  open,
  onOpenChange,
  farmerName,
  initialStatus,
  initialSummary,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmerName?: string;
  initialStatus?: SmsCaseOutcomeStatus | null;
  initialSummary?: string;
  onSubmit: (status: SmsCaseOutcomeStatus, summary: string) => void;
}) {
  const [status, setStatus] = React.useState<SmsCaseOutcomeStatus>(
    initialStatus ?? "monitoring"
  );
  const [summary, setSummary] = React.useState(initialSummary ?? "");

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setStatus(initialStatus ?? "monitoring");
    setSummary(initialSummary ?? "");
  }, [initialStatus, initialSummary, open]);

  const handleSubmit = () => {
    onSubmit(status, summary.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>I-record ang outcome ng case</DialogTitle>
          <DialogDescription>
            Ilagay kung ano na ang kasalukuyang lagay ng concern
            {farmerName ? ` ni ${farmerName}` : ""} para makita ito sa
            Operations, farmer profile, at reports.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Outcome status</Label>
            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(value as SmsCaseOutcomeStatus)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {outcomeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {SMS_CASE_OUTCOME_META[option].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {SMS_CASE_OUTCOME_META[status].helper}
            </p>
            {status === "resolved" ? (
              <p className="text-xs text-amber-700 dark:text-amber-200">
                Kapag pinili ang "Nalutas", hindi pa agad tuluyang isasara ang case. Hihintayin muna ng system ang kumpirmasyon ng magsasaka o manual confirmation ng barangay team.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Maikling buod</Label>
            <Textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              rows={5}
              placeholder="Halimbawa: Naibigay na ang paunang payo at babalikan muli matapos ang 3 araw."
            />
            <p className="text-xs text-muted-foreground">
              Mas mainam kung malinaw kung ano ang ginawa, ano ang lagay ng
              concern ngayon, at ano ang susunod na hakbang.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Kanselahin
          </Button>
          <Button onClick={handleSubmit}>I-save ang outcome</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
