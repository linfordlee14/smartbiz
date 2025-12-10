# Requirements Document

## Introduction

This document specifies the requirements for the React frontend API service layer (`src/services/api.js`) that connects the SmartBiz SA React application to the Flask backend. The service provides methods for chat interactions, voice-enabled responses, invoice generation, and natural language database queries.

## Glossary

- **API_Service**: The JavaScript module that handles HTTP communication between the React frontend and Flask backend
- **Chat_Endpoint**: The `/api/chat` backend route for text-based AI conversations
- **Voice_Endpoint**: The `/api/chat/voice` backend route for voice-enabled AI responses
- **Invoice_Endpoint**: The `/api/invoice/generate` backend route for SARS-compliant invoice creation
- **SmartSQL_Endpoint**: The `/api/smartsql` backend route for natural language database queries
- **Base_URL**: The configurable root URL for all API requests (default: `http://localhost:5000`)

## Requirements

### Requirement 1

**User Story:** As a frontend developer, I want a centralized API service module, so that all backend communication is handled consistently.

#### Acceptance Criteria

1. THE API_Service SHALL export a configurable Base_URL for all API requests
2. THE API_Service SHALL provide consistent error handling for all HTTP requests
3. WHEN a network error occurs THEN THE API_Service SHALL return a structured error object with an error message

### Requirement 2

**User Story:** As a user, I want to send chat messages to the AI assistant, so that I can get helpful responses for my business queries.

#### Acceptance Criteria

1. THE API_Service SHALL provide a `sendMessage` function that accepts a message string and optional context
2. WHEN `sendMessage` is called with a valid message THEN THE API_Service SHALL POST to the Chat_Endpoint and return the AI response
3. WHEN `sendMessage` is called with an empty message THEN THE API_Service SHALL return an error without making a network request
4. WHEN the Chat_Endpoint returns an error THEN THE API_Service SHALL propagate the error message to the caller

### Requirement 3

**User Story:** As a user, I want to receive voice responses from the AI, so that I can listen to answers hands-free.

#### Acceptance Criteria

1. THE API_Service SHALL provide a `sendMessageWithVoice` function that accepts a message, optional context, and optional voice_id
2. WHEN `sendMessageWithVoice` is called THEN THE API_Service SHALL POST to the Voice_Endpoint with enable_voice set to true
3. WHEN the Voice_Endpoint returns audio data THEN THE API_Service SHALL return the audio blob for playback
4. WHEN the Voice_Endpoint returns a voice_error THEN THE API_Service SHALL return both the text response and the error
5. WHEN `sendMessageWithVoice` is called with an empty message THEN THE API_Service SHALL return an error without making a network request

### Requirement 4

**User Story:** As a business owner, I want to generate SARS-compliant invoices, so that I can bill my clients properly.

#### Acceptance Criteria

1. THE API_Service SHALL provide a `generateInvoice` function that accepts business_id, client_name, items array, and optional client_vat and due_date
2. WHEN `generateInvoice` is called with valid data THEN THE API_Service SHALL POST to the Invoice_Endpoint and return the created invoice
3. WHEN `generateInvoice` is called with missing required fields THEN THE API_Service SHALL return an error without making a network request
4. WHEN the Invoice_Endpoint returns an error THEN THE API_Service SHALL propagate the error message to the caller

### Requirement 5

**User Story:** As a user, I want to query my business data using natural language, so that I can get insights without writing SQL.

#### Acceptance Criteria

1. THE API_Service SHALL provide a `runSmartSQL` function that accepts a natural language query string
2. WHEN `runSmartSQL` is called with a valid query THEN THE API_Service SHALL POST to the SmartSQL_Endpoint and return the SQL and results
3. WHEN `runSmartSQL` is called with an empty query THEN THE API_Service SHALL return an error without making a network request
4. WHEN the SmartSQL_Endpoint returns an error THEN THE API_Service SHALL propagate the error message to the caller
