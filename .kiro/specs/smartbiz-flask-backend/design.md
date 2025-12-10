# Design Document

## Overview

The SmartBiz SA Flask backend is a REST API server that provides AI-powered business assistance for South African entrepreneurs. It integrates three AI systems (Cerebras, LiquidMetal SmartSQL, ElevenLabs) and provides SARS-compliant invoicing with automatic 15% VAT calculation. The backend uses Flask with SQLAlchemy ORM and follows a modular service-oriented architecture.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                     │
│              http://localhost:5173                           │
└─────────────────────────┬───────────────────────────────────┘
                          │ Axios HTTP
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Flask Backend (app.py)                      │
│                  http://localhost:5000                       │
├─────────────────────────────────────────────────────────────┤
│  Routes (Blueprints)                                         │
│  ├── /api/chat      → chat.py                               │
│  ├── /api/chat/voice → chat.py                              │
│  ├── /api/smartsql  → chat.py                               │
│  └── /api/invoice   → invoice.py                            │
├─────────────────────────────────────────────────────────────┤
│  Services                                                    │
│  ├── CerebrasService    → Cerebras API (llama-3.1-8b)       │
│  ├── ElevenLabsService  → ElevenLabs TTS API                │
│  ├── SmartSQLService    → LiquidMetal SmartSQL              │
│  └── InvoiceService     → VAT calculation & persistence     │
├─────────────────────────────────────────────────────────────┤
│  Models (SQLAlchemy)                                         │
│  ├── User                                                    │
│  ├── Business                                                │
│  ├── Invoice                                                 │
│  └── ChatHistory                                             │
└─────────────────────────┬───────────────────────────────────┘
                          │ SQLAlchemy ORM
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              SQLite (dev) / PostgreSQL (prod)                │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Flask Application (app.py)

The main application entry point that:
- Initializes Flask with CORS configuration
- Configures SQLAlchemy database connection
- Registers route blueprints
- Provides health check and error handlers

```python
# Key interfaces
app = Flask(__name__)
db = SQLAlchemy(app)

# Blueprints
app.register_blueprint(chat_bp)
app.register_blueprint(invoice_bp)
```

### Route Blueprints

#### Chat Blueprint (routes/chat.py)

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/chat | POST | Text chat with Cerebras AI |
| /api/chat/voice | POST | Voice-enabled chat with ElevenLabs |
| /api/chat/voices | GET | List available ElevenLabs voices |
| /api/smartsql | POST | Natural language database queries |

#### Invoice Blueprint (routes/invoice.py)

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/invoice/generate | POST | Generate SARS-compliant invoice |
| /api/invoice/list/{business_id} | GET | List invoices for business |
| /api/invoice/{invoice_id} | GET | Get specific invoice |

### Service Classes

#### CerebrasService

```python
class CerebrasService:
    def __init__(self):
        self.api_key = os.getenv('CEREBRAS_API_KEY')
        self.base_url = "https://api.cerebras.ai/v1"
        self.model = "llama-3.1-8b"
    
    def get_response(self, message: str, context: str = "") -> str:
        """Get AI response from Cerebras, falls back to demo if no API key"""
```

#### ElevenLabsService

```python
class ElevenLabsService:
    def __init__(self):
        self.api_key = os.getenv('ELEVENLABS_API_KEY')
        self.base_url = "https://api.elevenlabs.io/v1"
        self.default_voice_id = os.getenv('ELEVENLABS_VOICE_ID', 'rachel')
    
    def text_to_speech(self, text: str, voice_id: str = None) -> dict:
        """Convert text to MP3 audio, returns {success, audio_data/error}"""
    
    def get_available_voices(self) -> list:
        """Get list of available voices from ElevenLabs"""
```

#### SmartSQLService

```python
class SmartSQLService:
    def __init__(self):
        self.api_key = os.getenv('LIQUIDMETAL_API_KEY')
    
    def execute_query(self, natural_language_query: str) -> dict:
        """Convert natural language to SQL and execute"""
```

#### InvoiceService

```python
class InvoiceService:
    VAT_RATE = 0.15  # 15% South African VAT
    
    def generate_invoice(self, business_id, client_name, items, ...) -> dict:
        """Generate SARS-compliant invoice with VAT calculation"""
    
    def list_invoices(self, business_id: str) -> list:
        """Get all invoices for a business"""
    
    def get_invoice(self, invoice_id: str) -> dict:
        """Get specific invoice by ID"""
```

## Data Models

### User Model

| Field | Type | Constraints |
|-------|------|-------------|
| id | String(36) | Primary Key, UUID |
| email | String(255) | Unique, Not Null |
| name | String(255) | Not Null |
| created_at | DateTime | Default: utcnow |

Relationships: One-to-Many with Business, ChatHistory

### Business Model

| Field | Type | Constraints |
|-------|------|-------------|
| id | String(36) | Primary Key, UUID |
| user_id | String(36) | Foreign Key (users.id), Not Null |
| name | String(255) | Not Null |
| vat_number | String(20) | Nullable |
| industry | String(100) | Nullable |
| registration_date | DateTime | Default: utcnow |
| created_at | DateTime | Default: utcnow |

Relationships: Many-to-One with User, One-to-Many with Invoice

### Invoice Model

| Field | Type | Constraints |
|-------|------|-------------|
| id | String(36) | Primary Key, UUID |
| business_id | String(36) | Foreign Key (businesses.id), Not Null |
| invoice_number | String(50) | Unique, Not Null |
| client_name | String(255) | Not Null |
| client_vat | String(20) | Nullable |
| total_excl_vat | Float | Not Null |
| vat_amount | Float | Not Null |
| total_incl_vat | Float | Not Null |
| issued_date | DateTime | Default: utcnow |
| due_date | DateTime | Nullable |
| items_json | JSON | Nullable |
| is_paid | Boolean | Default: False |
| paid_date | DateTime | Nullable |
| created_at | DateTime | Default: utcnow |

Relationships: Many-to-One with Business

### ChatHistory Model

| Field | Type | Constraints |
|-------|------|-------------|
| id | String(36) | Primary Key, UUID |
| user_id | String(36) | Foreign Key (users.id), Not Null |
| message | Text | Not Null |
| response | Text | Not Null |
| used_voice | Boolean | Default: False |
| created_at | DateTime | Default: utcnow |

Relationships: Many-to-One with User



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Chat endpoint returns valid response structure

*For any* valid non-empty message string sent to /api/chat, the response SHALL contain a "response" field with a non-empty string value.

**Validates: Requirements 1.1**

### Property 2: Empty message validation

*For any* request to /api/chat where the message field is empty, whitespace-only, or missing, the endpoint SHALL return HTTP 400 with error message "Message required".

**Validates: Requirements 1.3**

### Property 3: VAT calculation correctness

*For any* invoice with line items, the vat_amount SHALL equal exactly total_excl_vat * 0.15 (15% VAT), and total_incl_vat SHALL equal total_excl_vat + vat_amount.

**Validates: Requirements 3.1**

### Property 4: Invoice number format

*For any* generated invoice, the invoice_number SHALL match the pattern "INV-{digits}" where digits is a valid timestamp.

**Validates: Requirements 3.2**

### Property 5: Invoice generation validation

*For any* request to /api/invoice/generate missing any of business_id, client_name, or items, the endpoint SHALL return HTTP 400 with error message "Missing required fields".

**Validates: Requirements 3.3**

### Property 6: Invoice list filtering

*For any* business_id, all invoices returned by /api/invoice/list/{business_id} SHALL have business_id matching the requested business_id.

**Validates: Requirements 3.4**

### Property 7: SmartSQL empty query validation

*For any* request to /api/smartsql where the query field is empty or missing, the endpoint SHALL return HTTP 400 with error message "Query required".

**Validates: Requirements 4.2**

### Property 8: Invoice serialization round-trip

*For any* valid Invoice model instance, serializing to JSON dictionary and then using those values to create a new Invoice SHALL produce an equivalent invoice with matching field values.

**Validates: Requirements 7.5, 7.6**

## Error Handling

### API Error Responses

All API errors return JSON with consistent structure:

```python
{
    "error": "Error message description"
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful request |
| 400 | Bad request (missing/invalid parameters) |
| 404 | Resource not found |
| 500 | Internal server error |

### Service Error Handling

1. **Cerebras Service**: Falls back to demo responses when API key missing or API errors occur
2. **ElevenLabs Service**: Returns text response with voice_error field when TTS fails
3. **SmartSQL Service**: Returns 500 with error message on query failures
4. **Invoice Service**: Validates all required fields before processing

### Logging

- All service errors are logged with `print()` for debugging
- Production should use proper logging framework (e.g., Python logging module)

## Testing Strategy

### Property-Based Testing

The backend will use **Hypothesis** as the property-based testing library for Python.

Each property-based test will:
- Run a minimum of 100 iterations
- Be tagged with a comment referencing the correctness property
- Use smart generators that constrain to valid input spaces

Example test annotation format:
```python
# **Feature: smartbiz-flask-backend, Property 3: VAT calculation correctness**
@given(items=st.lists(st.fixed_dictionaries({...}), min_size=1))
def test_vat_calculation_property(items):
    ...
```

### Unit Testing

Unit tests will cover:
- Specific endpoint examples with known inputs/outputs
- Edge cases (empty lists, boundary values)
- Error conditions and exception handling
- Database model creation and relationships

### Test Organization

```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # Pytest fixtures
│   ├── test_chat.py         # Chat endpoint tests
│   ├── test_invoice.py      # Invoice endpoint tests
│   ├── test_models.py       # Database model tests
│   └── test_services.py     # Service class tests
```

### Test Fixtures

- Flask test client for API testing
- In-memory SQLite database for isolation
- Mock services for external API testing
