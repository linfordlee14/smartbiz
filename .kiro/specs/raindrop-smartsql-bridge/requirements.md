# Requirements Document

## Introduction

This specification defines the integration of Raindrop SmartSQL into the SmartBiz SA Flask backend via a "Bridge App" microservice architecture. The Bridge App will be created on the Raindrop platform using the `raindrop-code` CLI, exposing SmartSQL functionality as an HTTP POST endpoint. The Flask backend's SmartSQLService will be updated to call this new Raindrop endpoint instead of the direct LiquidMetal API, enabling the "Ask Data" feature to leverage Raindrop's SmartSQL capabilities for the hackathon sponsor prize.

## Glossary

- **Raindrop**: A platform that provides SmartSQL and other AI-powered data services, with CLI tooling for creating and deploying apps
- **SmartSQL**: Raindrop's natural language to SQL conversion and execution service
- **Bridge App**: A lightweight microservice deployed on Raindrop that exposes SmartSQL as an HTTP endpoint
- **raindrop-code**: CLI tool for initializing, developing, and deploying Raindrop applications
- **SmartSQLService**: The existing Flask service class that handles natural language database queries
- **Flask Backend**: The existing Python Flask application serving the SmartBiz SA API

## Requirements

### Requirement 1: Raindrop Bridge App Initialization

**User Story:** As a developer, I want to initialize a new Raindrop project using the CLI, so that I can create the Bridge App infrastructure.

#### Acceptance Criteria

1. WHEN a developer runs the raindrop-code init command with project name "smartbiz-bridge" THEN the CLI SHALL create a new project directory with the required configuration files
2. WHEN the project is initialized THEN the system SHALL generate a valid project structure compatible with Raindrop deployment
3. IF the raindrop-code CLI is not installed THEN the system SHALL provide clear installation instructions before proceeding

### Requirement 2: SmartSQL HTTP Endpoint Creation

**User Story:** As a developer, I want to create an HTTP POST endpoint in the Bridge App that accepts natural language queries and returns SQL results, so that my Flask backend can call it.

#### Acceptance Criteria

1. WHEN the Bridge App receives a POST request to the /query endpoint with a JSON body containing a "query" field THEN the system SHALL pass the query to SmartSQL for processing
2. WHEN SmartSQL successfully processes a query THEN the system SHALL return a JSON response containing the generated SQL and result rows
3. IF the query field is missing or empty THEN the system SHALL return a 400 status code with an appropriate error message
4. IF SmartSQL encounters an error during processing THEN the system SHALL return a 500 status code with error details
5. WHEN returning results THEN the system SHALL format the response as {"success": true, "sql": string, "results": array} for consistency with the existing Flask service interface

### Requirement 3: Bridge App Deployment

**User Story:** As a developer, I want to deploy the Bridge App to Raindrop's platform, so that it becomes accessible via a public URL.

#### Acceptance Criteria

1. WHEN a developer runs the raindrop-code deploy command THEN the system SHALL deploy the Bridge App to Raindrop's infrastructure
2. WHEN deployment succeeds THEN the system SHALL output the public URL where the Bridge App is accessible
3. IF deployment fails THEN the system SHALL provide clear error messages indicating the cause of failure

### Requirement 4: Flask SmartSQLService Integration

**User Story:** As a developer, I want to update the Flask SmartSQLService to call the Raindrop Bridge App endpoint, so that the "Ask Data" feature uses the new microservice.

#### Acceptance Criteria

1. WHEN the SmartSQLService is configured with a RAINDROP_BRIDGE_URL environment variable THEN the service SHALL use this URL for all SmartSQL requests
2. WHEN the SmartSQLService calls the Bridge App THEN the system SHALL send a POST request with the query in JSON format
3. WHEN the Bridge App returns a successful response THEN the SmartSQLService SHALL parse and return the results in the existing format
4. IF the Bridge App returns an error THEN the SmartSQLService SHALL handle the error gracefully and return an appropriate error response
5. WHEN the RAINDROP_BRIDGE_URL is not configured THEN the SmartSQLService SHALL fall back to the existing LiquidMetal API behavior for backward compatibility

### Requirement 5: Environment Configuration

**User Story:** As a developer, I want to configure the Bridge App URL via environment variables, so that I can easily switch between environments.

#### Acceptance Criteria

1. WHEN updating the .env file THEN the system SHALL include a RAINDROP_BRIDGE_URL variable for the Bridge App endpoint
2. WHEN updating the .env.example file THEN the system SHALL include documentation for the new RAINDROP_BRIDGE_URL variable
3. WHEN the Bridge App requires authentication THEN the system SHALL support a RAINDROP_API_KEY environment variable for secure access
