FROM denoland/deno:latest

# Create the application directory
WORKDIR /mcp-saba

# Copy dependency files
COPY deno.json deno.lock* package.json pnpm-lock.yaml* ./


# Copy the rest of the application code
COPY . .

# Cache application dependencies
RUN deno install && deno cache ./src/mod.ts

# Run the application
CMD ["run", "--allow-env", "--allow-net=0.0.0.0:8000", "./src/mod.ts"]