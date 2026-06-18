import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Copy, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { NavHeader } from "@/components/nav-header";
import { useToast } from "@/hooks/use-toast";
import type { CryptoPrice, NewsItem } from "@shared/schema";

function formatUsd(n: number): string {
  if (n >= 1000)
    return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  return `$${n.toFixed(2)}`;
}

function formatLargeNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function truncateHash(hash: string, start = 10, end = 8): string {
  if (hash.length <= start + end + 3) return hash;
  return `${hash.slice(0, start)}…${hash.slice(-end)}`;
}

function CopyButton({ value }: { value: string }) {
  const { toast } = useToast();
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        toast({ title: "Copied to clipboard" });
      }}
      className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
      title="Copy"
    >
      <Copy className="w-3.5 h-3.5" />
    </button>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex-1 min-w-0">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div
        className={`text-base font-bold ${accent ? "text-green-600" : "text-gray-900"} truncate`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

type TxRow = {
  hash: string;
  time: number;
  amount: number;
  fee: number;
  status: "confirmed" | "pending";
};

const MOCK_TXS: TxRow[] = [
  {
    hash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    time: Date.now() - 120000,
    amount: 0.00089652,
    fee: 0.0000112,
    status: "confirmed",
  },
  {
    hash: "f9e8d7c6b5a4f9e8d7c6b5a4f9e8d7c6b5a4f9e8d7c6b5a4f9e8d7c6b5a4f9e8",
    time: Date.now() - 3600000,
    amount: 0.01234567,
    fee: 0.0000234,
    status: "confirmed",
  },
  {
    hash: "1122334455661122334455661122334455661122334455661122334455661122334",
    time: Date.now() - 86400000,
    amount: 0.05,
    fee: 0.0000567,
    status: "confirmed",
  },
  {
    hash: "aabbccddeeffaabbccddeeffaabbccddeeffaabbccddeeffaabbccddeeffaabbcc",
    time: Date.now() - 172800000,
    amount: 0.00456789,
    fee: 0.0000089,
    status: "confirmed",
  },
];

export default function Explorer() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<"gallery" | "history">(
    "gallery"
  );
  const { toast } = useToast();

  const { data: prices, isLoading: pricesLoading } = useQuery<CryptoPrice[]>({
    queryKey: ["/api/prices"],
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (q) navigate(`/tx/${q}`);
  }

  const btc = prices?.find((p) => p.id === "bitcoin");
  const eth = prices?.find((p) => p.id === "ethereum");

  const DEMO_ADDRESS = "bc1qs0jt86gqas7wd2xqewl5yymw6amj7ndtnqgx68";
  const mainBalance = 0.00089652;
  const mainBalanceUsd = btc ? mainBalance * btc.priceUsd : 56.23;

  return (
    <div className="min-h-screen" style={{ background: "#f5f6f7" }}>
      <NavHeader />

      {/* Page header — address card */}
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
            <span className="text-gray-500">Bitcoin</span>
            <span>/</span>
            <span className="text-gray-500">Address</span>
            <span>/</span>
            <span className="font-mono text-gray-700 truncate max-w-[180px]">
              {truncateHash(DEMO_ADDRESS, 12, 10)}
            </span>
          </nav>

          {/* Address + actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg shrink-0 text-white"
                style={{ background: "#f7931a" }}
              >
                ₿
              </div>
              <div className="min-w-0">
                <div className="text-xs text-gray-400 font-medium mb-0.5">
                  Bitcoin Address
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="font-mono text-sm font-semibold text-gray-900 break-all"
                    data-testid="text-address"
                  >
                    {DEMO_ADDRESS}
                  </span>
                  <CopyButton value={DEMO_ADDRESS} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:ml-auto shrink-0">
              <button
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
                title="QR Code"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="3" height="3" />
                  <rect x="19" y="14" width="2" height="2" />
                  <rect x="14" y="19" width="2" height="2" />
                  <rect x="19" y="19" width="2" height="2" />
                </svg>
                QR
              </button>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
                </svg>
                Share
              </button>
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
                PDF
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-3 mt-5">
            <StatCard
              label="Main balance"
              value={`+${mainBalance.toFixed(8)} BTC`}
              sub={`· $${mainBalanceUsd.toFixed(2)} USD`}
              accent
            />
            <StatCard
              label="Recent transaction"
              value={`+0.00089652 BTC`}
              sub={timeAgo(Date.now() - 120000)}
            />
            {pricesLoading ? (
              <Skeleton className="flex-1 h-16 rounded-2xl min-w-[120px]" />
            ) : btc ? (
              <StatCard
                label="BTC Price"
                value={formatUsd(btc.priceUsd)}
                sub={`${btc.change24h >= 0 ? "+" : ""}${btc.change24h.toFixed(2)}% 24h`}
              />
            ) : null}
          </div>

          {/* Quick search */}
          <form onSubmit={handleSearch} className="mt-4 max-w-xl">
            <div className="flex bg-white border border-gray-300 rounded-full overflow-hidden shadow-sm focus-within:border-blue-400 transition-all">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search another address / transaction…"
                data-testid="input-explorer-search"
                className="flex-1 pl-4 pr-3 py-2.5 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
              />
              <button
                type="submit"
                data-testid="button-explorer-search"
                className="px-5 py-2 font-semibold text-white text-sm rounded-full m-1 transition-opacity hover:opacity-90 shrink-0"
                style={{ background: "#2170FF" }}
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main content: sidebar + content */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-6">
        {/* Left sidebar — Table of Contents */}
        <aside className="w-full md:w-56 shrink-0">
          <nav className="bg-white border border-gray-200 rounded-2xl p-3 sticky top-20">
            <ul className="space-y-0.5 text-sm">
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
              <li>
                <button
                  onClick={() => setActiveSection("history")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-medium ${
                    activeSection === "history"
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  History
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Right content area */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* dApp Gallery */}
          <section id="app-gallery">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              dApp Gallery
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* AI Assistant card */}
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
                  Hello, my name is Cuborg.
                  <div className="text-gray-500 font-normal mt-0.5">
                    I am your{" "}
                    <span
                      style={{
                        background:
                          "linear-gradient(90deg, #2170FF, #7c3aed)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      AI Assistant
                    </span>
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

              {/* Address statement card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div className="flex gap-1">
                    <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600">
                      PDF
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600">
                      CSV
                    </span>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900 flex-1">
                  Generate address statement
                  <div className="text-xs text-gray-400 font-normal mt-0.5">
                    In-depth reports on address holdings for any timeframe
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                    style={{ background: "#2170FF" }}
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M7 17l9.2-9.2M17 17V7H7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Portfolio tracker */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ background: "#0ac18e" }}
                  >
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900 flex-1">
                  Portfolio Tracker
                  <div className="text-xs text-gray-400 font-normal mt-0.5">
                    Track all your addresses in one place
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                    style={{ background: "#0ac18e" }}
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M7 17l9.2-9.2M17 17V7H7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Transaction history */}
          <section id="history">
            <h2 className="text-lg font-bold text-gray-900 mb-4">History</h2>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-[1fr_120px_100px_80px] gap-0 text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3 border-b border-gray-100">
                <span>Transaction</span>
                <span>Amount</span>
                <span>Fee</span>
                <span>Status</span>
              </div>
              {MOCK_TXS.map((tx) => (
                <div
                  key={tx.hash}
                  className="grid grid-cols-[1fr_120px_100px_80px] gap-0 items-center px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/tx/${tx.hash}`)}
                  data-testid={`row-tx-${tx.hash.slice(0, 8)}`}
                >
                  <div className="min-w-0 pr-4">
                    <div className="font-mono text-sm text-blue-600 truncate group-hover:text-blue-700">
                      {truncateHash(tx.hash)}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {timeAgo(tx.time)}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-green-600">
                    +{tx.amount.toFixed(8)} BTC
                  </div>
                  <div className="text-sm text-gray-500">
                    {tx.fee.toFixed(7)} BTC
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                      ✓
                    </span>
                  </div>
                </div>
              ))}
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
