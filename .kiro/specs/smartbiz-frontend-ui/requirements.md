# Requirements Document

## Introduction

This document specifies the requirements for the SmartBiz SA React frontend UI components. The system provides four main components: a ChatGPT-style chat interface for business advice, an invoice generator with live preview, an analytics dashboard powered by SmartSQL, and a main dashboard layout shell. All components use TailwindCSS for styling, support responsive design and dark mode, and connect to the existing `api.js` service for backend communication.

## Glossary

- **ChatInterface**: The React component providing a ChatGPT-style conversational interface for business advice
- **InvoiceGenerator**: The React component providing a form-based interface for creating SARS-compliant tax invoices
- **AnalyticsDashboard**: The React component displaying business insights and natural language data queries
- **DashboardLayout**: The main shell component containing navigation, header, and content area
- **Voice_Mode**: A toggle state that determines whether AI responses include audio playback
- **Line_Item**: An invoice entry containing description, quantity, and unit price
- **SARS_Compliant**: Adherence to South African Revenue Service tax invoice requirements including 15% VAT calculation
- **SmartSQL**: Natural language to SQL query translation service
- **Dark_Mode**: An alternate color scheme using dark backgrounds and light text

## Requirements

### Requirement 1

**User Story:** As a user, I want a ChatGPT-style chat interface, so that I can get business advice through natural conversation.

#### Acceptance Criteria

1. THE ChatInterface SHALL display a scrollable message list showing conversation history
2. THE ChatInterface SHALL provide an input box at the bottom with a send button for message submission
3. WHEN a user submits a message THEN THE ChatInterface SHALL display a "Thinking..." indicator while awaiting response
4. THE ChatInterface SHALL render AI response messages with Markdown formatting support
5. WHEN the backend returns an error object THEN THE ChatInterface SHALL display the error message to the user
6. THE ChatInterface SHALL provide a toggle button to switch between "Voice Mode" and "Text Mode"
7. WHEN Voice_Mode is enabled and a message is submitted THEN THE ChatInterface SHALL call the sendMessageWithVoice API method
8. WHEN Voice_Mode is disabled and a message is submitted THEN THE ChatInterface SHALL call the sendMessage API method
9. WHEN the Voice_Endpoint returns an audio Blob THEN THE ChatInterface SHALL automatically play the audio using HTML5 Audio

### Requirement 2

**User Story:** As a business owner, I want to generate SARS-compliant tax invoices with a live preview, so that I can create professional invoices efficiently.

#### Acceptance Criteria

1. THE InvoiceGenerator SHALL display a split-screen layout with form on the left and live preview on the right
2. THE InvoiceGenerator SHALL provide a required Client Name input field
3. THE InvoiceGenerator SHALL provide an optional VAT Number input field
4. THE InvoiceGenerator SHALL provide a dynamic Line_Item array with Description, Quantity, and Unit Price fields
5. THE InvoiceGenerator SHALL allow users to add and remove Line_Item entries
6. THE InvoiceGenerator live preview SHALL display a "Tax Invoice" header
7. THE InvoiceGenerator live preview SHALL calculate and display Subtotal in real-time
8. THE InvoiceGenerator live preview SHALL calculate and display 15% VAT amount in real-time
9. THE InvoiceGenerator live preview SHALL calculate and display Total (Subtotal + VAT) in real-time
10. THE InvoiceGenerator live preview SHALL display a "SARS Compliant" badge
11. WHEN the user clicks the Generate button THEN THE InvoiceGenerator SHALL call the generateInvoice API method
12. WHEN invoice generation succeeds THEN THE InvoiceGenerator SHALL display a success alert
13. WHEN invoice generation succeeds THEN THE InvoiceGenerator SHALL offer a Download PDF button
14. WHEN the backend returns an error THEN THE InvoiceGenerator SHALL display the error message to the user

### Requirement 3

**User Story:** As a business owner, I want an analytics dashboard with natural language queries, so that I can gain insights from my business data without writing SQL.

#### Acceptance Criteria

1. THE AnalyticsDashboard SHALL display 3-4 metric cards at the top showing key business metrics
2. WHEN the AnalyticsDashboard loads THEN THE AnalyticsDashboard SHALL call runSmartSQL with "Total revenue this month" to populate the Revenue card
3. WHEN the AnalyticsDashboard loads THEN THE AnalyticsDashboard SHALL call runSmartSQL with "Outstanding invoices count" to populate the Outstanding card
4. THE AnalyticsDashboard SHALL provide an "Ask Data" text input for natural language queries
5. WHEN a user submits a natural language query THEN THE AnalyticsDashboard SHALL call the runSmartSQL API method
6. WHEN runSmartSQL returns results THEN THE AnalyticsDashboard SHALL display the results in a table or text format
7. WHEN the backend returns an error THEN THE AnalyticsDashboard SHALL display the error message to the user

### Requirement 4

**User Story:** As a user, I want a main dashboard layout with navigation, so that I can easily switch between different features of the application.

#### Acceptance Criteria

1. THE DashboardLayout SHALL display a sidebar navigation with links to Chat, Invoices, and Analytics sections
2. THE DashboardLayout SHALL display a header with "SmartBiz SA" branding
3. THE DashboardLayout SHALL provide a Dark_Mode toggle button in the header using sun/moon icons
4. THE DashboardLayout SHALL display a "Connected" status indicator in the header
5. THE DashboardLayout SHALL manage active tab state to control which content is displayed
6. WHEN a navigation item is clicked THEN THE DashboardLayout SHALL update the active tab and display the corresponding component

### Requirement 5

**User Story:** As a user, I want the application to support dark mode and responsive design, so that I can use it comfortably in different environments and on different devices.

#### Acceptance Criteria

1. WHEN Dark_Mode is enabled THEN THE application SHALL use slate-900 backgrounds and slate-100 text colors
2. WHEN Dark_Mode is disabled THEN THE application SHALL use white backgrounds and slate-800 text colors
3. THE application SHALL use blue-600 as the primary accent color for interactive elements
4. THE application SHALL adapt its layout responsively for mobile, tablet, and desktop screen sizes
5. THE application SHALL use clean white cards with appropriate shadows in light mode

