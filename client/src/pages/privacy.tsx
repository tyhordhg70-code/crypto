import { Link } from "wouter";
import { Zap } from "lucide-react";

export default function Privacy() {
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
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mb-10">Last updated: March 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Overview</h2>
            <p>
              BlockExplorer ("we", "us", "our") is committed to protecting your privacy.
              This Privacy Policy explains what information we collect, how we use it, and your rights
              regarding that information. We operate a free, public blockchain explorer service at this website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Information We Collect</h2>
            <p><strong>We do not collect personal information.</strong> Specifically:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
              <li>No account registration is required to use any feature.</li>
              <li>We do not collect your name, email address, or any personally identifiable information.</li>
              <li>We do not set tracking cookies or use third-party advertising networks.</li>
              <li>We do not fingerprint your browser or device.</li>
            </ul>
            <p className="mt-3">
              <strong>Transaction hash queries:</strong> When you search for a transaction hash, that hash is
              forwarded to our data providers (mempool.space for Bitcoin; Ethereum public RPC nodes for Ethereum)
              to retrieve block data. These providers may log requests per their own privacy policies. We do not
              tie hash queries to your identity or IP address in any persistent storage.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Cookies &amp; Local Storage</h2>
            <p>
              BlockExplorer does not use advertising cookies or third-party tracking cookies. We may use
              session-related cookies solely to maintain the functionality of the web application. No cookie
              data is shared with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Third-Party Data Providers</h2>
            <p>Our service relies on these third-party APIs to deliver blockchain data:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
              <li><strong>CoinGecko</strong> (coingecko.com) — Cryptocurrency price data</li>
              <li><strong>mempool.space</strong> — Bitcoin transaction and block data</li>
              <li><strong>Ethereum Public Node</strong> (ethereum.publicnode.com) — Ethereum transaction data</li>
              <li><strong>CoinDesk, CoinTelegraph, Decrypt, Bitcoin Magazine</strong> — News RSS feeds</li>
            </ul>
            <p className="mt-3">
              These providers operate independently and have their own privacy policies. We encourage you to
              review them. We have no control over data collected by these providers when your browser or our
              server contacts their endpoints.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Security</h2>
            <p>
              BlockExplorer never asks for, stores, or transmits cryptocurrency private keys, seed phrases, or
              wallet passwords. If any website claiming to be BlockExplorer requests this information, it is not
              our service. Please report impersonators immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Children's Privacy</h2>
            <p>
              BlockExplorer is not directed to children under the age of 13. We do not knowingly collect
              personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The "Last updated" date at the top of this
              page will reflect the most recent revision. Continued use of BlockExplorer after changes are
              posted constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">8. Contact</h2>
            <p>
              Questions about this Privacy Policy can be directed to us via the contact information provided in
              our <Link href="/terms" className="text-indigo-600 hover:underline">Terms of Service</Link>.
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
