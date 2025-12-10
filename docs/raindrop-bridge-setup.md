# Raindrop Bridge App Setup Guide

This guide walks you through setting up the SmartBiz Bridge App on the Raindrop platform, which enables the "Ask Data" feature to use Raindrop's SmartSQL capabilities.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Raindrop account (sign up at raindrop.io if needed)

## Step 1: Install Raindrop CLI

Install the raindrop-code CLI globally:

```bash
npm install -g @raindrop/cli
```

### Verify Installation

```bash
raindrop-code --version
```

### Troubleshooting Installation Issues

| Issue | Solution |
|-------|----------|
| `EACCES: permission denied` | Use `sudo npm install -g @raindrop/cli` or fix npm permissions |
| `command not found: raindrop-code` | Ensure npm global bin is in your PATH. Run `npm config get prefix` and add `/bin` to PATH |
| `npm ERR! network` | Check internet connection or proxy settings. Try `npm config set registry https://registry.npmjs.org/` |
| Old Node.js version | Upgrade Node.js to v18+ using nvm: `nvm install 18 && nvm use 18` |

## Step 2: Login to Raindrop

Authenticate with your Raindrop account:

```bash
raindrop-code login
```

This will open a browser window for authentication. Follow the prompts to complete login.

### Troubleshooting Login Issues

| Issue | Solution |
|-------|----------|
| Browser doesn't open | Copy the URL from terminal and paste in browser manually |
| `Authentication failed` | Ensure you have a valid Raindrop account and try again |
| `Token expired` | Run `raindrop-code logout` then `raindrop-code login` again |
| Corporate firewall blocking | Check with IT for proxy settings or use VPN |

## Step 3: Initialize the Project

Create the smartbiz-bridge project:

```bash
raindrop-code init smartbiz-bridge
cd smartbiz-bridge
```

### Expected Project Structure

After initialization, you should see:

```
smartbiz-bridge/
├── raindrop.config.js    # Project configuration
├── src/
│   └── index.js          # Main application entry
├── package.json          # Dependencies
└── README.md             # Project documentation
```

## Step 4: Build the /query Endpoint

Open the Raindrop AI agent to build the endpoint:

```bash
raindrop-code agent
```

When the agent opens, provide this prompt:

```
Create an HTTP POST endpoint at /query that:
1. Accepts a JSON body with a "query" field containing a natural language question
2. Passes the query to SmartSQL to convert it to SQL and execute it
3. Returns a JSON response with this structure:
   - On success: {"success": true, "sql": "<generated SQL>", "results": [<array of row objects>]}
   - On error: {"success": false, "error": "<error message>"}
4. Validates that the "query" field exists and is not empty, returning 400 if invalid
5. Handles SmartSQL errors gracefully, returning 500 with error details
6. Adds CORS headers to allow requests from any origin
```

## Step 5: Deploy to Raindrop

The Bridge App code is located in the `new-raindrop-code/` directory. Deploy using Wrangler (Cloudflare Workers):

```bash
cd new-raindrop-code
npx wrangler deploy
```

### Alternative: Using raindrop-code CLI

If using the Raindrop CLI:

```bash
raindrop-code deploy
```

### Expected Output

```
✓ Building application...
✓ Uploading to Raindrop...
✓ Deployed successfully!
🌐 Your app is live at: https://smartbiz-api.<your-subdomain>.workers.dev
```

**Important:** Save the deployed URL - you'll need it for the Flask backend configuration.

### Current Deployment

The SmartBiz Bridge App is deployed at:
- **Base URL:** `https://smartbiz-api.smartbiz-sa.workers.dev`
- **Query Endpoint:** `https://smartbiz-api.smartbiz-sa.workers.dev/query`
- **Health Endpoint:** `https://smartbiz-api.smartbiz-sa.workers.dev/health`

### Troubleshooting Deployment Issues

| Issue | Solution |
|-------|----------|
| `Build failed` | Check for syntax errors in your code. Run `npm run build` locally first |
| `Upload failed` | Check internet connection. Try `npx wrangler deploy --verbose` for details |
| `Quota exceeded` | Check your Cloudflare/Raindrop plan limits or upgrade |
| `Invalid configuration` | Verify `wrangler.toml` has correct settings |
| `D1 database not found` | Ensure the D1 database is created: `npx wrangler d1 create smartbiz-db` |

## Step 6: Test the Deployed Endpoint

Test with curl:

```bash
# Test health endpoint
curl https://smartbiz-api.smartbiz-sa.workers.dev/health

# Test query endpoint
curl -X POST https://smartbiz-api.smartbiz-sa.workers.dev/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me all invoices"}'
```

### Expected Health Response

```json
{
  "status": "healthy",
  "deployment": "Raindrop Function",
  "timestamp": "2025-12-08T16:05:22.914Z",
  "version": "1.0.0"
}
```

### Expected Query Response

```json
{
  "success": true,
  "data": [...],
  "metadata": {
    "query": "Show me all invoices",
    "executionTimeMs": 123,
    "timestamp": "2024-12-08T12:00:00.000Z"
  }
}
```

## Next Steps

After successful deployment:

1. Copy the deployed URL: `https://smartbiz-api.smartbiz-sa.workers.dev/query`
2. Add it to your Flask backend's `.env` file as `RAINDROP_BRIDGE_URL`
3. Restart the Flask backend to use the new Raindrop integration

Example `.env` configuration:
```
RAINDROP_BRIDGE_URL=https://smartbiz-api.smartbiz-sa.workers.dev/query
```

## Quick Reference

| Command | Description |
|---------|-------------|
| `raindrop-code login` | Authenticate with Raindrop |
| `raindrop-code logout` | Clear authentication |
| `raindrop-code init <name>` | Create new project |
| `raindrop-code agent` | Open AI agent for development |
| `raindrop-code deploy` | Deploy to Raindrop platform |
| `raindrop-code logs` | View deployment logs |
| `raindrop-code --help` | Show all available commands |
