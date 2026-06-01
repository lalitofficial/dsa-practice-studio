// Extract the problem slug from a LeetCode URL.
// e.g. https://leetcode.com/problems/two-sum/ -> "two-sum"
export function leetcodeSlug(url: string): string {
  const match = url.match(/leetcode\.com\/problems\/([^/?#]+)/);
  return match ? match[1] : "";
}
