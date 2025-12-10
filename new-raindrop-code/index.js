export default {
    async fetch(request, env) {
        // Handle CORS preflight requests
        if (request.method === 'OPTIONS') {
            return handleCORS();
        }

        try {
            const url = new URL(request.url);
            const path = url.pathname;

            // Route handling
            if (path === '/' && request.method === 'GET') {
                return handleRoot();
            }

            if (path === '/health' && request.method === 'GET') {
                return handleHealth();
            }

            if (path === '/query' && request.method === 'POST') {
                return handleQuery(request, env);
            }

            // 404 for unknown routes
            return new Response(
                JSON.stringify({
                    error: 'Not Found',
                    message: 'Endpoint not found'
                }), {
                    status: 404,
                    headers: getCORSHeaders()
                }
            );

        } catch (error) {
            console.error('Request handling error:', error);

            return new Response(
                JSON.stringify({
                    error: 'Internal Server Error',
                    message: 'An unexpected error occurred'
                }), {
                    status: 500,
                    headers: getCORSHeaders()
                }
            );
        }
    }
};

// CORS headers for all responses
function getCORSHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };
}

// Handle CORS preflight requests
function handleCORS() {
    return new Response(null, {
        status: 200,
        headers: getCORSHeaders()
    });
}

// Handle root endpoint
function handleRoot() {
    return new Response(
        JSON.stringify({
            message: 'SmartBiz Query API',
            deployment: 'Raindrop SmartSQL',
            endpoints: {
                'POST /query': 'Execute natural language database queries via SmartSQL',
                'GET /health': 'Health check endpoint'
            },
            usage: {
                query: 'POST { "query": "your natural language query here" } to /query'
            }
        }), {
            status: 200,
            headers: getCORSHeaders()
        }
    );
}

// Handle health check
function handleHealth() {
    return new Response(
        JSON.stringify({
            status: 'healthy',
            deployment: 'Raindrop SmartSQL',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        }), {
            status: 200,
            headers: getCORSHeaders()
        }
    );
}

// Handle query execution using SmartSQL
async function handleQuery(request, env) {
    try {
        // Parse request body
        const body = await request.json();
        const {
            query
        } = body;

        // Validate request body
        if (!query || typeof query !== 'string') {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Request body must contain a "query" field with a string value'
                }), {
                    status: 400,
                    headers: getCORSHeaders()
                }
            );
        }

        // Trim whitespace
        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Query cannot be empty'
                }), {
                    status: 400,
                    headers: getCORSHeaders()
                }
            );
        }

        console.log(`Processing query: "${trimmedQuery}"`);
        const startTime = Date.now();

        try {
            // Use SmartSQL binding for natural language queries
            if (env.SSQL) {
                console.log('Using SmartSQL binding');
                const result = await env.SSQL.run(trimmedQuery);
                const executionTime = Date.now() - startTime;

                return new Response(
                    JSON.stringify({
                        success: true,
                        sql: result.sql || trimmedQuery,
                        results: result.results || result.rows || [],
                        metadata: {
                            query: trimmedQuery,
                            executionTimeMs: executionTime,
                            timestamp: new Date().toISOString()
                        }
                    }), {
                        status: 200,
                        headers: getCORSHeaders()
                    }
                );
            }

            // Fallback to D1 for raw SQL queries
            if (env.DB) {
                // Check if query looks like SQL
                const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'PRAGMA'];
                const isRawSQL = sqlKeywords.some(keyword =>
                    trimmedQuery.toUpperCase().trim().startsWith(keyword)
                );

                if (isRawSQL) {
                    console.log('Using D1 for raw SQL');
                    const stmt = env.DB.prepare(trimmedQuery);
                    const queryResult = await stmt.all();
                    const executionTime = Date.now() - startTime;

                    return new Response(
                        JSON.stringify({
                            success: true,
                            sql: trimmedQuery,
                            results: queryResult.results || [],
                            metadata: {
                                query: trimmedQuery,
                                executionTimeMs: executionTime,
                                timestamp: new Date().toISOString()
                            }
                        }), {
                            status: 200,
                            headers: getCORSHeaders()
                        }
                    );
                }
            }

            // No SmartSQL binding and not raw SQL
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'SmartSQL binding not configured. Natural language queries require SmartSQL.',
                    hint: 'For raw SQL, start your query with SELECT, INSERT, UPDATE, etc.'
                }), {
                    status: 400,
                    headers: getCORSHeaders()
                }
            );

        } catch (sqlError) {
            console.error('Query execution error:', sqlError);

            return new Response(
                JSON.stringify({
                    success: false,
                    error: sqlError.message || 'Query execution failed'
                }), {
                    status: 500,
                    headers: getCORSHeaders()
                }
            );
        }

    } catch (error) {
        console.error('Request parsing error:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: 'Invalid JSON in request body'
            }), {
                status: 400,
                headers: getCORSHeaders()
            }
        );
    }
}