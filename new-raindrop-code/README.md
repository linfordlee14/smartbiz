# SmartBiz Query API - Raindrop Function

A serverless Raindrop Function that accepts natural language queries and executes them against your database using the Raindrop SmartSQL binding.

## Features

- Serverless deployment on Raindrop platform
- POST endpoint at `/query` for natural language database queries
- CORS enabled for all origins
- JSON request/response format
- Error handling and validation
- Health check endpoint
- Uses `env.SSQL_DEMO` SmartSQL binding

## Architecture

This is designed as a Raindrop Function that:
- Exports a default `fetch` handler taking `(request, env)` parameters
- Uses the `env.SSQL_DEMO` binding to execute natural language queries
- Returns structured JSON responses with proper CORS headers

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure your Raindrop deployment:
```bash
# Edit wrangler.toml with your database configuration
# Set your database_name and database_id
```

3. Deploy to Raindrop:
```bash
npm run deploy
# or for local development
npm run dev
```

## API Endpoints

#### POST /query
Execute natural language database queries.

**Request:**
```json
{
  "query": "Show me all users who signed up last month"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Results from env.SSQL_DEMO.query()
  },
  "metadata": {
    "query": "Show me all users who signed up last month",
    "executionTimeMs": 125,
    "timestamp": "2024-01-20T12:34:56.789Z"
  }
}
```

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "deployment": "Raindrop Function",
  "timestamp": "2024-01-20T12:34:56.789Z",
  "version": "1.0.0"
}
```

#### GET /
API information and usage guide.

## SmartSQL Integration

The function uses the `env.SSQL_DEMO` binding automatically provided by Raindrop:

```javascript
const results = await env.SSQL_DEMO.query(trimmedQuery);
```

The binding should accept a natural language query string and return:
- Query results in any format your binding provides
- Error handling for invalid queries or database issues

## Error Handling

The API handles various error scenarios:

- **400 Bad Request**: Missing or invalid query parameter, invalid JSON
- **404 Not Found**: Unknown endpoints
- **500 Internal Server Error**: Database errors or unexpected failures

All errors return JSON responses with descriptive error messages and proper CORS headers.

## CORS Configuration

CORS is enabled for all origins with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## Raindrop Configuration

Update `wrangler.toml` with your actual database details:

```toml
[[d1_databases]]
binding = "SSQL_DEMO"
database_name = "your-actual-database-name"
database_id = "your-actual-database-id"
```

## Development

For local development:
```bash
npm run dev
```

This starts the Wrangler development server for testing your function locally.