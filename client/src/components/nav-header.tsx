import { Link, useLocation } from "wouter";
import { useState } from "react";

interface NavHeaderProps {
  transparent?: boolean;
}

export function NavHeader({ transparent = false }: NavHeaderProps) {
  const [, navigate] = useLocation();
  const [searchInput, setSearchInput] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchInput.trim();
    if (q) navigate(`/tx/${q}`);
  }

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ background: "var(--color-bg-base, #fff)", borderColor: "rgba(0,0,0,0.08)" }}
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
        <Link href="/" data-testid="link-logo">
          <div className="flex items-center gap-2 cursor-pointer select-none shrink-0 mr-2">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="#2170FF" />
              <text x="5" y="20" fill="white" fontSize="14" fontWeight="900" fontFamily="monospace">Bx</text>
            </svg>
            <span className="font-semibold text-[15px] tracking-tight text-gray-900 hidden sm:block">
              BlockExplorer
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5">
          <Link href="/explorer">
            <button
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              data-testid="link-nav-explorer"
            >
              Explorers
            </button>
          </Link>
          <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
            Products
          </button>
          <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
            Research
          </button>
          <Link href="/simulate">
            <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              data-testid="link-nav-simulate"
            >
              Simulate
            </button>
          </Link>
        </nav>

        <form onSubmit={handleSearch} className="flex-1 max-w-md ml-auto">
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search addresses, transactions and blocks"
              data-testid="input-nav-search"
              className="w-full pl-4 pr-20 py-1.5 text-sm bg-gray-100 border border-gray-200 rounded-full outline-none focus:border-blue-400 focus:bg-white transition-colors placeholder-gray-400"
            />
            <button
              type="submit"
              data-testid="button-nav-search"
              className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-semibold text-white rounded-full transition-colors"
              style={{ background: "#2170FF" }}
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </header>
  );
}
