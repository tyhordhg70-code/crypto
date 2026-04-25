import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Copy,
  ArrowRight,
  ExternalLink,
  Shield,
  Zap,
  Hash,
  Layers,
  Clock3,
  DollarSign,
  AlertTriangle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { NavHeader } from "@/components/nav-header";
import { NewsSection } from "@/components/news-section";
import type { UnifiedTransaction } from "@shared/schema";

function formatUsd(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCrypto(n: number, chain: string): string {
  const sym = chain === "bitcoin" ? "BTC" : "ETH";
  const decimals = chain === "bitcoin" ? 8 : 6;
  return `${n.toFixed(decimals)} ${sym}`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

function ConfirmationBar({ confirmations, max = 6 }: { confirmations: number; max?: number }) {
  const pct = Math.min((confirmations / max) * 100, 100);
  const done = confirmations >= max;
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-slate-700">
          {confirmations} / {max} Confirmations
        </span>
        {done && (
          <span className="text-sm font-semibold text-emerald-600">Fully Confirmed</span>
        )}
      </div>
      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${
            done ? "bg-emerald-500" : confirmations > 0 ? "bg-indigo-500" : "bg-slate-300"
          }`}
          style={{ width: `${pct}%` }}
          data-testid="bar-confirmations"
        />
      </div>
      <div className="flex gap-1 mt-2">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full ${
              i < confirmations
                ? done
                  ? "bg-emerald-500"
                  : "bg-indigo-400"
                : "bg-slate-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function useCountdown(expiresAt?: number) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = expiresAt - Date.now();
      if (diff <= 0) { setRemaining("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return remaining;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed")
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1.5 py-1 px-3" data-testid="badge-status">
        <CheckCircle className="w-3.5 h-3.5" />
        Confirmed
      </Badge>
    );
  if (status === "confirming")
    return (
      <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 gap-1.5 py-1 px-3" data-testid="badge-status">
        <Shield className="w-3.5 h-3.5" />
        Confirming
      </Badge>
    );
  if (status === "failed")
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 gap-1.5 py-1 px-3" data-testid="badge-status">
        <AlertCircle className="w-3.5 h-3.5" />
        Expired
      </Badge>
    );
  return (
    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1.5 py-1 px-3" data-testid="badge-status">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      Pending Transfer
    </Badge>
  );
}

function DetailRow({
  icon,
  label,
  value,
  mono = false,
  testId,
  sub,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  mono?: boolean;
  testId?: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3.5 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2 min-w-[160px] text-slate-500 text-sm">
        {icon}
        {label}
      </div>
      <div className="flex flex-col gap-0.5">
        <div
          className={`text-sm text-slate-900 break-all ${mono ? "font-mono text-xs" : "font-medium"}`}
          data-testid={testId}
        >
          {value}
        </div>
        {sub && <div className="text-xs text-slate-400">{sub}</div>}
      </div>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const { toast } = useToast();
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        toast({ title: "Copied to clipboard" });
      }}
      className="ml-1 text-slate-400 cursor-pointer"
      data-testid="button-copy"
    >
      <Copy className="w-3.5 h-3.5 inline" />
    </button>
  );
}

function AddressRow({
  address,
  value,
  valueUsd,
  isSimulated,
  symbol,
}: {
  address: string;
  value: number;
  valueUsd: number;
  isSimulated?: boolean;
  symbol: string;
}) {
  const { toast } = useToast();
  const short = address.length > 20 ? `${address.slice(0, 10)}…${address.slice(-8)}` : address;
  return (
    <div
      className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg text-xs bg-slate-50 border border-slate-100"
      data-testid={isSimulated ? "row-simulated-output" : "row-address"}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono text-slate-700 truncate">{short}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(address);
            toast({ title: "Copied to clipboard" });
          }}
          className="shrink-0 text-slate-300 hover:text-slate-500"
        >
          <Copy className="w-3 h-3" />
        </button>
      </div>
      <div className="text-right shrink-0">
        <div className="font-semibold text-slate-800">
          {value.toFixed(value < 0.001 ? 8 : 5)} {symbol}
        </div>
        <div className="text-slate-400">{formatUsd(valueUsd)}</div>
      </div>
    </div>
  );
}

export default function Transaction() {
  const { hash } = useParams<{ hash: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: tx, isPending, isError } = useQuery<UnifiedTransaction>({
    queryKey: ["/api/tx", hash],
    queryFn: async () => {
      const r = await fetch(`/api/tx/${hash}`);
      if (!r.ok) throw new Error("Transaction not found");
      return r.json() as Promise<UnifiedTransaction>;
    },
    refetchInterval: (query) => {
      const d = query.state.data;
      if (!d) return false;
      if (d.status === "confirmed" || d.status === "failed") return false;
      return 10_000;
    },
    retry: false,
  });

  const isUsdtFlash = tx?.txType === "usdt_flash";
  const countdown = useCountdown(isUsdtFlash ? tx?.expiresAt : undefined);
  const chainLabel = isUsdtFlash ? "Ethereum · USDT Token" : tx?.chain === "bitcoin" ? "Bitcoin" : "Ethereum";
  const chainSymbol = tx?.chain === "bitcoin" ? "₿" : "Ξ";
  const chainColor = tx?.chain === "bitcoin" ? "text-orange-500" : "text-indigo-500";
  const chainBg = tx?.chain === "bitcoin" ? "bg-orange-50" : "bg-indigo-50";

  if (isPending) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavHeader />
        <div className="max-w-3xl mx-auto px-6 py-12">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-40 rounded-xl mb-4" />
          <Skeleton className="h-64 rounded-xl mb-4" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !tx) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavHeader />
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Transaction Not Found</h2>
          <p className="text-slate-500 mb-6">
            We couldn't find a transaction for hash:
          </p>
          <code className="block bg-slate-100 rounded-lg px-4 py-3 text-sm font-mono text-slate-700 break-all mb-8">
            {hash}
          </code>
          <Button onClick={() => navigate("/explorer")} data-testid="button-back-explorer">
            Back to Explorer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavHeader />

      <div
        className="py-10"
        style={{
          background:
            "linear-gradient(135deg, hsl(230,100%,99%) 0%, hsl(215,85%,96%) 50%, hsl(260,75%,97%) 100%)",
        }}
      >
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-9 h-9 rounded-full ${chainBg} flex items-center justify-center text-base font-bold ${chainColor}`}
            >
              {chainSymbol}
            </div>
            <div>
              <div className="text-sm text-slate-500 font-medium">{chainLabel} Transaction</div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-sm text-slate-900 font-semibold" data-testid="text-tx-hash">
                  {tx.hash.length > 40 ? `${tx.hash.slice(0, 20)}...${tx.hash.slice(-20)}` : tx.hash}
                </h1>
                <CopyButton value={tx.hash} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <StatusBadge status={tx.status} />
            {tx.confirmations !== undefined && (
              <span className="text-sm text-slate-500" data-testid="text-confirmations-count">
                {tx.confirmations} confirmation{tx.confirmations !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">
        {isUsdtFlash && (
          <div className={`rounded-xl border p-4 ${tx.status === "failed" ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
            <div className="flex items-start gap-3">
              {tx.status === "failed" ? (
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              ) : (
                <Loader2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 animate-spin" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm" style={{ color: "#009393" }}>USDT Flash Transfer</span>
                  <span className="w-5 h-5 rounded-full inline-flex items-center justify-center text-white text-xs font-black" style={{ background: "#009393" }}>₮</span>
                </div>
                {tx.status === "failed" ? (
                  <p className="text-sm text-red-700">
                    This flash transfer has expired. The USDT was <strong>not permanently settled</strong> on-chain.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-emerald-800">
                      This USDT transfer is being processed on the Ethereum network. The tokens will remain in transit until the transfer window closes.
                    </p>
                    {countdown && countdown !== "Expired" && (
                      <div className="mt-2 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-700" data-testid="text-countdown">
                          Time remaining: {countdown}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-center gap-2">
              <a
                href={`https://etherscan.io/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                data-testid="link-etherscan"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Verify on Etherscan
              </a>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Transaction Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-xs text-slate-500 mb-1">Amount Transferred</div>
                {isUsdtFlash ? (
                  <>
                    <div className="text-2xl font-bold text-slate-900 flex items-center gap-1.5" data-testid="text-amount-crypto">
                      <span className="w-6 h-6 rounded-full inline-flex items-center justify-center text-white text-sm font-black shrink-0" style={{ background: "#009393" }}>₮</span>
                      {(tx.usdtAmount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-slate-500 font-medium mt-0.5">USDT (Tether)</div>
                    <div className="text-base text-emerald-600 font-semibold" data-testid="text-amount-usd">
                      ≈ {formatUsd(tx.usdtAmount ?? 0)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-slate-900" data-testid="text-amount-crypto">
                      {formatCrypto(tx.amount, tx.chain)}
                    </div>
                    <div className="text-base text-emerald-600 font-semibold" data-testid="text-amount-usd">
                      {formatUsd(tx.amountUsd)}
                    </div>
                  </>
                )}
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-xs text-slate-500 mb-1">Transaction Fee</div>
                <div className="text-xl font-bold text-slate-900" data-testid="text-fee-crypto">
                  {formatCrypto(tx.fee, tx.chain)}
                </div>
                <div className="text-base text-slate-600 font-semibold" data-testid="text-fee-usd">
                  {formatUsd(tx.feeUsd)}
                </div>
              </div>
            </div>

            <DetailRow
              icon={<ArrowRight className="w-4 h-4" />}
              label="From"
              value={
                <span>
                  {tx.fromAddress}
                  <CopyButton value={tx.fromAddress} />
                </span>
              }
              mono
              testId="text-from-address"
            />
            <DetailRow
              icon={<ArrowRight className="w-4 h-4 rotate-0" />}
              label="To"
              value={
                <span>
                  {tx.toAddress}
                  <CopyButton value={tx.toAddress} />
                </span>
              }
              mono
              testId="text-to-address"
            />

            {((tx.inputs?.length ?? 0) > 0 || (tx.outputs?.length ?? 0) > 0) && (
              <div className="pt-3 mt-1 border-t border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                      {tx.inputs?.length ?? 0} Input{(tx.inputs?.length ?? 0) !== 1 ? "s" : ""}
                    </div>
                    {(tx.inputs ?? []).map((inp, i) => (
                      <AddressRow
                        key={i}
                        address={inp.address}
                        value={inp.value}
                        valueUsd={inp.valueUsd}
                        symbol={tx.chain === "bitcoin" ? "BTC" : "ETH"}
                      />
                    ))}
                  </div>
                  <div className="hidden md:flex items-center justify-center self-center">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                      {tx.outputs?.length ?? 0} Output{(tx.outputs?.length ?? 0) !== 1 ? "s" : ""}
                    </div>
                    {(tx.outputs ?? []).map((out, i) => (
                      <AddressRow
                        key={i}
                        address={out.address}
                        value={out.value}
                        valueUsd={out.valueUsd}
                        symbol={tx.chain === "bitcoin" ? "BTC" : "ETH"}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              Block Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow
              icon={<Hash className="w-4 h-4" />}
              label="Transaction Hash"
              value={
                <span>
                  {tx.hash}
                  <CopyButton value={tx.hash} />
                </span>
              }
              mono
              testId="text-hash-detail"
            />
            <DetailRow
              icon={<Layers className="w-4 h-4" />}
              label="Block Height"
              value={
                tx.blockHeight ? `#${tx.blockHeight.toLocaleString()}` : "Pending (not yet included)"
              }
              testId="text-block-height"
            />
            <DetailRow
              icon={<Clock3 className="w-4 h-4" />}
              label="Timestamp"
              value={formatTimestamp(tx.timestamp)}
              testId="text-timestamp"
            />
            <DetailRow
              icon={<Shield className="w-4 h-4" />}
              label="Status"
              value={
                <StatusBadge status={tx.status} />
              }
            />
            {tx.inputCount !== undefined && (
              <DetailRow
                icon={<Hash className="w-4 h-4" />}
                label="Inputs / Outputs"
                value={`${tx.inputCount} / ${tx.outputCount}`}
                testId="text-inputs-outputs"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              {tx.chain === "ethereum" ? "Gas & Execution" : "Transaction Details"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tx.chain === "ethereum" ? (
              <>
                {tx.gasPrice && (
                  <DetailRow
                    icon={<Zap className="w-4 h-4" />}
                    label="Gas Price"
                    value={tx.gasPrice}
                    testId="text-gas-price"
                  />
                )}
                {tx.gasUsed && (
                  <DetailRow
                    icon={<Zap className="w-4 h-4" />}
                    label="Gas Used"
                    value={tx.gasUsed.toLocaleString()}
                    testId="text-gas-used"
                  />
                )}
                {tx.nonce !== undefined && (
                  <DetailRow
                    icon={<Hash className="w-4 h-4" />}
                    label="Nonce"
                    value={String(tx.nonce)}
                    testId="text-nonce"
                  />
                )}
                <DetailRow
                  icon={<DollarSign className="w-4 h-4" />}
                  label="Total Fee"
                  value={`${formatCrypto(tx.fee, tx.chain)} (${formatUsd(tx.feeUsd)})`}
                  testId="text-total-fee"
                />
              </>
            ) : (
              <>
                {tx.sizeBytes && (
                  <DetailRow
                    icon={<Hash className="w-4 h-4" />}
                    label="Size"
                    value={`${tx.sizeBytes.toLocaleString()} bytes`}
                    testId="text-size"
                  />
                )}
                {tx.weight && (
                  <DetailRow
                    icon={<Hash className="w-4 h-4" />}
                    label="Weight"
                    value={`${tx.weight.toLocaleString()} WU`}
                    testId="text-weight"
                  />
                )}
                <DetailRow
                  icon={<DollarSign className="w-4 h-4" />}
                  label="Total Fee"
                  value={`${formatCrypto(tx.fee, tx.chain)} (${formatUsd(tx.feeUsd)})`}
                  testId="text-total-fee"
                />
              </>
            )}
          </CardContent>
        </Card>

        {!isUsdtFlash && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Confirmation Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ConfirmationBar confirmations={tx.confirmations} />
              {tx.status !== "confirmed" && (
                <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Refreshing automatically every 10 seconds
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-12">
        <NewsSection />
      </div>

      <footer className="border-t border-slate-200 py-8 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-400">
          BlockExplorer
        </div>
      </footer>
    </div>
  );
}
