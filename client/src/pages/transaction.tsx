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
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { NavHeader } from "@/components/nav-header";
import type { UnifiedTransaction } from "@shared/schema";

function formatUsd(n: number): string {
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatCrypto(n: number, chain: string): string {
  const sym = chain === "bitcoin" ? "BTC" : "ETH";
  const decimals = chain === "bitcoin" ? 8 : 6;
  return `${n.toFixed(decimals)} ${sym}`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s} seconds ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m !== 1 ? "s" : ""} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h !== 1 ? "s" : ""} ago`;
  return `${Math.floor(h / 24)} day${Math.floor(h / 24) !== 1 ? "s" : ""} ago`;
}

function truncateHash(hash: string, start = 10, end = 8): string {
  if (hash.length <= start + end + 3) return hash;
  return `${hash.slice(0, start)}…${hash.slice(-end)}`;
}

function useCountdown(expiresAt?: number) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = expiresAt - Date.now();
      if (diff <= 0) {
        setRemaining("Expired");
        return;
      }
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

function CopyButton({ value, small }: { value: string; small?: boolean }) {
  const { toast } = useToast();
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        toast({ title: "Copied to clipboard" });
      }}
      className={`inline-flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 ${small ? "w-6 h-6" : "w-7 h-7"}`}
      data-testid="button-copy"
      title="Copy"
    >
      <Copy className={small ? "w-3 h-3" : "w-3.5 h-3.5"} />
    </button>
  );
}

function StatBox({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-2xl p-4 flex-1 min-w-[160px] ${className}`}
    >
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {label}
      </div>
      <div>{children}</div>
    </div>
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
  const short = truncateHash(address, 10, 8);
  return (
    <div
      className="flex items-center justify-between gap-2 py-2.5 px-3 rounded-xl text-xs bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors"
      data-testid={isSimulated ? "row-simulated-output" : "row-address"}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-mono text-gray-700 truncate">{short}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(address);
            toast({ title: "Copied" });
          }}
          className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors"
        >
          <Copy className="w-3 h-3" />
        </button>
      </div>
      <div className="text-right shrink-0">
        <div className="font-semibold text-gray-800">
          {value.toFixed(value < 0.001 ? 8 : 5)} {symbol}
        </div>
        <div className="text-gray-400">{formatUsd(valueUsd)}</div>
      </div>
    </div>
  );
}

export default function Transaction() {
  const { hash } = useParams<{ hash: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [additionalOpen, setAdditionalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<"events" | "gallery">(
    "events"
  );

  const {
    data: tx,
    isPending,
    isError,
  } = useQuery<UnifiedTransaction>({
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
  const chainLabel = isUsdtFlash
    ? "Ethereum · USDT Token"
    : tx?.chain === "bitcoin"
    ? "Bitcoin"
    : "Ethereum";
  const chainColor = tx?.chain === "bitcoin" ? "#f7931a" : "#2170FF";
  const chainEmoji = tx?.chain === "bitcoin" ? "₿" : "Ξ";
  const chainSymbol = tx?.chain === "bitcoin" ? "BTC" : "ETH";
  const satPerByte =
    tx?.sizeBytes && tx.fee
      ? Math.round((tx.fee * 1e8) / tx.sizeBytes)
      : undefined;

  if (isPending) {
    return (
      <div className="min-h-screen" style={{ background: "#f5f6f7" }}>
        <NavHeader />
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
          <Skeleton className="h-6 w-56 mb-5 rounded-full" />
          <Skeleton className="h-28 rounded-2xl mb-4" />
          <Skeleton className="h-20 rounded-2xl mb-4" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !tx) {
    return (
      <div className="min-h-screen" style={{ background: "#f5f6f7" }}>
        <NavHeader />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Transaction Not Found
          </h2>
          <p className="text-gray-500 mb-4 text-sm">
            We couldn't find a transaction for:
          </p>
          <code className="block bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-700 break-all mb-8">
            {hash}
          </code>
          <button
            onClick={() => navigate("/")}
            data-testid="button-back-explorer"
            className="px-5 py-2.5 rounded-full text-white font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ background: "#2170FF" }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f5f6f7" }}>
      <NavHeader />

      {/* Page header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5">
          {/* Breadcrumb */}
          <nav className="text-xs text-gray-400 mb-3 flex items-center gap-1.5 flex-wrap">
            <span
              className="cursor-pointer hover:text-gray-600 transition-colors"
              onClick={() => navigate("/")}
            >
              Home
            </span>
            <span>/</span>
            <span className="text-gray-500">{chainLabel}</span>
            <span>/</span>
            <span className="text-gray-500">Transaction</span>
            <span>/</span>
            <span className="font-mono text-gray-700">
              {hash ? truncateHash(hash, 12, 10) : ""}
            </span>
          </nav>

          {/* Tx hash header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg shrink-0 text-white"
                style={{ background: chainColor }}
              >
                {chainEmoji}
              </div>
              <div className="min-w-0">
                <div className="text-xs text-gray-400 font-medium mb-0.5">
                  {chainLabel} Transaction
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="font-mono text-sm font-semibold text-gray-900 break-all"
                    data-testid="text-tx-hash"
                  >
                    {tx.hash}
                  </span>
                  <CopyButton value={tx.hash} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:ml-auto shrink-0">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 stat boxes row */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-5">
        {/* USDT Flash banner */}
        {isUsdtFlash && (
          <div
            className={`rounded-2xl border p-4 mb-4 ${
              tx.status === "failed"
                ? "bg-red-50 border-red-200"
                : "bg-emerald-50 border-emerald-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {tx.status === "failed" ? (
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              ) : (
                <Loader2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 animate-spin" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm" style={{ color: "#009393" }}>
                    USDT Flash Transfer
                  </span>
                  <span
                    className="w-5 h-5 rounded-full inline-flex items-center justify-center text-white text-xs font-black"
                    style={{ background: "#009393" }}
                  >
                    ₮
                  </span>
                </div>
                {tx.status === "failed" ? (
                  <p className="text-sm text-red-700">
                    This flash transfer has expired. The USDT was{" "}
                    <strong>not permanently settled</strong> on-chain.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-emerald-800">
                      This USDT transfer is being processed on the Ethereum
                      network. The tokens will remain in transit until the
                      transfer window closes.
                    </p>
                    {countdown && countdown !== "Expired" && (
                      <div className="mt-2 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span
                          className="text-sm font-semibold text-emerald-700"
                          data-testid="text-countdown"
                        >
                          Time remaining: {countdown}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="mt-3 pt-3 border-t border-emerald-200/60">
                  <a
                    href={`https://etherscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium hover:opacity-80"
                    style={{ color: "#2170FF" }}
                    data-testid="link-etherscan"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Verify on Etherscan
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-5">
          {/* Transaction status */}
          <StatBox label="Transaction status">
            {tx.status === "confirmed" ? (
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  {tx.blockHeight
                    ? `In block ${tx.blockHeight.toLocaleString()}`
                    : "Confirmed"}
                </div>
                <div
                  className="text-xs text-gray-500"
                  data-testid="text-confirmations-count"
                >
                  Confirmations:{" "}
                  <span className="font-semibold text-gray-700">
                    {tx.confirmations ?? "–"}
                  </span>
                </div>
              </div>
            ) : tx.status === "confirming" ? (
              <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#2170FF" }}>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                Confirming…
              </div>
            ) : tx.status === "failed" ? (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-red-600">
                <XCircle className="w-4 h-4 shrink-0" />
                Expired / Failed
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-600">
                <Clock className="w-4 h-4 shrink-0" />
                Pending
              </div>
            )}
          </StatBox>

          {/* Time */}
          <StatBox label="Time">
            <div className="text-sm font-semibold text-gray-900 mb-1" data-testid="text-timestamp">
              {timeAgo(tx.timestamp)}
            </div>
            <div className="text-xs text-gray-400">
              {formatTimestamp(tx.timestamp)}
            </div>
          </StatBox>

          {/* Fee */}
          <StatBox label="Fee">
            <div
              className="text-sm font-semibold text-gray-900 mb-1"
              data-testid="text-fee-crypto"
            >
              {formatCrypto(tx.fee, tx.chain)}
            </div>
            <div className="text-xs text-gray-400" data-testid="text-fee-usd">
              {formatUsd(tx.feeUsd)}
              {satPerByte && (
                <span className="ml-2">{satPerByte} sat/B</span>
              )}
            </div>
          </StatBox>

          {/* Additional info toggle */}
          <div
            className="bg-white border border-gray-200 rounded-2xl p-4 flex-1 min-w-[160px] cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setAdditionalOpen((v) => !v)}
          >
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Additional info
            </div>
            <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors">
              {additionalOpen ? "Hide details" : "Show details"}
              {additionalOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable additional info */}
        {additionalOpen && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-400 mb-0.5">
                Amount transferred
              </div>
              <div className="font-semibold text-gray-900" data-testid="text-amount-crypto">
                {isUsdtFlash
                  ? `${(tx.usdtAmount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} USDT`
                  : formatCrypto(tx.amount, tx.chain)}
              </div>
              <div className="text-xs text-gray-400" data-testid="text-amount-usd">
                {isUsdtFlash
                  ? formatUsd(tx.usdtAmount ?? 0)
                  : formatUsd(tx.amountUsd)}
              </div>
            </div>
            {tx.sizeBytes && (
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Size</div>
                <div className="font-semibold text-gray-900" data-testid="text-size">
                  {tx.sizeBytes.toLocaleString()} bytes
                </div>
              </div>
            )}
            {tx.inputCount !== undefined && (
              <div>
                <div className="text-xs text-gray-400 mb-0.5">
                  Inputs / Outputs
                </div>
                <div className="font-semibold text-gray-900" data-testid="text-inputs-outputs">
                  {tx.inputCount} / {tx.outputCount}
                </div>
              </div>
            )}
            {tx.blockHeight && (
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Block height</div>
                <div className="font-semibold text-gray-900" data-testid="text-block-height">
                  #{tx.blockHeight.toLocaleString()}
                </div>
              </div>
            )}
            {tx.chain === "ethereum" && tx.gasPrice && (
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Gas price</div>
                <div className="font-semibold text-gray-900" data-testid="text-gas-price">
                  {tx.gasPrice}
                </div>
              </div>
            )}
            {tx.chain === "ethereum" && tx.gasUsed && (
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Gas used</div>
                <div className="font-semibold text-gray-900" data-testid="text-gas-used">
                  {tx.gasUsed.toLocaleString()}
                </div>
              </div>
            )}
            {tx.chain === "ethereum" && tx.nonce !== undefined && (
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Nonce</div>
                <div className="font-semibold text-gray-900" data-testid="text-nonce">
                  {tx.nonce}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Transaction hash</div>
              <div className="font-mono text-xs text-gray-700 break-all" data-testid="text-hash-detail">
                {truncateHash(tx.hash, 14, 10)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Two-column: sidebar + content */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pb-8 flex flex-col md:flex-row gap-6">
        {/* Left sidebar TOC */}
        <aside className="w-full md:w-56 shrink-0">
          <nav className="bg-white border border-gray-200 rounded-2xl p-3 sticky top-20">
            <ul className="space-y-0.5 text-sm">
              <li>
                <button
                  onClick={() => setActiveSection("events")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-medium ${
                    activeSection === "events"
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Transaction events
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection("gallery")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-medium ${
                    activeSection === "gallery"
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  dApp Gallery{" "}
                  <span
                    className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold text-white"
                    style={{ background: "#2170FF" }}
                  >
                    new
                  </span>
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Right content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* From / To */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="grid grid-cols-[1fr_40px_1fr] gap-3 items-start text-sm">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  From
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className="font-mono text-gray-800 break-all"
                    data-testid="text-from-address"
                  >
                    {tx.fromAddress}
                  </span>
                  <CopyButton value={tx.fromAddress} small />
                </div>
              </div>
              <div className="flex items-center justify-center mt-6">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  To
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className="font-mono text-gray-800 break-all"
                    data-testid="text-to-address"
                  >
                    {tx.toAddress}
                  </span>
                  <CopyButton value={tx.toAddress} small />
                </div>
              </div>
            </div>
          </div>

          {/* Transaction events — Inputs & Outputs */}
          {((tx.inputs?.length ?? 0) > 0 ||
            (tx.outputs?.length ?? 0) > 0) && (
            <section id="transaction-events">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Transaction events
              </h2>
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-semibold text-gray-900">
                    Main
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                    style={{ background: "#2170FF" }}
                  >
                    {(tx.inputs?.length ?? 0) + (tx.outputs?.length ?? 0)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_40px_1fr] gap-4 items-start">
                  {/* Inputs */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      {tx.inputs?.length ?? 0} Input
                      {(tx.inputs?.length ?? 0) !== 1 ? "s" : ""}
                    </div>
                    {(tx.inputs ?? []).map((inp, i) => (
                      <AddressRow
                        key={i}
                        address={inp.address}
                        value={inp.value}
                        valueUsd={inp.valueUsd}
                        symbol={chainSymbol}
                      />
                    ))}
                  </div>

                  <div className="hidden md:flex items-center justify-center self-center mt-8">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Outputs */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      {tx.outputs?.length ?? 0} Output
                      {(tx.outputs?.length ?? 0) !== 1 ? "s" : ""}
                    </div>
                    {(tx.outputs ?? []).map((out, i) => (
                      <AddressRow
                        key={i}
                        address={out.address}
                        value={out.value}
                        valueUsd={out.valueUsd}
                        isSimulated={out.isSimulated}
                        symbol={chainSymbol}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* dApp Gallery section */}
          <section id="dapp-gallery">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              dApp Gallery
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm"
                    style={{
                      background:
                        "linear-gradient(135deg, #2170FF, #7c3aed)",
                    }}
                  >
                    AI
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-gray-900 flex-1">
                  Cuborg AI Assistant
                  <div className="text-xs text-gray-400 font-normal mt-0.5">
                    Ask AI anything about this transaction
                  </div>
                </div>
                <button
                  className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{
                    background: "linear-gradient(90deg, #2170FF, #7c3aed)",
                  }}
                >
                  <span>Chat with AI assistant</span>
                  <svg
                    className="w-4 h-4 -rotate-45"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <ExternalLink className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900 flex-1">
                  Verify on Block Explorer
                  <div className="text-xs text-gray-400 font-normal mt-0.5">
                    {tx.chain === "bitcoin"
                      ? "View on Mempool.space or Blockstream"
                      : "View on Etherscan"}
                  </div>
                </div>
                <a
                  href={
                    tx.chain === "bitcoin"
                      ? `https://mempool.space/tx/${tx.hash}`
                      : `https://etherscan.io/tx/${tx.hash}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "#2170FF" }}
                  data-testid="link-etherscan"
                >
                  <span>Open external explorer</span>
                  <svg
                    className="w-4 h-4 -rotate-45"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer className="border-t border-gray-200 py-8 bg-white mt-4">
        <div className="max-w-screen-xl mx-auto px-6 text-center text-sm text-gray-400">
          BlockExplorer — Blockchain Data Explorer
        </div>
      </footer>
    </div>
  );
}
