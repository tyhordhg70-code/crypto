import { Link } from "wouter";
import { Zap, Shield, Globe, Zap as ZapIcon, BookOpen, RefreshCw, Lock } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">BlockExplorer</span>
          </Link>
          <nav className="flex gap-6 text-sm font-medium text-slate-600">
            <Link href="/explorer" className="hover:text-indigo-600">Explorer</Link>
            <Link href="/about" className="text-indigo-600">About</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">About BlockExplorer</h1>
        <p className="text-xl text-slate-500 mb-12 leading-relaxed">
          BlockExplorer is a free, open multi-chain blockchain explorer that lets anyone look up real-time
          transaction data, track confirmations, monitor live cryptocurrency prices, and read the latest
          crypto news — all in one place.
        </p>

        <section className="mb-14">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">What We Do</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: <Globe className="w-5 h-5 text-indigo-500" />,
                title: "Real Transaction Lookup",
                body: "Search any Bitcoin or Ethereum transaction hash and get the real status: confirmations, block height, sender/recipient addresses, amounts in both crypto and USD, and network fees.",
              },
              {
                icon: <RefreshCw className="w-5 h-5 text-indigo-500" />,
                title: "Live Price Data",
                body: "Real-time cryptocurrency prices for Bitcoin, Ethereum, Solana, BNB, XRP, Cardano, Dogecoin, and 100+ other assets — powered by CoinGecko's public API.",
              },
              {
                icon: <BookOpen className="w-5 h-5 text-indigo-500" />,
                title: "Crypto News Aggregator",
                body: "Headlines from CoinDesk, CoinTelegraph, Decrypt, and Bitcoin Magazine — updated every 15 minutes, no account required.",
              },
              {
                icon: <Shield className="w-5 h-5 text-indigo-500" />,
                title: "14+ Blockchain Networks",
                body: "Coverage across Bitcoin, Ethereum, BNB Chain, Solana, Avalanche, Polkadot, Cardano, Chainlink, and more.",
              },
            ].map((item) => (
              <div key={item.title} className="border border-slate-100 rounded-xl p-6 bg-slate-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Data Sources</h2>
          <p className="text-slate-600 mb-6">
            Transparency about data sources is fundamental to our credibility. We use only reputable,
            industry-standard APIs to serve real blockchain data:
          </p>
          <div className="space-y-4">
            {[
              {
                source: "CoinGecko",
                url: "https://coingecko.com",
                use: "Live cryptocurrency prices, market caps, 24h change, and 7-day price charts.",
                why: "CoinGecko is one of the most trusted independent crypto data aggregators, used by thousands of financial applications worldwide.",
              },
              {
                source: "mempool.space",
                url: "https://mempool.space",
                use: "Bitcoin transaction lookup, confirmation tracking, block height, fee data.",
                why: "mempool.space is the leading open-source Bitcoin mempool visualizer and block explorer, widely relied upon by the Bitcoin developer community.",
              },
              {
                source: "ethereum.publicnode.com",
                url: "https://ethereum.publicnode.com",
                use: "Ethereum transaction lookup via JSON-RPC: status, gas fees, block numbers, addresses.",
                why: "Public Node provides free, reliable, and rate-limit-free access to Ethereum's RPC endpoints for developers and applications.",
              },
              {
                source: "CoinDesk, CoinTelegraph, Decrypt, Bitcoin Magazine",
                url: null,
                use: "News headlines via RSS feeds.",
                why: "These are the four most widely cited publications in the cryptocurrency and blockchain industry.",
              },
            ].map((item) => (
              <div key={item.source} className="border border-slate-200 rounded-xl p-5 bg-white">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-semibold text-slate-900">{item.source}</span>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-indigo-500 hover:underline">{item.url}</a>
                  )}
                </div>
                <p className="text-slate-600 text-sm mb-1"><strong>Used for:</strong> {item.use}</p>
                <p className="text-slate-500 text-sm">{item.why}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Is BlockExplorer Legitimate?</h2>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 space-y-4">
            <p className="text-slate-700 leading-relaxed">
              Yes. BlockExplorer is a legitimate blockchain data tool that sources information directly from
              publicly available blockchain APIs and data providers. We do not:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 text-sm ml-2">
              <li>Ask for wallet private keys or seed phrases — ever.</li>
              <li>Require account creation to use any feature.</li>
              <li>Charge any fees for lookups or data access.</li>
              <li>Modify, alter, or interpret blockchain data — we display it as-is from the source.</li>
            </ul>
            <p className="text-slate-700 leading-relaxed">
              Our transaction lookup feature retrieves data directly from mempool.space (Bitcoin) and
              Ethereum public RPC nodes — the same underlying infrastructure used by major wallets and
              exchanges. You can independently verify any transaction we show you by entering the same hash
              into mempool.space or Etherscan.
            </p>
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Privacy &amp; Security</h2>
          <div className="flex items-start gap-4 p-5 border border-slate-200 rounded-xl">
            <Lock className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-slate-700 text-sm leading-relaxed">
                BlockExplorer does not collect personal information. Transaction hash lookups are sent to
                third-party APIs (mempool.space, Ethereum public nodes) without any identifying information
                tied to you. We do not set tracking cookies, run ad networks, or sell data. Read our full{" "}
                <Link href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link> for details.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Contact</h2>
          <p className="text-slate-600 text-sm">
            For questions, feedback, or issues with the explorer, you can reach us via the contact information
            listed in our <Link href="/terms" className="text-indigo-600 hover:underline">Terms of Service</Link>.
            We take reports of data inaccuracies seriously and investigate all reports promptly.
          </p>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-100 py-10 mt-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <ZapIcon className="w-3.5 h-3.5 text-white" />
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
