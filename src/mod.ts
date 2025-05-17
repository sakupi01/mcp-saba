import type { McpServer } from "npm:@modelcontextprotocol/sdk@^1.11.3/server/mcp.js";
import { createSakupi01McpServer } from "./server.ts";

// Create and start the server
const server: McpServer = createSakupi01McpServer();

// Export for use in other modules
export { server };
export * from "./types.ts";
