# @sakupi01/mcp-saba

[![JSR](https://jsr.io/badges/@sakupi01/mcp-saba)](https://jsr.io/@sakupi01/mcp-saba)
[![Publish](https://github.com/sakupi01/mcp-saba/actions/workflows/publish.yml/badge.svg)](https://github.com/sakupi01/mcp-saba/actions/workflows/publish.yml)
[![Deploy](https://github.com/sakupi01/mcp-saba/actions/workflows/deploy.yml/badge.svg)](https://github.com/sakupi01/mcp-saba/actions/workflows/deploy.yml)
[![Publish Docker image](https://github.com/sakupi01/mcp-saba/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/sakupi01/mcp-saba/actions/workflows/docker-publish.yml)

An MCP Server for blog search functionality developed /w Deno!

Available as Local Package and Remote Server.

- Docker Image: [sakupi/mcp-saba](https://hub.docker.com/r/sakupi/mcp-saba)
- Package: [@sakupi01/mcp-saba](https://jsr.io/@sakupi01/mcp-saba)
- Remote Server: [https://mcp.sakupi01.com/mcp](https://mcp.sakupi01.com/mcp)

## How to

### Install from JSR

```bash
# Deno
deno add @sakupi01/mcp-saba

# npm
npx jsr add @sakupi01/mcp-saba

# yarn
yarn dlx jsr add @sakupi01/mcp-saba

# pnpm
pnpm dlx jsr add @sakupi01/mcp-saba
```

## Usage

### Running the MCP Server Locally

```typescript
import { runServer } from "@sakupi01/mcp-saba/mod";

// Start server with default settings (port 8000)
runServer();

// Or with custom configuration
runServer({
  port: 3000
});
```

### Using the Remote MCP Server

You can use the already deployed MCP server as an API endpoint:

```
https://mcp.sakupi01.com/mcp
```

### Using in VS Code

You can use mcp-saba in VS Code with the following methods:

#### Option 1: Add to VS Code settings.json

Add the following to your VS Code settings.json:

```json
"mcp": {
  "servers": {
    "sakupi01-mcp": {
      "type": "http",
      "url": "https://mcp.sakupi01.com/mcp"
    }
  }
}
```

#### Option 2: Using Local Server

1. Start the local MCP server in a terminal:

   ```bash
   # Using docker image
   docker run -i --rm sakupi/mcp-saba
   
   # Using npx
   npx @sakupi01/mcp-saba
   
   # Or if installed globally
   mcp-saba
   ```

2. Open VS Code Command Palette (Cmd+Shift+P or Ctrl+Shift+P)
3. Run "MCP: Add Server..."
4. Enter `http://localhost:8000/mcp` as the server URL

#### Option 3: Using Docker Image

To use Docker Image, add the following style of setting to your Host:.
For example, `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "@sakupi01.com/mcp": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "sakupi/mcp-saba"
      ]
    }
  }
}
```

## Available Tools

### Blog Search Tool (`sakupi01_search_blogs`)

Search blog posts by title, description, URL, tags, and content.  
Multiple keywords separated by spaces are treated as OR conditions.

#### Parameters

- `query`: Search query (required, 1-100 characters)
- `limit`: Maximum number of results to return (optional, default: 10, max: 100)
- `offset`: Result offset (optional, default: 0)
- `order`: Sort order (optional, "desc" (newest first) or "asc" (oldest first), default: "desc")

#### Example Response

```json
{
  "total": 1,
  "offset": 0,
  "limit": 2,
  "order": "desc",
  "query": {
    "original": "Test",
    "keywords": ["test"],
    "exactPhrases": []
  },
  "results": [
    {
      "title": "🎄Open UI Advent Calendar: Day 11 / Customizable Select Element",
      "pubDate": "2024-12-11T00:00:00.000Z",
      "description": "Customizable Select Element specifications...",
      "link": "https://blog.sakupi01.com/dev/articles/2024-openui-advent-11/",
      "content": "Test content...",
      "tags": ["openui", "advent calendar"],
      "score": 2
    }
  ]
}
```

## Running Tests

Install dependencies and run tests:

```bash
deno test
```

## Changelog

See the [Releases](https://github.com/sakupi01/mcp-saba/releases) page.

## License

Released under the MIT License. See the [LICENSE](./LICENSE) file for details.
