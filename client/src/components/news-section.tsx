import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Clock, RefreshCw, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { NewsItem } from "@shared/schema";

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

export function NewsSection() {
  const { data: news, isLoading, isError, refetch, isFetching } = useQuery<NewsItem[]>({
    queryKey: ["/api/news"],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-indigo-500" />
          <h3 className="text-base font-semibold text-slate-900">Latest Crypto News</h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-64">
              <Skeleton className="h-40 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !news || news.length === 0) {
    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            <h3 className="text-base font-semibold text-slate-900">Latest Crypto News</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-slate-500 hover:text-slate-700 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Retry
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-slate-200 bg-slate-50/60 text-center gap-3">
          <Newspaper className="w-8 h-8 text-slate-300" />
          <p className="text-sm text-slate-500">News headlines are temporarily unavailable.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Loading…" : "Try again"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-500" />
          <h3 className="text-base font-semibold text-slate-900">Latest Crypto News</h3>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div
        className="flex gap-4 overflow-x-auto pb-4"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}
        data-testid="container-news-section"
      >
        {news.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-64 rounded-xl border border-slate-200 bg-white p-4 hover-elevate"
            data-testid={`card-news-tx-${item.id}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs truncate max-w-[80px]">
                {item.source}
              </Badge>
              <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(item.publishedAt)}</span>
            </div>
            <h4 className="font-semibold text-sm text-slate-900 leading-snug line-clamp-3 mb-2">
              {item.title}
            </h4>
            <div className="flex items-center gap-1 text-xs text-indigo-600">
              <ExternalLink className="w-3 h-3" />
              Read more
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
