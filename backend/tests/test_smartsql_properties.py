"""Property-based tests for SmartSQLService.

These tests validate correctness properties for the Raindrop SmartSQL Bridge integration.
"""
import json
import pytest
import requests
from hypothesis import given, settings, strategies as st
from unittest.mock import patch, MagicMock
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.smartsql_service import SmartSQLService


class TestURLRoutingBasedOnConfiguration:
    """Property tests for URL routing based on configuration.
    
    **Feature: raindrop-smartsql-bridge, Property 1: URL Routing Based on Configuration**
    **Validates: Requirements 4.1, 4.5**
    """
    
    # Strategy for generating valid HTTP URLs
    url_path_strategy = st.text(
        alphabet=st.sampled_from('abcdefghijklmnopqrstuvwxyz0123456789-_'),
        min_size=1,
        max_size=30
    )
    
    raindrop_url_strategy = st.builds(
        lambda domain, path: f"https://{domain}.raindrop.app/{path}",
        domain=st.text(
            alphabet=st.sampled_from('abcdefghijklmnopqrstuvwxyz0123456789-'),
            min_size=3,
            max_size=20
        ).filter(lambda x: x and not x.startswith('-') and not x.endswith('-')),
        path=st.text(
            alphabet=st.sampled_from('abcdefghijklmnopqrstuvwxyz0123456789-_'),
            min_size=1,
            max_size=20
        )
    )
    
    query_strategy = st.text(min_size=1, max_size=100).filter(lambda x: x.strip())
    
    api_key_strategy = st.text(
        alphabet=st.sampled_from('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),
        min_size=10,
        max_size=50
    )
    
    @given(
        raindrop_url=raindrop_url_strategy,
        query=query_strategy
    )
    @settings(max_examples=100, deadline=None)
    def test_routes_to_raindrop_when_configured(self, raindrop_url, query):
        """
        Property 1: URL Routing Based on Configuration - Raindrop path
        
        *For any* SmartSQLService instance, if RAINDROP_BRIDGE_URL is configured,
        the service should route requests to that URL.
        
        **Validates: Requirements 4.1, 4.5**
        """
        # Clear any existing env vars and set only Raindrop URL
        env_vars = {
            'RAINDROP_BRIDGE_URL': raindrop_url,
            'LIQUIDMETAL_API_KEY': '',
            'LIQUIDMETAL_BASE_URL': ''
        }
        
        with patch.dict(os.environ, env_vars, clear=False):
            service = SmartSQLService()
            
            # Mock both potential endpoints
            with patch('services.smartsql_service.requests.post') as mock_post:
                mock_response = MagicMock()
                mock_response.json.return_value = {
                    "success": True,
                    "sql": "SELECT 1",
                    "results": []
                }
                mock_response.raise_for_status = MagicMock()
                mock_post.return_value = mock_response
                
                # Execute query
                service.execute_query(query)
                
                # Property: Request should be made to Raindrop URL
                assert mock_post.called, "requests.post should have been called"
                call_args = mock_post.call_args
                called_url = call_args.args[0] if call_args.args else call_args.kwargs.get('url')
                
                assert called_url == raindrop_url, \
                    f"Should route to Raindrop URL. Expected: {raindrop_url}, Got: {called_url}"
    
    @given(
        liquidmetal_url=st.just('https://api.liquidmetal.ai/v1'),
        liquidmetal_key=api_key_strategy,
        query=query_strategy
    )
    @settings(max_examples=100, deadline=None)
    def test_falls_back_to_liquidmetal_when_raindrop_not_configured(self, liquidmetal_url, liquidmetal_key, query):
        """
        Property 1: URL Routing Based on Configuration - LiquidMetal fallback
        
        *For any* SmartSQLService instance, if RAINDROP_BRIDGE_URL is NOT configured,
        the service should fall back to the LiquidMetal API URL.
        
        **Validates: Requirements 4.1, 4.5**
        """
        # Set only LiquidMetal config, no Raindrop
        env_vars = {
            'RAINDROP_BRIDGE_URL': '',
            'LIQUIDMETAL_API_KEY': liquidmetal_key,
            'LIQUIDMETAL_BASE_URL': liquidmetal_url
        }
        
        with patch.dict(os.environ, env_vars, clear=False):
            service = SmartSQLService()
            
            # Verify Raindrop is not configured
            assert not service._use_raindrop(), "Raindrop should not be used when URL is empty"
            
            with patch('services.smartsql_service.requests.post') as mock_post:
                mock_response = MagicMock()
                mock_response.json.return_value = {
                    "success": True,
                    "sql": "SELECT 1",
                    "results": []
                }
                mock_response.raise_for_status = MagicMock()
                mock_post.return_value = mock_response
                
                # Execute query
                service.execute_query(query)
                
                # Property: Request should be made to LiquidMetal URL
                assert mock_post.called, "requests.post should have been called"
                call_args = mock_post.call_args
                called_url = call_args.args[0] if call_args.args else call_args.kwargs.get('url')
                
                expected_url = f"{liquidmetal_url}/smartsql"
                assert called_url == expected_url, \
                    f"Should fall back to LiquidMetal URL. Expected: {expected_url}, Got: {called_url}"
    
    @given(
        raindrop_url=raindrop_url_strategy,
        liquidmetal_key=api_key_strategy,
        query=query_strategy
    )
    @settings(max_examples=100, deadline=None)
    def test_raindrop_takes_precedence_over_liquidmetal(self, raindrop_url, liquidmetal_key, query):
        """
        Property 1: URL Routing Based on Configuration - Raindrop precedence
        
        *For any* SmartSQLService instance where BOTH Raindrop and LiquidMetal are configured,
        the service should prefer Raindrop and route requests to the Raindrop URL.
        
        **Validates: Requirements 4.1, 4.5**
        """
        # Set both Raindrop and LiquidMetal config
        env_vars = {
            'RAINDROP_BRIDGE_URL': raindrop_url,
            'LIQUIDMETAL_API_KEY': liquidmetal_key,
            'LIQUIDMETAL_BASE_URL': 'https://api.liquidmetal.ai/v1'
        }
        
        with patch.dict(os.environ, env_vars, clear=False):
            service = SmartSQLService()
            
            # Verify Raindrop is preferred
            assert service._use_raindrop(), "Raindrop should be used when URL is configured"
            
            with patch('services.smartsql_service.requests.post') as mock_post:
                mock_response = MagicMock()
                mock_response.json.return_value = {
                    "success": True,
                    "sql": "SELECT 1",
                    "results": []
                }
                mock_response.raise_for_status = MagicMock()
                mock_post.return_value = mock_response
                
                # Execute query
                service.execute_query(query)
                
                # Property: Request should be made to Raindrop URL (not LiquidMetal)
                assert mock_post.called, "requests.post should have been called"
                call_args = mock_post.call_args
                called_url = call_args.args[0] if call_args.args else call_args.kwargs.get('url')
                
                assert called_url == raindrop_url, \
                    f"Raindrop should take precedence. Expected: {raindrop_url}, Got: {called_url}"
                assert "liquidmetal" not in called_url.lower(), \
                    "Should NOT route to LiquidMetal when Raindrop is configured"


class TestRequestFormatConsistency:
    """Property tests for request format consistency when calling Raindrop Bridge.
    
    **Feature: raindrop-smartsql-bridge, Property 2: Request Format Consistency**
    **Validates: Requirements 4.2**
    """
    
    @given(
        query=st.text(min_size=1, max_size=500).filter(lambda x: x.strip())
    )
    @settings(max_examples=100, deadline=None)
    def test_request_body_contains_query_field(self, query):
        """
        Property 2: Request Format Consistency
        
        *For any* natural language query string, when the SmartSQLService calls 
        the Raindrop Bridge, the request body should be a valid JSON object 
        containing exactly the "query" field with the original query string.
        
        **Validates: Requirements 4.2**
        """
        # Create service with Raindrop URL configured
        with patch.dict(os.environ, {
            'RAINDROP_BRIDGE_URL': 'https://test-bridge.raindrop.app/query'
        }):
            service = SmartSQLService()
            
            # Mock requests.post to capture the actual request
            with patch('services.smartsql_service.requests.post') as mock_post:
                # Set up mock response
                mock_response = MagicMock()
                mock_response.json.return_value = {
                    "success": True,
                    "sql": "SELECT * FROM test",
                    "results": []
                }
                mock_response.raise_for_status = MagicMock()
                mock_post.return_value = mock_response
                
                # Execute the query
                service._call_raindrop_bridge(query)
                
                # Verify the request was made
                assert mock_post.called, "requests.post should have been called"
                
                # Get the actual call arguments
                call_args = mock_post.call_args
                
                # Verify the json payload
                json_payload = call_args.kwargs.get('json')
                assert json_payload is not None, "Request should have json payload"
                
                # Property: The payload should contain exactly the "query" field
                assert "query" in json_payload, "Payload must contain 'query' field"
                assert json_payload["query"] == query, \
                    f"Query field should contain original query. Expected: {query!r}, Got: {json_payload['query']!r}"
                
                # Property: The payload should be a valid JSON-serializable object
                try:
                    json.dumps(json_payload)
                except (TypeError, ValueError) as e:
                    pytest.fail(f"Payload should be JSON-serializable: {e}")


class TestResponseParsingConsistency:
    """Property tests for response parsing consistency from Raindrop Bridge.
    
    **Feature: raindrop-smartsql-bridge, Property 3: Response Parsing Consistency**
    **Validates: Requirements 2.5, 4.3**
    """
    
    @given(
        sql=st.text(min_size=1, max_size=500),
        results=st.lists(
            st.dictionaries(
                keys=st.text(min_size=1, max_size=50).filter(lambda x: x.strip()),
                values=st.one_of(
                    st.none(),
                    st.booleans(),
                    st.integers(),
                    st.floats(allow_nan=False, allow_infinity=False),
                    st.text(max_size=100)
                ),
                min_size=0,
                max_size=5
            ),
            min_size=0,
            max_size=10
        )
    )
    @settings(max_examples=100, deadline=None)
    def test_successful_response_parsing_preserves_structure(self, sql, results):
        """
        Property 3: Response Parsing Consistency
        
        *For any* successful Bridge App response containing {success: true, sql: string, results: array},
        the SmartSQLService should return a dictionary with identical structure and values.
        
        **Validates: Requirements 2.5, 4.3**
        """
        # Create service with Raindrop URL configured
        with patch.dict(os.environ, {
            'RAINDROP_BRIDGE_URL': 'https://test-bridge.raindrop.app/query'
        }):
            service = SmartSQLService()
            
            # Create the Bridge App response
            bridge_response = {
                "success": True,
                "sql": sql,
                "results": results
            }
            
            # Mock requests.post to return our generated response
            with patch('services.smartsql_service.requests.post') as mock_post:
                mock_response = MagicMock()
                mock_response.json.return_value = bridge_response
                mock_response.raise_for_status = MagicMock()
                mock_post.return_value = mock_response
                
                # Execute the query
                result = service._call_raindrop_bridge("test query")
                
                # Property: The result should have identical structure
                assert result["success"] == True, "Result should indicate success"
                assert result["sql"] == sql, \
                    f"SQL should be preserved. Expected: {sql!r}, Got: {result['sql']!r}"
                assert result["results"] == results, \
                    f"Results should be preserved. Expected: {results!r}, Got: {result['results']!r}"


class TestErrorResponseHandling:
    """Property tests for error response handling from Raindrop Bridge.
    
    **Feature: raindrop-smartsql-bridge, Property 4: Error Response Handling**
    **Validates: Requirements 4.4**
    """
    
    @given(
        error_message=st.text(min_size=1, max_size=500).filter(lambda x: x.strip())
    )
    @settings(max_examples=100, deadline=None)
    def test_error_response_with_success_false(self, error_message):
        """
        Property 4: Error Response Handling - JSON error response
        
        *For any* error response from the Bridge App with {success: false, error: string},
        the SmartSQLService should return {success: false, error: string} without raising exceptions.
        
        **Validates: Requirements 4.4**
        """
        with patch.dict(os.environ, {
            'RAINDROP_BRIDGE_URL': 'https://test-bridge.raindrop.app/query'
        }):
            service = SmartSQLService()
            
            # Create error response from Bridge App
            bridge_error_response = {
                "success": False,
                "error": error_message
            }
            
            with patch('services.smartsql_service.requests.post') as mock_post:
                mock_response = MagicMock()
                mock_response.json.return_value = bridge_error_response
                mock_response.raise_for_status = MagicMock()
                mock_post.return_value = mock_response
                
                # Execute the query - should NOT raise an exception
                result = service._call_raindrop_bridge("test query")
                
                # Property: Result should be {success: false, error: string}
                assert result["success"] == False, "Result should indicate failure"
                assert "error" in result, "Result must contain 'error' field"
                assert isinstance(result["error"], str), "Error must be a string"
                assert result["error"] == error_message, \
                    f"Error message should be preserved. Expected: {error_message!r}, Got: {result['error']!r}"
    
    @given(
        status_code=st.sampled_from([400, 401, 403, 404, 500, 502, 503, 504])
    )
    @settings(max_examples=100, deadline=None)
    def test_http_error_status_codes(self, status_code):
        """
        Property 4: Error Response Handling - HTTP error status codes
        
        *For any* HTTP 4xx/5xx error response from the Bridge App,
        the SmartSQLService should return {success: false, error: string} without raising exceptions.
        
        **Validates: Requirements 4.4**
        """
        with patch.dict(os.environ, {
            'RAINDROP_BRIDGE_URL': 'https://test-bridge.raindrop.app/query'
        }):
            service = SmartSQLService()
            
            with patch('services.smartsql_service.requests.post') as mock_post:
                # Simulate HTTP error by raising HTTPError on raise_for_status
                mock_response = MagicMock()
                mock_response.status_code = status_code
                http_error = requests.exceptions.HTTPError(
                    f"{status_code} Error",
                    response=mock_response
                )
                mock_response.raise_for_status.side_effect = http_error
                mock_post.return_value = mock_response
                
                # Execute the query - should NOT raise an exception
                result = service._call_raindrop_bridge("test query")
                
                # Property: Result should be {success: false, error: string}
                assert result["success"] == False, \
                    f"Result should indicate failure for HTTP {status_code}"
                assert "error" in result, "Result must contain 'error' field"
                assert isinstance(result["error"], str), "Error must be a string"
                assert len(result["error"]) > 0, "Error message should not be empty"
    
    @given(
        exception_type=st.sampled_from([
            requests.exceptions.ConnectionError,
            requests.exceptions.Timeout
        ])
    )
    @settings(max_examples=100, deadline=None)
    def test_connection_and_timeout_errors(self, exception_type):
        """
        Property 4: Error Response Handling - Connection and timeout errors
        
        *For any* connection error or timeout from the Bridge App,
        the SmartSQLService should return {success: false, error: string} without raising exceptions.
        
        **Validates: Requirements 4.4**
        """
        with patch.dict(os.environ, {
            'RAINDROP_BRIDGE_URL': 'https://test-bridge.raindrop.app/query'
        }):
            service = SmartSQLService()
            
            with patch('services.smartsql_service.requests.post') as mock_post:
                # Simulate connection/timeout error
                mock_post.side_effect = exception_type("Connection failed")
                
                # Execute the query - should NOT raise an exception
                result = service._call_raindrop_bridge("test query")
                
                # Property: Result should be {success: false, error: string}
                assert result["success"] == False, \
                    f"Result should indicate failure for {exception_type.__name__}"
                assert "error" in result, "Result must contain 'error' field"
                assert isinstance(result["error"], str), "Error must be a string"
                assert len(result["error"]) > 0, "Error message should not be empty"


class TestAuthenticationHeaderInclusion:
    """Property tests for authentication header inclusion when calling Raindrop Bridge.
    
    **Feature: raindrop-smartsql-bridge, Property 5: Authentication Header Inclusion**
    **Validates: Requirements 5.3**
    """
    
    # Strategy for generating valid API keys
    api_key_strategy = st.text(
        alphabet=st.sampled_from('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),
        min_size=10,
        max_size=50
    )
    
    query_strategy = st.text(min_size=1, max_size=100).filter(lambda x: x.strip())
    
    @given(
        api_key=api_key_strategy,
        query=query_strategy
    )
    @settings(max_examples=100, deadline=None)
    def test_authorization_header_included_when_api_key_configured(self, api_key, query):
        """
        Property 5: Authentication Header Inclusion
        
        *For any* request to the Raindrop Bridge when RAINDROP_API_KEY is configured,
        the request should include an Authorization header with the API key.
        
        **Validates: Requirements 5.3**
        """
        with patch.dict(os.environ, {
            'RAINDROP_BRIDGE_URL': 'https://test-bridge.raindrop.app/query',
            'RAINDROP_API_KEY': api_key
        }):
            service = SmartSQLService()
            
            with patch('services.smartsql_service.requests.post') as mock_post:
                mock_response = MagicMock()
                mock_response.json.return_value = {
                    "success": True,
                    "sql": "SELECT 1",
                    "results": []
                }
                mock_response.raise_for_status = MagicMock()
                mock_post.return_value = mock_response
                
                # Execute the query
                service._call_raindrop_bridge(query)
                
                # Verify the request was made
                assert mock_post.called, "requests.post should have been called"
                
                # Get the actual call arguments
                call_args = mock_post.call_args
                headers = call_args.kwargs.get('headers', {})
                
                # Property: Authorization header should be present with Bearer token
                assert "Authorization" in headers, \
                    "Authorization header must be present when API key is configured"
                assert headers["Authorization"] == f"Bearer {api_key}", \
                    f"Authorization header should contain Bearer token with API key. " \
                    f"Expected: 'Bearer {api_key}', Got: '{headers['Authorization']}'"
    
    @given(
        query=query_strategy
    )
    @settings(max_examples=100, deadline=None)
    def test_no_authorization_header_when_api_key_not_configured(self, query):
        """
        Property 5: Authentication Header Inclusion - No header when no key
        
        *For any* request to the Raindrop Bridge when RAINDROP_API_KEY is NOT configured,
        the request should NOT include an Authorization header.
        
        **Validates: Requirements 5.3**
        """
        with patch.dict(os.environ, {
            'RAINDROP_BRIDGE_URL': 'https://test-bridge.raindrop.app/query',
            'RAINDROP_API_KEY': ''
        }):
            service = SmartSQLService()
            
            with patch('services.smartsql_service.requests.post') as mock_post:
                mock_response = MagicMock()
                mock_response.json.return_value = {
                    "success": True,
                    "sql": "SELECT 1",
                    "results": []
                }
                mock_response.raise_for_status = MagicMock()
                mock_post.return_value = mock_response
                
                # Execute the query
                service._call_raindrop_bridge(query)
                
                # Verify the request was made
                assert mock_post.called, "requests.post should have been called"
                
                # Get the actual call arguments
                call_args = mock_post.call_args
                headers = call_args.kwargs.get('headers', {})
                
                # Property: Authorization header should NOT be present
                assert "Authorization" not in headers, \
                    "Authorization header should NOT be present when API key is not configured"
