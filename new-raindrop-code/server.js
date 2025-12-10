const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import Raindrop SmartSQL binding
// Adjust the import path based on your actual binding location
const SmartSQL = require('./smartsql-binding'); // Update this path as needed

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - allow all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Initialize SmartSQL binding
let smartsql;
try {
  smartsql = new SmartSQL({
    // Configure based on your database connection
    connectionString: process.env.DATABASE_URL || 'your-database-connection-string'
  });
  console.log('SmartSQL binding initialized successfully');
} catch (error) {
  console.error('Failed to initialize SmartSQL binding:', error);
  process.exit(1);
}

// POST /query endpoint
app.post('/query', async (req, res) => {
  try {
    const { query } = req.body;

    // Validate request body
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Request body must contain a "query" field with a string value'
      });
    }

    // Trim whitespace
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Query cannot be empty'
      });
    }

    console.log(`Executing query: "${trimmedQuery}"`);

    // Execute query using SmartSQL binding
    const startTime = Date.now();
    const results = await smartsql.execute(trimmedQuery);
    const executionTime = Date.now() - startTime;

    // Return results with metadata
    res.json({
      success: true,
      data: results,
      metadata: {
        query: trimmedQuery,
        executionTimeMs: executionTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Query execution error:', error);
    
    // Handle different types of errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }
    
    if (error.name === 'DatabaseError') {
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to execute query against database'
      });
    }

    // Generic error response
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your query'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'SmartBiz Query API',
    endpoints: {
      'POST /query': 'Execute natural language database queries',
      'GET /health': 'Health check endpoint'
    },
    usage: {
      query: 'POST { "query": "your natural language query here" } to /query'
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`SmartBiz Query API server running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  POST /query - Execute natural language queries`);
  console.log(`  GET  /health - Health check`);
  console.log(`  GET  / - API information`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (smartsql && typeof smartsql.close === 'function') {
    smartsql.close();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  if (smartsql && typeof smartsql.close === 'function') {
    smartsql.close();
  }
  process.exit(0);
});