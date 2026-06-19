import { useEffect, useRef } from "react";
  import { useLocation } from "wouter";

  export default function Explorer() {
    const [, navigate] = useLocation();
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const addressUrl = `${import.meta.env.BASE_URL}address.html`;

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

      function wireUp() {
        try {
          const doc = iframe?.contentDocument;
          if (!doc) return;

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

          const links = doc.querySelectorAll<HTMLAnchorElement>(
            'a[href^="https://blockchair.com"]',
          );
          links.forEach((a) => {
            a.addEventListener("click", (e) => e.preventDefault());
          });
        } catch {
          /* cross-origin guard — should not happen, same origin */
        }
      }

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
        src={addressUrl}
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
  