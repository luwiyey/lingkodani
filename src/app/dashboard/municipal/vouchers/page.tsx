
'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const requests = [
    { id: 'REQ001', barangay: 'Batakil', resource: 'Binhi ng Hybrid na Palay', quantity: 20, unit: 'sako', status: 'pending' },
    { id: 'REQ002', barangay: 'Batakil', resource: 'Patabang Urea', quantity: 50, unit: 'sako', status: 'approved' },
    { id: 'REQ003', barangay: 'Batakil', resource: 'Hand Tractor', quantity: 1, unit: 'yunit', status: 'rejected' },
];

const vouchers = [
    { id: 'VCH001', farmer: 'Maria Clara', resource: 'Patabang Urea', quantity: 2, unit: 'sako', status: 'issued', issueDate: new Date().toISOString() },
    { id: 'VCH002', farmer: 'Juan dela Cruz', resource: 'Binhi ng Hybrid na Palay', quantity: 1, unit: 'sako', status: 'redeemed', issueDate: new Date(Date.now() - 86400000).toISOString() },
]

export default function VouchersPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Tagapamahala ng Rekurso at Voucher</h1>
        <p className="text-muted-foreground">Aprubahan ang mga kahilingan mula sa barangay at subaybayan ang pamamahagi ng voucher.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Mga Kahilingan ng Rekurso mula sa Barangay</CardTitle>
          <CardDescription>Suriin at aprubahan ang mga kahilingan para sa mga rekurso.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Barangay</TableHead>
                <TableHead>Rekurso</TableHead>
                <TableHead>Dami</TableHead>
                <TableHead>Katayuan</TableHead>
                <TableHead className="text-right">Mga Aksyon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>{req.barangay}</TableCell>
                  <TableCell>{req.resource}</TableCell>
                  <TableCell>{req.quantity} {req.unit}</TableCell>
                  <TableCell><Badge variant={req.status === 'pending' ? 'secondary' : 'default'}>{req.status}</Badge></TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" disabled={req.status !== 'pending'}>Tanggihan</Button>
                    <Button size="sm" disabled={req.status !== 'pending'}>Aprubahan</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Log ng mga Inisyung Voucher sa SMS</CardTitle>
          <CardDescription>Subaybayan ang katayuan ng lahat ng voucher na ipinadala sa mga magsasaka.</CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Magsasaka</TableHead>
                <TableHead>Rekurso</TableHead>
                <TableHead>Katayuan</TableHead>
                <TableHead>Petsa ng Pag-isyu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.farmer}</TableCell>
                  <TableCell>{v.quantity} {v.unit} ng {v.resource}</TableCell>
                  <TableCell><Badge variant={v.status === 'issued' ? 'secondary' : 'default'}>{v.status}</Badge></TableCell>
                  <TableCell>{new Date(v.issueDate).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
