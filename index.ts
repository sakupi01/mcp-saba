#!/usr/bin/env -S deno run -A

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { type Sakupi01McpServer, server as createSakupi01McpServer } from "./src/mod.ts";
import process from "node:process";

const DEFAULT_PORT = process.env["PORT"] ? parseInt(process.env["PORT"]) : 8000;
/**
 * Function to start the server
 * @param configs Server configuration options
 * @returns Server instance and cleanup function
 */
export const runServer = async ({
  port = DEFAULT_PORT,
  mcpServer = createSakupi01McpServer,
}: {
  port?: number;
  mcpServer?: Sakupi01McpServer;
} = {}) => {
  const app = express();
  app.use(express.json());

  const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
    // Specify undefined for stateless servers
    sessionIdGenerator: undefined,
  });

  // Connect MCP server with the transport
  await mcpServer.connect(transport);

  // Handle POST requests
  app.post("/mcp", async (req, res) => {
    console.error("Received MCP request:", req.body);
    try {
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  });

  // GET requests need to be implemented for compatibility with SSE endpoints
  // If not implementing SSE endpoints, return 405 Method Not Allowed
  app.get("/mcp", async (_req, res) => {
    console.error("Received GET MCP request");
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Method not allowed.",
        },
        id: null,
      }),
    );
  });

  // DELETE requests need to be implemented for stateful servers
  app.delete("/mcp", async (_req, res) => {
    console.error("Received DELETE MCP request");
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Method not allowed.",
        },
        id: null,
      }),
    );
  });

  // Start the server
  const server = app.listen(port, () => {
    console.error(`Server is running on http://localhost:${port}/mcp`);
  });

  // Return cleanup function
  const cleanup = async () => {
    try {
      console.error(`Closing transport`);
      await transport.close();
    } catch (error) {
      console.error(`Error closing transport:`, error);
    }

    await mcpServer.close();
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.error("Server shutdown complete");
  };

  return {
    server,
    cleanup,
  };
};

const { cleanup } = await runServer().catch((err) => {
  console.error("Error setting up server:", err);
  process.exit(1);
});
process.on("SIGINT", async () => {
  console.error("Shutting down MCP server...");
  await cleanup();
  process.exit(0);
});
