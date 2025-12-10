# Requirements Document

## Introduction

This specification defines the UI polish improvements for the SmartBiz SA frontend application to achieve a high-end SaaS product appearance. The improvements focus on enhanced spacing, professional card styling, modern chat interface with empty state, and a paper-like invoice preview. All changes maintain existing functionality and API connections while upgrading the visual presentation using Tailwind CSS.

## Glossary

- **SmartBiz_UI**: The React-based frontend user interface for SmartBiz SA
- **DashboardLayout**: The main layout component containing header, sidebar, and content area
- **ChatInterface**: The conversational AI interface component for business advice
- **InvoiceGenerator**: The form-based invoice creation component with live preview
- **AnalyticsDashboard**: The business metrics and natural language query component
- **Card**: A contained UI element with background, shadow, border, and rounded corners
- **Empty_State**: A placeholder UI shown when no content exists, featuring suggestions
- **Suggestion_Chip**: A clickable button displaying a pre-defined query suggestion
- **Message_Bubble**: A styled container for individual chat messages
- **Live_Preview**: The real-time invoice preview panel in the InvoiceGenerator

## Requirements

### Requirement 1

**User Story:** As a user, I want the main content area to have generous padding, so that the interface feels spacious and professional.

#### Acceptance Criteria

1. WHEN the DashboardLayout renders the main content area THEN the SmartBiz_UI SHALL apply padding of p-8 or greater to create visual breathing room from the sidebar
2. WHEN viewing any tab content THEN the SmartBiz_UI SHALL maintain consistent padding across all views (Chat, Invoices, Analytics)

### Requirement 2

**User Story:** As a user, I want all cards and containers to have a polished, professional appearance, so that the application looks like a premium SaaS product.

#### Acceptance Criteria

1. WHEN rendering a Card in light mode THEN the SmartBiz_UI SHALL apply bg-white background color
2. WHEN rendering a Card in dark mode THEN the SmartBiz_UI SHALL apply bg-slate-800 background color
3. WHEN rendering any Card THEN the SmartBiz_UI SHALL apply shadow-lg for a professional shadow effect
4. WHEN rendering any Card THEN the SmartBiz_UI SHALL apply rounded-xl or rounded-2xl for smooth corners
5. WHEN rendering a Card in light mode THEN the SmartBiz_UI SHALL apply border border-slate-200
6. WHEN rendering a Card in dark mode THEN the SmartBiz_UI SHALL apply border border-slate-700

### Requirement 3

**User Story:** As a user, I want to see helpful suggestions when the chat is empty, so that I know how to start using the AI assistant.

#### Acceptance Criteria

1. WHEN the ChatInterface has no messages THEN the SmartBiz_UI SHALL display the Logo component centered in the chat area
2. WHEN the ChatInterface has no messages THEN the SmartBiz_UI SHALL display exactly 3 clickable Suggestion_Chips below the Logo
3. WHEN a user clicks a Suggestion_Chip THEN the SmartBiz_UI SHALL populate the input field with the suggestion text and submit the message
4. THE SmartBiz_UI SHALL include these specific suggestions: "How do I register for VAT?", "Draft a payment reminder", "Analyze my revenue"

### Requirement 4

**User Story:** As a user, I want modern-looking message bubbles in the chat, so that the conversation feels contemporary and polished.

#### Acceptance Criteria

1. WHEN rendering user Message_Bubbles THEN the SmartBiz_UI SHALL apply rounded-2xl corners and appropriate padding for a modern appearance
2. WHEN rendering assistant Message_Bubbles THEN the SmartBiz_UI SHALL apply rounded-2xl corners with a distinct visual style from user messages
3. WHEN rendering Message_Bubbles THEN the SmartBiz_UI SHALL apply subtle shadows and smooth transitions for a polished feel

### Requirement 5

**User Story:** As a user, I want the invoice live preview to look like a physical sheet of paper, so that I can visualize the final document.

#### Acceptance Criteria

1. WHEN rendering the Live_Preview panel THEN the SmartBiz_UI SHALL apply a white background regardless of dark mode setting
2. WHEN rendering the Live_Preview panel THEN the SmartBiz_UI SHALL apply a distinct shadow (shadow-xl or shadow-2xl) to create a paper-like depth effect
3. WHEN rendering the Live_Preview panel THEN the SmartBiz_UI SHALL center the preview within its container with appropriate margins
4. WHEN rendering the Live_Preview panel THEN the SmartBiz_UI SHALL apply a subtle border to define the paper edge

### Requirement 6

**User Story:** As a user, I want the metric cards in the Analytics Dashboard to have consistent premium styling, so that the dashboard looks cohesive and professional.

#### Acceptance Criteria

1. WHEN rendering metric cards THEN the SmartBiz_UI SHALL apply the standard Card styling (shadow-lg, rounded-xl, appropriate borders)
2. WHEN rendering the Ask Data section THEN the SmartBiz_UI SHALL apply the standard Card styling for visual consistency
