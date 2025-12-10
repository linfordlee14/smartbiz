# Design Document: React Frontend API Service

## Overview

The API service module (`src/services/api.js`) provides a centralized interface for the React frontend to communicate with the SmartBiz SA Flask backend. It handles four main functionalities: text chat, voice-enabled chat, invoice generation, and natural language database queries.

## Architecture

```mermaid
graph TD
    subgraph React Frontend
        A[Components] --> B[api.js Service]
    end
    
    subgraph Flask Backend
        C[/api/chat]
        D[/api/chat/voice]
        E[/api/invoice/generate]
        F[/api/smartsql]
    end
    
    B -->|POST| C
    B -->|POST| D
    B -->|POST| E
    B -->|POST| F
```

## Components and Interfaces

### API Service Module

```javascript
// Configuration
const BASE_URL = 'http://localhost:5000';

// Exported Functions
sendMessage(message, context?) → Promise<{response: string} | {error: string}>
sendMessageWithVoice(message, context?, voice_id?) → Promise<Blob | {response: string, voice_error?: string} | {error: string}>
generateInvoice(business_id, client_name, items, client_vat?, due_date?) → Promise<Invoice | {error: string}>
runSmartSQL(query) → Promise<{sql: string, results: any[]} | {error: string}>
```

### Request/Response Formats

**sendMessage**
- Request: `POST /api/chat` with `{message: string, context?: string}`
- Success Response: `{response: string}`
- Error Response: `{error: string}`

**sendMessageWithVoice**
- Request: `POST /api/chat/voice` with `{message: string, context?: string, enable_voice: true, voice_id?: string}`
- Success Response (audio): `Blob` (audio/mpeg)
- Success Response (voice error): `{response: string, voice_error: string}`
- Error Response: `{error: string}`

**generateInvoice**
- Request: `POST /api/invoice/generate` with `{business_id: string, client_name: string, items: array, client_vat?: string, due_date?: string}`
- Success Response: Invoice object with id, invoice_number, totals, etc.
- Error Response: `{error: string}`

**runSmartSQL**
- Request: `POST /api/smartsql` with `{query: string}`
- Success Response: `{sql: string, results: array}`
- Error Response: `{error: string}`

## Data Models

### Invoice Item
```javascript
{
  description: string,  // Item description
  quantity: number,     // Quantity (positive integer)
  unit_price: number    // Price per unit in ZAR
}
```

### Invoice Response
```javascript
{
  id: string,           // UUID
  invoice_number: string,
  business_id: string,
  client_name: string,
  client_vat: string | null,
  items: InvoiceItem[],
  subtotal: number,
  vat_amount: number,   // 15% VAT
  total: number,
  due_date: string,
  created_at: string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Empty input validation
*For any* API method (sendMessage, sendMessageWithVoice, runSmartSQL) and any input that is empty, whitespace-only, or missing, the method SHALL return an error object without making a network request.
**Validates: Requirements 2.3, 3.5, 5.3**

### Property 2: Required field validation for invoices
*For any* call to generateInvoice where business_id, client_name, or items is missing or empty, the method SHALL return an error object without making a network request.
**Validates: Requirements 4.3**

### Property 3: Consistent error structure
*For any* API method that encounters an error (network, validation, or backend), the returned error object SHALL contain an `error` property with a string message.
**Validates: Requirements 1.2, 1.3, 2.4, 4.4, 5.4**

### Property 4: Voice request payload
*For any* call to sendMessageWithVoice with a valid message, the request payload SHALL include `enable_voice: true`.
**Validates: Requirements 3.2**

## Error Handling

All API methods follow a consistent error handling pattern:

1. **Input Validation Errors**: Return `{error: string}` immediately without network request
2. **Network Errors**: Catch fetch exceptions and return `{error: 'Network error: <message>'}`
3. **Backend Errors**: Parse error response and return `{error: string}` from backend

```javascript
// Error handling pattern
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    const data = await response.json();
    return { error: data.error || 'Request failed' };
  }
  return await response.json();
} catch (err) {
  return { error: `Network error: ${err.message}` };
}
```

## Testing Strategy

### Unit Tests
- Test each API method with valid inputs (mocked fetch)
- Test input validation for each method
- Test error handling for network failures
- Test error propagation from backend

### Property-Based Tests
Using fast-check library for JavaScript property-based testing:

- **Property 1**: Generate random whitespace strings and verify all text-input methods reject them
- **Property 2**: Generate invoice data with random missing fields and verify rejection
- **Property 3**: Simulate various error conditions and verify consistent error structure
- **Property 4**: Generate valid messages and verify voice request payload structure

Each property-based test will:
- Run a minimum of 100 iterations
- Be tagged with format: `**Feature: react-frontend-api, Property {number}: {property_text}**`
