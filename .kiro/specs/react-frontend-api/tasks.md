# Implementation Plan

- [x] 1. Set up API service module structure






  - [x] 1.1 Create `frontend/src/services/api.js` with BASE_URL configuration and helper functions

    - Create the services directory if it doesn't exist
    - Define configurable BASE_URL constant
    - Create shared error handling helper function
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Implement sendMessage function





  - [x] 2.1 Implement sendMessage with input validation and API call


    - Add empty/whitespace input validation
    - POST to `/api/chat` endpoint with message and optional context
    - Handle success and error responses consistently
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.2 Write property test for empty input validation (sendMessage)

    - **Property 1: Empty input validation**
    - **Validates: Requirements 2.3**

- [x] 3. Implement sendMessageWithVoice function





  - [x] 3.1 Implement sendMessageWithVoice with voice-specific handling


    - Add empty/whitespace input validation
    - POST to `/api/chat/voice` with enable_voice: true
    - Handle audio blob response for successful voice generation
    - Handle voice_error case returning both text response and error
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Write property test for voice request payload

    - **Property 4: Voice request payload**
    - **Validates: Requirements 3.2**

- [x] 4. Implement generateInvoice function





  - [x] 4.1 Implement generateInvoice with required field validation


    - Validate business_id, client_name, and items are present and non-empty
    - POST to `/api/invoice/generate` with all invoice data
    - Handle success and error responses
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 4.2 Write property test for required field validation

    - **Property 2: Required field validation for invoices**
    - **Validates: Requirements 4.3**

- [x] 5. Implement runSmartSQL function








  - [x] 5.1 Implement runSmartSQL with input validation

    - Add empty/whitespace query validation
    - POST to `/api/smartsql` endpoint with query
    - Return sql and results on success
    - _Requirements: 5.1, 5.2, 5.3, 5.4_


  - [x] 5.2 Write property test for empty input validation (runSmartSQL)

    - **Property 1: Empty input validation**
    - **Validates: Requirements 5.3**

- [x] 6. Checkpoint - Ensure all tests pass







  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Write property test for consistent error structure







  - [x] 7.1 Write property test for error structure consistency

    - **Property 3: Consistent error structure**
    - **Validates: Requirements 1.2, 1.3, 2.4, 4.4, 5.4**

- [-] 8. Write unit tests for API service




  - [x] 8.1 Write unit tests for sendMessage





    - Test valid message returns response
    - Test empty message returns error
    - Test network error handling
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [-] 8.2 Write unit tests for sendMessageWithVoice

    - Test valid message with audio response
    - Test voice_error case
    - Test empty message returns error
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [-] 8.3 Write unit tests for generateInvoice

    - Test valid invoice generation
    - Test missing required fields
    - Test backend error propagation
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 8.4 Write unit tests for runSmartSQL







    - Test valid query returns sql and results
    - Test empty query returns error
    - _Requirements: 5.1, 5.2, 5.3, 5.4_



- [x] 9. Final Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.
