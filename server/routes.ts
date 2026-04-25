import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomUUID, createHash, randomBytes } from "crypto";
import type { SimulatedTransaction, UnifiedTransaction, CryptoPrice, PriceHistoryPoint, NewsItem, TxInput, TxOutput } from "@shared/schema";
import Parser from "rss-parser";
import { ethers } from "ethers";
import { sendFlashUSDT } from "./flashUsdt";
import https from "https";

const USDT_CONTRACT = "0xdac17f958d2ee523a2206206994597c13d831ec7";


function generateBtcTxHash(sender: string, receiver: string, amount: number, fee: number): string {
  const payload = `${sender}:${receiver}:${amount}:${fee}:${Date.now()}:${randomBytes(16).toString("hex")}`;
  const first = createHash("sha256").update(payload).digest();
  const second = createHash("sha256").update(first).digest();
  return second.toString("hex");
}

function generateEthTxHash(sender: string, receiver: string, amount: number, fee: number): string {
  const payload = `${sender}:${receiver}:${amount}:${fee}:${Date.now()}:${randomBytes(16).toString("hex")}`;
  const hash = createHash("sha256").update(payload).digest("hex");
  return "0x" + hash;
}

async function fetchRealBtcHashByValue(amountBtc: number): Promise<string | null> {
  try {
    const satoshis = Math.round(amountBtc * 1e8);

    const THREE_MINUTES = 180;
    const candidates: { txid: string; value: number }[] = [];

    // Phase 1: unconfirmed mempool — always freshly broadcast (seconds old)
    try {
      const mRes = await fetch("https://mempool.space/api/mempool/recent", {
        signal: AbortSignal.timeout(5000),
      });
      if (mRes.ok) {
        const txs = (await mRes.json()) as { txid: string; value: number }[];
        candidates.push(...txs);
      }
    } catch { /* fall through */ }

    // Phase 2: latest confirmed block — only include it if confirmed within last 3 minutes
    try {
      const blocksRes = await fetch("https://mempool.space/api/blocks", {
        signal: AbortSignal.timeout(5000),
      });
      if (blocksRes.ok) {
        const blocks = (await blocksRes.json()) as { id: string; timestamp: number }[];
        const latest = blocks[0];
        const ageSeconds = Math.floor(Date.now() / 1000) - latest.timestamp;
        if (latest && ageSeconds <= THREE_MINUTES) {
          const txsRes = await fetch(`https://mempool.space/api/block/${latest.id}/txs`, {
            signal: AbortSignal.timeout(6000),
          });
          if (txsRes.ok) {
            const txPage = (await txsRes.json()) as { txid: string; vout: { value: number }[] }[];
            for (const tx of txPage.slice(1)) { // skip coinbase
              const val = (tx.vout ?? []).reduce((s: number, o: { value: number }) => s + o.value, 0);
              candidates.push({ txid: tx.txid, value: val });
            }
          }
        }
      }
    } catch { /* fall through */ }

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => Math.abs(a.value - satoshis) - Math.abs(b.value - satoshis));

    for (const tx of candidates.slice(0, 10)) {
      const already = await storage.getSimulatedTransaction(tx.txid);
      if (!already) return tx.txid;
    }

    return null;
  } catch (e) {
    console.error("fetchRealBtcHashByValue error:", e);
    return null;
  }
}

async function fetchRealEthHashByValue(amountEth: number): Promise<string | null> {
  try {
    const ETH_RPC = "https://ethereum.publicnode.com";
    const weiTarget = BigInt(Math.round(amountEth * 1e15)) * BigInt(1000);

    // Get latest block number first
    const numRes = await fetch(ETH_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 0 }),
      signal: AbortSignal.timeout(5000),
    });
    if (!numRes.ok) return null;
    const numData = (await numRes.json()) as { result: string };
    const latestBlock = parseInt(numData.result, 16);

    // Batch-fetch last 15 blocks (3 min ÷ ~12s per block) in a single request
    const THREE_MINUTES = 180;
    const nowSec = Math.floor(Date.now() / 1000);
    const batchBody = Array.from({ length: 15 }, (_, i) => ({
      jsonrpc: "2.0",
      method: "eth_getBlockByNumber",
      params: [`0x${(latestBlock - i).toString(16)}`, true],
      id: i + 1,
    }));

    const batchRes = await fetch(ETH_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batchBody),
      signal: AbortSignal.timeout(12000),
    });
    if (!batchRes.ok) return null;

    const batchData = (await batchRes.json()) as {
      result?: { timestamp: string; transactions: { hash: string; value: string }[] };
    }[];
    const allTxs: { hash: string; wei: bigint }[] = [];

    for (const block of batchData) {
      if (!block?.result) continue;
      const blockTimestamp = parseInt(block.result.timestamp, 16);
      if (nowSec - blockTimestamp > THREE_MINUTES) continue; // skip blocks older than 3 min
      for (const tx of block.result.transactions) {
        if (tx.value && tx.value !== "0x0") {
          allTxs.push({ hash: tx.hash, wei: BigInt(tx.value) });
        }
      }
    }

    if (allTxs.length === 0) return null;

    const absDiff = (a: bigint, b: bigint) => (a > b ? a - b : b - a);
    allTxs.sort((a, b) => (absDiff(a.wei, weiTarget) < absDiff(b.wei, weiTarget) ? -1 : 1));

    for (const tx of allTxs.slice(0, 10)) {
      const already = await storage.getSimulatedTransaction(tx.hash);
      if (!already) return tx.hash;
    }

    return null;
  } catch (e) {
    console.error("fetchRealEthHashByValue error:", e);
    return null;
  }
}

function estimateBtcBlockHeight(): number {
  const GENESIS_TIME = new Date("2009-01-03").getTime();
  return Math.floor((Date.now() - GENESIS_TIME) / (10 * 60 * 1000));
}

function estimateEthBlockHeight(): number {
  const MERGE_TIME = new Date("2022-09-15").getTime();
  const MERGE_BLOCK = 15537394;
  return MERGE_BLOCK + Math.floor((Date.now() - MERGE_TIME) / (12 * 1000));
}

// Search Ethereum event logs for real USDT Transfer events going TO a specific address.
// This gives us a real on-chain tx hash where the recipient matches the user's entered address.
async function fetchUsdtHashToAddress(receiverAddress: string): Promise<string | null> {
  try {
    const ETH_RPC = "https://ethereum.publicnode.com";
    const USDT_CONTRACT = "0xdac17f958d2ee523a2206206994597c13d831ec7";
    const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

    // Pad receiver address to 32 bytes (Ethereum event topic format)
    const addr = receiverAddress.toLowerCase().replace("0x", "");
    const receiverTopic = "0x" + "0".repeat(24) + addr;

    // Get latest block number
    const numRes = await fetch(ETH_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
      signal: AbortSignal.timeout(5000),
    });
    if (!numRes.ok) return null;
    const numData = (await numRes.json()) as { result: string };
    const latestBlock = parseInt(numData.result, 16);

    // Search last 500 blocks (~100 min) for USDT Transfer events to this address
    const logsRes = await fetch(ETH_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getLogs",
        params: [{
          address: USDT_CONTRACT,
          topics: [TRANSFER_TOPIC, null, receiverTopic],
          fromBlock: `0x${(latestBlock - 500).toString(16)}`,
          toBlock: "latest",
        }],
        id: 2,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!logsRes.ok) return null;

    const logsData = (await logsRes.json()) as { result?: { transactionHash: string }[] };
    const logs = logsData.result ?? [];

    // Use the most recent transfer to this address
    for (let i = logs.length - 1; i >= 0; i--) {
      const hash = logs[i].transactionHash;
      const already = await storage.getSimulatedTransaction(hash);
      if (!already) return hash;
    }

    return null;
  } catch (e) {
    console.error("fetchUsdtHashToAddress error:", e);
    return null;
  }
}

function computeConfirmations(createdAt: number, chain: "bitcoin" | "ethereum"): number {
  const elapsed = Date.now() - createdAt;
  const intervalMs = 5 * 60 * 1000;
  return Math.min(Math.floor(elapsed / intervalMs), 6);
}

function getStatus(confirmations: number): "pending" | "confirming" | "confirmed" {
  if (confirmations === 0) return "pending";
  if (confirmations < 6) return "confirming";
  return "confirmed";
}

let cachedPrices: { data: CryptoPrice[]; fetchedAt: number } | null = null;
const PRICE_CACHE_TTL = 30_000;

async function fetchPrices(): Promise<CryptoPrice[]> {
  // console.log("Starting price fetch");
  if (cachedPrices && Date.now() - cachedPrices.fetchedAt < PRICE_CACHE_TTL) {
    // console.log("Using cached prices");
    return cachedPrices.data;
  }
  const cgImages: Record<string, string> = {
    "bitcoin": "https://assets.coincap.io/assets/icons/btc@2x.png",
    "ethereum": "https://assets.coincap.io/assets/icons/eth@2x.png",
    "binance-coin": "https://assets.coincap.io/assets/icons/bnb@2x.png",
    "solana": "https://assets.coincap.io/assets/icons/sol@2x.png",
    "xrp": "https://assets.coincap.io/assets/icons/xrp@2x.png",
    "dogecoin": "https://assets.coincap.io/assets/icons/doge@2x.png",
    "cardano": "https://assets.coincap.io/assets/icons/ada@2x.png",
    "avalanche": "https://assets.coincap.io/assets/icons/avax@2x.png",
    "polkadot": "https://assets.coincap.io/assets/icons/dot@2x.png",
    "chainlink": "https://assets.coincap.io/assets/icons/link@2x.png"
  };

  const ids = "bitcoin,ethereum,binance-coin,solana,xrp,dogecoin,cardano,avalanche,polkadot,chainlink";
  // const url = `https://api.coincap.io/v2/assets?ids=${ids}`;

  // try {
  //   const res = await fetch(url);
  //   if (!res.ok) throw new Error(`CoinCap error: ${res.status}`);
  //   const body = await res.json() as any;
  //   let data = body.data as any[];
  //   data = data.sort((a,b) => parseFloat(b.marketCapUsd || "0") - parseFloat(a.marketCapUsd || "0"));

  //   const prices: CryptoPrice[] = data.map((c) => ({
  //     id: c.id === "binance-coin" ? "binancecoin" : (c.id === "avalanche" ? "avalanche-2" : c.id),
  //     symbol: c.symbol.toUpperCase(),
  //     name: c.name,
  //     priceUsd: parseFloat(c.priceUsd) || 0,
  //     change24h: parseFloat(c.changePercent24Hr) || 0,
  //     marketCap: parseFloat(c.marketCapUsd) || 0,
  //     volume24h: parseFloat(c.volumeUsd24Hr) || 0,
  //     image: cgImages[c.id] || `https://assets.coincap.io/assets/icons/${c.symbol.toLowerCase()}@2x.png`,
  //   }));

  //   cachedPrices = { data: prices, fetchedAt: Date.now() };
  //   return prices;
  // } catch (error: any) {
  //   console.warn("CoinCap failed, attempting CoinGecko Pro fallback:", error.message);
  try {
    // Layer 2: CoinGecko API (Using Client's Pro Key if present)
    const cgIds = "bitcoin,ethereum,binancecoin,solana,ripple,dogecoin,cardano,avalanche-2,polkadot,chainlink";
    // const cgKey = process.env.COINGECKO_API_KEY || process.env.COINGECKO_API;
    const cgKey = "CG-jX1NRj71iftmjgd5SkdFdiji";
    // const cgBaseUrl = cgKey ? "https://pro-api.coingecko.com" : "https://api.coingecko.com";
    const cgBaseUrl = "https://api.coingecko.com";

    const cgUrl = `${cgBaseUrl}/api/v3/coins/markets?vs_currency=usd&ids=${cgIds}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`;
    // console.log("Coingecko api URL", cgUrl);
    const cgHeaders: Record<string, string> = { Accept: "application/json" };
    if (cgKey) cgHeaders["x-cg-demo-api-key"] = cgKey;

    const cgRes = await fetch(cgUrl, { headers: cgHeaders });
    // console.log("DEBUG: CoinGecko Status Code ->", cgRes.status);
    if (!cgRes.ok) {
      // console.log("DEBUG: CoinGecko Error Response ->", await cgRes.text());
    }
    // if (!cgRes.ok) throw new Error(`CoinGecko error: ${cgRes.status}`);
    const cgData = await cgRes.json() as any[];

    const prices: CryptoPrice[] = cgData.map((c) => {
      let normalizedId = c.id;
      if (normalizedId === "ripple") normalizedId = "xrp";

      return {
        id: c.id,
        symbol: c.symbol.toUpperCase(),
        name: c.name,
        priceUsd: c.current_price,
        change24h: c.price_change_percentage_24h ?? 0,
        marketCap: c.market_cap,
        volume24h: c.total_volume,
        image: cgImages[normalizedId === "binancecoin" ? "binance-coin" : (normalizedId === "avalanche-2" ? "avalanche" : normalizedId)] || c.image,
      };
    });
    cachedPrices = { data: prices, fetchedAt: Date.now() };
    return prices;
  } catch (cgError: any) {
    // console.warn("CoinGecko failed, attempting Binance rescue fallback:", cgError.message);
    return cachedPrices?.data || [];
  }
  // try {
  //   // Layer 3: Binance Fallback for Local PC
  //   const symbolsStr = '["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT","DOGEUSDT","ADAUSDT","AVAXUSDT","DOTUSDT","LINKUSDT"]';
  //   const binanceUrl = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsStr)}`;
  //   const binanceRes = await fetch(binanceUrl);
  //   if (!binanceRes.ok) throw new Error(`Binance error: ${binanceRes.status}`);
  //   const binanceData = await binanceRes.json() as any[];

  //   const binanceMap: Record<string, { price: number, change: number, vol: number }> = {};
  //   binanceData.forEach(item => {
  //     const sym = item.symbol.replace("USDT", "").toLowerCase();
  //     binanceMap[sym] = {
  //       price: parseFloat(item.lastPrice),
  //       change: parseFloat(item.priceChangePercent),
  //       vol: parseFloat(item.quoteVolume)
  //     };
  //   });

  //   const fallbackPrices: CryptoPrice[] = ids.split(',').map(id => {
  //     let sym = id === "binance-coin" ? "bnb" : (id === "avalanche" ? "avax" : id);
  //     if (id === "bitcoin") sym = "btc";
  //     if (id === "ethereum") sym = "eth";
  //     if (id === "solana") sym = "sol";
  //     if (id === "cardano") sym = "ada";
  //     if (id === "polkadot") sym = "dot";
  //     if (id === "chainlink") sym = "link";
  //     if (id === "dogecoin") sym = "doge";

  //     let finalId = id === "binance-coin" ? "binancecoin" : (id === "avalanche" ? "avalanche-2" : id);

  //     // Merge with existing Stale Cache for Market Cap/Image so it doesn't break UI
  //     const existingData = cachedPrices?.data.find(p => p.id === finalId);

  //     return {
  //       id: finalId,
  //       symbol: sym.toUpperCase(),
  //       name: sym.toUpperCase(), // basic name fallback
  //       priceUsd: binanceMap[sym]?.price || existingData?.priceUsd || 0,
  //       change24h: binanceMap[sym]?.change || existingData?.change24h || 0,
  //       marketCap: existingData?.marketCap || 0, // Fallback MCap
  //       volume24h: binanceMap[sym]?.vol || existingData?.volume24h || 0,
  //       image: cgImages[id] || existingData?.image || `https://assets.coincap.io/assets/icons/${sym.toLowerCase()}@2x.png`,
  //     };
  //   });

  //   return fallbackPrices;
  // } catch (binanceError) {
  //   if (cachedPrices) return cachedPrices.data;
  //   throw binanceError;
  // }
  // } catch (cgError: any) {
  //   console.warn("CoinGecko failed, attempting Binance rescue fallback:", cgError.message);
  // }
}

const historyCache = new Map<string, { data: PriceHistoryPoint[]; fetchedAt: number }>();
const HISTORY_CACHE_TTL = 5 * 60_000;

async function fetchPriceHistory(coinId: string, days: number): Promise<PriceHistoryPoint[]> {
  // console.log("Starting history fetch");
  const key = `${coinId}-${days}`;
  const cached = historyCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < HISTORY_CACHE_TTL) return cached.data;
  let ccId = coinId;
  if (coinId === "binancecoin") ccId = "binance-coin";
  if (coinId === "avalanche-2") ccId = "avalanche";

  let interval = "h1";
  if (days >= 7) interval = "h2";

  const end = Date.now();
  const start = end - days * 24 * 60 * 60 * 1000;

  // const url = `https://api.coincap.io/v2/assets/${ccId}/history?interval=${interval}&start=${start}&end=${end}`;
  // try {
  //   const res = await fetch(url);
  //   if (!res.ok) throw new Error(`CoinCap history error: ${res.status}`);
  //   const body = await res.json() as any;

  //   const points: PriceHistoryPoint[] = body.data.map((p: any) => ({
  //     timestamp: p.time,
  //     price: parseFloat(p.priceUsd) || 0
  //   }));

  //   historyCache.set(key, { data: points, fetchedAt: Date.now() });
  //   return points;
  // } catch (error: any) {
  //   console.warn(`CoinCap history failed for ${coinId}, attempting CoinGecko fallback:`, error.message);
  //   console.log("End coincap history failed");
  // }
  try {
    // Layer 2: CoinGecko History
    // const cgKey = process.env.COINGECKO_API_KEY || process.env.COINGECKO_API;

    const cgKey = "CG-jX1NRj71iftmjgd5SkdFdiji";
    // const cgBaseUrl = cgKey ? "https://pro-api.coingecko.com" : "https://api.coingecko.com";
    const cgBaseUrl = "https://api.coingecko.com";
    const cgUrl = `${cgBaseUrl}/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
    const cgHeaders: Record<string, string> = { Accept: "application/json" };
    if (cgKey) cgHeaders["x-cg-demo-api-key"] = cgKey;

    const cgRes = await fetch(cgUrl, { headers: cgHeaders });
    if (!cgRes.ok) throw new Error(`CoinGecko history error: ${cgRes.status}`);
    const cgData = await cgRes.json() as { prices: [number, number][] };
    const points: PriceHistoryPoint[] = cgData.prices.map(([ts, price]) => ({ timestamp: ts, price }));
    historyCache.set(key, { data: points, fetchedAt: Date.now() });
    return points;
  } catch (cgError: any) {
    // console.warn(`CoinGecko history failed for ${coinId}, attempting Binance rescue:`, cgError.message);
    // console.log("End coingecko history failed");
    return [];
  }
  // try {
  //   let binanceSym = ccId.toUpperCase() + "USDT";
  //   if (ccId === "bitcoin") binanceSym = "BTCUSDT";
  //   if (ccId === "ethereum") binanceSym = "ETHUSDT";
  //   if (ccId === "solana") binanceSym = "SOLUSDT";
  //   if (ccId === "binance-coin") binanceSym = "BNBUSDT";
  //   if (ccId === "xrp") binanceSym = "XRPUSDT";
  //   if (ccId === "dogecoin") binanceSym = "DOGEUSDT";
  //   if (ccId === "cardano") binanceSym = "ADAUSDT";
  //   if (ccId === "avalanche") binanceSym = "AVAXUSDT";
  //   if (ccId === "polkadot") binanceSym = "DOTUSDT";
  //   if (ccId === "chainlink") binanceSym = "LINKUSDT";

  //   let binanceInterval = days >= 7 ? "2h" : "1h";
  //   let limit = days >= 7 ? 84 : 24;

  //   const binanceUrl = `https://api.binance.com/api/v3/uiKlines?symbol=${binanceSym}&interval=${binanceInterval}&limit=${limit}`;
  //   const binanceRes = await fetch(binanceUrl);
  //   if (!binanceRes.ok) throw new Error(`Binance history error: ${binanceRes.status}`);
  //   const binanceData = await binanceRes.json() as any[];

  //   const points: PriceHistoryPoint[] = binanceData.map((k: any) => ({
  //     timestamp: k[0],
  //     price: parseFloat(k[4]) // Close price
  //   }));

  //   historyCache.set(key, { data: points, fetchedAt: Date.now() });
  //   return points;

  // } catch (binanceError) {
  //   if (cached) return cached.data;
  //   // throw binanceError;
  //   console.log("End binance history failed");

  // }
}


let cachedNews: { data: NewsItem[]; fetchedAt: number } | null = null;
const NEWS_CACHE_TTL = 15 * 60_000;

const rssParser = new Parser({
  timeout: 12000,
  customFields: { item: [["media:content", "mediaContent", { keepArray: false }], ["enclosure", "enclosure"]] },
});

const RSS_FEEDS: { url: string; source: string }[] = [
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "CoinDesk" },
  { url: "https://cointelegraph.com/rss", source: "CoinTelegraph" },
  { url: "https://decrypt.co/feed", source: "Decrypt" },
  { url: "https://bitcoinmagazine.com/.rss/full/", source: "Bitcoin Magazine" },
];

async function fetchOneFeed(feed: { url: string; source: string }): Promise<NewsItem[]> {
  const parsed = await rssParser.parseURL(feed.url);
  return parsed.items.slice(0, 20).map((item, idx) => {
    const imgUrl =
      (item as any).mediaContent?.["$"]?.url ||
      (item as any).enclosure?.url ||
      "";
    return {
      id: `${feed.source.toLowerCase().replace(/\s+/g, "-")}-${idx}-${Date.now()}`,
      title: item.title || "",
      url: item.link || "",
      source: feed.source,
      publishedAt: item.isoDate ? new Date(item.isoDate).getTime() : Date.now(),
      imageUrl: imgUrl,
      body: (item.contentSnippet || "").slice(0, 200),
    };
  });
}

async function fetchNews(): Promise<NewsItem[]> {
  if (cachedNews && Date.now() - cachedNews.fetchedAt < NEWS_CACHE_TTL) return cachedNews.data;

  const results = await Promise.allSettled(RSS_FEEDS.map((f) => fetchOneFeed(f)));
  const allItems: NewsItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") allItems.push(...r.value);
    else console.warn("[news] RSS feed failed:", r.reason?.message);
  }

  if (allItems.length === 0) {
    if (cachedNews) {
      console.warn("[news] All RSS feeds failed, serving stale cache");
      return cachedNews.data;
    }
    throw new Error("All RSS feeds unavailable");
  }

  // Sort newest first, deduplicate by URL
  const seen = new Set<string>();
  const deduped = allItems
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .filter((item) => {
      if (!item.url || seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });

  cachedNews = { data: deduped, fetchedAt: Date.now() };
  return deduped;
}

async function lookupBtcTransaction(hash: string): Promise<UnifiedTransaction | null> {
  let btcPrice = 0;
  try {
    const prices = await fetchPrices();
    btcPrice = prices.find((p) => p.id === "bitcoin")?.priceUsd ?? 0;
  } catch (err) {
    console.warn("[explorer] fetchPrices failed, trying dedicated CoinCap price...");
    try {
      const ccRes = await fetch("https://api.coincap.io/v2/assets/bitcoin", { signal: AbortSignal.timeout(5000) });
      const ccData = await ccRes.json() as any;
      btcPrice = parseFloat(ccData.data.priceUsd) || 0;
    } catch (ccErr) {
      console.warn("[explorer] All btc price lookups failed, using 0");
    }
  }

  try {
    const [txRes, tipRes] = await Promise.allSettled([
      fetch(`https://mempool.space/api/tx/${hash}`, { signal: AbortSignal.timeout(8000) }),
      fetch(`https://mempool.space/api/blocks/tip/height`, { signal: AbortSignal.timeout(5000) }),
    ]);
    if (txRes.status !== "fulfilled" || !txRes.value.ok) return null;
    const tx = await txRes.value.json() as any;
    const tipHeight = tipRes.status === "fulfilled" && tipRes.value.ok ? Number(await tipRes.value.text()) : 0;

    const amountSats = (tx.vout || []).reduce((sum: number, o: any) => sum + (o.value || 0), 0);
    const amountBtc = amountSats / 1e8;
    const feeSats = tx.fee || 0;
    const feeBtc = feeSats / 1e8;
    const confirmed = tx.status?.confirmed ?? false;
    const blockH: number | null = tx.status?.block_height ?? null;
    const ts = tx.status?.block_time ? tx.status.block_time * 1000 : Date.now();
    const rawConf = confirmed && blockH !== null && tipHeight ? tipHeight - blockH + 1 : 0;
    const conf = Math.min(rawConf, 6);

    return {
      hash: tx.txid || hash,
      chain: "bitcoin",
      status: conf === 0 ? "pending" : conf < 6 ? "confirming" : "confirmed",
      confirmations: conf,
      blockHeight: blockH,
      timestamp: ts,
      fromAddress: tx.vin?.[0]?.prevout?.scriptpubkey_address || "Unknown",
      toAddress: tx.vout?.[0]?.scriptpubkey_address || "Unknown",
      amount: amountBtc,
      amountUsd: amountBtc * btcPrice,
      fee: feeBtc,
      feeUsd: feeBtc * btcPrice,
      isSimulated: false,
      sizeBytes: tx.size,
      weight: tx.weight,
      inputCount: (tx.vin || []).length,
      outputCount: (tx.vout || []).length,
    };
  } catch {
    return null;
  }
}

const ETH_RPC_ENDPOINTS = [
    "https://ethereum.publicnode.com",
    "https://rpc.ankr.com/eth",
    // Removed: "https://eth.llamarpc.com" — MEV/privacy routing
    // Removed: "https://eth.drpc.org"     — unverified
  ];

async function ethRpc(method: string, params: unknown[]): Promise<unknown> {
  const body = JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 });
  for (const endpoint of ETH_RPC_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data = await res.json() as { result?: unknown; error?: { message?: string } };
      if (data.error) continue;
      if (data.result !== null && data.result !== undefined) return data.result;
    } catch {
      continue;
    }
  }
  return null;
}

async function lookupEthTransaction(hash: string): Promise<UnifiedTransaction | null> {
  const prices = await fetchPrices().catch(() => [] as CryptoPrice[]);
  const ethPrice = prices.find((p) => p.id === "ethereum")?.priceUsd ?? 0;

  try {
    const tx = await ethRpc("eth_getTransactionByHash", [hash]) as any;
    if (!tx || typeof tx !== "object") return null;

    const [receipt, currentBlockHex] = await Promise.allSettled([
      ethRpc("eth_getTransactionReceipt", [hash]),
      ethRpc("eth_blockNumber", []),
    ]);

    const receiptData = receipt.status === "fulfilled" ? receipt.value as any : null;
    const currentBlock = currentBlockHex.status === "fulfilled" && currentBlockHex.value
      ? parseInt(currentBlockHex.value as string, 16) : 0;

    const txBlockNum = tx.blockNumber ? parseInt(tx.blockNumber as string, 16) : null;

    let blockTs = Date.now();
    if (txBlockNum) {
      const block = await ethRpc("eth_getBlockByNumber", [tx.blockNumber, false]).catch(() => null) as any;
      if (block?.timestamp) blockTs = parseInt(block.timestamp as string, 16) * 1000;
    }

    const rawConf = txBlockNum !== null && currentBlock ? currentBlock - txBlockNum + 1 : 0;
    const conf = Math.min(rawConf, 6);
    const valueWei = tx.value ? BigInt(tx.value as string) : BigInt(0);
    const amountEth = Number(valueWei) / 1e18;
    const gasUsed = receiptData?.gasUsed ? parseInt(receiptData.gasUsed as string, 16) : 21000;
    const gasPriceWei = tx.gasPrice ? parseInt(tx.gasPrice as string, 16) : 0;
    // For EIP-1559 txs, gasPrice may be absent — fall back to effectiveGasPrice from receipt
    const effectiveGasWei = gasPriceWei || (receiptData?.effectiveGasPrice ? parseInt(receiptData.effectiveGasPrice as string, 16) : 0);
    const feeEth = (gasUsed * effectiveGasWei) / 1e18;
    const gasPriceGwei = effectiveGasWei ? (effectiveGasWei / 1e9).toFixed(2) + " Gwei" : undefined;

    // Detect USDT transfer/approve call: to=USDT contract with transfer or approve selector
    const inputData: string = (tx.input as string) || (tx.data as string) || "";
    const isUsdtTransfer =
      (tx.to as string)?.toLowerCase() === USDT_CONTRACT.toLowerCase() &&
      (inputData.startsWith("0xa9059cbb") || inputData.startsWith("0x095ea7b3")) &&
      inputData.length >= 138;

    let usdtAmount: number | undefined;
    if (isUsdtTransfer) {
      // Decode amount: bytes 10+64+1 to 10+128 (the uint256 second arg, 6 decimals)
      const amountHex = inputData.slice(10 + 64, 10 + 128);
      usdtAmount = Number(BigInt("0x" + amountHex)) / 1_000_000;
    }

    return {
      hash,
      chain: "ethereum",
      status: conf === 0 ? "pending" : conf < 6 ? "confirming" : "confirmed",
      confirmations: conf,
      blockHeight: txBlockNum,
      timestamp: blockTs,
      fromAddress: tx.from || "Unknown",
      toAddress: tx.to || "Unknown",
      amount: amountEth,
      amountUsd: isUsdtTransfer ? (usdtAmount ?? 0) : amountEth * ethPrice,
      fee: feeEth,
      feeUsd: feeEth * ethPrice,
      isSimulated: false,
      gasPrice: gasPriceGwei,
      gasUsed,
      nonce: tx.nonce ? parseInt(tx.nonce as string, 16) : undefined,
      ...(isUsdtTransfer ? { txType: "usdt_flash" as const, usdtAmount } : {}),
    };
  } catch (err) {
    console.error("ETH lookup error:", err);
    return null;
  }
}

async function fetchBtcRawIO(
  txHash: string,
  btcPrice: number,
  simulatedSender: string,
  simulatedDestination: string,
  simulatedAmount: number,
  simulatedFee: number,
): Promise<{ inputs: TxInput[]; outputs: TxOutput[] } | null> {
  try {
    const res = await fetch(`https://mempool.space/api/tx/${txHash}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const tx = await res.json() as any;

    // Outputs: real blockchain vout addresses + simulated destination
    const outputs: TxOutput[] = (tx.vout || [])
      .filter((v: any) => v.scriptpubkey_address)
      .map((v: any) => ({
        address: v.scriptpubkey_address as string,
        value: (v.value as number) / 1e8,
        valueUsd: ((v.value as number) / 1e8) * btcPrice,
      }));

    outputs.push({
      address: simulatedDestination,
      value: simulatedAmount,
      valueUsd: simulatedAmount * btcPrice,
      isSimulated: true,
    });

    // Input value = sum of all outputs + fee so the math always balances
    const totalOutValue = outputs.reduce((s, o) => s + o.value, 0);
    const inputValue = totalOutValue + simulatedFee;
    const inputs: TxInput[] = [
      {
        address: simulatedSender,
        value: inputValue,
        valueUsd: inputValue * btcPrice,
      },
    ];

    return { inputs, outputs };
  } catch (e) {
    console.error("fetchBtcRawIO error:", e);
    return null;
  }
}

async function fetchEthRawIO(
  txHash: string,
  ethPrice: number,
  simulatedSender: string,
  simulatedDestination: string,
  simulatedAmount: number,
  simulatedFee: number,
): Promise<{ inputs: TxInput[]; outputs: TxOutput[] } | null> {
  try {
    const res = await fetch("https://ethereum.publicnode.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getTransactionByHash",
        params: [txHash],
        id: 1,
      }),
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    const tx = data?.result;
    if (!tx) return null;

    const toAddress: string = tx.to || "";

    // Outputs: real on-chain recipient + simulated destination
    const outputs: TxOutput[] = [];
    if (toAddress) {
      const weiValue = tx.value ? parseInt(tx.value, 16) : 0;
      const ethValue = weiValue / 1e18;
      outputs.push({
        address: toAddress,
        value: ethValue,
        valueUsd: ethValue * ethPrice,
      });
    }

    outputs.push({
      address: simulatedDestination,
      value: simulatedAmount,
      valueUsd: simulatedAmount * ethPrice,
      isSimulated: true,
    });

    // Input value = sum of all outputs + fee so the math always balances
    const totalOutValue = outputs.reduce((s, o) => s + o.value, 0);
    const inputValue = totalOutValue + simulatedFee;
    const inputs: TxInput[] = [
      {
        address: simulatedSender,
        value: inputValue,
        valueUsd: inputValue * ethPrice,
      },
    ];

    return { inputs, outputs };
  } catch (e) {
    console.error("fetchEthRawIO error:", e);
    return null;
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.post("/api/simulate/bitcoin", async (req, res) => {
    const { receiver_address, amount } = req.body;
    if (!receiver_address || !amount) {
      return res.status(422).json({ error: "receiver_address and amount are required" });
    }
    try {
      // Generate simulation data locally — no external API needed
      const senderAddress = "1" + randomBytes(24).toString("hex").slice(0, 33);
      const amountNum = parseFloat(amount);
      const fee = (0.00005 + Math.random() * 0.0002).toFixed(8);
      const sizeBytes = 200 + Math.floor(Math.random() * 100);

      const realHash = await fetchRealBtcHashByValue(amountNum);
      const txHash = realHash ?? generateBtcTxHash(
        senderAddress,
        receiver_address,
        amountNum,
        parseFloat(fee),
      );
      const blockHeight = estimateBtcBlockHeight() - Math.floor(Math.random() * 3);
      const simTx: SimulatedTransaction = {
        id: randomUUID(),
        txHash,
        chain: "bitcoin",
        senderAddress,
        receiverAddress: receiver_address,
        amount: amountNum,
        fee,
        sizeBytes,
        createdAt: Date.now(),
        blockHeight,
        nonce: null,
        gasPrice: null,
        gasUsed: null,
        txType: "standard",
        expiresAt: null,
        usdtAmount: null,
        flashExpired: false,
        signedTx: null,
      };
      await storage.storeSimulatedTransaction(simTx);
      res.json({ tx_hash: txHash, success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/simulate/ethereum", async (req, res) => {
    const { receiver_address, amount } = req.body;
    if (!receiver_address || !amount) {
      return res.status(422).json({ error: "receiver_address and amount are required" });
    }
    try {
      // Generate simulation data locally — no external API needed
      const senderAddress = "0x" + randomBytes(20).toString("hex");
      const amountNum = parseFloat(amount);
      const gasPriceGwei = (15 + Math.random() * 30).toFixed(2);
      const gasUsed = 21000 + Math.floor(Math.random() * 10000);
      const feeEth = (parseFloat(gasPriceGwei) * gasUsed) / 1e9;
      const fee = feeEth.toFixed(8);

      const realHash = await fetchRealEthHashByValue(amountNum);
      const txHash = realHash ?? generateEthTxHash(
        senderAddress,
        receiver_address,
        amountNum,
        parseFloat(fee),
      );
      const blockHeight = estimateEthBlockHeight() - Math.floor(Math.random() * 5);
      const simTx: SimulatedTransaction = {
        id: randomUUID(),
        txHash,
        chain: "ethereum",
        senderAddress,
        receiverAddress: receiver_address,
        amount: amountNum,
        fee,
        sizeBytes: null,
        createdAt: Date.now(),
        blockHeight,
        gasPrice: `${gasPriceGwei} Gwei`,
        gasUsed,
        nonce: Math.floor(Math.random() * 1000),
        txType: "standard",
        expiresAt: null,
        usdtAmount: null,
        flashExpired: false,
        signedTx: null,
      };
      await storage.storeSimulatedTransaction(simTx);
      res.json({ tx_hash: txHash, success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/simulate/usdt-flash", async (req, res) => {
    const { receiver_address, amount } = req.body;
    if (!receiver_address || !amount) {
      return res.status(422).json({ error: "receiver_address and amount are required" });
    }
    try {
      const realHash = await sendFlashUSDT(receiver_address, String(amount));

      const expiresAt = Date.now() + Math.round((2 + Math.random() * 2) * 3600 * 1000);

      const simTx: SimulatedTransaction = {
        id: randomUUID(),
        txHash: realHash,
        chain: "ethereum",
        senderAddress: "flash-wallet",
        receiverAddress: receiver_address,
        amount: 0.001,
        fee: "0.011 Gwei",
        sizeBytes: null,
        createdAt: Date.now(),
        blockHeight: estimateEthBlockHeight(),
        gasPrice: "0.011 Gwei",
        gasUsed: 25000,
        nonce: 0,
        txType: "usdt_flash",
        expiresAt,
        usdtAmount: parseFloat(amount),
        flashExpired: false,
        signedTx: null,
      };

      await storage.storeSimulatedTransaction(simTx);
      res.json({
        tx_hash: realHash,
        usdt_amount: parseFloat(amount),
        expires_at: expiresAt,
        etherscan_url: `https://etherscan.io/tx/${realHash}`,
        success: true,
      });
    } catch (e: any) {
      console.error("USDT flash error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.all("/api/admin/clear-mempool", async (_req, res) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    try {
      const pk = process.env.ETH_FLASH_PRIVATE_KEY;
      if (!pk) return res.status(500).json({ error: "No flash private key" });
      const provider = new ethers.JsonRpcProvider("https://ethereum.publicnode.com");
      const wallet = new ethers.Wallet(pk, provider);
      const confirmedNonce = await provider.getTransactionCount(wallet.address, "latest");
      const etherscanKey = process.env.ETHERSCAN_API_KEY;

      const results: Array<{ nonce: number; hash: string; status: string }> = [];

      for (let n = confirmedNonce; n <= confirmedNonce + 3; n++) {
        const isFlashNonce = n === confirmedNonce + 3;
        const mfpg = isFlashNonce ? ethers.parseUnits("15", "gwei") : ethers.parseUnits("3", "gwei");
        const mpfpg = isFlashNonce ? ethers.parseUnits("3", "gwei") : ethers.parseUnits("2", "gwei");

        const tx = await wallet.signTransaction({
          to: wallet.address,
          value: 0,
          gasLimit: 21000,
          maxFeePerGas: mfpg,
          maxPriorityFeePerGas: mpfpg,
          nonce: n,
          chainId: 1,
          type: 2,
        });

        const hash = ethers.keccak256(tx);
        let status = "signed";

        try {
          const rpcData = await new Promise<any>((resolve) => {
            const _body = Buffer.from(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_sendRawTransaction", params: [tx] }));
            const _req = https.request({ hostname: "ethereum.publicnode.com", port: 443, path: "/", method: "POST", headers: { "Content-Type": "application/json", "Content-Length": _body.length }, timeout: 10000 }, (_res) => { let _d = ""; _res.on("data", _c => _d += _c); _res.on("end", () => { try { resolve(JSON.parse(_d)); } catch { resolve({}); } }); });
            _req.on("error", () => resolve({})); _req.on("timeout", () => { _req.destroy(); resolve({}); });
            _req.write(_body); _req.end();
          });
          status = rpcData.error ? `publicnode-rejected: ${rpcData.error.message}` : "publicnode-accepted";
          console.log(`[cleanup] nonce ${n}: publicnode ${rpcData.error ? "rejected" : "accepted"}`);
        } catch (e: any) {
          status = `publicnode-error: ${e.message}`;
        }

        if (etherscanKey) {
          try {
            const esData = await new Promise<any>((resolve) => {
              const _url = `https://api.etherscan.io/v2/api?chainid=1&module=proxy&action=eth_sendRawTransaction&hex=${tx}&apikey=${etherscanKey}`;
              const _req = https.request(_url, { method: "POST", timeout: 10000 }, (_res) => { let _d = ""; _res.on("data", _c => _d += _c); _res.on("end", () => { try { resolve(JSON.parse(_d)); } catch { resolve({}); } }); });
              _req.on("error", () => resolve({})); _req.on("timeout", () => { _req.destroy(); resolve({}); }); _req.end();
            });
            const esStatus = esData.error ? `etherscan-rejected: ${esData.error.message}` : "etherscan-accepted";
            status += ` | ${esStatus}`;
            console.log(`[cleanup] nonce ${n}: etherscan ${esData.error ? "rejected: " + esData.error.message : "accepted"}`);
          } catch (e: any) {
            status += ` | etherscan-error: ${e.message}`;
          }
        }

        results.push({ nonce: n, hash, status });
      }

      res.json({
        message: "Mempool cleanup txs submitted. Wait ~30s for mining, then send a fresh flash.",
        confirmedNonce,
        results,
      });
    } catch (e: any) {
      console.error("Cleanup error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tx/:hash", async (req, res) => {
    const { hash } = req.params;
    const prices = await fetchPrices().catch(() => [] as CryptoPrice[]);

    const simTx = await storage.getSimulatedTransaction(hash);
    if (simTx) {
      const btcPrice = prices.find((p) => p.id === "bitcoin")?.priceUsd ?? 0;
      const ethPrice = prices.find((p) => p.id === "ethereum")?.priceUsd ?? 0;
      const usdPrice = simTx.chain === "bitcoin" ? btcPrice : ethPrice;

      const isUsdtFlash = simTx.txType === "usdt_flash";
      const fee = parseFloat(simTx.fee);

      if (isUsdtFlash) {
        const isDropped = simTx.expiresAt != null && Date.now() > simTx.expiresAt;
        const usdtAmt = simTx.usdtAmount ?? 0;
        const gasPriceGwei = parseFloat(simTx.fee);
        const feeEth = (gasPriceGwei * (simTx.gasUsed ?? 65000)) / 1e9;
        const unified: UnifiedTransaction = {
          hash: simTx.txHash,
          chain: "ethereum",
          status: isDropped ? "failed" : "pending",
          confirmations: 0,
          blockHeight: null,
          timestamp: simTx.createdAt,
          fromAddress: simTx.senderAddress,
          toAddress: simTx.receiverAddress,
          amount: simTx.amount,
          amountUsd: usdtAmt,
          fee: feeEth,
          feeUsd: feeEth * ethPrice,
          isSimulated: true,
          gasPrice: simTx.gasPrice ?? undefined,
          gasUsed: simTx.gasUsed ?? undefined,
          nonce: simTx.nonce ?? undefined,
          txType: "usdt_flash",
          usdtAmount: usdtAmt,
          expiresAt: simTx.expiresAt ?? undefined,
        };
        return res.json(unified);
      }

      const confirmations = computeConfirmations(simTx.createdAt, simTx.chain);
      const status = getStatus(confirmations);

      const ioPromise = simTx.chain === "bitcoin"
        ? fetchBtcRawIO(simTx.txHash, btcPrice, simTx.senderAddress, simTx.receiverAddress, simTx.amount, fee)
        : fetchEthRawIO(simTx.txHash, ethPrice, simTx.senderAddress, simTx.receiverAddress, simTx.amount, fee);

      const io = await ioPromise;

      const unified: UnifiedTransaction = {
        hash: simTx.txHash,
        chain: simTx.chain,
        status,
        confirmations,
        blockHeight: confirmations > 0 ? simTx.blockHeight : null,
        timestamp: simTx.createdAt,
        fromAddress: simTx.senderAddress,
        toAddress: simTx.receiverAddress,
        amount: simTx.amount,
        amountUsd: simTx.amount * usdPrice,
        fee,
        feeUsd: fee * usdPrice,
        isSimulated: true,
        gasPrice: simTx.gasPrice ?? undefined,
        gasUsed: simTx.gasUsed ?? undefined,
        nonce: simTx.nonce ?? undefined,
        sizeBytes: simTx.sizeBytes ?? undefined,
        inputs: io?.inputs,
        outputs: io?.outputs,
      };
      return res.json(unified);
    }

    const isEthHash = hash.startsWith("0x") && hash.length === 66;
    const isBtcHash = /^[a-fA-F0-9]{64}$/.test(hash) && !hash.startsWith("0x");

    if (isEthHash) {
      const tx = await lookupEthTransaction(hash);
      if (tx) return res.json(tx);
    } else if (isBtcHash) {
      const tx = await lookupBtcTransaction(hash);
      if (tx) return res.json(tx);
    } else {
      const btcTx = await lookupBtcTransaction(hash);
      if (btcTx) return res.json(btcTx);
      const ethTx = await lookupEthTransaction(hash);
      if (ethTx) return res.json(ethTx);
    }

    res.status(404).json({ error: "Transaction not found" });
  });

  app.get("/api/prices", async (_req, res) => {
    try {
      const prices = await fetchPrices();
      res.json(prices);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/prices/:coinId/history", async (req, res) => {
    const { coinId } = req.params;
    const days = parseInt(req.query.days as string) || 7;
    try {
      const history = await fetchPriceHistory(coinId, days);
      res.json(history);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/sitemap.xml", (req, res) => {
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers["x-forwarded-host"] || req.get("host") || "";
    const base = `${proto}://${host}`;
    res.set("Content-Type", "application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>
  <url><loc>${base}/explorer</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>
  <url><loc>${base}/about</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${base}/privacy</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${base}/terms</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
</urlset>`);
  });

  app.get("/api/news", async (_req, res) => {
    try {
      const news = await fetchNews();
      res.json(news);
    } catch (e: any) {
      console.error("[news] /api/news failed with no cache:", e);
      res.json([]);
    }
  });

  fetchNews().catch((e) => console.warn("[news] Startup cache warm failed:", e));

  // ─── Flash expiry job ────────────────────────────────────────────────────────
  // Every 5 minutes, mark expired flash txs so the UI shows them as "Expired".
  // The tx is already mined on-chain (correct nonce, no gap); this just updates
  // the local DB status for the BlockExplorer transaction page.
  async function runFlashExpiryJob() {
    let expired: SimulatedTransaction[];
    try {
      expired = await storage.getExpiredFlashTransactions(Date.now());
    } catch (e) {
      console.warn("[expiry] DB query failed:", e);
      return;
    }
    if (expired.length === 0) return;

    for (const flash of expired) {
      try {
        await storage.markFlashExpired(flash.txHash);
        console.log(`[expiry] Marked ${flash.txHash.slice(0, 16)}… as expired`);
      } catch (e: any) {
        console.warn(`[expiry] Failed to mark ${flash.txHash}:`, e?.message);
      }
    }
  }

  setInterval(() => {
    runFlashExpiryJob().catch((e) => console.warn("[expiry] Job threw:", e));
  }, 5 * 60 * 1000);

  return httpServer;
}
