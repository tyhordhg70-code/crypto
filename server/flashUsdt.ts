import { ethers } from "ethers";
  import https from "https";

  // Read-only provider (for getBlock, getTransactionCount). publicnode is fine for reads.
  const READ_PROVIDER_URL = "https://ethereum.publicnode.com";
  const provider = new ethers.JsonRpcProvider(READ_PROVIDER_URL);

  // Broadcast endpoints — alternative public RPCs that should NOT forward to Blink/MEV relays.
  // publicnode is intentionally excluded because logs prove it forwards underpriced txs to Blink Protect.
  const BROADCAST_RPCS = [
    { url: "https://eth.merkle.io", label: "merkle" },
    { url: "https://eth-mainnet.public.blastapi.io", label: "blast" },
    { url: "https://rpc.eth.gateway.fm", label: "gatewayfm" },
    { url: "https://eth.drpc.org", label: "drpc" }
  ];

  const USDT = "0xdac17f958d2ee523a2206206994597c13d831ec7";

  const iface = new ethers.Interface([
    "function transfer(address to, uint256 amount)"
  ]);

  function getWallet() {
    return new ethers.Wallet(process.env.ETH_FLASH_PRIVATE_KEY!, provider);
  }

  function httpsPost(url: string, body: string, contentType = "application/json"): Promise<{ ok: boolean; data: any; raw?: string }> {
    return new Promise((resolve) => {
      const u = new URL(url);
      const bodyBuf = Buffer.from(body);
      const req = https.request(
        {
          hostname: u.hostname,
          port: 443,
          path: (u.pathname || "/") + (u.search || ""),
          method: "POST",
          headers: {
            "Content-Type": contentType,
            "Content-Length": bodyBuf.length
          },
          timeout: 15000
        },
        (res) => {
          let d = "";
          res.on("data", (c) => (d += c));
          res.on("end", () => {
            try { resolve({ ok: true, data: JSON.parse(d), raw: d }); }
            catch { resolve({ ok: true, data: null, raw: d }); }
          });
        }
      );
      req.on("error", () => resolve({ ok: false, data: null }));
      req.on("timeout", () => { req.destroy(); resolve({ ok: false, data: null }); });
      req.write(bodyBuf);
      req.end();
    });
  }

  async function sendToRpc(rpcUrl: string, signedTx: string, label: string) {
    const body = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_sendRawTransaction",
      params: [signedTx]
    });
    const r = await httpsPost(rpcUrl, body);
    if (!r.ok) { console.log(`[flash] ${label}: network error`); return false; }
    if (r.data?.error) { console.log(`[flash] ${label}: rejected (${r.data.error.message})`); return false; }
    if (r.data?.result) { console.log(`[flash] ${label}: accepted`); return true; }
    console.log(`[flash] ${label}: unexpected response (${r.raw?.slice(0, 120)})`);
    return false;
  }

  async function sendToEtherscan(signedTx: string) {
    const key = process.env.ETHERSCAN_API_KEY;
    if (!key) { console.log("[flash] etherscan: skipped (no ETHERSCAN_API_KEY)"); return false; }
    const url = `https://api.etherscan.io/v2/api?chainid=1&module=proxy&action=eth_sendRawTransaction&hex=${signedTx}&apikey=${key}`;
    const r = await httpsPost(url, "");
    if (!r.ok) { console.log("[flash] etherscan: network error"); return false; }
    if (r.data?.error) { console.log(`[flash] etherscan: rejected (${r.data.error.message ?? JSON.stringify(r.data.error)})`); return false; }
    if (r.data?.result) { console.log("[flash] etherscan: accepted"); return true; }
    console.log(`[flash] etherscan: unexpected response (${r.raw?.slice(0, 120)})`);
    return false;
  }

  async function broadcastRawTx(signedTx: string) {
    const tasks = [
      ...BROADCAST_RPCS.map(rpc => sendToRpc(rpc.url, signedTx, rpc.label)),
      sendToEtherscan(signedTx)
    ];
    const results = await Promise.all(tasks);
    const accepted = results.filter(Boolean).length;
    const total = tasks.length;
    console.log(`[flash] ${accepted}/${total} endpoints accepted`);
  }

  async function cancelPending(wallet: ethers.Wallet) {
    const latestNonce = await provider.getTransactionCount(wallet.address, "latest");
    const pendingNonce = await provider.getTransactionCount(wallet.address, "pending");

    if (pendingNonce > latestNonce) {
      console.log(`[flash] found pending tx at nonce ${latestNonce}, sending cancellation...`);
      const block = await provider.getBlock("latest");

      const cancelTx = await wallet.sendTransaction({
        to: wallet.address,
        value: 0,
        nonce: latestNonce,
        gasLimit: 21000,
        maxFeePerGas: block!.baseFeePerGas! * 3n,
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei")
      });

      console.log(`[flash] cancel tx broadcast: ${cancelTx.hash}`);
      const receipt = await cancelTx.wait(1);
      console.log(`[flash] cancel tx mined in block ${receipt!.blockNumber}`);
    }
  }

  export async function sendFlashUSDT(to: string, amount: string) {
    const wallet = getWallet();

    await cancelPending(wallet);

    const block = await provider.getBlock("latest");
    const baseFee = block!.baseFeePerGas!;
    const targetMaxFee = (baseFee * 60n) / 100n;
    const floor = ethers.parseUnits("0.011", "gwei");
    const maxFeePerGas = targetMaxFee < floor ? floor : targetMaxFee;
    const maxPriorityFeePerGas = ethers.parseUnits("0.01", "gwei");

    const data = iface.encodeFunctionData("transfer", [
      to,
      ethers.parseUnits(amount, 6)
    ]);

    const nonce = await provider.getTransactionCount(wallet.address, "latest");

    console.log(
      `[flash] baseFee=${(Number(baseFee) / 1e9).toFixed(4)} Gwei, ` +
      `maxFeePerGas=${(Number(maxFeePerGas) / 1e9).toFixed(4)} Gwei, nonce=${nonce}`
    );

    const tx = {
      to: USDT,
      data,
      gasLimit: 25000,
      maxFeePerGas,
      maxPriorityFeePerGas,
      nonce,
      type: 2,
      chainId: 1
    };

    const signedTx = await wallet.signTransaction(tx);
    const hash = ethers.keccak256(signedTx);

    await broadcastRawTx(signedTx);

    console.log(`[flash] tx hash: ${hash}`);
    return hash;
  }
  