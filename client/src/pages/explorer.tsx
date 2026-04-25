import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, ExternalLink, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NavHeader } from "@/components/nav-header";
import type { CryptoPrice, NewsItem } from "@shared/schema";

function formatUsd(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  return `$${n.toFixed(2)}`;
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

function truncate(s: string, len = 16): string {
  if (s.length <= len) return s;
  return `${s.slice(0, 8)}...${s.slice(-8)}`;
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-shrink-0 w-72 rounded-xl border border-slate-200 bg-white overflow-hidden hover-elevate transition-all"
      data-testid={`card-news-${item.id}`}
    >
      {item.imageUrl && (
        <div className="h-36 bg-slate-100 overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">
            {item.source}
          </Badge>
          <span className="text-xs text-slate-400">{timeAgo(item.publishedAt)}</span>
        </div>
        <h4 className="font-semibold text-sm text-slate-900 leading-snug line-clamp-2 mb-2">
          {item.title}
        </h4>
        <div className="flex items-center gap-1 text-xs text-indigo-600">
          <ExternalLink className="w-3 h-3" />
          Read more
        </div>
      </div>
    </a>
  );
}

export default function Explorer() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");

  const { data: prices, isLoading: pricesLoading } = useQuery<CryptoPrice[]>({
    queryKey: ["/api/prices"],
  });

  const { data: news, isLoading: newsLoading } = useQuery<NewsItem[]>({
    queryKey: ["/api/news"],
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (q) navigate(`/tx/${q}`);
  }

  const btc = prices?.find((p) => p.id === "bitcoin");
  const eth = prices?.find((p) => p.id === "ethereum");

  return (
    <div className="min-h-screen bg-slate-50">
      <NavHeader />

      <div
        className="py-14"
        style={{
          background:
            "linear-gradient(135deg, hsl(230,100%,99%) 0%, hsl(215,85%,96%) 50%, hsl(260,75%,97%) 100%)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
            Blockchain Explorer
          </h1>
          <p className="text-slate-500 text-lg mb-8">
            Search any transaction, address, or block across Bitcoin and Ethereum
          </p>
          <form onSubmit={handleSearch}>
            <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-lg shadow-indigo-100/30 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Transaction hash, address, block number..."
                  data-testid="input-explorer-search"
                  className="w-full pl-12 pr-4 py-3.5 text-base bg-transparent outline-none text-slate-800 placeholder-slate-400"
                />
              </div>
              <Button type="submit" size="lg" className="rounded-xl" data-testid="button-explorer-search">
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {pricesLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
            : prices?.slice(0, 4).map((coin) => (
                <Card key={coin.id} data-testid={`card-explorer-price-${coin.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                      <span className="text-sm font-medium text-slate-600">{coin.symbol}</span>
                      {coin.change24h >= 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-red-500 ml-auto" />
                      )}
                    </div>
                    <div className="text-xl font-bold text-slate-900" data-testid={`text-explorer-price-${coin.id}`}>
                      {formatUsd(coin.priceUsd)}
                    </div>
                    <div
                      className={`text-xs mt-0.5 font-medium ${
                        coin.change24h >= 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {coin.change24h >= 0 ? "+" : ""}
                      {coin.change24h.toFixed(2)}%
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-600">₿</span>
                </div>
                Bitcoin Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    label: "Current Price",
                    value: btc ? formatUsd(btc.priceUsd) : "–",
                    testId: "text-btc-price",
                  },
                  {
                    label: "24h Change",
                    value: btc ? `${btc.change24h >= 0 ? "+" : ""}${btc.change24h.toFixed(2)}%` : "–",
                    testId: "text-btc-change",
                    colored: btc ? btc.change24h >= 0 : true,
                  },
                  {
                    label: "Market Cap",
                    value: btc
                      ? `$${(btc.marketCap / 1e12).toFixed(2)}T`
                      : "–",
                    testId: "text-btc-mcap",
                  },
                  {
                    label: "Est. Block Height",
                    value: (() => {
                      const genesis = new Date("2009-01-03").getTime();
                      return Math.floor((Date.now() - genesis) / (10 * 60 * 1000)).toLocaleString();
                    })(),
                    testId: "text-btc-height",
                  },
                  { label: "Avg Block Time", value: "~10 min", testId: "text-btc-blocktime" },
                ].map(({ label, value, testId, colored }) => (
                  <div key={label} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span
                      className={`text-sm font-semibold ${
                        colored !== undefined
                          ? colored
                            ? "text-emerald-600"
                            : "text-red-500"
                          : "text-slate-900"
                      }`}
                      data-testid={testId}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-indigo-600">Ξ</span>
                </div>
                Ethereum Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    label: "Current Price",
                    value: eth ? formatUsd(eth.priceUsd) : "–",
                    testId: "text-eth-price",
                  },
                  {
                    label: "24h Change",
                    value: eth ? `${eth.change24h >= 0 ? "+" : ""}${eth.change24h.toFixed(2)}%` : "–",
                    testId: "text-eth-change",
                    colored: eth ? eth.change24h >= 0 : true,
                  },
                  {
                    label: "Market Cap",
                    value: eth
                      ? `$${(eth.marketCap / 1e12).toFixed(3)}T`
                      : "–",
                    testId: "text-eth-mcap",
                  },
                  {
                    label: "Est. Block Height",
                    value: (() => {
                      const mergeTime = new Date("2022-09-15").getTime();
                      const mergeBlock = 15537394;
                      return (mergeBlock + Math.floor((Date.now() - mergeTime) / 12000)).toLocaleString();
                    })(),
                    testId: "text-eth-height",
                  },
                  { label: "Avg Block Time", value: "~12 sec", testId: "text-eth-blocktime" },
                ].map(({ label, value, testId, colored }) => (
                  <div key={label} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span
                      className={`text-sm font-semibold ${
                        colored !== undefined
                          ? colored
                            ? "text-emerald-600"
                            : "text-red-500"
                          : "text-slate-900"
                      }`}
                      data-testid={testId}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Latest Crypto News
            </h2>
            <span className="text-sm text-slate-400">Updated every 5 minutes</span>
          </div>

          {newsLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-72">
                  <Skeleton className="h-48 rounded-xl" />
                </div>
              ))}
            </div>
          ) : news && news.length > 0 ? (
            <div
              className="flex gap-4 overflow-x-auto pb-4"
              style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}
              data-testid="container-news"
            >
              {news.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>News unavailable at the moment</p>
            </div>
          )}
        </div>
      </div>

      <footer className="border-t border-slate-200 py-8 mt-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-400">
          BlockExplorer
        </div>
      </footer>
    </div>
  );
}
