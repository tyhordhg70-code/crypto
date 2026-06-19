import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

export default function Explorer() {
  const [, navigate] = useLocation();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const pageUrl = `${import.meta.env.BASE_URL}address.html`;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

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

        // Keep blockchair.com links inside the app: route them to our own pages
        // (logo / homepage links navigate home instead of doing nothing).
        const links = doc.querySelectorAll<HTMLAnchorElement>(
          'a[href^="https://blockchair.com"]',
        );
        links.forEach((a) => {
          a.addEventListener("click", (e) => {
            e.preventDefault();
            routeHref(a.href);
          });
        });
      } catch {
        /* cross-origin guard — should not happen, same origin */
      }
    }

    // Handle the case where the iframe finished loading before this effect ran
    const doc = iframe.contentDocument;
    if (doc && doc.readyState !== "loading") {
      wireUp();
    }
    iframe.addEventListener("load", wireUp);
    return () => iframe.removeEventListener("load", wireUp);
  }, [navigate]);

  return (
    <iframe
      ref={iframeRef}
      src={pageUrl}
      title="Bitcoin Address"
      data-testid="iframe-explorer"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        border: "none",
      }}
    />
  );
}
