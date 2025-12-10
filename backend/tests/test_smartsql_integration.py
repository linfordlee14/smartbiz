"""Integration tests for SmartSQLService.

These tests verify the end-to-end behavior of SmartSQLService with mocked
external dependencies (Bridge App and LiquidMetal API).

_Requirements: 4.1, 4.5_
"""
import pytest
import sys
import os
from unittest.mock import patch, MagicMock
import requests

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.smartsql_service import SmartSQLService


class TestRaindropBridgeIntegration:
    """Integration tests for SmartSQLService with mocked Raindrop Bridge responses.
    
    _Requirements: 4.1_
    """
    
    def test_successful_query_through_raindrop_bridge(self):
        """Test successful query execution through Raindrop Bridge."""
        with patch.dict(os.environ, {
            'RAINDROP_BRIDGE_URL': 'https://smartbiz-bridge.raindrop.app/query',
            'RAINDROP_API_KEY': '',
            'LIQUIDMETAL_API_KEY': ''
        }):
            service = SmartSQLService()
            
            mock_response = {
                "success": True,
                "sql": "SELECT * FROM invoices WHERE amount > 1000",
                "results": [
                    {"id": 1, "amount": 1500.00, "customer": "Acme Corp"},
                    {"id": 2, "amount": 2300.50, "customer": "TechStart"}
                ]
            }
            
            with patch('services.smartsql_service.requests.post') as mock_post:
                mock_resp = MagicMock()
                mock_resp.json.return_value = mock_response
                mock_resp.raise_for_status = MagicMock()
                mock_post.return_value = mock_resp
                
                result = service.execute_query("Show me invoices over $1000")
                
                assert result["success"] is True
                assert result["sql"] == "SELECT * FROM invoices WHERE amount > 1000"
                assert len(result["results"]) == 2
                assert result["results"][0]["customer"] == "Acme Corp"
    
    def test_raindrop_bridge_error_response(self):
        """Test handling of error response from Raindrop Bridge."""
        with patch.dict(os.environ, {
            'RAINDROP_BRIDGE_URL': 'https://smartbiz-bridge.raindrop.app/query',
            'RAINDROP_API_KEY': ''
        }):
            service = SmartSQLService()
            
            mock_response = {
                "success": False,
                "error": "Unable to parse query: ambiguous table reference"
            }
            
            with patch('services.smartsql_service.requests.post') as mock_post:
                mock_resp = MagicMock()
                mock_resp.json.return_value = mock_response
                mock_resp.raise_for_status = MagicMock()
                mock_post.return_value = mock_resp
                
                result = service.execute_query("Show me the data")
                
                assert result["success"] is False
                assert "ambiguous table reference" in result["error"]
    
    def test_raindrop_bridge_connection_timeout(self):
        """Test handling of connection timeout to Raindrop Bridge."""
        with patch.dict(os.environ, {
            'RAINDROP_BRIDGE_URL': 'https://smartbiz-bridge.raindrop.app/query',
            'RAINDROP_API_KEY': ''
        }):
            service = SmartSQLService()
            
            with patch('services.smartsql_service.requests.post') as mock_post:
                mock_post.side_effect = requests.exceptions.Timeout("Connection timed out")
                
                result = service.execute_query("Show me all invoices")
                
                assert result["success"] is False
                assert "timed out" in result["error"].lower()
    
    def test_raindrop_bridge_connection_error(self):
        """Test handling of connection error to Raindrop Bridge."""
        with patch.dict(os.environ, {
            'RAINDROP_BRIDGE_URL': 'https://smartbiz-bridge.raindrop.app/query',
            'RAINDROP_API_KEY': ''
        }):
            service = SmartSQLService()
            
            with patch('services.smartsql_service.requests.post') as mock_post:
                mock_post.side_effect = requests.exceptions.ConnectionError("Failed to connect")
                
                result = service.execute_query("Show me all invoices")
                
                assert result["success"] is False
                assert "failed" in result["error"].lower()
    
    def test_raindrop_bridge_with_api_key(self):
        """Test that API key is included in Authorization header."""
        with patch.dict(os.environ, {
            'RAINDROP_BRIDGE_URL': 'https://smartbiz-bridge.raindrop.app/query',
            'RAINDROP_API_KEY': 'test-api-key-12345'
        }):
            service = SmartSQLService()
            
            with patch('services.smartsql_service.requests.post') as mock_post:
                mock_resp = MagicMock()
                mock_resp.json.return_value = {"success": True, "sql": "SELECT 1", "results": []}
                mock_resp.raise_for_status = MagicMock()
                mock_post.return_value = mock_resp
                
                service.execute_query("Test query")
                
                call_args = mock_post.call_args
                headers = call_args.kwargs.get('headers', {})
                assert headers.get('Authorization') == 'Bearer test-api-key-12345'


class TestLiquidMetalFallbackIntegration:
    """Integration tests for SmartSQLService fallback to LiquidMetal API.
    
    _Requirements: 4.5_
    """
    
    def test_fallback_to_liquidmetal_when_raindrop_not_configured(self):
        """Test that service falls back to LiquidMetal when Raindrop URL is not set."""
        with patch.dict(os.environ, {
            'RAINDROP_BRIDGE_URL': '',
            'LIQUIDMETAL_API_KEY': 'lm-test-key-12345',
            'LIQUIDMETAL_BASE_URL': 'https://api.liquidmetal.ai/v1'
        }):
            service = SmartSQLService()
            
            mock_response = {
                "sql": "SELECT * FROM users",
                "results": [{"id": 1, "name": "John"}]
            }
            
            with patch('services.smartsql_service.requests.post') as mock_post:
                mock_resp = MagicMock()
                mock_resp.json.return_value = mock_response
                mock_resp.raise_for_status = MagicMock()
                mock_post.return_value = mock_resp
                
                result = service.execute_query("Show me all users")
                
                # Verify LiquidMetal endpoint was called
                call_args = mock_post.call_args
                called_url = call_args.args[0] if call_args.args else call_args.kwargs.get('url')
                assert 'liquidmetal' in called_url.lower()
                assert result["success"] is True
    
    def test_no_backend_configured_returns_error(self):
        """Test that error is returned when neither backend is configured."""
        with patch.dict(os.environ, {
            'RAINDROP_BRIDGE_URL': '',
            'LIQUIDMETAL_API_KEY': '',
            'LIQUIDMETAL_BASE_URL': ''
        }):
            service = SmartSQLService()
            
            result = service.execute_query("Show me all invoices")
            
            assert result["success"] is False
            assert "backend configured" in result["error"].lower()
    
    def test_liquidmetal_timeout_handling(self):
        """Test handling of timeout when calling LiquidMetal API."""
        with patch.dict(os.environ, {
            'RAINDROP_BRIDGE_URL': '',
            'LIQUIDMETAL_API_KEY': 'lm-test-key-12345',
            'LIQUIDMETAL_BASE_URL': 'https://api.liquidmetal.ai/v1'
        }):
            service = SmartSQLService()
            
            with patch('services.smartsql_service.requests.post') as mock_post:
                mock_post.side_effect = requests.exceptions.Timeout("Request timed out")
                
                result = service.execute_query("Show me all invoices")
                
                assert result["success"] is False
                assert "timed out" in result["error"].lower()
    
    def test_liquidmetal_connection_error_handling(self):
        """Test handling of connection error when calling LiquidMetal API."""
        with patch.dict(os.environ, {
            'RAINDROP_BRIDGE_URL': '',
            'LIQUIDMETAL_API_KEY': 'lm-test-key-12345',
            'LIQUIDMETAL_BASE_URL': 'https://api.liquidmetal.ai/v1'
        }):
            service = SmartSQLService()
            
            with patch('services.smartsql_service.requests.post') as mock_post:
                mock_post.side_effect = requests.exceptions.ConnectionError("Connection refused")
                
                result = service.execute_query("Show me all invoices")
                
                assert result["success"] is False
                assert "failed" in result["error"].lower()


class TestRaindropPrecedenceIntegration:
    """Integration tests verifying Raindrop takes precedence over LiquidMetal.
    
    _Requirements: 4.1, 4.5_
    """
    
    def test_raindrop_used_when_both_configured(self):
        """Test that Raindrop Bridge is used when both backends are configured."""
        with patch.dict(os.environ, {
            'RAINDROP_BRIDGE_URL': 'https://smartbiz-bridge.raindrop.app/query',
            'RAINDROP_API_KEY': '',
            'LIQUIDMETAL_API_KEY': 'lm-test-key-12345',
            'LIQUIDMETAL_BASE_URL': 'https://api.liquidmetal.ai/v1'
        }):
            service = SmartSQLService()
            
            with patch('services.smartsql_service.requests.post') as mock_post:
                mock_resp = MagicMock()
                mock_resp.json.return_value = {"success": True, "sql": "SELECT 1", "results": []}
                mock_resp.raise_for_status = MagicMock()
                mock_post.return_value = mock_resp
                
                service.execute_query("Test query")
                
                # Verify Raindrop endpoint was called, not LiquidMetal
                call_args = mock_post.call_args
                called_url = call_args.args[0] if call_args.args else call_args.kwargs.get('url')
                assert 'raindrop' in called_url.lower()
                assert 'liquidmetal' not in called_url.lower()
