# Implementation Plan

- [x] 1. Set up project structure and core Flask application




  - [x] 1.1 Create backend directory structure with routes/, services/, and tests/ folders


    - Create folder structure matching the design document
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 1.2 Implement main Flask application (app.py) with CORS, SQLAlchemy, and error handlers

    - Initialize Flask app with CORS configuration
    - Configure SQLAlchemy with DATABASE_URL support
    - Add health check endpoint /api/health
    - Add 404 and 500 error handlers returning JSON
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 1.3 Create requirements.txt with all dependencies

    - Flask, Flask-CORS, Flask-SQLAlchemy, python-dotenv, requests, gunicorn, hypothesis
    - _Requirements: 6.2_

- [x] 2. Implement database models





  - [x] 2.1 Create models.py with User, Business, Invoice, ChatHistory models


    - Define all fields with correct types and constraints
    - Set up foreign key relationships and cascades
    - Use UUID for primary keys
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 2.2 Write unit tests for database models

    - Test model creation with valid data
    - Test relationships between models
    - Test unique constraints
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 3. Implement Invoice Service with VAT calculation





  - [x] 3.1 Create services/invoice_service.py with InvoiceService class


    - Implement generate_invoice() with 15% VAT calculation
    - Implement list_invoices() for business
    - Implement get_invoice() by ID
    - Generate invoice numbers in "INV-{timestamp}" format
    - _Requirements: 3.1, 3.2, 3.4, 3.5_
  - [x] 3.2 Write property test for VAT calculation


    - **Property 3: VAT calculation correctness**
    - **Validates: Requirements 3.1**


  - [x] 3.3 Write property test for invoice number format






    - **Property 4: Invoice number format**
    - **Validates: Requirements 3.2**
  - [x] 3.4 Write property test for invoice serialization round-trip






    - **Property 8: Invoice serialization round-trip**
    - **Validates: Requirements 7.5, 7.6**

- [x] 4. Implement Invoice routes






  - [x] 4.1 Create routes/invoice.py with invoice blueprint

    - POST /api/invoice/generate - create SARS-compliant invoice
    - GET /api/invoice/list/{business_id} - list invoices
    - GET /api/invoice/{invoice_id} - get specific invoice
    - Validate required fields and return 400 for missing fields
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 4.2 Write property test for invoice generation validation

    - **Property 5: Invoice generation validation**
    - **Validates: Requirements 3.3**

  - [x] 4.3 Write property test for invoice list filtering

    - **Property 6: Invoice list filtering**
    - **Validates: Requirements 3.4**

- [x] 5. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Cerebras Service









  - [x] 6.1 Create services/cerebras_service.py with CerebrasService class

    - Implement get_response() calling Cerebras API
    - Add South African business context to system prompt
    - Implement demo fallback responses when API key missing
    - Handle API errors gracefully
    - _Requirements: 1.1, 1.2, 1.4_

- [x] 7. Implement Chat routes







  - [x] 7.1 Create routes/chat.py with chat blueprint



    - POST /api/chat - text chat endpoint
    - Validate message field and return 400 for empty/missing
    - Return response from CerebrasService
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 7.2 Write property test for chat response structure

    - **Property 1: Chat endpoint returns valid response structure**
    - **Validates: Requirements 1.1**


  - [x] 7.3 Write property test for empty message validation








    - **Property 2: Empty message validation**
    - **Validates: Requirements 1.3**

- [x] 8. Implement ElevenLabs Service






  - [x] 8.1 Create services/elevenlabs_service.py with ElevenLabsService class

    - Implement text_to_speech() calling ElevenLabs API
    - Implement get_available_voices()
    - Handle API errors and return error dict
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 9. Implement Voice Chat routes



















  - [x] 9.1 Add voice endpoints to routes/chat.py


    - POST /api/chat/voice - voice-enabled chat
    - GET /api/chat/voices - list available voices
    - Return MP3 audio when voice enabled and successful
    - Return text with voice_error when voice fails
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 10. Implement SmartSQL Service







  - [x] 10.1 Create services/smartsql_service.py with SmartSQLService class




    - Implement execute_query() for natural language to SQL
    - Handle API errors
    - _Requirements: 4.1, 4.3_

- [x] 11. Implement SmartSQL routes





  - [x] 11.1 Add SmartSQL endpoint to routes/chat.py


    - POST /api/smartsql - natural language database queries
    - Validate query field and return 400 for empty/missing
    - _Requirements: 4.1, 4.2, 4.3_


  - [x] 11.2 Write property test for SmartSQL empty query validation





    - **Property 7: SmartSQL empty query validation**
    - **Validates: Requirements 4.2**

- [x] 12. Create environment configuration







  - [-] 12.1 Create .env.example with all required environment variables


    - CEREBRAS_API_KEY, ELEVENLABS_API_KEY, LIQUIDMETAL_API_KEY
    - DATABASE_URL, FRONTEND_URL, SECRET_KEY, FLASK_PORT, FLASK_ENV
    - _Requirements: 6.2_

- [x] 13. Final Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
