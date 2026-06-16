import * as cheerio from "cheerio";
import { withAuth, ensureMethod } from "./_lib/http";

// GET /api/reader?url=<geeksforgeeks article> -> { statementHtml, solutionHtml }.
// Splits the article at the first "approach/solution" heading so the problem
// statement and the solution can live in separate panels. Restricted to
// geeksforgeeks.org articles (SSRF guard; practice.* is a client-rendered SPA).
const SOL =
  /approach|solution|algorithm|implementation|naive|efficient|optimal|pseudo|intuition|\bsteps?\b|\bcode\b|\busing\b|method/i;

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

    const full = el.html() || "";
    // Split at the first heading that looks like a solution/approach.
    const solHead = el
      .find("h1,h2,h3,h4")
      .toArray()
      .find((n) => SOL.test($(n).text().trim()));
    let statementHtml = full;
    let solutionHtml = "";
    if (solHead) {
      const headingHtml = $.html(solHead);
      const pos = full.indexOf(headingHtml);
      if (pos > 0) {
        statementHtml = full.slice(0, pos);
        solutionHtml = full.slice(pos);
      }
    }
    const title = ($("h1").first().text() || $("title").text() || "").trim();
    res.setHeader("Cache-Control", "private, max-age=86400");
    res.json({ title, statementHtml, solutionHtml, source: url });
  } catch (err) {
    res.status(502).json({ error: "Reader failed", detail: String((err as Error)?.message).slice(0, 200) });
  }
});
