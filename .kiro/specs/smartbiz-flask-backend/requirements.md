# Requirements Document

## Introduction

SmartBiz SA is an AI-powered business assistant application for South African entrepreneurs. This document specifies the requirements for the Flask backend API that integrates three AI systems (Cerebras for chat, LiquidMetal SmartSQL for database queries, and ElevenLabs for voice synthesis) with SARS-compliant invoicing functionality. The backend serves a React frontend and provides endpoints for chat, voice responses, invoice generation, and business analytics.

## Glossary

- **SmartBiz_Backend**: The Flask-based REST API server that handles all backend operations for SmartBiz SA
- **Cerebras_Service**: The AI service integration using Cerebras llama-3.1-8b model for generating chat responses
- **ElevenLabs_Service**: The text-to-speech service for converting AI responses to audio
- **SmartSQL_Service**: The LiquidMetal service that converts natural language queries to SQL
- **Invoice_Service**: The service responsible for generating SARS-compliant invoices with 15% VAT calculations
- **SARS**: South African Revenue Service - the tax authority requiring specific invoice formats
- **VAT**: Value Added Tax - 15% standard rate in South Africa
- **POPIA**: Protection of Personal Information Act - South African data protection law

## Requirements

### Requirement 1

**User Story:** As a user, I want to send chat messages and receive AI-powered responses, so that I can get business advice relevant to South African context.

#### Acceptance Criteria

1. WHEN a user sends a POST request to /api/chat with a message THEN the SmartBiz_Backend SHALL forward the message to Cerebras_Service and return the AI-generated response
2. WHEN the Cerebras_Service API key is missing or invalid THEN the SmartBiz_Backend SHALL return a demo response with South African business context
3. WHEN the message field is empty or missing THEN the SmartBiz_Backend SHALL return a 400 error with message "Message required"
4. WHEN the Cerebras_Service encounters an error THEN the SmartBiz_Backend SHALL log the error and return a fallback demo response

### Requirement 2

**User Story:** As a user, I want to receive voice responses to my chat messages, so that I can listen to AI advice hands-free.

#### Acceptance Criteria

1. WHEN a user sends a POST request to /api/chat/voice with a message and enable_voice=true THEN the SmartBiz_Backend SHALL generate text via Cerebras_Service and convert it to audio via ElevenLabs_Service
2. WHEN voice synthesis succeeds THEN the SmartBiz_Backend SHALL return the audio as an MP3 file with mimetype "audio/mpeg"
3. WHEN voice synthesis fails THEN the SmartBiz_Backend SHALL return the text response with a voice_error field explaining the failure
4. WHEN enable_voice is false or omitted THEN the SmartBiz_Backend SHALL return only the text response as JSON
5. WHEN a user sends a GET request to /api/chat/voices THEN the SmartBiz_Backend SHALL return the list of available ElevenLabs voices

### Requirement 3

**User Story:** As a business owner, I want to generate SARS-compliant invoices with automatic VAT calculation, so that I can bill clients legally in South Africa.

#### Acceptance Criteria

1. WHEN a user sends a POST request to /api/invoice/generate with business_id, client_name, and items THEN the SmartBiz_Backend SHALL create an invoice with 15% VAT calculated automatically
2. WHEN generating an invoice THEN the SmartBiz_Backend SHALL assign a unique invoice number in format "INV-{timestamp}"
3. WHEN required fields (business_id, client_name, items) are missing THEN the SmartBiz_Backend SHALL return a 400 error with message "Missing required fields"
4. WHEN a user sends a GET request to /api/invoice/list/{business_id} THEN the SmartBiz_Backend SHALL return all invoices for that business
5. WHEN a user sends a GET request to /api/invoice/{invoice_id} THEN the SmartBiz_Backend SHALL return the specific invoice details or 404 if not found

### Requirement 4

**User Story:** As a business owner, I want to query my financial data using natural language, so that I can get insights without writing SQL.

#### Acceptance Criteria

1. WHEN a user sends a POST request to /api/smartsql with a natural language query THEN the SmartBiz_Backend SHALL convert it to SQL via SmartSQL_Service and execute it
2. WHEN the query field is empty or missing THEN the SmartBiz_Backend SHALL return a 400 error with message "Query required"
3. WHEN the SmartSQL_Service encounters an error THEN the SmartBiz_Backend SHALL return a 500 error with the error message

### Requirement 5

**User Story:** As a developer, I want the backend to have proper database models, so that data is stored consistently and relationships are maintained.

#### Acceptance Criteria

1. THE SmartBiz_Backend SHALL define a User model with id (UUID), email (unique), name, and created_at fields
2. THE SmartBiz_Backend SHALL define a Business model with id (UUID), user_id (foreign key), name, vat_number, industry, and created_at fields
3. THE SmartBiz_Backend SHALL define an Invoice model with id (UUID), business_id (foreign key), invoice_number (unique), client_name, client_vat, total_excl_vat, vat_amount, total_incl_vat, issued_date, due_date, items_json, is_paid, and created_at fields
4. THE SmartBiz_Backend SHALL define a ChatHistory model with id (UUID), user_id (foreign key), message, response, used_voice, and created_at fields
5. WHEN the application starts THEN the SmartBiz_Backend SHALL create all database tables if they do not exist

### Requirement 6

**User Story:** As a developer, I want the backend to be properly configured with CORS and environment variables, so that it works securely with the frontend.

#### Acceptance Criteria

1. THE SmartBiz_Backend SHALL enable CORS for the frontend URL specified in FRONTEND_URL environment variable
2. THE SmartBiz_Backend SHALL load configuration from environment variables using python-dotenv
3. THE SmartBiz_Backend SHALL use SQLite for development and support PostgreSQL for production via DATABASE_URL
4. WHEN a GET request is sent to /api/health THEN the SmartBiz_Backend SHALL return status "healthy" with version information
5. WHEN an unhandled 404 error occurs THEN the SmartBiz_Backend SHALL return JSON error response
6. WHEN an unhandled 500 error occurs THEN the SmartBiz_Backend SHALL return JSON error response

### Requirement 7

**User Story:** As a developer, I want service classes to encapsulate external API integrations, so that the code is modular and testable.

#### Acceptance Criteria

1. THE Cerebras_Service SHALL encapsulate all Cerebras API calls with proper error handling and demo fallback
2. THE ElevenLabs_Service SHALL encapsulate text-to-speech conversion with configurable voice selection
3. THE SmartSQL_Service SHALL encapsulate natural language to SQL conversion
4. THE Invoice_Service SHALL encapsulate invoice generation with VAT calculation logic
5. WHEN serializing invoice data THEN the Invoice_Service SHALL convert Invoice model to JSON-serializable dictionary
6. WHEN deserializing invoice data THEN the Invoice_Service SHALL parse JSON back to Invoice model fields
