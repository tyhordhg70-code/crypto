import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html — inject absolute og:image URL so social crawlers work
  app.use("/{*path}", (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    let html = fs.readFileSync(indexPath, "utf-8");

    const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers["x-forwarded-host"] || req.get("host") || "";
    const baseUrl = `${proto}://${host}`;

    html = html
      .replace(/content="\/og-image-v4\.png"/g, `content="${baseUrl}/og-image-v4.png"`)
      .replace(/<meta property="og:url"[^>]*>/g, "")
      .replace(
        '<meta property="og:type"',
        `<meta property="og:url" content="${baseUrl}" />\n    <meta property="og:type"`,
      )
      .replace(/"url": "\/"/g, `"url": "${baseUrl}/"`)
      .replace(/"target": "\/tx\/{search_term}"/g, `"target": "${baseUrl}/tx/{search_term}"`)
      .replace(/Sitemap: \/sitemap\.xml/, `Sitemap: ${baseUrl}/sitemap.xml`);

    res.set({ "Content-Type": "text/html" }).send(html);
  });
}
