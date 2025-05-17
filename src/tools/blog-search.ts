import * as z from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { searchBlogs } from "../services/blog.ts";
import type { Blog } from "../types.ts";
/**
 * Register the blog search tool with the server
 */
export const registerBlogSearchTool = (server: McpServer, fixtures?: Blog[]) => {
  server.tool(
    "sakupi01_search_blogs",
    "Search items by title, description, URL, tags, and content. Multiple keywords separated by spaces are searched as OR conditions",
    {
      query: z
        .string()
        .min(1, "Search query must be at least 1 character")
        .max(100, "Search query must not exceed 100 characters")
        .describe(
          "Search query. Multiple keywords separated by spaces are searched as OR conditions",
        ),
      limit: z
        .number()
        .int("Limit must be an integer")
        .min(1, "Limit must be at least 1")
        .max(100, "Limit must not exceed 100")
        .default(10)
        .describe("Maximum number of results to return (default: 10, max: 100)"),
      offset: z
        .number()
        .int("Offset must be an integer")
        .min(0, "Offset must be at least 0")
        .default(0)
        .describe("Result offset (default: 0)"),
      order: z
        .enum(["desc", "asc"])
        .default("desc")
        .describe("Sort order: desc - newest first (default), asc - oldest first"),
    },
    async ({ query, limit, offset, order }) => {
      try {
        const searchResults = await searchBlogs(query, limit, offset, order, fixtures);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(searchResults, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("Error occurred while searching items:", error);
        return {
          content: [
            {
              type: "text",
              text: `Error occurred while searching items: ${String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
};
