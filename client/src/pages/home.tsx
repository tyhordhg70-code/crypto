import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const [, navigate] = useLocation();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const homeUrl = `${import.meta.env.BASE_URL}home.html`;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    function wireUp() {
      try {
        const doc = iframe?.contentDocument;
        if (!doc) return;

        // Intercept the hero search form and any header search forms
        const forms = doc.querySelectorAll("form");
        forms.forEach((form) => {
          form.addEventListener("submit", (e) => {
            e.preventDefault();
            const input = form.querySelector<HTMLInputElement>('input[name="q"], input[type="text"]');
            const q = input?.value.trim();
            if (!q) return;
            routeQuery(q);
          });
        });

        // Make blockchain cards / explorer links route into our app instead of blockchair.com
        const links = doc.querySelectorAll<HTMLAnchorElement>('a[href^="https://blockchair.com"]');
        links.forEach((a) => {
          a.addEventListener("click", (e) => {
            e.preventDefault();
          });
        });
      } catch {
        /* cross-origin guard — should not happen, same origin */
      }
    }

    function routeQuery(q: string) {
      if (q.length > 40 && /^[0-9a-fA-F]+$/.test(q)) {
        navigate(`/tx/${q}`);
      } else if (q.startsWith("0x") || /^(1|3|bc1)/.test(q)) {
        navigate(`/explorer?address=${q}`);
      } else {
        navigate(`/tx/${q}`);
      }
    }

    iframe.addEventListener("load", wireUp);
    return () => iframe.removeEventListener("load", wireUp);
  }, [navigate]);

  return (
    <iframe
      ref={iframeRef}
      src={homeUrl}
      title="Blockchain Explorer"
      data-testid="iframe-home"
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
