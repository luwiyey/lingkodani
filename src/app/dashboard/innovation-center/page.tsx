'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useData } from '@/context/data-context';
import {
  CheckCircle2,
  ClipboardCheck,
  Download,
  ExternalLink,
  Fingerprint,
  Glasses,
  Link2,
  Loader2,
  ShieldCheck,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ProofBlock = {
  index: number;
  recordType: string;
  recordCount: number;
  createdAt: string;
  previousHash: string;
  hash: string;
};

const encoder = new TextEncoder();

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function shortenHash(hash: string) {
  return hash ? `${hash.slice(0, 12)}...${hash.slice(-10)}` : 'Wala pa';
}

export default function InnovationCenterPage() {
  const { auditLogs, smsMessages, farmers, vouchers, resources, marketPrices } = useData();
  const { toast } = useToast();
  const [proof, setProof] = useState<ProofBlock | null>(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const recordSummary = useMemo(() => ({
    smsCases: smsMessages.length,
    farmers: farmers.length,
    vouchers: vouchers.length,
    inventoryItems: resources.length,
    priceEntries: marketPrices.length,
    auditActions: auditLogs.length,
  }), [auditLogs.length, farmers.length, marketPrices.length, resources.length, smsMessages.length, vouchers.length]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const createProof = async () => {
    setProofLoading(true);
    try {
      const previousHash = proof?.hash ?? 'LINGKOD-ANI-GENESIS';
      const createdAt = new Date().toISOString();
      const payload = JSON.stringify({ previousHash, recordSummary, createdAt });
      const hash = await sha256(payload);
      setProof({
        index: (proof?.index ?? 0) + 1,
        recordType: 'Lingkod-Ani operational snapshot',
        recordCount: Object.values(recordSummary).reduce((sum, count) => sum + count, 0),
        createdAt,
        previousHash,
        hash,
      });
      setSignature(null);
      toast({ title: 'Nagawa ang record proof', description: 'May cryptographic fingerprint na ang kasalukuyang snapshot.' });
    } finally {
      setProofLoading(false);
    }
  };

  const connectWallet = async () => {
    const ethereum = (window as Window & { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
    if (!ethereum) {
      toast({ title: 'Walang Web3 wallet', description: 'Mag-install muna ng compatible wallet gaya ng MetaMask sa device na gagamitin.', variant: 'destructive' });
      return;
    }
    setWalletLoading(true);
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0] ?? null);
      toast({ title: 'Nakapag-connect ang wallet', description: 'Maaaring gamitin ang wallet identity bilang optional na signer ng proof.' });
    } catch {
      toast({ title: 'Hindi nakakonekta ang wallet', description: 'Kinansela o hindi pinayagan ang wallet connection.', variant: 'destructive' });
    } finally {
      setWalletLoading(false);
    }
  };

  const signProof = async () => {
    if (!proof || !walletAddress) return;
    const ethereum = (window as Window & { ethereum?: { request: (args: { method: string; params: string[] }) => Promise<string> } }).ethereum;
    if (!ethereum) return;
    setWalletLoading(true);
    try {
      const message = `Lingkod-Ani record proof\n${proof.hash}\n${proof.createdAt}`;
      const result = await ethereum.request({ method: 'personal_sign', params: [message, walletAddress] });
      setSignature(result);
      toast({ title: 'Nalagdaan ang proof', description: 'Naitala ang wallet signature sa exported verification certificate.' });
    } catch {
      toast({ title: 'Hindi nalagdaan ang proof', description: 'Kinansela o hindi pinayagan ang wallet signature.', variant: 'destructive' });
    } finally {
      setWalletLoading(false);
    }
  };

  const toggleCamera = async () => {
    if (cameraOn) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraOn(false);
      return;
    }
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch {
      setCameraError('Hindi mabuksan ang camera. Payagan ang camera access o gamitin ang guide nang walang camera.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Innovation at Trust Center</h1>
          <Badge variant="secondary">Optional tools</Badge>
        </div>
        <p className="max-w-3xl text-muted-foreground">Mga dagdag na kasangkapan para sa mas matibay na record accountability, digital verification, at field learning. Hindi nito inilalagay ang pribadong farmer data sa public blockchain.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600" />Tamper-evident record proof</CardTitle>
                <CardDescription>Cryptographic fingerprint ng report o operational snapshot para mapatunayan kung may nabago matapos itong i-finalize.</CardDescription>
              </div>
              <Fingerprint className="h-7 w-7 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {Object.entries(recordSummary).map(([label, value]) => <div key={label} className="rounded-lg border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">{label.replace(/([A-Z])/g, ' $1')}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>)}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void createProof()} disabled={proofLoading}>{proofLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardCheck className="mr-2 h-4 w-4" />}Gumawa ng record proof</Button>
              {proof && <Button variant="outline" onClick={() => downloadJson(`lingkod-ani-proof-${proof.index}.json`, { ...proof, walletAddress, signature })}><Download className="mr-2 h-4 w-4" />I-download ang certificate</Button>}
            </div>
            {proof && <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 text-sm"><div className="flex items-center gap-2 font-medium text-emerald-900"><CheckCircle2 className="h-4 w-4" />Proof #{proof.index} created</div><p className="mt-2 break-all font-mono text-xs text-emerald-950">Hash: {proof.hash}</p><p className="mt-1 break-all font-mono text-xs text-emerald-950">Previous: {shortenHash(proof.previousHash)}</p></div>}
            <p className="text-xs text-muted-foreground">Ito ay blockchain-ready verification: linked hashes muna ang ginagamit sa system. Ang public-chain anchoring ay maaari lamang i-on kapag may approved network, wallet policy, at funding para sa transaction fees.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-blue-600" />Web3 identity at signing</CardTitle>
            <CardDescription>Optional wallet signature para sa staff o certifying office. Walang password o private key na kinokolekta ng Lingkod-Ani.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 text-sm"><p className="font-medium">Wallet status</p><p className="mt-1 break-all text-muted-foreground">{walletAddress ?? 'Walang nakakonektang wallet'}</p>{signature && <p className="mt-2 break-all font-mono text-xs text-blue-700">Signature: {shortenHash(signature)}</p>}</div>
            <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void connectWallet()} disabled={walletLoading}>{walletLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}Connect wallet</Button><Button onClick={() => void signProof()} disabled={!proof || !walletAddress || walletLoading}><Link2 className="mr-2 h-4 w-4" />Sign current proof</Button></div>
            <p className="text-xs text-muted-foreground">Ang wallet ay optional identity layer lamang. Ang normal na barangay login, role permissions, Firebase security rules, at audit logs ang nananatiling pangunahing access control.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4"><div><CardTitle className="flex items-center gap-2"><Glasses className="h-5 w-5 text-orange-600" />Field Learning AR Guide</CardTitle><CardDescription>Camera-assisted crop inspection guide para sa AEW training. Gumagana rin bilang ordinaryong visual guide kapag walang camera o compatible na AR device.</CardDescription></div><Smartphone className="h-7 w-7 text-orange-600" /></div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
            <div className="relative min-h-[260px] overflow-hidden rounded-xl border bg-slate-950">
              <video ref={videoRef} autoPlay playsInline muted className={`h-full min-h-[260px] w-full object-cover ${cameraOn ? 'opacity-100' : 'hidden'}`} />
              {!cameraOn && <div className="flex min-h-[260px] items-center justify-center p-8 text-center text-slate-300"><div><Smartphone className="mx-auto mb-3 h-10 w-10 text-orange-400" /><p className="font-medium">Handa ang crop guide</p><p className="mt-1 text-sm text-slate-400">Buksan ang camera para sa live overlay, o basahin ang guide sa tabi.</p></div></div>}
              {cameraOn && <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="rounded-full border-2 border-orange-300/80 p-16"><div className="h-2 w-2 rounded-full bg-orange-300" /></div><div className="absolute bottom-4 rounded-full bg-black/60 px-4 py-2 text-xs text-white">I-center ang dahon o bahagi ng tanim sa bilog</div></div>}
            </div>
            <div className="space-y-4">
              <div><p className="font-semibold">Gabay sa unang pagsusuri</p><ol className="mt-2 space-y-2 text-sm text-muted-foreground"><li>1. Tingnan kung may batik, butas, pagkalanta, o kakaibang insekto.</li><li>2. Kunan ng malinaw na larawan kung may smartphone.</li><li>3. Itala ang tanim, edad ng tanim, at lawak ng apektadong bahagi.</li><li>4. Ipadala ang obserbasyon sa SMS Feed para ma-review ng AEW.</li></ol></div>
              <Separator />
              <div className="rounded-lg border border-orange-200 bg-orange-50/70 p-3 text-sm text-orange-950"><p className="font-medium">Paalala</p><p className="mt-1">Ang overlay na ito ay training aid, hindi awtomatikong diagnosis. Kailangan pa rin ang validation ng AEW bago magbigay ng final na payo.</p></div>
              {cameraError && <p className="text-sm text-destructive">{cameraError}</p>}
              <Button onClick={() => void toggleCamera()} variant={cameraOn ? 'destructive' : 'default'}>{cameraOn ? 'Isara ang camera' : 'Buksan ang field camera'}</Button>
              <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:underline">Compatibility reference <ExternalLink className="h-3 w-3" /></a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
