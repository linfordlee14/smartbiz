"""Property-based tests for Chat routes."""
import pytest
import sys
import os
from hypothesis import given, strategies as st, settings, assume

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, db


class TestChatResponseStructure:
    """Property tests for chat response structure."""
    
    # **Feature: smartbiz-flask-backend, Property 1: Chat endpoint returns valid response structure**
    @given(
        message=st.text(min_size=1, alphabet=st.characters(
            whitelist_categories=('L', 'N', 'P', 'S'),
            whitelist_characters=' '
        ))
    )
    @settings(max_examples=100, deadline=None)
    def test_chat_returns_valid_response_structure(self, message):
        """
        Property 1: Chat endpoint returns valid response structure
        
        *For any* valid non-empty message string sent to /api/chat, the response 
        SHALL contain a "response" field with a non-empty string value.
        
        **Validates: Requirements 1.1**
        """
        # Skip whitespace-only messages (those are invalid inputs)
        assume(message.strip())
        
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        
        with app.app_context():
            db.create_all()
            
            client = app.test_client()
            response = client.post('/api/chat', json={'message': message})
            
            # Should return 200
            assert response.status_code == 200, \
                f"Expected 200, got {response.status_code} for message: {repr(message)}"
            
            response_data = response.get_json()
            
            # Should contain 'response' field
            assert 'response' in response_data, \
                f"Response missing 'response' field: {response_data}"
            
            # Response should be a non-empty string
            assert isinstance(response_data['response'], str), \
                f"Response is not a string: {type(response_data['response'])}"
            
            assert len(response_data['response']) > 0, \
                f"Response is empty string"


class TestEmptyMessageValidation:
    """Property tests for empty message validation."""
    
    # **Feature: smartbiz-flask-backend, Property 2: Empty message validation**
    @given(
        whitespace=st.text(alphabet=' \t\n\r', min_size=0, max_size=10)
    )
    @settings(max_examples=100, deadline=None)
    def test_empty_or_whitespace_message_returns_400(self, whitespace):
        """
        Property 2: Empty message validation
        
        *For any* request to /api/chat where the message field is empty, 
        whitespace-only, or missing, the endpoint SHALL return HTTP 400 
        with error message "Message required".
        
        **Validates: Requirements 1.3**
        """
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        
        with app.app_context():
            db.create_all()
            
            client = app.test_client()
            
            # Test with whitespace-only message
            response = client.post('/api/chat', json={'message': whitespace})
            
            assert response.status_code == 400, \
                f"Expected 400, got {response.status_code} for whitespace message: {repr(whitespace)}"
            
            response_data = response.get_json()
            assert response_data.get('error') == 'Message required', \
                f"Expected 'Message required', got: {response_data}"
    
    @given(
        data=st.fixed_dictionaries({}, optional={'context': st.text()})
    )
    @settings(max_examples=100, deadline=None)
    def test_missing_message_field_returns_400(self, data):
        """
        Property 2: Empty message validation (missing field case)
        
        *For any* request to /api/chat where the message field is missing,
        the endpoint SHALL return HTTP 400 with error message "Message required".
        
        **Validates: Requirements 1.3**
        """
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        
        with app.app_context():
            db.create_all()
            
            client = app.test_client()
            
            # Test with missing message field
            response = client.post('/api/chat', json=data)
            
            assert response.status_code == 400, \
                f"Expected 400, got {response.status_code} for data: {data}"
            
            response_data = response.get_json()
            assert response_data.get('error') == 'Message required', \
                f"Expected 'Message required', got: {response_data}"


class TestSmartSQLEmptyQueryValidation:
    """Property tests for SmartSQL empty query validation."""
    
    # **Feature: smartbiz-flask-backend, Property 7: SmartSQL empty query validation**
    @given(
        whitespace=st.text(alphabet=' \t\n\r', min_size=0, max_size=10)
    )
    @settings(max_examples=100, deadline=None)
    def test_empty_or_whitespace_query_returns_400(self, whitespace):
        """
        Property 7: SmartSQL empty query validation
        
        *For any* request to /api/smartsql where the query field is empty 
        or missing, the endpoint SHALL return HTTP 400 with error message 
        "Query required".
        
        **Validates: Requirements 4.2**
        """
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        
        with app.app_context():
            db.create_all()
            
            client = app.test_client()
            
            # Test with whitespace-only query
            response = client.post('/api/smartsql', json={'query': whitespace})
            
            assert response.status_code == 400, \
                f"Expected 400, got {response.status_code} for whitespace query: {repr(whitespace)}"
            
            response_data = response.get_json()
            assert response_data.get('error') == 'Query required', \
                f"Expected 'Query required', got: {response_data}"
    
    @given(
        data=st.fixed_dictionaries({}, optional={'context': st.text()})
    )
    @settings(max_examples=100, deadline=None)
    def test_missing_query_field_returns_400(self, data):
        """
        Property 7: SmartSQL empty query validation (missing field case)
        
        *For any* request to /api/smartsql where the query field is missing,
        the endpoint SHALL return HTTP 400 with error message "Query required".
        
        **Validates: Requirements 4.2**
        """
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        
        with app.app_context():
            db.create_all()
            
            client = app.test_client()
            
            # Test with missing query field
            response = client.post('/api/smartsql', json=data)
            
            assert response.status_code == 400, \
                f"Expected 400, got {response.status_code} for data: {data}"
            
            response_data = response.get_json()
            assert response_data.get('error') == 'Query required', \
                f"Expected 'Query required', got: {response_data}"
