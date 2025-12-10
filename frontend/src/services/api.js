/**
 * API Service Module
 * Centralized interface for React frontend to communicate with SmartBiz SA Flask backend
 */

// Configuration
const BASE_URL = 'http://localhost:5000';

/**
 * Shared error handling helper function
 * Handles fetch requests with consistent error handling pattern
 * 
 * @param {string} url - The endpoint URL
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<object>} - Response data or error object
 */
async function handleRequest(url, options) {
    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            const data = await response.json();
            return {
                error: data.error || 'Request failed'
            };
        }

        return await response.json();
    } catch (err) {
        return {
            error: `Network error: ${err.message}`
        };
    }
}

/**
 * Helper to create standard POST request options
 * 
 * @param {object} body - Request body to be JSON stringified
 * @returns {object} - Fetch options object
 */
function createPostOptions(body) {
    return {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    };
}

/**
 * Validates that a string input is not empty or whitespace-only
 * 
 * @param {string} input - The input to validate
 * @returns {boolean} - True if valid, false if empty/whitespace
 */
function isValidStringInput(input) {
    return typeof input === 'string' && input.trim().length > 0;
}

/**
 * Send a chat message to the AI assistant
 * 
 * @param {string} message - The message to send
 * @param {string} [context] - Optional context for the conversation
 * @returns {Promise<{response: string} | {error: string}>} - AI response or error object
 */
async function sendMessage(message, context) {
    // Validate input - return error without network request for empty/whitespace
    if (!isValidStringInput(message)) {
        return {
            error: 'Message cannot be empty'
        };
    }

    const body = {
        message
    };
    if (context !== undefined && context !== null) {
        body.context = context;
    }

    return handleRequest(`${BASE_URL}/api/chat`, createPostOptions(body));
}

/**
 * Send a chat message with voice response enabled
 * 
 * @param {string} message - The message to send
 * @param {string} [context] - Optional context for the conversation
 * @param {string} [voice_id] - Optional voice ID for voice generation
 * @returns {Promise<Blob | {response: string, voice_error?: string} | {error: string}>} - Audio blob, text response with optional voice error, or error object
 */
async function sendMessageWithVoice(message, context, voice_id) {
    // Validate input - return error without network request for empty/whitespace
    if (!isValidStringInput(message)) {
        return {
            error: 'Message cannot be empty'
        };
    }

    const body = {
        message,
        enable_voice: true
    };
    if (context !== undefined && context !== null) {
        body.context = context;
    }
    if (voice_id !== undefined && voice_id !== null) {
        body.voice_id = voice_id;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/chat/voice`, createPostOptions(body));

        if (!response.ok) {
            const data = await response.json();
            return {
                error: data.error || 'Request failed'
            };
        }

        // Check content type to determine response format
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('audio/')) {
            // Successful voice generation - return audio blob
            return await response.blob();
        }

        // JSON response - could be text response with voice_error or other data
        const data = await response.json();

        // Handle voice_error case - return both text response and error
        if (data.voice_error) {
            return {
                response: data.response,
                voice_error: data.voice_error
            };
        }

        return data;
    } catch (err) {
        return {
            error: `Network error: ${err.message}`
        };
    }
}

/**
 * Generate a SARS-compliant invoice
 * 
 * @param {string} business_id - The business ID
 * @param {string} client_name - The client's name
 * @param {Array} items - Array of invoice items with description, quantity, unit_price
 * @param {string} [client_vat] - Optional client VAT number
 * @param {string} [due_date] - Optional due date
 * @returns {Promise<object | {error: string}>} - Invoice object or error object
 */
async function generateInvoice(business_id, client_name, items, client_vat, due_date) {
    // Validate required fields - return error without network request if missing/empty
    if (!isValidStringInput(business_id)) {
        return {
            error: 'business_id is required'
        };
    }

    if (!isValidStringInput(client_name)) {
        return {
            error: 'client_name is required'
        };
    }

    if (!Array.isArray(items) || items.length === 0) {
        return {
            error: 'items is required and must be a non-empty array'
        };
    }

    const body = {
        business_id,
        client_name,
        items
    };

    if (client_vat !== undefined && client_vat !== null) {
        body.client_vat = client_vat;
    }

    if (due_date !== undefined && due_date !== null) {
        body.due_date = due_date;
    }

    return handleRequest(`${BASE_URL}/api/invoice/generate`, createPostOptions(body));
}

/**
 * Run a natural language query against the database using SmartSQL
 * 
 * @param {string} query - The natural language query string
 * @returns {Promise<{sql: string, results: any[]} | {error: string}>} - SQL and results or error object
 */
async function runSmartSQL(query) {
    // Validate input - return error without network request for empty/whitespace
    if (!isValidStringInput(query)) {
        return {
            error: 'Query cannot be empty'
        };
    }

    return handleRequest(`${BASE_URL}/api/smartsql`, createPostOptions({
        query
    }));
}

/**
 * Download invoice as PDF
 * 
 * @param {string} invoice_id - The invoice ID
 * @returns {Promise<Blob | {error: string}>} - PDF blob or error object
 */
async function downloadInvoicePdf(invoice_id) {
    if (!isValidStringInput(invoice_id)) {
        return {
            error: 'invoice_id is required'
        };
    }

    try {
        const response = await fetch(`${BASE_URL}/api/invoice/${invoice_id}/pdf`);

        if (!response.ok) {
            const data = await response.json();
            return {
                error: data.error || 'Failed to download PDF'
            };
        }

        return await response.blob();
    } catch (err) {
        return {
            error: `Network error: ${err.message}`
        };
    }
}

export {
    BASE_URL,
    handleRequest,
    createPostOptions,
    isValidStringInput,
    sendMessage,
    sendMessageWithVoice,
    generateInvoice,
    downloadInvoicePdf,
    runSmartSQL
};