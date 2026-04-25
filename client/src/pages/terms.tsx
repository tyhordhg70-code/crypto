import { Link } from "wouter";
import { Zap } from "lucide-react";

export default function Terms() {
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
            <Link href="/about" className="hover:text-indigo-600">About</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Terms of Service</h1>
        <p className="text-sm text-slate-400 mb-10">Last updated: March 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using BlockExplorer ("the Service"), you agree to be bound by these Terms of
              Service. If you do not agree with any part of these terms, you may not use the Service. These
              terms apply to all users of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Description of Service</h2>
            <p>
              BlockExplorer is a free, publicly accessible multi-chain blockchain explorer and analytics tool.
              The Service provides:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
              <li>Real-time cryptocurrency price data sourced from CoinGecko</li>
              <li>Bitcoin transaction lookup via mempool.space</li>
              <li>Ethereum transaction lookup via public Ethereum RPC nodes</li>
              <li>Block statistics and network data for 14+ blockchains</li>
              <li>Aggregated cryptocurrency news from CoinDesk, CoinTelegraph, Decrypt, and Bitcoin Magazine</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. No Financial Advice</h2>
            <p>
              The information provided by BlockExplorer is for informational purposes only and does not
              constitute financial, investment, legal, or tax advice. Cryptocurrency markets are highly
              volatile. Past price data displayed on BlockExplorer does not guarantee future performance.
              Always conduct your own research and consult qualified professionals before making any
              financial decisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Accuracy of Data</h2>
            <p>
              BlockExplorer relies on third-party APIs to provide blockchain data. While we strive to present
              accurate and timely information, we make no warranties regarding the completeness, accuracy,
              or availability of any data displayed. Transaction data is sourced directly from blockchain
              network providers and is not modified by BlockExplorer. You can independently verify any
              transaction by checking mempool.space (Bitcoin) or Etherscan (Ethereum).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Prohibited Uses</h2>
            <p>You agree not to use BlockExplorer to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
              <li>Engage in any activity that violates applicable laws or regulations</li>
              <li>Attempt to overload, harm, or disrupt the Service through automated requests</li>
              <li>Scrape or harvest data in ways that degrade service quality for other users</li>
              <li>Impersonate BlockExplorer or misrepresent any affiliation with us</li>
              <li>Use the Service for any fraudulent or deceptive purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Limitation of Liability</h2>
            <p>
              BlockExplorer is provided "as is" without warranties of any kind. To the maximum extent
              permitted by applicable law, BlockExplorer and its operators shall not be liable for any
              indirect, incidental, special, or consequential damages arising from your use of, or inability
              to use, the Service. This includes any decisions made based on information displayed on
              BlockExplorer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Third-Party Links &amp; Services</h2>
            <p>
              BlockExplorer may display links to external websites (such as news sources and data providers).
              These links are provided for convenience only. We have no control over, and assume no
              responsibility for, the content or practices of any third-party sites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">8. Intellectual Property</h2>
            <p>
              The BlockExplorer interface, design, and original content are our property. Blockchain data
              displayed on the Service is sourced from public networks and third-party APIs and is not our
              intellectual property. Cryptocurrency news is the property of the respective publishers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">9. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. The "Last updated" date at the top of
              this page will reflect the most recent revision. Continued use of BlockExplorer after changes
              are posted constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">10. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with generally applicable
              principles of internet and commercial law. Any disputes arising from use of the Service should
              first be raised with us directly before seeking legal remedies.
            </p>
          </section>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 py-10 mt-10">
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
