import * as cheerio from "cheerio";
import { withAuth, ensureMethod } from "./_lib/http";

// GET /api/reader?url=<geeksforgeeks article> -> extracted article HTML.
// Restricted to geeksforgeeks.org article pages (SSRF guard; practice.* is a
// client-rendered SPA with no server content). The client sanitizes the HTML.
function allowed(u: string): boolean {
  try {
    const url = new URL(u);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith("geeksforgeeks.org") &&
      !url.hostname.startsWith("practice.")
    );
  } catch {
    return false;
  }
}

export default withAuth(async ({ req, res }) => {
  if (!ensureMethod(req, res, ["GET"])) return;
  const url = String(req.query.url || "");
  if (!allowed(url)) {
    res.status(400).json({ error: "Only geeksforgeeks.org articles are supported" });
    return;
  }
  try {
    const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; DSAStudio/1.0)" } });
    if (!r.ok) {
      res.status(502).json({ error: "Fetch failed" });
      return;
    }
    const $ = cheerio.load(await r.text());
    let el = $(".article--viewer_content").first();
    if (!el.length) el = $(".text").first();
    if (!el.length) {
      res.status(404).json({ error: "No readable content" });
      return;
    }
    el.find(
      "script,style,iframe,ins,noscript,nav,header,footer,form,button,.gfg-ad,.three_dots,.article-meta,.articleHead,.improved",
    ).remove();
    const html = el.html() || "";
    const title = ($("h1").first().text() || $("title").text() || "").trim();
    res.setHeader("Cache-Control", "private, max-age=86400");
    res.json({ html, title, source: url });
  } catch (err) {
    res.status(502).json({ error: "Reader failed", detail: String((err as Error)?.message).slice(0, 200) });
  }
});
