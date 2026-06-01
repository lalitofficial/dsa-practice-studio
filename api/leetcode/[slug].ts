import { withAuth, ensureMethod } from "../_lib/http";

// GET /api/leetcode/:slug -> the public problem statement from LeetCode's
// GraphQL API. Done server-side to avoid browser CORS. Cached per warm
// instance since statements are effectively static.
const cache = new Map<string, unknown>();

const QUERY = `query q($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionId
    title
    difficulty
    content
    topicTags { name }
  }
}`;

export default withAuth(async ({ req, res }) => {
  if (!ensureMethod(req, res, ["GET"])) return;
  const slug = String(req.query.slug || "").trim();
  if (!slug) {
    res.status(400).json({ error: "Missing slug" });
    return;
  }
  if (cache.has(slug)) {
    res.json(cache.get(slug));
    return;
  }

  try {
    const resp = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        referer: `https://leetcode.com/problems/${slug}/`,
        "user-agent": "Mozilla/5.0 (compatible; DSAStudio/1.0)",
      },
      body: JSON.stringify({ query: QUERY, variables: { titleSlug: slug } }),
    });
    if (!resp.ok) {
      res.status(502).json({ error: "LeetCode request failed" });
      return;
    }
    const json = (await resp.json()) as {
      data?: { question?: { title?: string; difficulty?: string; content?: string; topicTags?: { name: string }[] } };
    };
    const q = json?.data?.question;
    if (!q) {
      res.status(404).json({ error: "Statement not found" });
      return;
    }
    const payload = {
      title: q.title || "",
      difficulty: q.difficulty || "",
      content: q.content || "",
      tags: Array.isArray(q.topicTags) ? q.topicTags.map((t) => t.name) : [],
      premium: !q.content, // premium problems return null content
    };
    cache.set(slug, payload);
    res.json(payload);
  } catch {
    res.status(502).json({ error: "LeetCode unavailable" });
  }
});
