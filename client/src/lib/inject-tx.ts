const OLD_FULL =
  "cd2aa6b0c2f59350c8df2611e4ae0e41c420dd56965069de5b1f2657ebfaf4f7";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const pad = (n: number) => String(n).padStart(2, "0");
const fmtInt = (n: number) => Number(n).toLocaleString("en-US");
const fmtUsd = (u: number) =>
  Number(u).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const fmtBtc = (sats: number) => (sats / 1e8).toFixed(8);
const trimZeros = (s: string) => s.replace(/\.?0+$/, "") || "0";
const truncHash = (h: string) => h.slice(0, 6) + "..." + h.slice(-6);
const escapeHtml = (s: unknown) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function absUTC(sec: number): string {
  const d = new Date(sec * 1000);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} ${pad(
    d.getUTCHours(),
  )}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
}

function relTime(sec: number): string {
  const s = Math.max(0, Math.floor(Date.now() / 1000 - sec));
  if (s < 60) return `${s} second${s !== 1 ? "s" : ""} ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m !== 1 ? "s" : ""} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h !== 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d !== 1 ? "s" : ""} ago`;
}

const VERIFIED_ICON =
  '<svg class="| icon-square-sm | inline va-middle mb-2xs |" aria-label="Verified" aria-hidden="true"><use href="#icon-verified"></use></svg>';

function amountCell(btc: string, usd: string, prevLink: string): string {
  return `<div class="value-body | | flow flow-gap-2xs | ff-mono"><div class="fs-regular">${prevLink}<div class="values | inline | | ff-mono wb-ka va-middle"><span class="wb-bw"><span class="wb-ba">${btc}</span>&nbsp;BTC&nbsp;${VERIFIED_ICON}</span><span class="color-text-secondary">·</span><span class="wb-bw">${usd}</span>&nbsp;USD</div></div></div>`;
}

function addressCell(addr: string, isLink: boolean): string {
  const inner = isLink
    ? `<a class="link link--underlined" href="https://blockchair.com/bitcoin/address/${escapeHtml(
        addr,
      )}">${escapeHtml(
        addr,
      )}</a> <blockchair-copy copy-value="${escapeHtml(
        addr,
      )}" role="button" aria-label="Copy to clipboard" tabindex="0" class="br-full cursor-copy form-el-square-sm inline-block va-middle" style="--is-copied: 0;"><svg aria-hidden="true" class="action-icon | form-el-square-sm | |"><use href="#icon-copy"></use></svg></blockchair-copy>`
    : `${escapeHtml(addr)}`;
  return `<div class="value-body | | flow flow-gap-2xs | ff-mono"><div class="wb-ba fs-regular">${inner}</div></div>`;
}

function ioRow(
  label: string,
  index: number,
  addr: string,
  isLink: boolean,
  btc: string,
  usd: string,
  prevLink: string,
): string {
  return `<li class="transaction-events__event | card card--effect | flow flow--separated flow-gap-sm px-xl py-lg br-xl |"><div><div class="value | | flow | flow-gap-xs"><h3 class="| caption | | uppercase flow flow--row ai-center flow-gap-regular jc-between fw-wrap"><span>${label} ${index}</span></h3>${addressCell(
    addr,
    isLink,
  )}</div></div><div><div class="value | | flow | flow-gap-xs"><h3 class="| caption | | uppercase">Amount</h3>${amountCell(
    btc,
    usd,
    prevLink,
  )}</div></div></li>`;
}

function setText(el: Element | null | undefined, text: string): void {
  if (el) el.textContent = text;
}

function valueByCaption(doc: Document, caption: string): Element | null {
  const heads = doc.querySelectorAll("h2.caption, h3.caption");
  for (const h of Array.from(heads)) {
    if (h.textContent?.trim() === caption)
      return (h.closest(".value") as Element) || h.parentElement;
  }
  return null;
}

function usdSpan(scope: Element): Element | undefined {
  return Array.from(scope.querySelectorAll(".wb-bw")).find(
    (b) => !b.querySelector(".wb-ba"),
  );
}

export interface TxData {
  // mempool.space transaction shape — only the fields we read are typed loosely
  tx: any;
  tip: number;
  btcPrice: number;
}

// Fetch everything the page needs straight from the browser:
// - full tx (with prevout addresses/values) from mempool.space (CORS-enabled)
// - current tip height to compute confirmations
// - BTC price from our own /api/prices, falling back to mempool's price feed
export async function fetchTxData(hash: string): Promise<TxData | null> {
  const base = import.meta.env.BASE_URL || "/";
  const [txRes, tipRes] = await Promise.all([
    fetch(`https://mempool.space/api/tx/${hash}`),
    fetch("https://mempool.space/api/blocks/tip/height"),
  ]);
  if (!txRes.ok) return null;
  const tx = await txRes.json();
  const tip = tipRes.ok ? parseInt(await tipRes.text(), 10) : 0;

  let btcPrice = 0;
  try {
    const pRes = await fetch(`${base}api/prices`);
    if (pRes.ok) {
      const arr = await pRes.json();
      const btc = Array.isArray(arr)
        ? arr.find((p: any) => p.id === "bitcoin")
        : null;
      btcPrice = (btc && Number(btc.priceUsd)) || 0;
    }
  } catch {
    /* ignore — fall back below */
  }
  if (!btcPrice) {
    try {
      const mp = await fetch("https://mempool.space/api/v1/prices");
      if (mp.ok) btcPrice = Number((await mp.json()).USD) || 0;
    } catch {
      /* ignore — USD columns will show 0.00 */
    }
  }
  return { tx, tip, btcPrice };
}

// Mutate the saved Blockchair demo document in place so it shows the real
// transaction. Targets stable selectors/captions (re-runnable from a pristine
// reload) and rebuilds the input/output lists from the mempool tx.
export function injectRealTx(
  doc: Document,
  tx: any,
  tip: number,
  btcPrice: number,
): void {
  const txid: string = tx.txid;
  const root = doc.documentElement;

  // Replace the demo hash everywhere (text nodes + attributes) so the visible
  // hash, breadcrumb, copy buttons and links all point at the real tx.
  const replaceEverywhere = (find: string, rep: string) => {
    const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
    const nodes: Node[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      if (n.nodeValue && n.nodeValue.includes(find))
        n.nodeValue = n.nodeValue.split(find).join(rep);
    }
    root.querySelectorAll("*").forEach((el) => {
      for (const a of Array.from(el.attributes)) {
        if (a.value.includes(find))
          el.setAttribute(a.name, a.value.split(find).join(rep));
      }
    });
  };
  replaceEverywhere(OLD_FULL, txid);
  replaceEverywhere(truncHash(OLD_FULL), truncHash(txid));
  try {
    doc.title = "Bitcoin transaction " + txid;
  } catch {
    /* ignore */
  }

  const confirmed = !!(tx.status && tx.status.confirmed);
  const blockH =
    tx.status && tx.status.block_height != null ? tx.status.block_height : null;
  const confs =
    confirmed && blockH != null && tip ? Math.max(1, tip - blockH + 1) : 0;
  const totalIn = (tx.vin || []).reduce(
    (s: number, v: any) => s + ((v.prevout && v.prevout.value) || 0),
    0,
  );
  const feeSats = tx.fee || 0;
  const vsizeExact = tx.weight / 4;

  // Transaction status: block height link + confirmations
  const statusV = valueByCaption(doc, "Transaction status");
  if (statusV) {
    const a = statusV.querySelector(
      "[data-in-block] a, a[data-href-template]",
    ) as HTMLAnchorElement | null;
    if (a && blockH != null) {
      setText(a, fmtInt(blockH));
      a.setAttribute("href", `https://blockchair.com/bitcoin/block/${blockH}`);
    }
    const c = statusV.querySelector("[data-confirmations]");
    if (c) {
      setText(c, fmtInt(confs));
      c.setAttribute("data-block", String(blockH));
    }
  }

  // Time: relative + absolute
  const timeV = valueByCaption(doc, "Time");
  if (timeV && tx.status && tx.status.block_time) {
    const sec = tx.status.block_time;
    const iso = new Date(sec * 1000).toISOString().replace("Z", "000Z");
    const rel = timeV.querySelector("time[data-time-relative]");
    if (rel) {
      setText(rel, relTime(sec));
      rel.setAttribute("datetime", iso);
      rel.setAttribute("data-timer-start", String(sec * 1000));
    }
    const abs = timeV.querySelector("time[data-time]");
    if (abs) {
      setText(abs, absUTC(sec));
      abs.setAttribute("datetime", iso);
    }
  }

  // Fee: BTC, sat/B, sat/vB, USD
  const feeV = valueByCaption(doc, "Fee");
  if (feeV) {
    const bas = feeV.querySelectorAll(".wb-ba");
    setText(bas[0], fmtBtc(feeSats));
    if (tx.size) setText(bas[1], trimZeros((feeSats / tx.size).toFixed(6)));
    if (vsizeExact)
      setText(bas[2], trimZeros((feeSats / vsizeExact).toFixed(6)));
    setText(usdSpan(feeV), fmtUsd((feeSats / 1e8) * btcPrice));
  }

  // Amount transferred (sum of inputs)
  const amtV = valueByCaption(doc, "Amount transferred");
  if (amtV) {
    setText(amtV.querySelector(".wb-ba"), fmtBtc(totalIn));
    setText(usdSpan(amtV), fmtUsd((totalIn / 1e8) * btcPrice));
  }

  // Size / Weight / Virtual size / Lock time / Version
  const setSimple = (caption: string, val: string) => {
    const v = valueByCaption(doc, caption);
    if (v) {
      const s = v.querySelector(".fs-md");
      if (s) s.textContent = val;
    }
  };
  setSimple("Size", fmtInt(tx.size || 0));
  setSimple("Weight", fmtInt(tx.weight || 0));
  setSimple("Virtual size", `${fmtInt(Math.round(vsizeExact || 0))} vB`);
  setSimple("Lock time", fmtInt(tx.locktime || 0));
  setSimple("Version", String(tx.version != null ? tx.version : ""));

  // Inputs / Outputs lists (uls[0] = inputs, uls[1] = outputs)
  const uls = doc.querySelectorAll("ul.transaction-events");
  if (uls.length >= 2) {
    const inRows = (tx.vin || []).map((v: any, i: number) => {
      const cb = !!v.is_coinbase;
      const addr = cb
        ? "Coinbase (Newly Generated Coins)"
        : (v.prevout && v.prevout.scriptpubkey_address) || "Unknown";
      const val = (v.prevout && v.prevout.value) || 0;
      const prevLink =
        !cb && v.txid
          ? `<a class="| | inline-block va-middle | br-full" href="https://blockchair.com/bitcoin/transaction/${v.txid}/bitcoin-main/0?o=${v.vout}"><svg aria-hidden="true" class="action-icon form-el-square-sm"><g style="transform: rotate(180deg); transform-origin: center;"><use href="#icon-link-arrow-horizontal"></use></g></svg></a>`
          : "";
      return ioRow(
        "Input",
        i,
        addr,
        !cb,
        fmtBtc(val),
        fmtUsd((val / 1e8) * btcPrice),
        prevLink,
      );
    });
    const outRows = (tx.vout || []).map((o: any, i: number) => {
      const isLink = !!o.scriptpubkey_address;
      const addr =
        o.scriptpubkey_address || `(${o.scriptpubkey_type || "unknown"})`;
      return ioRow(
        "Output",
        i,
        addr,
        isLink,
        fmtBtc(o.value || 0),
        fmtUsd(((o.value || 0) / 1e8) * btcPrice),
        "",
      );
    });
    uls[0].innerHTML = inRows.join("");
    uls[1].innerHTML = outRows.join("");
  }
}
