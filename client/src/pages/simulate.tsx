import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Send,
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Clock,
  Bitcoin,
  Layers,
  ArrowLeftRight,
  DollarSign,
  Zap,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { NavHeader } from "@/components/nav-header";
import { apiRequest } from "@/lib/queryClient";
import type { UnifiedTransaction, CryptoPrice } from "@shared/schema";

const cryptoSchema = z.object({
  chain: z.enum(["bitcoin", "ethereum"]),
  receiver_address: z.string().min(10, "Enter a valid address"),
  amount: z.coerce.number().positive("Amount must be positive"),
});

const usdtFlashSchema = z.object({
  receiver_address: z.string().min(10, "Enter a valid ETH address").startsWith("0x", "Must be an Ethereum address starting with 0x"),
  amount: z.coerce.number().positive("Amount must be positive").min(1, "Minimum 1 USDT"),
});

type CryptoFormData = z.infer<typeof cryptoSchema>;
type UsdtFlashFormData = z.infer<typeof usdtFlashSchema>;

interface PendingTx {
  txHash: string;
  chain: "bitcoin" | "ethereum";
  amount: number;
  receiverAddress: string;
  submittedAt: number;
}

interface PendingFlash {
  txHash: string;
  usdtAmount: number;
  receiverAddress: string;
  expiresAt: number;
  submittedAt: number;
}

function truncate(str: string, start = 8, end = 6): string {
  if (str.length <= start + end + 3) return str;
  return `${str.slice(0, start)}...${str.slice(-end)}`;
}

function formatCrypto(n: number, decimals = 8): string {
  return n.toFixed(decimals).replace(/\.?0+$/, "");
}

function formatUsd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function formatUsdt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " USDT";
}

function CopyButton({ text }: { text: string }) {
  const { toast } = useToast();
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: text.slice(0, 20) + "..." });
      }}
      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
    >
      <Copy className="w-3.5 h-3.5" />
    </button>
  );
}

function ConfirmationDialog({
  pending,
  onClose,
}: {
  pending: PendingTx;
  onClose: () => void;
}) {
  const [, navigate] = useLocation();

  const { data: tx } = useQuery<UnifiedTransaction>({
    queryKey: ["/api/tx", pending.txHash],
    queryFn: () => fetch(`/api/tx/${pending.txHash}`).then((r) => r.json()),
    refetchInterval: 10_000,
    enabled: true,
  });

  const confirmations = tx?.confirmations ?? 0;
  const status = tx?.status ?? "pending";
  const amountUsd = tx?.amountUsd ?? 0;
  const fee = tx?.fee ?? 0;
  const feeUsd = tx?.feeUsd ?? 0;
  const symbol = pending.chain === "bitcoin" ? "BTC" : "ETH";
  const progress = Math.round((confirmations / 6) * 100);

  const statusColors = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    confirming: "bg-blue-100 text-blue-700 border-blue-200",
    confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    failed: "bg-red-100 text-red-700 border-red-200",
  };

  const statusLabel = {
    pending: "Pending",
    confirming: "Confirming",
    confirmed: "Confirmed",
    failed: "Failed",
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-6 pt-8 pb-6 text-white">
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center ring-4 ring-white/30">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl font-bold text-white">
              Transaction Broadcasted
            </DialogTitle>
            <p className="text-center text-emerald-100 text-sm mt-1">
              Your transaction has been submitted to the {pending.chain === "bitcoin" ? "Bitcoin" : "Ethereum"} network
            </p>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[status as keyof typeof statusColors] ?? statusColors.pending}`}
              data-testid="badge-dialog-status"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${status === "pending" ? "bg-amber-500 animate-pulse" : status === "confirming" ? "bg-blue-500 animate-pulse" : "bg-emerald-500"}`} />
              {statusLabel[status as keyof typeof statusLabel] ?? status}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs text-slate-500 shrink-0">Recipient</span>
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-mono text-xs text-slate-800 truncate" data-testid="text-dialog-recipient">
                  {truncate(pending.receiverAddress, 10, 8)}
                </span>
                <CopyButton text={pending.receiverAddress} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">Amount Sent</span>
              <div className="text-right">
                <div className="font-bold text-slate-900 text-sm" data-testid="text-dialog-amount-crypto">
                  {formatCrypto(pending.amount)} {symbol}
                </div>
                {amountUsd > 0 && (
                  <div className="text-xs text-slate-500" data-testid="text-dialog-amount-usd">
                    {formatUsd(amountUsd)}
                  </div>
                )}
              </div>
            </div>

            {fee > 0 && (
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">Network Fee</span>
                <div className="text-right">
                  <div className="text-xs font-medium text-slate-700">
                    {formatCrypto(fee, 8)} {symbol}
                  </div>
                  {feeUsd > 0 && (
                    <div className="text-xs text-slate-400">{formatUsd(feeUsd)}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Layers className="w-3.5 h-3.5" />
                Confirmations
              </span>
              <span className="font-semibold text-slate-800" data-testid="text-dialog-confirmations">
                {confirmations} / 6
              </span>
            </div>
            <Progress value={progress} className="h-2" data-testid="progress-confirmations" />
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>0</span>
              <span className={status === "confirmed" ? "text-emerald-600 font-medium" : ""}>
                {status === "confirmed" ? "Fully confirmed" : "Pending confirmations"}
              </span>
              <span>6</span>
            </div>
          </div>

          <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 flex items-start gap-2">
            <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-700">
              <span className="font-semibold">Estimated confirmation:</span>{" "}
              30–60 minutes
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400 shrink-0">Network</span>
              <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                {pending.chain === "bitcoin" ? (
                  <Bitcoin className="w-3 h-3 text-orange-500" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                )}
                {pending.chain === "bitcoin" ? "Bitcoin (BTC)" : "Ethereum (ETH)"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400 shrink-0">Submitted</span>
              <span className="text-xs text-slate-600 text-right">
                {new Date(pending.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{" "}
                {new Date(pending.submittedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "UTC", hour12: false })} UTC
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400 shrink-0">Tx Hash</span>
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-mono text-xs text-slate-600 truncate" data-testid="text-dialog-txhash">
                  {truncate(pending.txHash, 12, 10)}
                </span>
                <CopyButton text={pending.txHash} />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            data-testid="button-dialog-close"
          >
            Close
          </Button>
          <Button
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            onClick={() => { onClose(); navigate(`/tx/${pending.txHash}`); }}
            data-testid="button-dialog-view-explorer"
          >
            <ExternalLink className="w-4 h-4 mr-1.5" />
            View in Explorer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UsdtFlashDialog({
  pending,
  onClose,
}: {
  pending: PendingFlash;
  onClose: () => void;
}) {
  const [, navigate] = useLocation();
  const expiryDate = new Date(pending.expiresAt);
  const expiryStr = expiryDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " " + expiryDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC", hour12: false }) + " UTC";

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        <div className="px-6 pt-8 pb-6 text-white" style={{ background: "linear-gradient(135deg, #009393 0%, #006b6b 100%)" }}>
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center ring-4 ring-white/30">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl font-bold text-white">
              USDT Flash Sent
            </DialogTitle>
            <p className="text-center text-teal-100 text-sm mt-1">
              Transaction broadcast to the Ethereum network
            </p>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-700 border-emerald-200" data-testid="badge-flash-status">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Processing
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">Token</span>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "#009393" }}>₮</div>
                <span className="text-xs font-semibold text-slate-800">Tether USD (USDT)</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">Amount</span>
              <div className="text-right">
                <div className="font-bold text-slate-900 text-sm" data-testid="text-flash-amount">
                  {formatUsdt(pending.usdtAmount)}
                </div>
                <div className="text-xs text-slate-500">≈ {formatUsd(pending.usdtAmount)}</div>
              </div>
            </div>
            <div className="flex items-start justify-between gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 shrink-0">Recipient</span>
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-mono text-xs text-slate-800 truncate" data-testid="text-flash-recipient">
                  {truncate(pending.receiverAddress, 10, 8)}
                </span>
                <CopyButton text={pending.receiverAddress} />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex items-start gap-2">
            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800">
              <span className="font-semibold">Transfer window active.</span> This USDT transfer is being processed on the Ethereum network and will remain active until {expiryStr}.
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400 shrink-0">Network</span>
              <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                Ethereum (ERC-20)
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400 shrink-0">Tx Hash</span>
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-mono text-xs text-slate-600 truncate" data-testid="text-flash-txhash">
                  {truncate(pending.txHash, 12, 10)}
                </span>
                <CopyButton text={pending.txHash} />
              </div>
            </div>
          </div>

          <a
            href={`https://etherscan.io/tx/${pending.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 py-1"
            data-testid="link-etherscan-dialog"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View on Etherscan
          </a>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} data-testid="button-flash-close">
            Close
          </Button>
          <Button
            className="flex-1 text-white"
            style={{ background: "#009393" }}
            onClick={() => { onClose(); navigate(`/tx/${pending.txHash}`); }}
            data-testid="button-flash-view-explorer"
          >
            <ExternalLink className="w-4 h-4 mr-1.5" />
            View in Explorer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Simulate() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"crypto" | "usdt-flash">("crypto");
  const [pendingTx, setPendingTx] = useState<PendingTx | null>(null);
  const [pendingFlash, setPendingFlash] = useState<PendingFlash | null>(null);
  const [inputCurrency, setInputCurrency] = useState<"crypto" | "usd">("crypto");

  const { data: prices } = useQuery<CryptoPrice[]>({
    queryKey: ["/api/prices"],
    refetchInterval: 30_000,
  });

  const cryptoForm = useForm<CryptoFormData>({
    resolver: zodResolver(cryptoSchema),
    defaultValues: { chain: "bitcoin", receiver_address: "", amount: 0 },
  });

  const flashForm = useForm<UsdtFlashFormData>({
    resolver: zodResolver(usdtFlashSchema),
    defaultValues: { receiver_address: "", amount: 0 },
  });

  const chain = cryptoForm.watch("chain");
  const rawAmount = cryptoForm.watch("amount");

  const cryptoPrice =
    prices?.find((p) => p.id === (chain === "bitcoin" ? "bitcoin" : "ethereum"))?.priceUsd ?? 0;

  const symbol = chain === "bitcoin" ? "BTC" : "ETH";

  const conversionHint = (() => {
    if (!cryptoPrice || !rawAmount || rawAmount <= 0) return null;
    if (inputCurrency === "usd") {
      const crypto = rawAmount / cryptoPrice;
      return `≈ ${formatCrypto(crypto)} ${symbol}`;
    } else {
      const usd = rawAmount * cryptoPrice;
      return `≈ ${formatUsd(usd)}`;
    }
  })();

  const cryptoMutation = useMutation({
    mutationFn: async (data: CryptoFormData) => {
      let cryptoAmount = data.amount;
      if (inputCurrency === "usd") {
        if (!cryptoPrice || cryptoPrice <= 0) throw new Error("Unable to fetch live price. Please try again.");
        cryptoAmount = data.amount / cryptoPrice;
      }
      const endpoint = data.chain === "bitcoin" ? "/api/simulate/bitcoin" : "/api/simulate/ethereum";
      return apiRequest("POST", endpoint, { receiver_address: data.receiver_address, amount: cryptoAmount });
    },
    onSuccess: async (res, variables) => {
      const data = await res.json();
      if (data.tx_hash) {
        let cryptoAmount = variables.amount;
        if (inputCurrency === "usd" && cryptoPrice > 0) cryptoAmount = variables.amount / cryptoPrice;
        setPendingTx({ txHash: data.tx_hash, chain: variables.chain, amount: cryptoAmount, receiverAddress: variables.receiver_address, submittedAt: Date.now() });
        cryptoForm.reset();
      } else if (data.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Something went wrong", variant: "destructive" });
    },
  });

  const flashMutation = useMutation({
    mutationFn: async (data: UsdtFlashFormData) => {
      return apiRequest("POST", "/api/simulate/usdt-flash", { receiver_address: data.receiver_address, amount: data.amount });
    },
    onSuccess: async (res, variables) => {
      const data = await res.json();
      if (data.tx_hash) {
        setPendingFlash({ txHash: data.tx_hash, usdtAmount: variables.amount, receiverAddress: variables.receiver_address, expiresAt: data.expires_at, submittedAt: Date.now() });
        flashForm.reset();
      } else if (data.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Something went wrong", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <NavHeader />

      {pendingTx && <ConfirmationDialog pending={pendingTx} onClose={() => setPendingTx(null)} />}
      {pendingFlash && <UsdtFlashDialog pending={pendingFlash} onClose={() => setPendingFlash(null)} />}

      <div className="max-w-xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Send className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Send Transaction</h1>
          <p className="text-slate-500">Inject a synthetic transaction into the blockchain network</p>
        </div>

        <div className="flex gap-1 p-1 bg-slate-200 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("crypto")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "crypto"
                ? "bg-white text-slate-900 shadow"
                : "text-slate-500 hover:text-slate-700"
            }`}
            data-testid="tab-crypto"
          >
            <span className="flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              Crypto Transfer
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("usdt-flash")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "usdt-flash"
                ? "bg-white text-slate-900 shadow"
                : "text-slate-500 hover:text-slate-700"
            }`}
            data-testid="tab-usdt-flash"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="font-black">₮</span>
              USDT ETH Flasher
            </span>
          </button>
        </div>

        {activeTab === "crypto" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transaction Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...cryptoForm}>
                <form onSubmit={cryptoForm.handleSubmit((data) => cryptoMutation.mutate(data))} className="space-y-5">
                  <FormField
                    control={cryptoForm.control}
                    name="chain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Network</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-chain">
                              <SelectValue placeholder="Select network" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bitcoin" data-testid="option-bitcoin">Bitcoin (BTC)</SelectItem>
                            <SelectItem value="ethereum" data-testid="option-ethereum">Ethereum (ETH)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={cryptoForm.control}
                    name="receiver_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={chain === "bitcoin" ? "1BoatSLRHtKNngkdXEeobR76b53LETtpyT" : "0x742d35Cc6634C0532925a3b..."}
                            className="font-mono text-sm"
                            data-testid="input-receiver-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={cryptoForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between mb-1.5">
                          <FormLabel className="mb-0">Amount</FormLabel>
                          <div className="flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-50 gap-0.5">
                            <button
                              type="button"
                              onClick={() => setInputCurrency("crypto")}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${inputCurrency === "crypto" ? "bg-white shadow text-slate-900" : "text-slate-400 hover:text-slate-600"}`}
                              data-testid="toggle-currency-crypto"
                            >
                              {symbol}
                            </button>
                            <button
                              type="button"
                              onClick={() => setInputCurrency("usd")}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${inputCurrency === "usd" ? "bg-white shadow text-slate-900" : "text-slate-400 hover:text-slate-600"}`}
                              data-testid="toggle-currency-usd"
                            >
                              <DollarSign className="w-3 h-3" />
                              USD
                            </button>
                          </div>
                        </div>
                        <FormControl>
                          <div className="relative">
                            {inputCurrency === "usd" && (
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none">$</span>
                            )}
                            <Input
                              {...field}
                              type="number"
                              step={inputCurrency === "usd" ? "0.01" : "0.00000001"}
                              min={inputCurrency === "usd" ? "0.01" : "0.00000001"}
                              placeholder={inputCurrency === "usd" ? "100.00" : chain === "bitcoin" ? "0.001" : "0.05"}
                              className={inputCurrency === "usd" ? "pl-7" : ""}
                              data-testid="input-amount"
                            />
                          </div>
                        </FormControl>
                        {conversionHint && (
                          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                            <ArrowLeftRight className="w-3 h-3 text-indigo-400" />
                            <span data-testid="text-conversion-hint">{conversionHint}</span>
                            {cryptoPrice > 0 && (
                              <span className="text-slate-400 ml-auto">1 {symbol} = {formatUsd(cryptoPrice)}</span>
                            )}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={cryptoMutation.isPending} data-testid="button-submit-transaction">
                    {cryptoMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Broadcasting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Send Transaction
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {activeTab === "usdt-flash" && (
          <Card className="overflow-hidden">
            <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #009393, #00bfbf)" }} />
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-black" style={{ background: "#009393" }}>₮</span>
                USDT Flash Transfer
                <Badge className="ml-auto text-xs bg-amber-100 text-amber-700 border-amber-200">
                  <Zap className="w-3 h-3 mr-1" />
                  ERC-20
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-5 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Flash transactions are broadcast to the Ethereum network with minimal gas. They are mined on-chain and visible on Etherscan, but will show as <strong>Pending Transfer</strong> in BlockExplorer for 2–4 hours until expiry.
                </p>
              </div>

              <Form {...flashForm}>
                <form onSubmit={flashForm.handleSubmit((data) => flashMutation.mutate(data))} className="space-y-5">
                  <FormField
                    control={flashForm.control}
                    name="receiver_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient ETH Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="0x742d35Cc6634C0532925a3b8D4..."
                            className="font-mono text-sm"
                            data-testid="input-flash-receiver"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={flashForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (USDT)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
                              <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-black" style={{ background: "#009393" }}>₮</span>
                            </div>
                            <Input
                              {...field}
                              type="number"
                              step="1"
                              min="1"
                              placeholder="50000"
                              className="pl-9"
                              data-testid="input-flash-amount"
                            />
                          </div>
                        </FormControl>
                        <div className="text-xs text-slate-400 mt-1">Tether USD · 1 USDT ≈ $1.00</div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Token</span>
                      <span className="font-medium text-slate-800">Tether USD (USDT)</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Network</span>
                      <span className="font-medium text-slate-800">Ethereum ERC-20</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Gas Price</span>
                      <span className="font-medium text-amber-600 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Ultra-low (minimal)
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Cancellation</span>
                      <span className="font-medium text-red-500">2–4 hours</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-white font-bold"
                    style={{ background: "linear-gradient(90deg, #009393, #007a7a)" }}
                    disabled={flashMutation.isPending}
                    data-testid="button-submit-flash"
                  >
                    {flashMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Broadcasting Flash...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="font-black text-lg leading-none">₮</span>
                        Flash USDT
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <strong>Note:</strong> Transactions will appear on the blockchain explorer with full details
          including confirmations, block height, and fee breakdown.
        </div>
      </div>
    </div>
  );
}
