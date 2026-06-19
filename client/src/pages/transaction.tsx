import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { fetchTxData, injectRealTx } from "../lib/inject-tx";

const DEMO_HASH =
  "cd2aa6b0c2f59350c8df2611e4ae0e41c420dd56965069de5b1f2657ebfaf4f7";

export default function Transaction() {
  const [location, navigate] = useLocation();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ?v= busts the browser cache when the saved tx.html markup/styles change.
  const pageUrl = `${import.meta.env.BASE_URL}tx.html?v=20260619`;

  // Hash from the current /tx/:hash route (decoded, suffix stripped).
  const rawHash = location.startsWith("/tx/")
    ? decodeURIComponent(location.slice(4))
    : "";
  const hash = rawHash.split(/[/?#]/)[0];
  // Only fetch + inject for a real 64-hex BTC txid that isn't the saved demo.
  const isRealLookup =
    /^[0-9a-fA-F]{64}$/.test(hash) && hash.toLowerCase() !== DEMO_HASH;

  // Hide the saved demo page behind a loader for real lookups until the real tx
  // data has been injected, so the demo values never flash on screen first.
  const [revealed, setRevealed] = useState(!isRealLookup);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Reset the loader whenever the looked-up hash changes.
    setRevealed(!isRealLookup);

    function routeQuery(q: string) {
      const v = encodeURIComponent(q);
      if (q.length > 40 && /^[0-9a-fA-F]+$/.test(q)) {
        navigate(`/tx/${v}`);
      } else if (q.startsWith("0x") || /^(1|3|bc1)/.test(q)) {
        navigate(`/explorer?address=${v}`);
      } else {
        navigate(`/tx/${v}`);
      }
    }

    // Resolve a blockchair.com link to an internal route. Returns true if handled.
    function routeHref(href: string): boolean {
      try {
        const u = new URL(href);
        if (u.hostname !== "blockchair.com") return false;
        const tx = u.pathname.match(/\/transaction\/([^/?#]+)/);
        if (tx) {
          navigate(`/tx/${tx[1]}`);
          return true;
        }
        const addr = u.pathname.match(/\/address\/([^/?#]+)/);
        if (addr) {
          navigate(`/explorer?address=${encodeURIComponent(addr[1])}`);
          return true;
        }
        if (u.pathname === "/" || u.pathname === "") {
          navigate("/");
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }

    function wireUp() {
      try {
        const doc = iframe?.contentDocument;
        if (!doc) return;

        // Intercept only forms that contain a search query input
        const forms = doc.querySelectorAll("form");
        forms.forEach((form) => {
          const input = form.querySelector<HTMLInputElement>(
            'input[name="q"], input[type="search"], input[type="text"]',
          );
          if (!input) return;
          form.addEventListener("submit", (e) => {
            e.preventDefault();
            const q = input.value.trim();
            if (!q) return;
            routeQuery(q);
          });
        });

        // Delegate blockchair.com link clicks at the document level so links we
        // inject later (rebuilt input/output rows) are handled too. Use duck
        // typing for `closest` — the click target comes from the iframe realm,
        // so `instanceof Element` (parent realm) would be false for it.
        doc.addEventListener(
          "click",
          (e) => {
            const target = e.target as {
              closest?: (s: string) => Element | null;
            } | null;
            const a =
              target && typeof target.closest === "function"
                ? (target.closest(
                    'a[href^="https://blockchair.com"]',
                  ) as HTMLAnchorElement | null)
                : null;
            if (a) {
              e.preventDefault();
              routeHref(a.href);
            }
          },
          true,
        );
      } catch {
        /* cross-origin guard — should not happen, same origin */
      }
    }

    // Guard so we run exactly once per document, whether triggered by the
    // immediate path below or the iframe's load event.
    let ran = false;
    async function onReady() {
      if (ran) return;
      ran = true;
      wireUp();
      if (!isRealLookup) return;
      const d = iframe?.contentDocument;
      if (!d) {
        setRevealed(true);
        return;
      }
      try {
        const data = await fetchTxData(hash);
        if (data) injectRealTx(d, data.tx, data.tip, data.btcPrice);
      } catch {
        /* leave the pristine page untouched on failure */
      } finally {
        // Reveal once injection has finished (or failed) so the demo never flashes.
        setRevealed(true);
      }
    }

    // Handle the case where tx.html already finished loading before this effect
    // ran. A freshly-mounted iframe's document is about:blank (also "complete"),
    // so require the real tx.html URL before running early.
    const doc = iframe.contentDocument;
    if (
      doc &&
      doc.readyState === "complete" &&
      /tx\.html/.test(doc.URL || "")
    ) {
      onReady();
    }
    iframe.addEventListener("load", onReady);
    return () => iframe.removeEventListener("load", onReady);
  }, [location, navigate, hash, isRealLookup]);

  return (
    <>
      <iframe
        key={hash || "demo"}
        ref={iframeRef}
        src={pageUrl}
        title="Bitcoin Transaction"
        data-testid="iframe-transaction"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          border: "none",
        }}
      />
      {!revealed && (
        <div
          aria-busy="true"
          data-testid="tx-loading"
          style={{
            position: "fixed",
            inset: 0,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2147483647,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              border: "3px solid #e6e8eb",
              borderTopColor: "#1d6fe0",
              borderRadius: "50%",
              animation: "bxspin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes bxspin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
    </>
  );
}
