import { McpAgent } from "agents/mcp";
import { createSakupi01McpServer } from "./server.ts";

// Define our MCP agent with tools
export class Sakupi01MCP extends McpAgent {
  server = createSakupi01McpServer();

  async init() {}
}

export default {
  // @ts-ignore
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      return Sakupi01MCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    if (url.pathname === "/mcp") {
      return Sakupi01MCP.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
