import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { NavHeader } from "@/components/nav-header";
import type { CryptoPrice } from "@shared/schema";

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)
    return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `$${n.toFixed(2)}`;
}

function formatUsdFull(n: number): string {
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const STATIC_CHAINS = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    color: "#f7931a",
    bg: "#fff8ee",
    latestBlock: 895_714,
    avgFee: "0.00001 BTC",
    ecosystem: "bitcoin",
    emoji: "₿",
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    color: "#627eea",
    bg: "#f0f1ff",
    latestBlock: 20_482_901,
    avgFee: "0.0005 ETH",
    ecosystem: "ethereum",
    emoji: "Ξ",
  },
  {
    id: "litecoin",
    name: "Litecoin",
    symbol: "LTC",
    color: "#345d9d",
    bg: "#eef2fb",
    latestBlock: 2_683_441,
    avgFee: "0.0001 LTC",
    ecosystem: "bitcoin",
    emoji: "Ł",
  },
  {
    id: "bitcoin-cash",
    name: "Bitcoin Cash",
    symbol: "BCH",
    color: "#0ac18e",
    bg: "#edfdf7",
    latestBlock: 862_001,
    avgFee: "0.000002 BCH",
    ecosystem: "bitcoin",
    emoji: "₿",
  },
  {
    id: "dogecoin",
    name: "Dogecoin",
    symbol: "DOGE",
    color: "#c2a633",
    bg: "#fdf9ee",
    latestBlock: 5_112_033,
    avgFee: "0.01 DOGE",
    ecosystem: "bitcoin",
    emoji: "Ð",
  },
  {
    id: "monero",
    name: "Monero",
    symbol: "XMR",
    color: "#ff6600",
    bg: "#fff3ec",
    latestBlock: 3_212_008,
    avgFee: "0.00001 XMR",
    ecosystem: "privacy",
    emoji: "ɱ",
  },
  {
    id: "zcash",
    name: "Zcash",
    symbol: "ZEC",
    color: "#ecb244",
    bg: "#fdf8ee",
    latestBlock: 2_481_003,
    avgFee: "0.0001 ZEC",
    ecosystem: "privacy",
    emoji: "ⓩ",
  },
  {
    id: "ethereum-classic",
    name: "Ethereum Classic",
    symbol: "ETC",
    color: "#328332",
    bg: "#edf8ed",
    latestBlock: 20_791_033,
    avgFee: "0.0001 ETC",
    ecosystem: "ethereum",
    emoji: "Ξ",
  },
];

type TabId = "all" | "bitcoin" | "ethereum" | "privacy";
const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "bitcoin", label: "Bitcoin ecosystem" },
  { id: "ethereum", label: "Ethereum ecosystem" },
  { id: "privacy", label: "Privacy coins" },
];

function timeAgoBlock(mins: number): string {
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function BlockchainCard({
  chain,
  price,
}: {
  chain: (typeof STATIC_CHAINS)[0];
  price?: CryptoPrice;
}) {
  const [, navigate] = useLocation();
  const displayPrice = price
    ? formatUsd(price.priceUsd)
    : chain.symbol === "BTC"
    ? "$62,800"
    : chain.symbol === "ETH"
    ? "$3,100"
    : "–";
  const minsAgo = Math.floor(Math.random() * 12) + 1;

  return (
    <div
      className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
      onClick={() => navigate(`/explorer?chain=${chain.id}`)}
      data-testid={`card-chain-${chain.id}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0"
          style={{ background: chain.bg, color: chain.color }}
        >
          {chain.emoji}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 text-sm leading-tight">
            {chain.name}
          </div>
          <div className="text-xs text-gray-400">{chain.symbol}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="font-bold text-gray-900 text-sm">{displayPrice}</div>
        </div>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">Latest block</span>
          <span className="font-medium text-gray-700">
            {chain.latestBlock.toLocaleString()}{" "}
            <span className="text-gray-400">· {timeAgoBlock(minsAgo)}</span>
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Average fee</span>
          <span className="font-medium text-gray-700">{chain.avgFee}</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("all");

  const { data: prices } = useQuery<CryptoPrice[]>({
    queryKey: ["/api/prices"],
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (q) navigate(`/tx/${q}`);
  }

  const btc = prices?.find((p) => p.id === "bitcoin");
  const eth = prices?.find((p) => p.id === "ethereum");

  const filteredChains =
    activeTab === "all"
      ? STATIC_CHAINS
      : STATIC_CHAINS.filter((c) => c.ecosystem === activeTab);

  return (
    <div className="min-h-screen" style={{ background: "#f5f6f7" }}>
      <NavHeader />

      {/* Hero */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10 md:py-14">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Left: heading + search */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-1">
                Blockchain explorer,
                <br />
                analytics and web services
              </h1>
              <h2 className="text-xl md:text-2xl font-semibold mb-6">
                Explore data stored on{" "}
                <span
                  className="font-bold"
                  style={{
                    background:
                      "linear-gradient(90deg, #2170FF 0%, #7c3aed 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  48 blockchains
                </span>
              </h2>

              <form onSubmit={handleSearch} className="w-full max-w-2xl mb-4">
                <div className="flex bg-white border border-gray-300 rounded-full overflow-hidden shadow-sm focus-within:border-blue-400 focus-within:shadow-md transition-all">
                  {/* QR icon */}
                  <div className="flex items-center pl-4 pr-1 shrink-0">
                    <svg
                      className="w-5 h-5 text-gray-400"
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
                  </div>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by address / transaction / block"
                    data-testid="input-hero-search"
                    className="flex-1 px-3 py-3.5 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                  />
                  <button
                    type="submit"
                    data-testid="button-hero-search"
                    className="px-6 py-3 font-semibold text-white text-sm rounded-full m-1 transition-opacity hover:opacity-90 shrink-0"
                    style={{ background: "#2170FF" }}
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Price ticker row */}
              <div className="flex flex-wrap gap-4 mt-2">
                {btc && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="font-semibold text-gray-600">BTC</span>
                    <span className="font-bold text-gray-900">
                      {formatUsdFull(btc.priceUsd)}
                    </span>
                    <span
                      className={`text-xs font-semibold ${btc.change24h >= 0 ? "text-green-600" : "text-red-500"}`}
                    >
                      {btc.change24h >= 0 ? "+" : ""}
                      {btc.change24h.toFixed(2)}%
                    </span>
                  </div>
                )}
                {eth && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="font-semibold text-gray-600">ETH</span>
                    <span className="font-bold text-gray-900">
                      {formatUsdFull(eth.priceUsd)}
                    </span>
                    <span
                      className={`text-xs font-semibold ${eth.change24h >= 0 ? "text-green-600" : "text-red-500"}`}
                    >
                      {eth.change24h >= 0 ? "+" : ""}
                      {eth.change24h.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: AI assistant card */}
            <div
              className="w-full md:w-64 shrink-0 rounded-2xl border border-gray-200 p-5 flex flex-col gap-3 bg-white"
              style={{
                background:
                  "linear-gradient(135deg, rgba(33,112,255,0.04) 0%, rgba(124,58,237,0.04) 100%)",
              }}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-lg">
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
              <div className="text-sm text-gray-600 leading-snug">
                <span>Hello, my name is Cuborg.</span>
                <div className="flex items-center gap-1 mt-0.5">
                  I am your{" "}
                  <span
                    className="font-semibold"
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
                className="mt-auto flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{
                  background:
                    "linear-gradient(90deg, #2170FF 0%, #7c3aed 100%)",
                }}
              >
                <span>Chat with AI assistant</span>
                <svg
                  className="w-4 h-4 rotate-[-45deg]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Blockchain list */}
      <section className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}
              style={activeTab === tab.id ? { background: "#2170FF" } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredChains.map((chain) => {
            const priceData = prices?.find(
              (p) =>
                p.id === chain.id ||
                (chain.id === "bitcoin" && p.id === "bitcoin") ||
                (chain.id === "ethereum" && p.id === "ethereum")
            );
            return (
              <BlockchainCard key={chain.id} chain={chain} price={priceData} />
            );
          })}
          {filteredChains.length === 0 && (
            <div className="col-span-4 text-center py-12 text-gray-400 text-sm">
              No blockchains in this category yet.
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 bg-white mt-4">
        <div className="max-w-screen-xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <span className="font-semibold text-gray-700">BlockExplorer</span>
          <div className="flex gap-5">
            <a href="/about" className="hover:text-gray-600 transition-colors">
              About
            </a>
            <a
              href="/privacy"
              className="hover:text-gray-600 transition-colors"
            >
              Privacy
            </a>
            <a href="/terms" className="hover:text-gray-600 transition-colors">
              Terms
            </a>
          </div>
          <span>© {new Date().getFullYear()} BlockExplorer</span>
        </div>
      </footer>
    </div>
  );
}
