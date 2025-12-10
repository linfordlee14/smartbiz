# Implementation Plan

- [x] 1. Set up project dependencies and shared utilities






  - [x] 1.1 Install required dependencies (react-markdown, lucide-react, tailwindcss if not present)

    - Add react-markdown to package.json
    - Add lucide-react for icons
    - Verify TailwindCSS is configured
    - _Requirements: 1.4_

  - [x] 1.2 Create shared dark mode context and utility hooks

    - Create DarkModeContext for app-wide dark mode state
    - Create useDarkMode hook for components
    - _Requirements: 5.1, 5.2_

- [x] 2. Implement DashboardLayout component





  - [x] 2.1 Create Logo.jsx component using lucide-react


    - Implement Logo component with Briefcase icon from lucide-react
    - Add gradient styling for icon container (blue to purple)
    - Add "SmartBiz SA" text with gradient styling
    - Add "AI Business Assistant" subtitle
    - Support dark mode variants
    - _Requirements: 4.2_


  - [x] 2.2 Create DashboardLayout.jsx with header, sidebar, and content area

    - Import and use Logo component in header
    - Add dark mode toggle with sun/moon icons
    - Add "Connected" status indicator
    - Implement sidebar with Chat, Invoices, Analytics navigation
    - Manage activeTab state for content switching

    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [x] 2.3 Write property test for navigation state management

    - **Property 7: Navigation state management**
    - **Validates: Requirements 4.5, 4.6**

  - [x] 2.4 Write property test for dark mode styling

    - **Property 8: Dark mode styling**
    - **Validates: Requirements 5.1, 5.2**

- [x] 3. Implement ChatInterface component





  - [x] 3.1 Create ChatInterface.jsx with message list and input


    - Implement scrollable message list
    - Add input box with send button at bottom
    - Add voice mode toggle button
    - Implement "Thinking..." loading state
    - _Requirements: 1.1, 1.2, 1.3, 1.6_

  - [x] 3.2 Integrate API calls and Markdown rendering

    - Connect to sendMessage and sendMessageWithVoice APIs
    - Implement voice mode logic for API selection
    - Add react-markdown for AI response rendering
    - Implement audio playback for voice responses
    - Handle error responses with user display
    - _Requirements: 1.4, 1.5, 1.7, 1.8, 1.9_

  - [x] 3.3 Write property test for message list rendering

    - **Property 1: Message list rendering**
    - **Validates: Requirements 1.1**

  - [x] 3.4 Write property test for Markdown rendering

    - **Property 2: Markdown rendering**
    - **Validates: Requirements 1.4**

  - [x] 3.5 Write property test for voice mode API selection

    - **Property 3: Voice mode API selection**
    - **Validates: Requirements 1.7, 1.8**



 tests pass








  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement InvoiceGenerator component






  - [x] 5.1 Create InvoiceGenerator.jsx with form and live preview layout


    - Implement split-screen layout (form left, preview right)
    - Add Client Name input (required)
    - Add VAT Number input (optional)
    - Implement dynamic line items array with add/remove
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_





  - [x] 5.2 Implement live preview with calculations





    - Display "Tax Invoice" header
    - Calculate and display subtotal in real-time
    - Calculate and display 15% VAT amount
    - Calculate and display total

    - Add "SARS Compliant" badge
    - _Requirements: 2.6, 2.7, 2.8, 2.9, 2.10_
  - [x] 5.3 Integrate generateInvoice API and success handling

    - Connect Generate button to generateInvoice API

    - Display success alert on completion
    - Show Download PDF button (mock download)
    - Handle and display error responses
    - _Requirements: 2.11, 2.12, 2.13, 2.14_

  - [x] 5.4 Write property test for invoice calculation correctness








    - **Property 4: Invoice calculation correctness**
    - **Validates: Requirements 2.7, 2.8, 2.9**

- [x] 6. Implement AnalyticsDashboard component

  - [x] 6.1 Create AnalyticsDashboard.jsx with metric cards

    - Implement 3-4 metric card layout (Revenue, Outstanding, VAT Due)
    - Add loading states for cards
    - _Requirements: 3.1_


  - [x] 6.2 Implement initial data loading
    - Call runSmartSQL("Total revenue this month") on mount for Revenue card
    - Call runSmartSQL("Outstanding invoices count") on mount for Outstanding card
    - _Requirements: 3.2, 3.3_
  - [x] 6.3 Implement Ask Data query interface
    - Add "Ask Data" text input for natural language queries
    - Connect to runSmartSQL API on submit
    - Display results in table or text format
    - Handle and display error responses
    - _Requirements: 3.4, 3.5, 3.6, 3.7_
  - [x] 6.4 Write property test for query results rendering


    - **Property 6: Query results rendering**
    - **Validates: Requirements 3.6**

- [x] 7. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Write property test for error message display






  - [x] 8.1 Write property test for error display across components

    - **Property 5: Error message display**
    - **Validates: Requirements 1.5, 2.14, 3.7**

- [x] 9. Integrate components into App.jsx






  - [x] 9.1 Update App.jsx to use DashboardLayout as root

    - Import and render DashboardLayout
    - Ensure dark mode context is provided at app level
    - Wire up all child components
    - _Requirements: 4.1, 4.5, 4.6_

- [x] 10. Write unit tests for components





  - [x] 10.1 Write unit tests for ChatInterface


    - Test message submission flow
    - Test voice mode toggle
    - Test loading state display
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 1.7, 1.8_

  - [x] 10.2 Write unit tests for InvoiceGenerator

    - Test line item add/remove
    - Test form validation
    - Test API integration
    - _Requirements: 2.4, 2.5, 2.11, 2.14_

  - [x] 10.3 Write unit tests for AnalyticsDashboard

    - Test initial data loading
    - Test query submission
    - Test results display
    - _Requirements: 3.2, 3.3, 3.5, 3.6_

  - [x] 10.4 Write unit tests for DashboardLayout

    - Test navigation between tabs
    - Test dark mode toggle
    - _Requirements: 4.3, 4.5, 4.6_

- [x] 11. Final Checkpoint - Ensure all tests pass








  - Ensure all tests pass, ask the user if questions arise.

---

**Note:** Clerk Authentication will be implemented as a final step (separate spec) to protect the API endpoints. This will include:
- Frontend: Clerk React SDK integration for sign-in/sign-up flows
- Backend: JWT verification middleware to protect all API routes
- User session management and protected route handling
