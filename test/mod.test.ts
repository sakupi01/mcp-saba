import { assertEquals } from "jsr:@std/assert";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import mockItems from "./__fixtures__/blogs.json" with { type: "json" };
import { createSakupi01McpServer } from "../src/server.ts";
import type { Blog } from "../src/types.ts";
import { runServer } from "../src/mod.ts";

const createConnection = async (url: string) => {
  const client = new Client({
    name: "example-client",
    version: "1.0.0",
  });
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    sessionId: undefined,
  });
  client.onerror = (error) => {
    console.error("Client error:", error);
  };

  await client.connect(transport);
  return client;
};

async function createTestServer() {
  // create mcp server with mock
  const mcpServer = createSakupi01McpServer({
    blogs: mockItems as Blog[],
  });

  const port = Math.floor(Math.random() * (65535 - 1024) + 1024);

  // bootup mcp server
  const { cleanup } = await runServer({
    port,
    mcpServer,
  });
  return {
    cleanup,
    url: `http://localhost:${port}/mcp`,
  };
}

Deno.test("should search blogs with query", async () => {
  const { cleanup, url } = await createTestServer();

  // create mcp client
  const client = await createConnection(url);

  try {
    // call sakupi01_search_blogs
    const response = await client.callTool({
      name: "sakupi01_search_blogs",
      arguments: {
        query: "Test",
        limit: 2,
        offset: 0,
      },
    });

    assertEquals(response.content, [
      {
        type: "text",
        text: "{\n" +
          '  "total": 1,\n' +
          '  "offset": 0,\n' +
          '  "limit": 2,\n' +
          '  "order": "desc",\n' +
          '  "query": {\n' +
          '    "original": "Test",\n' +
          '    "keywords": [\n' +
          '      "test"\n' +
          "    ],\n" +
          '    "exactPhrases": []\n' +
          "  },\n" +
          '  "results": [\n' +
          "    {\n" +
          '      "title": "🎄Open UI Advent Calendar: Day 11 / Customizable Select Element Ep.9",\n' +
          '      "pubDate": "2024-12-11T00:00:00.000Z",\n' +
          '      "description": "Customizable Select Elementの関連仕様:  `appearance: base-select;` - `::picker-icon`のデフォルトスタイルはどうやって決まったのか",\n' +
          '      "link": "https://blog.sakupi01.com/dev/articles/2024-openui-advent-11/",\n' +
          '      "content": "Test Test",\n' +
          '      "tags": [\n' +
          '        "openui",\n' +
          '        "advent calendar"\n' +
          "      ],\n" +
          '      "score": 2\n' +
          "    }\n" +
          "  ]\n" +
          "}",
      },
    ]);
  } finally {
    client.close();
    await cleanup();
  }
});
