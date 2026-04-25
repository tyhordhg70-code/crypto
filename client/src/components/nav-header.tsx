import { Link, useLocation } from "wouter";
import { Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLocation as useWouterLocation } from "wouter";

interface NavHeaderProps {
  transparent?: boolean;
}

export function NavHeader({ transparent = false }: NavHeaderProps) {
  const [, navigate] = useWouterLocation();
  const [searchInput, setSearchInput] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchInput.trim();
    if (q) navigate(`/tx/${q}`);
  }

  const base = transparent
    ? "absolute top-0 left-0 right-0 z-50"
    : "sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200/60";

  return (
    <header className={`${base}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" data-testid="link-logo">
          <div className="flex items-center gap-2.5 cursor-pointer select-none">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">
              BlockExplorer
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              data-testid="link-nav-home"
            >
              Home
            </Button>
          </Link>
          <Link href="/explorer">
            <Button
              variant="ghost"
              size="sm"
              data-testid="link-nav-explorer"
            >
              Explorer
            </Button>
          </Link>
        </nav>

        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search tx hash..."
              data-testid="input-nav-search"
              className={`w-full pl-9 pr-4 py-2 text-sm rounded-lg border outline-none transition-all focus:ring-2 focus:ring-indigo-400/40 ${
                transparent
                  ? "bg-white/10 border-white/20 text-white placeholder-white/50 backdrop-blur"
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
              }`}
            />
          </div>
          <Button type="submit" size="sm" data-testid="button-nav-search">
            Search
          </Button>
        </form>
      </div>
    </header>
  );
}
