const PLATFORMS = [
  {
    name: 'leetcode',
    pattern: /leetcode\.com\/problems\/([^/]+)/,
    extractName: (url, title) => {
      const match = url.match(/leetcode\.com\/problems\/([^/]+)/);
      if (match) {
        return match[1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      }
      return title;
    },
  },
  {
    name: 'codeforces',
    pattern: /codeforces\.com\/(problemset\/problem|contest)\/[\d]+\/problem\//,
    extractName: (_url, title) => title.replace(' - Codeforces', '').trim(),
  },
  {
    name: 'gfg',
    pattern: /geeksforgeeks\.org\/problems\/([^/]+)/,
    extractName: (url, title) => {
      const match = url.match(/problems\/([^/]+)/);
      if (match) {
        return match[1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      }
      return title;
    },
  },
  {
    name: 'codechef',
    pattern: /codechef\.com\/problems\/([^/]+)/,
    extractName: (_url, title) => title.replace(' | CodeChef', '').trim(),
  },
  {
    name: 'neetcode',
    pattern: /neetcode\.io/,
    extractName: (_url, title) => title.replace(' - NeetCode', '').trim(),
  },
];

export function detectPlatform(url, title) {
  for (const p of PLATFORMS) {
    if (p.pattern.test(url)) {
      return {
        platform: p.name,
        name: p.extractName(url, title),
      };
    }
  }
  return { platform: 'other', name: title };
}