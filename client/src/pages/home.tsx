import { useState } from "react";
import { useLocation } from "wouter";
import { NavHeader } from "@/components/nav-header";
import heroChairImg from "@assets/image_1781813786122.png";
import universeChairImg from "@assets/image_1781813707895.png";

const CDN = "https://loutre.blockchair.net/w4/assets/images/blockchains";
const TOKEN_CDN = "https://loutre.blockchair.net/contract-enricher/token";
const PRODUCT_CDN = "https://loutre.blockchair.net/w4/assets/images/products";
const CUBORG_CDN = "https://loutre.blockchair.net/w4/assets/images/cuborg";

type Ecosystem = "all" | "bitcoin" | "ethereum" | "privacy";

interface Chain {
  id: string;
  name: string;
  symbol: string;
  colorLight: string;
  colorDark: string;
  price: string;
  block: string;
  blockTime: string;
  fee: string;
  ecosystems: Ecosystem[];
  highlighted?: boolean;
}

const CHAINS: Chain[] = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC", colorLight: "#ffcc66", colorDark: "#ffaa00", price: "$62,800", block: "954,290", blockTime: "2 min ago", fee: "$0.28", ecosystems: ["all", "bitcoin"], highlighted: true },
  { id: "ethereum", name: "Ethereum", symbol: "ETH", colorLight: "#B2CCFF", colorDark: "#545BFF", price: "$1,685", block: "25,346,290", blockTime: "8 sec ago", fee: "$0.15", ecosystems: ["all", "ethereum"], highlighted: true },
  { id: "aptos", name: "Aptos", symbol: "APT", colorLight: "#a1e5e0", colorDark: "#00ffea", price: "$0.63", block: "840,451,106", blockTime: "3 sec ago", fee: "$0.00036", ecosystems: ["all", "ethereum"] },
  { id: "arbitrum-one", name: "Arbitrum One", symbol: "ARB", colorLight: "#AAD4F2", colorDark: "#9DCCED", price: "$0.082", block: "474,867,284", blockTime: "2 sec ago", fee: "$0.0003", ecosystems: ["all", "ethereum"] },
  { id: "avalanche", name: "Avalanche", symbol: "AVAX", colorLight: "#FFCDD0", colorDark: "#E84142", price: "$20.81", block: "55,821,006", blockTime: "2 sec ago", fee: "$0.009", ecosystems: ["all", "ethereum"] },
  { id: "base", name: "Base", symbol: "ETH", colorLight: "#C2D4FF", colorDark: "#0052FF", price: "$1,685", block: "28,411,084", blockTime: "2 sec ago", fee: "$0.0002", ecosystems: ["all", "ethereum"] },
  { id: "beacon-chain", name: "Beacon Chain", symbol: "ETH", colorLight: "#B2CCFF", colorDark: "#545BFF", price: "$1,685", block: "11,238,916", blockTime: "12 sec ago", fee: "–", ecosystems: ["all", "ethereum"] },
  { id: "bitcoin-cash", name: "Bitcoin Cash", symbol: "BCH", colorLight: "#c8f0b0", colorDark: "#8DC351", price: "$314.46", block: "906,712", blockTime: "8 min ago", fee: "$0.0013", ecosystems: ["all", "bitcoin"] },
  { id: "blast", name: "Blast", symbol: "ETH", colorLight: "#FFFCB0", colorDark: "#FCFC03", price: "$1,685", block: "18,211,005", blockTime: "2 sec ago", fee: "$0.0002", ecosystems: ["all", "ethereum"] },
  { id: "bnb", name: "BNB", symbol: "BNB", colorLight: "#FFE8A0", colorDark: "#F0B90B", price: "$548.23", block: "50,222,189", blockTime: "3 sec ago", fee: "$0.05", ecosystems: ["all", "ethereum"] },
  { id: "bob", name: "BOB", symbol: "BTC", colorLight: "#ffc266", colorDark: "#ff9900", price: "$62,800", block: "34,472,962", blockTime: "3 sec ago", fee: "$0.0011", ecosystems: ["all", "bitcoin"] },
  { id: "botanix", name: "Botanix", symbol: "BTC", colorLight: "#ffe667", colorDark: "#fcce00", price: "$62,800", block: "6,289,314", blockTime: "85 days ago", fee: "$0.0049", ecosystems: ["all", "bitcoin"] },
  { id: "cardano", name: "Cardano", symbol: "ADA", colorLight: "#a0c4ff", colorDark: "#0033AD", price: "$0.35", block: "10,912,004", blockTime: "20 sec ago", fee: "$0.18", ecosystems: ["all", "bitcoin"] },
  { id: "dash", name: "Dash", symbol: "DASH", colorLight: "#a8d8ff", colorDark: "#008CE7", price: "$22.54", block: "2,120,008", blockTime: "2 min ago", fee: "$0.0009", ecosystems: ["all", "bitcoin", "privacy"] },
  { id: "digibyte", name: "DigiByte", symbol: "DGB", colorLight: "#a0d4ff", colorDark: "#0165A0", price: "$0.007", block: "19,841,334", blockTime: "15 sec ago", fee: "$0.0001", ecosystems: ["all", "bitcoin"] },
  { id: "dogecoin", name: "Dogecoin", symbol: "DOGE", colorLight: "#ffe9a0", colorDark: "#C2A633", price: "$0.15", block: "5,561,122", blockTime: "1 min ago", fee: "$0.25", ecosystems: ["all", "bitcoin"] },
  { id: "ecash", name: "eCash", symbol: "XEC", colorLight: "#a0c8ff", colorDark: "#0074C2", price: "$0.000022", block: "906,712", blockTime: "8 min ago", fee: "$0.0001", ecosystems: ["all", "bitcoin"] },
  { id: "ethereum-classic", name: "Ethereum Classic", symbol: "ETC", colorLight: "#a8e0a8", colorDark: "#328332", price: "$18.24", block: "20,791,033", blockTime: "12 sec ago", fee: "$0.0002", ecosystems: ["all", "ethereum"] },
  { id: "fantom", name: "Fantom", symbol: "FTM", colorLight: "#b0c8ff", colorDark: "#1969FF", price: "$0.38", block: "106,819,004", blockTime: "1 sec ago", fee: "$0.0001", ecosystems: ["all", "ethereum"] },
  { id: "gnosis-chain", name: "Gnosis Chain", symbol: "xDAI", colorLight: "#a0e0cc", colorDark: "#04795B", price: "$1.00", block: "39,911,008", blockTime: "5 sec ago", fee: "$0.0001", ecosystems: ["all", "ethereum"] },
  { id: "groestlcoin", name: "Groestlcoin", symbol: "GRS", colorLight: "#a8f0a8", colorDark: "#00b300", price: "$0.37", block: "5,201,088", blockTime: "1 min ago", fee: "$0.0001", ecosystems: ["all", "bitcoin"] },
  { id: "handshake", name: "Handshake", symbol: "HNS", colorLight: "#d0d0d0", colorDark: "#1b1b1b", price: "$0.011", block: "931,008", blockTime: "10 min ago", fee: "$0.0001", ecosystems: ["all", "bitcoin"] },
  { id: "kusama", name: "Kusama", symbol: "KSM", colorLight: "#e0c0ff", colorDark: "#000000", price: "$20.02", block: "25,441,008", blockTime: "6 sec ago", fee: "$0.002", ecosystems: ["all", "ethereum"] },
  { id: "linea", name: "Linea", symbol: "ETH", colorLight: "#c0c8e0", colorDark: "#161616", price: "$1,685", block: "16,041,221", blockTime: "3 sec ago", fee: "$0.0001", ecosystems: ["all", "ethereum"] },
  { id: "liquid-network", name: "Liquid Network", symbol: "L-BTC", colorLight: "#9df2ed", colorDark: "#66fff6", price: "$62,800", block: "3,935,441", blockTime: "12 sec ago", fee: "$0.04", ecosystems: ["all", "bitcoin"] },
  { id: "litecoin", name: "Litecoin", symbol: "LTC", colorLight: "#66F2FF", colorDark: "#0EEAFF", price: "$43.37", block: "3,127,260", blockTime: "39 sec ago", fee: "$0.0019", ecosystems: ["all", "bitcoin"] },
  { id: "mantle", name: "Mantle", symbol: "MNT", colorLight: "#b2f3ee", colorDark: "#7ffff6", price: "$0.52", block: "96,838,797", blockTime: "7 sec ago", fee: "$0.004", ecosystems: ["all", "ethereum"] },
  { id: "merlin", name: "Merlin", symbol: "BTC", colorLight: "#585bff", colorDark: "#2a2cbf", price: "$62,800", block: "29,887,554", blockTime: "12 sec ago", fee: "$0.042", ecosystems: ["all", "bitcoin"] },
  { id: "monero", name: "Monero", symbol: "XMR", colorLight: "#ffaa80", colorDark: "#ff5500", price: "$323.37", block: "3,699,164", blockTime: "1 min ago", fee: "$0.096", ecosystems: ["all", "privacy"], highlighted: true },
  { id: "moonbeam", name: "Moonbeam", symbol: "GLMR", colorLight: "#c399ff", colorDark: "#6a00ff", price: "$0.091", block: "9,211,008", blockTime: "12 sec ago", fee: "$0.001", ecosystems: ["all", "ethereum"] },
  { id: "opbnb", name: "opBNB", symbol: "BNB", colorLight: "#FFE8A0", colorDark: "#F0B90B", price: "$548.23", block: "51,004,218", blockTime: "1 sec ago", fee: "$0.0001", ecosystems: ["all", "ethereum"] },
  { id: "optimism", name: "Optimism", symbol: "OP", colorLight: "#ffc0c6", colorDark: "#FF0420", price: "$0.51", block: "132,004,008", blockTime: "2 sec ago", fee: "$0.0003", ecosystems: ["all", "ethereum"] },
  { id: "peercoin", name: "Peercoin", symbol: "PPC", colorLight: "#b0e8b0", colorDark: "#3CB054", price: "$0.52", block: "841,008", blockTime: "10 min ago", fee: "$0.0001", ecosystems: ["all", "bitcoin"] },
  { id: "polkadot", name: "Polkadot", symbol: "DOT", colorLight: "#ffb0d8", colorDark: "#E6007A", price: "$3.11", block: "22,841,008", blockTime: "6 sec ago", fee: "$0.005", ecosystems: ["all", "ethereum"] },
  { id: "polygon", name: "Polygon", symbol: "POL", colorLight: "#d4b8ff", colorDark: "#8247E5", price: "$0.19", block: "67,841,008", blockTime: "2 sec ago", fee: "$0.0001", ecosystems: ["all", "ethereum"] },
  { id: "polygon-zkevm", name: "Polygon zkEVM", symbol: "ETH", colorLight: "#c8b0f8", colorDark: "#7B3FE4", price: "$1,685", block: "16,841,008", blockTime: "5 sec ago", fee: "$0.0002", ecosystems: ["all", "ethereum"] },
  { id: "rootstock", name: "Rootstock", symbol: "RBTC", colorLight: "#ffbc66", colorDark: "#ff9000", price: "$62,800", block: "8,849,882", blockTime: "31 days ago", fee: "$0.063", ecosystems: ["all", "bitcoin"] },
  { id: "scroll", name: "Scroll", symbol: "ETH", colorLight: "#FFE8C8", colorDark: "#FFDBB2", price: "$1,685", block: "14,041,008", blockTime: "3 sec ago", fee: "$0.0002", ecosystems: ["all", "ethereum"] },
  { id: "solana", name: "Solana", symbol: "SOL", colorLight: "#d0b0ff", colorDark: "#9945FF", price: "$127.81", block: "321,841,008", blockTime: "0.4 sec ago", fee: "$0.0002", ecosystems: ["all", "ethereum"] },
  { id: "stacks", name: "Stacks", symbol: "STX", colorLight: "#ff7547", colorDark: "#fc6432", price: "$0.51", block: "184,108", blockTime: "10 min ago", fee: "$0.02", ecosystems: ["all", "bitcoin"] },
  { id: "stellar", name: "Stellar", symbol: "XLM", colorLight: "#a0d8ff", colorDark: "#08B5E5", price: "$0.088", block: "54,841,008", blockTime: "5 sec ago", fee: "$0.000001", ecosystems: ["all", "ethereum"] },
  { id: "ton", name: "TON", symbol: "TON", colorLight: "#a8d0ff", colorDark: "#0088CC", price: "$2.91", block: "51,841,008", blockTime: "5 sec ago", fee: "$0.003", ecosystems: ["all", "ethereum"] },
  { id: "tron", name: "TRON", symbol: "TRX", colorLight: "#ffb0b4", colorDark: "#FF060A", price: "$0.22", block: "67,841,008", blockTime: "3 sec ago", fee: "$0.001", ecosystems: ["all", "ethereum"] },
  { id: "xrp-ledger", name: "XRP Ledger", symbol: "XRP", colorLight: "#a8d0f0", colorDark: "#0085C0", price: "$2.15", block: "94,841,008", blockTime: "3 sec ago", fee: "$0.0002", ecosystems: ["all", "ethereum"] },
  { id: "zcash", name: "Zcash", symbol: "ZEC", colorLight: "#ffe0a0", colorDark: "#F4B728", price: "$444.59", block: "3,382,489", blockTime: "3 min ago", fee: "$0.14", ecosystems: ["all", "privacy"] },
  { id: "zksync-era", name: "zkSync Era", symbol: "ETH", colorLight: "#c0c8f0", colorDark: "#4E529A", price: "$1,685", block: "54,841,008", blockTime: "1 sec ago", fee: "$0.0001", ecosystems: ["all", "ethereum"] },
];

const TOKENS = [
  { id: "tether", name: "Tether", symbol: "USDT", price: "$0.99", change: "-0.14%", changeUp: false, marketCap: "186.07B USD", supply: "186.47B USDT" },
  { id: "usd-coin", name: "USDC", symbol: "USDC", price: "$0.99", change: "+0.018%", changeUp: true, marketCap: "74.94B USD", supply: "74.94B USDC" },
  { id: "hyperliquid", name: "Hyperliquid", symbol: "HYPE", price: "$67.97", change: "-8.29%", changeUp: false, marketCap: "15.12B USD", supply: "222.45M HYPE" },
  { id: "usds", name: "USDS", symbol: "USDS", price: "$0.99", change: "-0.0082%", changeUp: false, marketCap: "10.24B USD", supply: "10.24B USDS" },
  { id: "ethena-usde", name: "Ethena USDe", symbol: "USDE", price: "$0.99", change: "-0.056%", changeUp: false, marketCap: "4.50B USD", supply: "4.51B USDE" },
  { id: "dai", name: "Dai", symbol: "DAI", price: "$0.99", change: "+0.011%", changeUp: true, marketCap: "4.16B USD", supply: "4.16B DAI" },
  { id: "hedera-hashgraph", name: "Hedera", symbol: "HBAR", price: "$0.079", change: "-1.04%", changeUp: false, marketCap: "3.47B USD", supply: "43.47B HBAR" },
  { id: "chainlink", name: "Chainlink", symbol: "LINK", price: "$7.84", change: "-4.17%", changeUp: false, marketCap: "5.71B USD", supply: "727.10M LINK" },
];

const PRODUCTS = [
  { name: "News Aggregator", icon: "news.svg", href: "#" },
  { name: "Blockchair Awesome", icon: "awesome_icon.webp", href: "#" },
  { name: "Transaction receipts", icon: "transaction-receipts.webp", href: "#" },
  { name: "Wallet statements", icon: "wallet-statements.svg", href: "#" },
  { name: "Tokens", icon: "tokens.svg", href: "#" },
  { name: "Browser extension", icon: "extension.svg", href: "#" },
  { name: "Broadcast transaction", icon: "broadcast-transaction.svg", href: "#" },
  { name: "Node explorers", icon: "node-explorers.svg", href: "#" },
  { name: "API", icon: "api.svg", href: "#" },
  { name: "Datasets", icon: "dumps.svg", href: "#" },
  { name: "Charts", icon: "charts.svg", href: "#" },
];

const TABS: { id: Ecosystem; label: string }[] = [
  { id: "all", label: "All" },
  { id: "bitcoin", label: "Bitcoin ecosystem" },
  { id: "ethereum", label: "Ethereum ecosystem" },
  { id: "privacy", label: "Privacy coins" },
];

function BlockchainCard({ chain, onClick }: { chain: Chain; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer"
      style={{
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid rgba(0,0,0,0.06)",
        borderLeft: `3px solid ${chain.colorLight}`,
        padding: "20px 20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        transition: "box-shadow 0.15s ease, transform 0.15s ease",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.transform = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <img
          src={`${CDN}/${chain.id}/logo_light_48.webp`}
          alt={`${chain.name} logo`}
          width={48}
          height={48}
          style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0 }}
          onError={e => {
            const img = e.currentTarget;
            img.style.display = "none";
          }}
        />
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: "#111", lineHeight: 1.3 }}>{chain.name}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 15, color: "#111" }}>{chain.price}</span>
            <span style={{ fontSize: 12, color: "#888", fontWeight: 500 }}>{chain.symbol}</span>
          </div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>Latest block</div>
        <div style={{ fontSize: 13, color: "#222" }}>
          {chain.block} <span style={{ color: "#aaa" }}>· {chain.blockTime}</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>Average fee</div>
        <div style={{ fontSize: 13, color: "#222" }}>{chain.fee}</div>
      </div>
    </div>
  );
}

function TokenCard({ token }: { token: (typeof TOKENS)[0] }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid rgba(0,0,0,0.06)",
        padding: "20px 20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        transition: "box-shadow 0.15s",
        cursor: "pointer",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <img
          src={`${TOKEN_CDN}/${token.id}/large.png`}
          alt={`${token.name} logo`}
          width={48}
          height={48}
          style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0 }}
          onError={e => {
            const img = e.currentTarget;
            img.style.background = "#f0f0f0";
            img.style.border = "1px solid #ddd";
          }}
        />
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 15, color: "#111" }}>{token.name}</span>
            <span style={{ fontSize: 12, color: "#888" }}>{token.symbol}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 14, color: "#222" }}>{token.price}</span>
            <span style={{ fontSize: 12, color: token.changeUp ? "#16a34a" : "#dc2626", fontWeight: 500 }}>
              {token.change}
            </span>
          </div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>Market cap</div>
        <div style={{ fontSize: 13, color: "#222" }}>{token.marketCap}</div>
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>Circulating supply</div>
        <div style={{ fontSize: 13, color: "#222" }}>{token.supply}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Ecosystem>("all");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    if (q.length > 40 && /^[0-9a-fA-F]+$/.test(q)) {
      navigate(`/tx/${q}`);
    } else if (q.startsWith("0x") || q.startsWith("1") || q.startsWith("3") || q.startsWith("bc1")) {
      navigate(`/explorer?address=${q}`);
    } else {
      navigate(`/tx/${q}`);
    }
  }

  const filteredChains = CHAINS.filter(c => c.ecosystems.includes(activeTab));

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6f7" }}>
      <NavHeader />

      {/* ───── HERO ───── */}
      <section
        style={{
          background: "linear-gradient(160deg, #061428 0%, #0a1e3d 55%, #0d2348 100%)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Chair illustration — large right-side background element */}
        <img
          src={heroChairImg}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "-20px",
            top: "-10px",
            height: "115%",
            width: "auto",
            opacity: 0.45,
            pointerEvents: "none",
            userSelect: "none",
            objectFit: "contain",
          }}
        />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 40px", position: "relative", zIndex: 1 }}>
          {/* Title row + Cuborg card */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 32, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <h1 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 700, color: "#fff", lineHeight: 1.2, margin: 0 }}>
                Blockchain explorer,<br />analytics and web services
              </h1>
              <h2 style={{ fontSize: 18, fontWeight: 500, color: "#8ba9cc", margin: "10px 0 0" }}>
                Explore data stored on{" "}
                <span style={{
                  background: "linear-gradient(90deg, #3b82f6 0%, #a855f7 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontWeight: 600,
                }}>48 blockchains</span>
              </h2>
            </div>

            {/* Cuborg card */}
            <div style={{
              background: "linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(168,85,247,0.18) 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 16,
              padding: "16px 20px",
              width: 280,
              flexShrink: 0,
              backdropFilter: "blur(8px)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <img
                  src={`${CUBORG_CDN}/hello.svg`}
                  alt="Cuborg AI assistant"
                  width={48}
                  height={48}
                  style={{ width: 48, height: 48 }}
                  onError={e => { (e.currentTarget as HTMLElement).style.display = "none"; }}
                />
                <p style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 500, margin: 0, lineHeight: 1.4 }}>
                  Hi! I'm Cuborg, your AI Assistant.<br />How can I help you today?
                </p>
              </div>
              <a
                href="#"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  padding: "10px 16px",
                  color: "#e2e8f0",
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.18)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
              >
                <span>Chat with AI Assistant</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ marginTop: 32 }}>
            <form onSubmit={handleSearch} style={{ maxWidth: 700 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                background: "#fff",
                borderRadius: 999,
                overflow: "hidden",
                padding: "4px 4px 4px 20px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
              }}>
                <svg viewBox="0 0 24 24" width="20" height="20" style={{ flexShrink: 0, color: "#9ca3af" }} fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="3" height="3" />
                  <rect x="19" y="14" width="2" height="2" /><rect x="14" y="19" width="2" height="2" /><rect x="19" y="19" width="2" height="2" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search addresses, transactions and blocks"
                  data-testid="input-hero-search"
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    padding: "10px 12px",
                    fontSize: 15,
                    background: "transparent",
                    color: "#111",
                    minWidth: 0,
                  }}
                />
                <button
                  type="submit"
                  data-testid="button-hero-search"
                  style={{
                    background: "#2170FF",
                    color: "#fff",
                    border: "none",
                    borderRadius: 999,
                    padding: "10px 24px",
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexShrink: 0,
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                >
                  Search
                  <svg viewBox="0 0 18 18" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path fillRule="evenodd" clipRule="evenodd" d="M2.65 8A5.35 5.35 0 1 1 13.35 8 5.35 5.35 0 0 1 2.65 8ZM8 1.35a6.65 6.65 0 1 0 4.22 11.79l2.5 2.5 1-1-2.5-2.5A6.65 6.65 0 0 0 8 1.35Z" fill="currentColor" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ───── BLOCKCHAINS ───── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 8px" }}>
        <h2 className="sr-only">Explore blockchains</h2>

        {/* Tabs */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "6px 16px",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                border: activeTab === tab.id ? "none" : "1px solid #e5e7eb",
                background: activeTab === tab.id ? "#2170FF" : "#fff",
                color: activeTab === tab.id ? "#fff" : "#374151",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}>
          {filteredChains.map(chain => (
            <BlockchainCard
              key={chain.id}
              chain={chain}
              onClick={() => navigate(`/explorer?chain=${chain.id}`)}
            />
          ))}
        </div>
      </section>

      {/* ───── TOKENS ───── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#111", margin: 0 }}>Tokens</h2>
          <a href="#" style={{ fontSize: 14, color: "#2170FF", fontWeight: 500, textDecoration: "none" }}>
            Discover more →
          </a>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}>
          {TOKENS.map(t => <TokenCard key={t.id} token={t} />)}
        </div>
      </section>

      {/* ───── "WE DEVELOP PRODUCTS" FEATURE ───── */}
      <section style={{ maxWidth: 1200, margin: "48px auto 0", padding: "0 24px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 48,
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}>
          <div style={{ flex: 1, minWidth: 280, maxWidth: 600 }}>
            <h2 style={{ fontSize: "clamp(18px,2.5vw,24px)", fontWeight: 700, color: "#111", lineHeight: 1.4, marginBottom: 20 }}>
              We develop products that make blockchain data accessible to individuals, development teams, and research organizations
            </h2>
            <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.7, marginBottom: 12 }}>
              Blockchair is the first blockchain explorer which incorporates a multitude of different blockchains into one search engine.
            </p>
            <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.7 }}>
              Now, we are striving to make blockchain data understandable and accessible for a wide and varied audience, interested in both blockchain and crypto, while maintaining and securing the privacy of our users as a paramount when developing products.
            </p>
          </div>
          <img
            src={universeChairImg}
            alt="Universe chair illustration"
            width={320}
            height={320}
            style={{ width: "min(320px, 100%)", height: "auto", flexShrink: 0 }}
          />
        </div>
      </section>

      {/* ───── PRODUCTS GRID ───── */}
      <section style={{ maxWidth: 1200, margin: "32px auto 0", padding: "0 24px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "#111", marginBottom: 16 }}>Products</h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(20rem, 100%), 1fr))",
          gap: 10,
        }}>
          {PRODUCTS.map(p => (
            <a
              key={p.name}
              href={p.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "#fff",
                borderRadius: 10,
                padding: "14px 16px",
                border: "1px solid rgba(0,0,0,0.06)",
                textDecoration: "none",
                color: "#111",
                fontSize: 14,
                fontWeight: 500,
                transition: "box-shadow 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(0,0,0,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              <img
                src={`${PRODUCT_CDN}/${p.icon}`}
                alt={p.name}
                width={40}
                height={40}
                style={{ width: 40, height: 40, flexShrink: 0 }}
                onError={e => { (e.currentTarget as HTMLElement).style.display = "none"; }}
              />
              <span style={{ flex: 1 }}>{p.name}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16" style={{ color: "#9ca3af" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
          ))}
        </div>
      </section>

      {/* ───── "1 API FOR ALL BLOCKCHAINS" FEATURE ───── */}
      <section style={{ maxWidth: 1200, margin: "56px auto 0", padding: "0 24px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 48,
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}>
          <img
            src="https://loutre.blockchair.net/w4/assets/images/products/api.svg"
            alt="API illustration"
            width={300}
            height={300}
            style={{ width: "min(300px, 100%)", height: "auto", flexShrink: 0 }}
            onError={e => { (e.currentTarget as HTMLElement).style.display = "none"; }}
          />
          <div style={{ flex: 1, minWidth: 280 }}>
            <h2 style={{ fontSize: "clamp(20px,2.5vw,28px)", fontWeight: 700, color: "#111", marginBottom: 12 }}>
              1 API for all blockchains
            </h2>
            <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.7, marginBottom: 16 }}>
              Join thousands of crypto companies, analysts, academics, and students which utilize Blockchair's REST API to fetch data and power their projects.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
              {["Never-ending data insights for all supported blockchains", "Sort and filter data with our SQL-like queries", "Integrate news from crypto outlets into your app"].map(item => (
                <li key={item} style={{ fontSize: 15, fontWeight: 500, color: "#374151", display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ color: "#2170FF", marginTop: 3 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="#"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#2170FF",
                color: "#fff",
                borderRadius: 10,
                padding: "12px 24px",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              Discover API
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ───── "PRIVACY IS OUR PARAMOUNT" FEATURE ───── */}
      <section style={{ maxWidth: 1200, margin: "56px auto 0", padding: "0 24px 56px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 48,
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h2 style={{ fontSize: "clamp(20px,2.5vw,28px)", fontWeight: 700, color: "#111", marginBottom: 8 }}>
              Privacy is our paramount
            </h2>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "#374151", marginBottom: 16 }}>
              Blockchair is the most private blockchain search engine
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              <li style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.7 }}>
                Unlike most blockchain explorers and cryptocurrency companies, we do not collect personal data, nor do we share it with third-party analytics companies and ad networks.
              </li>
              <li style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.7 }}>
                When using our services you do not risk any personal identifiable information becoming public or your cryptocurrency balances being leaked.
              </li>
            </ul>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#2170FF",
                  color: "#fff",
                  border: "none",
                  borderRadius: 999,
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                onClick={() => navigator.clipboard.writeText("http://blkchairbknpn73cfjhevhla7rkp4ed5gg2knctvv7it4lioy22defid.onion/")}
              >
                Copy .onion url
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
              <a
                href="#"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "transparent",
                  color: "#374151",
                  border: "1px solid #e5e7eb",
                  borderRadius: 999,
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#9ca3af"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb"; }}
              >
                Our privacy policy
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
          <img
            src="https://loutre.blockchair.net/w4/assets/images/homepage/privacy.svg"
            alt="Privacy illustration"
            width={300}
            height={300}
            style={{ width: "min(300px, 100%)", height: "auto", flexShrink: 0 }}
            onError={e => { (e.currentTarget as HTMLElement).style.display = "none"; }}
          />
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer style={{ borderTop: "1px solid #e5e7eb", background: "#fff", padding: "40px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#111", marginBottom: 8 }}>Blockchair © 2026</div>
              <div style={{ display: "flex", gap: 16, fontSize: 14, color: "#6b7280" }}>
                <a href="#" style={{ color: "#6b7280", textDecoration: "none" }}>Terms of service</a>
                <span>|</span>
                <a href="#" style={{ color: "#6b7280", textDecoration: "none" }}>Privacy policy</a>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {/* Discord */}
              <a href="#" style={{ width: 32, height: 32, borderRadius: "50%", background: "#5865F2", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }} aria-label="Discord">
                <svg viewBox="0 0 32 32" width="20" height="20" fill="currentColor"><path d="M 22.411 10.173 C 21.198 9.617 19.917 9.223 18.601 9 C 18.42 9.322 18.258 9.653 18.112 9.993 C 16.71 9.782 15.285 9.782 13.883 9.993 C 13.738 9.653 13.575 9.322 13.395 9 C 12.078 9.224 10.796 9.62 9.582 10.176 C 7.169 13.744 6.516 17.224 6.842 20.654 C 8.256 21.698 9.836 22.491 11.517 23 C 11.895 22.491 12.23 21.951 12.517 21.387 C 11.971 21.181 11.444 20.93 10.941 20.634 C 11.074 20.537 11.202 20.439 11.328 20.344 C 14.287 21.735 17.713 21.735 20.672 20.344 C 20.799 20.446 20.929 20.545 21.058 20.634 C 20.555 20.93 20.028 21.182 19.48 21.388 C 19.768 21.952 20.103 22.493 20.482 23 C 22.163 22.493 23.745 21.7 25.158 20.655 C 25.542 16.678 24.502 13.23 22.411 10.173 Z M 12.932 18.545 C 12.021 18.545 11.269 17.717 11.269 16.7 C 11.269 15.684 11.994 14.85 12.929 14.85 C 13.863 14.85 14.61 15.684 14.594 16.7 C 14.577 17.717 13.86 18.545 12.932 18.545 Z M 19.068 18.545 C 18.157 18.545 17.406 17.717 17.406 16.7 C 17.406 15.684 18.132 14.85 19.068 14.85 C 20.005 14.85 20.744 15.684 20.729 16.7 C 20.713 17.717 19.998 18.545 19.068 18.545 Z" /></svg>
              </a>
              {/* Telegram */}
              <a href="#" style={{ width: 32, height: 32, borderRadius: "50%", background: "#2AABEE", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }} aria-label="Telegram">
                <svg viewBox="0 0 32 32" width="20" height="20" fill="currentColor"><path d="M10.8682 17.3584L6.9634 16.0861S6.49673 15.8968 6.647 15.4674C6.67793 15.3789 6.74033 15.3036 6.927 15.1741C7.7922 14.571 22.9411 9.12609 22.9411 9.12609S23.3689 8.98196 23.6211 9.07782C23.6835 9.09714 23.7397 9.13269 23.7839 9.18083C23.828 9.22898 23.8586 9.28799 23.8725 9.35182C23.8997 9.46458 23.9111 9.58059 23.9063 9.69649C23.9051 9.79676 23.893 9.88969 23.8838 10.0354C23.7915 11.5241 21.0305 22.6345 21.0305 22.6345S20.8653 23.2846 20.2734 23.3069C20.1279 23.3116 19.983 23.287 19.8473 23.2344C19.7116 23.1819 19.5878 23.1026 19.4834 23.0013C18.3219 22.0022 14.3075 19.3044 13.4205 18.711C13.4005 18.6974 13.3836 18.6796 13.371 18.6589C13.3585 18.6382 13.3505 18.6151 13.3477 18.591C13.3353 18.5285 13.4033 18.451 13.4033 18.451S20.3934 12.2377 20.5794 11.5854C20.5938 11.5349 20.5394 11.51 20.4663 11.5321C20.0021 11.7029 11.9538 16.7854 11.0655 17.3464C11.0016 17.3657 10.934 17.3698 10.8682 17.3584Z" /></svg>
              </a>
              {/* X / Twitter */}
              <a href="#" style={{ width: 32, height: 32, borderRadius: "50%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }} aria-label="X (Twitter)">
                <svg viewBox="0 0 32 32" width="18" height="18" fill="none"><path d="M7.88 7.62l7.38 9.44L7.84 24.7h1.67l6.5-6.72 5.25 6.72H26.9l-7.79-9.97 6.91-7.13H24.4l-5.99 6.19-4.83-6.2H7.88Zm2.46 1.18h2.61l11.53 14.76h-2.61L10.34 8.8Z" fill="currentColor" /></svg>
              </a>
              {/* GitHub */}
              <a href="#" style={{ width: 32, height: 32, borderRadius: "50%", background: "#24292e", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }} aria-label="GitHub">
                <svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M15.95 0.33C7.13 0.33 0 7.51 0 16.4c0 7.1 4.57 13.11 10.91 15.24.8.16 1.09-.34 1.09-.76 0-.37-.01-1.64-.01-2.97-4.44.96-5.37-2.13-5.37-2.13-.72-1.86-1.78-2.35-1.78-2.35-1.45-.99.1-.99.1-.99 1.61.11 2.45 1.65 2.45 1.65 1.43 2.45 3.73 1.74 4.64 1.33.13-1.04.56-1.74 1.01-2.14-3.54-.4-7.27-1.77-7.27-7.88 0-1.74.62-3.16 1.65-4.28-.16-.4-.72-2.03.16-4.23 0 0 1.35-.43 4.42 1.65a15.38 15.38 0 0 1 8.03 0c3.07-2.08 4.42-1.65 4.42-1.65.88 2.2.32 3.82.16 4.23 1.03 1.12 1.65 2.55 1.65 4.28 0 6.13-3.73 7.47-7.29 7.86.58.5 1.09 1.48 1.09 2.99 0 2.15-.02 3.88-.02 4.4 0 .43.29.94 1.1.78A16.55 16.55 0 0 0 31.88 16.4C31.9 7.51 24.75.33 15.95.33Z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
