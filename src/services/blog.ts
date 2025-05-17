import type { Blog } from "../types.ts";
import { getDataWithCache } from "../utils/cache.ts";

/**
 * Fetch blogs from the API
 */
export const fetchBlogs = async (): Promise<Blog[]> => {
  const response = await fetch("https://blog.sakupi01.com/blog.json");
  if (!response.ok) {
    throw new Error(`Failed to fetch articles: ${response.statusText}`);
  }

  const data = await response.json();
  return data as Blog[];
};

/**
 * Get blogs with caching
 */
export const getBlogs = (fixtures?: Blog[]) => getDataWithCache("blogs", fetchBlogs, fixtures);

/**
 * Search configuration
 */
const FIELD_WEIGHTS = {
  title: 5,
  tags: 4,
  description: 3,
  content: 2,
  link: 1,
};

/**
 * Parse search query into keywords and exact phrases
 */
export const parseQuery = (query: string) => {
  const exactPhrases: string[] = [];
  const processedQuery = query.trim().replace(/"([^"]+)"/g, (_, phrase) => {
    exactPhrases.push(phrase.toLowerCase());
    return "";
  }).trim();

  const keywords = processedQuery
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => word.toLowerCase());

  return { keywords, exactPhrases };
};

/**
 * Search blogs based on query
 */
export const searchBlogs = async (
  query: string,
  limit: number,
  offset: number,
  order: "asc" | "desc",
  fixtures?: Blog[],
) => {
  const blogs = await getBlogs(fixtures);
  const { keywords, exactPhrases } = parseQuery(query);
  const isEmptyQuery = keywords.length === 0 && exactPhrases.length === 0;

  // Score each blog based on search criteria
  const scoredItems = blogs.map((item) => {
    if (isEmptyQuery) return { item, score: 1 };

    const fields = {
      title: item.title.toLowerCase(),
      description: (item.description || "").toLowerCase(),
      content: (item.content || "").toLowerCase(),
      link: item.link.toLowerCase(),
      tags: (item.tags || []).join(" ").toLowerCase(),
    };

    let score = 0;

    // Score exact phrases
    for (const phrase of exactPhrases) {
      for (const [field, text] of Object.entries(fields) as [keyof typeof fields, string][]) {
        if (text.includes(phrase)) {
          score += FIELD_WEIGHTS[field] * 2;
        }
      }
    }

    // Score keywords
    for (const keyword of keywords) {
      for (const [field, text] of Object.entries(fields) as [keyof typeof fields, string][]) {
        const wordBoundaryRegex = new RegExp(`\\b${keyword}\\b`, "i");
        if (wordBoundaryRegex.test(text)) {
          score += FIELD_WEIGHTS[field];
        } else if (text.includes(keyword)) {
          score += FIELD_WEIGHTS[field] * 0.5;
        }
      }
    }

    return { item, score };
  });

  // Filter and sort results
  const filteredItems = scoredItems
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      // First sort by score
      if (b.score !== a.score) return b.score - a.score;

      // Then by date
      const dateA = new Date(a.item.pubDate).getTime();
      const dateB = new Date(b.item.pubDate).getTime();
      return order === "asc" ? dateA - dateB : dateB - dateA;
    })
    .slice(offset, offset + limit);

  return {
    total: scoredItems.filter(({ score }) => score > 0).length,
    offset,
    limit,
    order,
    query: { original: query, keywords, exactPhrases },
    results: filteredItems.map(({ item, score }) => ({ ...item, score })),
  };
};
