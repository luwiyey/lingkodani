'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Fingerprint,
  Search,
  Shield,
  ShieldAlert,
  Workflow,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { HelpDialog } from '@/components/ui/help-dialog';
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useData } from '@/context/data-context';
import { buildAuditSummary, getAuditChangedFields } from '@/lib/audit-intelligence';
import type { AuditLog } from '@/lib/types';

function inferAuditCategory(action: string) {
  const normalized = action.toLowerCase();
  if (normalized.includes('security') || normalized.includes('invite') || normalized.includes('delete_user')) return 'security';
  if (normalized.includes('automation') || normalized.includes('retention') || normalized.includes('follow_up')) return 'automation';
  if (normalized.includes('settings')) return 'settings';
  if (normalized.includes('update') || normalized.includes('create') || normalized.includes('merge')) return 'data';
  return 'operations';
}

function inferAuditSeverity(action: string) {
  const normalized = action.toLowerCase();
  if (normalized.includes('delete') || normalized.includes('revoke') || normalized.includes('failure') || normalized.includes('reopen')) return 'critical';
  if (normalized.includes('retry') || normalized.includes('warning') || normalized.includes('retention')) return 'warning';
  return 'info';
}

type FilterMode = 'all' | 'security' | 'operations' | 'suspicious' | 'missing_reason';

export default function AuditLogPage() {
  const { auditLogs } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [filter, setFilter] = useState<FilterMode>('all');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const auditSummary = useMemo(() => buildAuditSummary(auditLogs), [auditLogs]);
  const suspiciousLogIds = useMemo(
    () => new Set(auditSummary.suspiciousActivities.flatMap((item) => item.relatedLogIds)),
    [auditSummary.suspiciousActivities]
  );

  const filteredLogs = useMemo(
    () =>
      auditLogs.filter((log) => {
        const matchesSearch =
          log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) {
          return false;
        }

        const category = log.category ?? inferAuditCategory(log.action);

        switch (filter) {
          case 'security':
            return category === 'security' || Boolean(log.securitySensitive);
          case 'operations':
            return category !== 'security' && !log.securitySensitive;
          case 'suspicious':
            return suspiciousLogIds.has(log.id);
          case 'missing_reason':
            return Boolean(log.reasonRequired && !log.reasonProvided?.trim());
          default:
            return true;
        }
      }),
    [auditLogs, filter, searchTerm, suspiciousLogIds]
  );

  const filterButtons: Array<{ id: FilterMode; label: string }> = [
    { id: 'all', label: 'Lahat' },
    { id: 'security', label: 'Security' },
    { id: 'operations', label: 'Operations' },
    { id: 'suspicious', label: 'Suspicious' },
    { id: 'missing_reason', label: 'Walang dahilan' },
  ];

  const summaryCards = [
    { label: 'Kabuuang log', value: auditSummary.totalLogs, icon: Fingerprint },
    { label: 'Security / sensitive', value: auditSummary.securityLogs, icon: Shield },
    {
      label: 'Critical / warning',
      value: `${auditSummary.criticalLogs} / ${auditSummary.warningLogs}`,
      icon: AlertTriangle,
    },
    { label: 'Reason missing', value: auditSummary.reasonMissingCount, icon: ShieldAlert },
  ];

  const renderChangedFields = (log: AuditLog) => {
    const changedFields = getAuditChangedFields(log);

    if (changedFields.length === 0) {
      return null;
    }

    return (
      <p className="text-xs text-muted-foreground">
        Changed fields: {changedFields.join(', ')}
      </p>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold tracking-tight">Log ng Pagsusuri</h1>
          <HelpDialog title="Log ng Pagsusuri" tooltipText="Suriin ang mga mahahalagang aksyon na ginawa sa system.">
            <p>Ang pahinang ito ay naglalaman ng detalyadong audit trail ng mahahalagang aksyon sa sistema.</p>
            <p>
              Mas malinaw na ngayon ang paghihiwalay ng security-sensitive actions, operational events, at mga pattern na dapat bantayan
              ng supervisor.
            </p>
            <p><strong>Mga dagdag na layer:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Suspicious Activity Queue:</strong> Awtomatikong nagfa-flag ng missing reasons, system-triggered sensitive actions, at burst ng critical actions.</li>
              <li><strong>Security vs Operations filters:</strong> Mas madaling maghanap ng security-sensitive events kaysa mahaluan ng ordinaryong workflow logs.</li>
              <li><strong>Before / after hints:</strong> Mas madaling makita kung aling fields ang nabago bago pa buksan ang buong snapshot.</li>
            </ul>
          </HelpDialog>
        </div>
        <p className="text-muted-foreground">
          Isang mas malinaw na governance view ng audit trail para sa security, accountability, at operational review.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.label}>
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="mt-2 text-2xl font-bold">{card.value}</p>
                </div>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className={auditSummary.suspiciousActivities.length > 0 ? "border-amber-300 bg-amber-50/60" : undefined}>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-amber-700" />
            <div>
              <h2 className="font-semibold">Suspicious Activity Queue</h2>
              <p className="text-sm text-muted-foreground">
                Ito ang mga pattern na dapat tingnan muna ng supervisor o admin.
              </p>
            </div>
          </div>
          {auditSummary.suspiciousActivities.length > 0 ? (
            auditSummary.suspiciousActivities.map((item) => (
              <div key={item.id} className="rounded-lg border bg-background p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                  <Badge variant={item.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {item.severity}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Kaugnay na logs: {item.relatedLogIds.length}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Wala pang natukoy na suspicious pattern sa kasalukuyang audit trail.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <HoverTooltip text="Mag-type dito upang maghanap ng mga log. Maaari kang maghanap ayon sa email ng user, uri ng aksyon, o mga keyword sa detalye.">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Maghanap sa mga log ayon sa user, aksyon, o detalye..."
              className="w-full rounded-lg bg-background pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </HoverTooltip>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterButtons.map((item) => (
          <Button
            key={item.id}
            variant={filter === item.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-2 md:px-4">Timestamp</TableHead>
                  <TableHead className="px-2 md:px-4">Gumagamit</TableHead>
                  <TableHead className="px-2 md:px-4">Aksyon</TableHead>
                  <TableHead className="px-2 md:px-4">Uri</TableHead>
                  <TableHead className="px-2 md:px-4">Mga Detalye</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const category = log.category ?? inferAuditCategory(log.action);
                  const severity = log.severity ?? inferAuditSeverity(log.action);

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="break-words px-2 py-4 align-top md:px-4">
                        {isClient ? new Date(log.timestamp).toLocaleString() : ''}
                      </TableCell>
                      <TableCell className="break-words px-2 py-4 align-top font-medium md:px-4">{log.user}</TableCell>
                      <TableCell className="px-2 py-4 align-top md:px-4">
                        <div className="flex flex-col gap-2">
                          <Badge variant="secondary">{log.action}</Badge>
                          {log.reasonProvided ? (
                            <p className="text-xs text-muted-foreground">Reason: {log.reasonProvided}</p>
                          ) : null}
                          {log.reasonRequired && !log.reasonProvided?.trim() ? (
                            <p className="text-xs text-amber-700">Required ang reason pero walang nailagay.</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-4 align-top md:px-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{category}</Badge>
                          <Badge variant={severity === 'critical' ? 'destructive' : severity === 'warning' ? 'secondary' : 'outline'}>
                            {severity}
                          </Badge>
                          {log.securitySensitive ? <Badge variant="destructive">Sensitive</Badge> : null}
                          {suspiciousLogIds.has(log.id) ? <Badge variant="destructive">Suspicious pattern</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell className="break-words px-2 py-4 align-top md:px-4">
                        <div className="space-y-2">
                          <p>{log.details}</p>
                          {renderChangedFields(log)}
                          {(log.beforeSnapshot || log.afterSnapshot) ? (
                            <details className="rounded-lg border bg-muted/20 p-2 text-xs">
                              <summary className="cursor-pointer font-medium">Before / after</summary>
                              {log.beforeSnapshot ? (
                                <pre className="mt-2 overflow-auto whitespace-pre-wrap">{JSON.stringify(log.beforeSnapshot, null, 2)}</pre>
                              ) : null}
                              {log.afterSnapshot ? (
                                <pre className="mt-2 overflow-auto whitespace-pre-wrap">{JSON.stringify(log.afterSnapshot, null, 2)}</pre>
                              ) : null}
                            </details>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Walang tumugmang audit log sa kasalukuyang filter.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
