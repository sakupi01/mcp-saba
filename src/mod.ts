#!/usr/bin/env -S deno run -A
import type { McpServer } from "npm:@modelcontextprotocol/sdk@^1.11.3/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import process from "node:process";
import { createSakupi01McpServer } from "./server.ts";
import type { Sakupi01McpServer } from "./types.ts";
import type { Server, IncomingMessage, ServerResponse } from "node:http";

const DEFAULT_PORT = process.env["PORT"] ? parseInt(process.env["PORT"]) : 8000;
const MCP_ENDPOINT = "/mcp";

const ERROR_RESPONSES = {
    methodNotAllowed: {
        jsonrpc: "2.0",
        error: {
            code: -32000,
            message: "Method not allowed.",
        },
        id: null,
    },
    internalServerError: {
        jsonrpc: "2.0",
        error: {
            code: -32603,
            message: "Internal server error",
        },
        id: null,
    },
};

/**
 * Server configuration interface
*/
interface ServerConfig {
    port?: number;
    mcpServer?: Sakupi01McpServer;
}

// Create and start the server
const server: McpServer = createSakupi01McpServer();

/**
 * Configure and set up the Express application
*/
function setupExpressApp() {
    const app = express();
    app.use(express.json());
    return app;
}

/**
 * Configure and set up the transport layer
*/
function setupTransport() {
    return new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // For stateless servers
    });
}

/**
 * Set up route handlers for the Express application
 */
function setupRoutes(app: express.Express, transport: StreamableHTTPServerTransport) {
  // POST handler for MCP requests
  app.post(MCP_ENDPOINT, async (req, res) => {
    console.error("Received MCP request:", req.body);
    try {
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json(ERROR_RESPONSES.internalServerError);
      }
    }
  });

  // GET handler (for SSE compatibility)
  app.get(MCP_ENDPOINT, (_req, res) => {
    console.error("Received GET MCP request");
    res.writeHead(405).end(JSON.stringify(ERROR_RESPONSES.methodNotAllowed));
  });

  // DELETE handler (for stateful servers)
  app.delete(MCP_ENDPOINT, (_req, res) => {
    console.error("Received DELETE MCP request");
    res.writeHead(405).end(JSON.stringify(ERROR_RESPONSES.methodNotAllowed));
  });
}

/**
 * Create a cleanup function for graceful server shutdown
 */
function createCleanupFunction(
  server: ReturnType<typeof express.application.listen>,
  transport: StreamableHTTPServerTransport,
  mcpServer: Sakupi01McpServer
) {
  return async () => {
    try {
      console.error("Closing transport");
      await transport.close();
    } catch (error) {
      console.error("Error closing transport:", error);
    }

    await mcpServer.close();
    
    await new Promise<void>((resolve, reject) => {
      server.close((err) => err ? reject(err) : resolve());
    });
    
    console.error("Server shutdown complete");
  };
}

/**
 * Start the server with the given configuration
 * @param config Server configuration options
 * @returns Server instance and cleanup function
 */
export async function runServer({
  port = DEFAULT_PORT,
  mcpServer = server,
}: ServerConfig = {}): Promise<{
    server: Server<typeof IncomingMessage, typeof ServerResponse>;
    cleanup: () => Promise<void>;
}> {
  // Setup application and transport
  const app = setupExpressApp();
  const transport = setupTransport();
  
  // Connect MCP server with transport
  await mcpServer.connect(transport);
  
  // Setup route handlers
  setupRoutes(app, transport);
  
  // Start the server
  const server = app.listen(port, () => {
    console.error(`Server is running on http://localhost:${port}${MCP_ENDPOINT}`);
  });
  
  // Create cleanup function
  const cleanup = createCleanupFunction(server, transport, mcpServer);
  
  return { server, cleanup };
}

/**
 * Handle process signals and initialize server
 */
async function main() {
  try {
    const { cleanup } = await runServer();
    
    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.error("Shutting down MCP server...");
      await cleanup();
      process.exit(0);
    });
    
    // Additional signal handlers could be added here
    process.on("SIGTERM", async () => {
      console.error("Received SIGTERM, shutting down MCP server...");
      await cleanup();
      process.exit(0);
    });
    
  } catch (err) {
    console.error("Error setting up server:", err);
    process.exit(1);
  }
}

// Execute main function
await main();