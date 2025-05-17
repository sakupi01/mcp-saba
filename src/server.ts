import { McpServer } from "npm:@modelcontextprotocol/sdk@^1.11.3/server/mcp.js";
import type { Blog } from "./types.ts";
import { registerBlogSearchTool } from "./tools/blog-search.ts";

/**
 * Create a Sakupi01 MCP Server
 * @param fixtures Configuration options such as test data
 */
export const createSakupi01McpServer = (fixtures?: { blogs?: Blog[] }): McpServer => {
  const server = new McpServer({
    name: "sakupi01-mcp-saba",
    version: "0.1.0",
  });

  // Register all tools
  registerBlogSearchTool(server, fixtures?.blogs);

  return server;
};
