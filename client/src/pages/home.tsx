import { useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Search, TrendingUp, TrendingDown, ArrowRight, Shield, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCryptoBg } from "@/components/animated-crypto-bg";
import { NavHeader } from "@/components/nav-header";
import { NewsSection } from "@/components/news-section";
import type { CryptoPrice, PriceHistoryPoint } from "@shared/schema";

const COINS = [
  { id: "bitcoin", label: "Bitcoin", symbol: "BTC", color: "#f97316" },
  { id: "ethereum", label: "Ethereum", symbol: "ETH", color: "#627eea" },
  { id: "binancecoin", label: "BNB", symbol: "BNB", color: "#f59e0b" },
  { id: "solana", label: "Solana", symbol: "SOL", color: "#9333ea" },
];

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  return `$${n.toFixed(4)}`;
}

function formatLargeNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function PriceCard({ coin }: { coin: CryptoPrice }) {
  const up = coin.change24h >= 0;
  return (
    <Card className="hover-elevate cursor-pointer" data-testid={`card-price-${coin.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <img src={coin.image} alt={coin.name} className="w-7 h-7 rounded-full" />
            <div>
              <div className="font-semibold text-sm text-slate-900">{coin.name}</div>
              <div className="text-xs text-slate-500">{coin.symbol}</div>
            </div>
          </div>
          <Badge variant={up ? "default" : "destructive"} className="text-xs">
            {up ? "+" : ""}{coin.change24h.toFixed(2)}%
          </Badge>
        </div>
        <div className="text-xl font-bold text-slate-900" data-testid={`text-price-${coin.id}`}>
          {formatUsd(coin.priceUsd)}
        </div>
        <div className="text-xs text-slate-500 mt-1">Vol: {formatLargeNum(coin.volume24h)}</div>
      </CardContent>
    </Card>
  );
}

function ChartSection() {
  const [selectedCoin, setSelectedCoin] = useState(COINS[0]);

  const { data: prices, isLoading: pricesLoading } = useQuery<CryptoPrice[]>({
    queryKey: ["/api/prices"],
  });

  if (prices) {
    // console.log("BROWSER DEBUG: Received Prices from API ->", prices);
  }

  const { data: history, isLoading: historyLoading } = useQuery<PriceHistoryPoint[]>({
    queryKey: ["/api/prices", selectedCoin.id, "history"],
    queryFn: () =>
      fetch(`/api/prices/${selectedCoin.id}/history?days=7`).then((r) => r.json()),
  });

  const chartData = Array.isArray(history)
    ? history.map((p) => ({
      time: new Date(p.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      price: p.price,
    }))
    : [];

  const currentPrice = prices?.find((p) => p.id === selectedCoin.id);

  return (
    <section className="py-20 bg-white" id="prices">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Live Market Prices</h2>
          <p className="text-slate-500 text-lg">Real-time cryptocurrency prices and 7-day history</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {COINS.map((c) => (
            <Button
              key={c.id}
              variant={selectedCoin.id === c.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCoin(c)}
              data-testid={`button-coin-tab-${c.id}`}
            >
              {c.label}
            </Button>
          ))}
        </div>

        {currentPrice && (
          <div className="text-center mb-6">
            <span className="text-4xl font-bold text-slate-900" data-testid="text-selected-price">
              {formatUsd(currentPrice.priceUsd)}
            </span>
            <span
              className={`ml-3 text-lg font-semibold ${currentPrice.change24h >= 0 ? "text-emerald-600" : "text-red-500"
                }`}
            >
              {currentPrice.change24h >= 0 ? "+" : ""}
              {currentPrice.change24h.toFixed(2)}% (24h)
            </span>
          </div>
        )}

        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-6 mb-10">
          {historyLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={selectedCoin.color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={selectedCoin.color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                  formatter={(value: number) => [formatUsd(value), selectedCoin.label]}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={selectedCoin.color}
                  strokeWidth={2}
                  fill="url(#priceGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {pricesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {prices?.map((p) => <PriceCard key={p.id} coin={p} />)}
          </div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const pricesRef = useRef<HTMLDivElement>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (q) navigate(`/tx/${q}`);
  }

  return (
    <div className="min-h-screen bg-white">
      <div
        className="relative min-h-screen flex flex-col overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, hsl(230,100%,99%) 0%, hsl(215,90%,97%) 30%, hsl(260,80%,97%) 70%, hsl(290,70%,99%) 100%)",
        }}
      >
        <AnimatedCryptoBg />
        <NavHeader transparent />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur border border-indigo-200/60 rounded-full px-4 py-1.5 mb-8 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-indigo-700">Live Blockchain Data</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-tight tracking-tight mb-6">
            Explore the{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Blockchain
            </span>
          </h1>

          <p className="text-xl text-slate-600 max-w-2xl mb-12 leading-relaxed">
            Track transactions, monitor blocks, and explore the decentralized world in real time.
          </p>

          <form onSubmit={handleSearch} className="w-full max-w-2xl mb-8">
            <div className="flex gap-2 bg-white/80 backdrop-blur p-2 rounded-2xl border border-slate-200 shadow-xl shadow-indigo-100/40">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Enter transaction hash, address, or block number..."
                  data-testid="input-hero-search"
                  className="w-full pl-12 pr-4 py-3.5 text-base bg-transparent outline-none text-slate-800 placeholder-slate-400"
                />
              </div>
              <Button type="submit" size="lg" className="rounded-xl" data-testid="button-hero-search">
                Search <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap gap-3 justify-center mb-16">
            {["Bitcoin", "Ethereum", "Solana", "BNB Chain"].map((name) => (
              <Badge key={name} variant="outline" className="px-3 py-1 bg-white/60 backdrop-blur text-slate-700 border-slate-300/60">
                {name}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-8 max-w-lg w-full">
            {[
              { label: "Networks", value: "14+" },
              { label: "Uptime", value: "99.9%" },
              { label: "Tx Lookups", value: "Instant" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-black text-slate-900">{value}</div>
                <div className="text-sm text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex justify-center pb-8">
          <button
            onClick={() => pricesRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="flex flex-col items-center gap-2 text-slate-400 cursor-pointer"
            data-testid="button-scroll-down"
          >
            <span className="text-sm">Scroll to see prices</span>
            <div className="w-5 h-8 border-2 border-slate-300 rounded-full flex justify-center pt-1.5">
              <div className="w-1 h-2 rounded-full bg-slate-400 animate-bounce" />
            </div>
          </button>
        </div>
      </div>

      <div ref={pricesRef}>
        <ChartSection />
      </div>

      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Everything You Need</h2>
            <p className="text-slate-500 text-lg">Professional blockchain analytics at your fingertips</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Search className="w-6 h-6 text-indigo-600" />,
                title: "Transaction Lookup",
                desc: "Search any transaction hash across Bitcoin and Ethereum networks instantly.",
              },
              {
                icon: <TrendingUp className="w-6 h-6 text-emerald-600" />,
                title: "Live Price Data",
                desc: "Monitor real-time cryptocurrency prices with 7-day historical charts.",
              },
              {
                icon: <Shield className="w-6 h-6 text-purple-600" />,
                title: "Full Tx Details",
                desc: "View block height, confirmations, fees, and complete transaction metadata.",
              },
              {
                icon: <Zap className="w-6 h-6 text-yellow-600" />,
                title: "Instant Confirmations",
                desc: "Track confirmation progress in real time as your transaction propagates.",
              },
              {
                icon: <Globe className="w-6 h-6 text-blue-600" />,
                title: "Multi-Chain Support",
                desc: "Explore Bitcoin and Ethereum with unified search and display.",
              },
              {
                icon: <TrendingDown className="w-6 h-6 text-rose-600" />,
                title: "Crypto News",
                desc: "Stay updated with the latest blockchain and cryptocurrency headlines.",
              },
            ].map((f) => (
              <Card key={f.title} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-2">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Crypto News</h2>
            <p className="text-slate-500 text-sm">The latest from the blockchain world</p>
          </div>
          <NewsSection />
        </div>
      </section>

      <footer className="bg-white border-t border-slate-100 py-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-900">BlockExplorer</span>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-slate-500 mb-3">
            <Link href="/about" className="hover:text-indigo-600">About</Link>
            <Link href="/privacy" className="hover:text-indigo-600">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-indigo-600">Terms of Service</Link>
          </div>
          <p className="text-slate-400 text-xs">BlockExplorer © 2026 — Data provided by CoinGecko, mempool.space, and Ethereum public nodes.</p>
        </div>
      </footer>
    </div>
  );
}
