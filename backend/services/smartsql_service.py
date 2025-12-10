"""SmartSQL Service for SmartBiz SA - Natural language to SQL conversion.

Supports two backends:
1. Raindrop Bridge (preferred) - Cloudflare Worker with SmartSQL binding
2. LiquidMetal API (fallback) - Direct API calls
"""
import os
import requests
from typing import Dict, Any, Optional


class SmartSQLService:
    """Service for converting natural language queries to SQL.
    
    Uses Raindrop Bridge if configured, otherwise falls back to LiquidMetal API.
    """
    
    def __init__(self):
        """Initialize SmartSQLService with API configuration."""
        # Raindrop Bridge configuration (preferred)
        self.raindrop_url = os.getenv('RAINDROP_BRIDGE_URL')
        self.raindrop_api_key = os.getenv('RAINDROP_API_KEY')
        self.raindrop_timeout = int(os.getenv('RAINDROP_TIMEOUT', '30'))
        
        # LiquidMetal API configuration (fallback)
        self.liquidmetal_api_key = os.getenv('LIQUIDMETAL_API_KEY')
        self.liquidmetal_base_url = os.getenv('LIQUIDMETAL_BASE_URL', 'https://api.liquidmetal.ai/v1')
    
    def _use_raindrop(self) -> bool:
        """Check if Raindrop Bridge should be used."""
        return bool(self.raindrop_url)
    
    def execute_query(self, natural_language_query: str) -> Dict[str, Any]:
        """Convert natural language to SQL and execute.
        
        Args:
            natural_language_query: The user's natural language query
            
        Returns:
            Dictionary with query results or error information:
            - On success: {"success": True, "sql": str, "results": list}
            - On error: {"success": False, "error": str}
        """
        # Use Raindrop Bridge if configured
        if self._use_raindrop():
            return self._call_raindrop_bridge(natural_language_query)
        
        # Fall back to LiquidMetal API
        if not self.liquidmetal_api_key:
            return {
                "success": False,
                "error": "No SmartSQL backend configured. Set RAINDROP_BRIDGE_URL or LIQUIDMETAL_API_KEY."
            }
        
        try:
            return self._call_liquidmetal_api(natural_language_query)
        except requests.exceptions.Timeout:
            print(f"LiquidMetal API timeout for query: {natural_language_query}")
            return {
                "success": False,
                "error": "SmartSQL API request timed out"
            }
        except requests.exceptions.RequestException as e:
            print(f"LiquidMetal API request error: {e}")
            return {
                "success": False,
                "error": f"SmartSQL API request failed: {str(e)}"
            }
        except Exception as e:
            print(f"LiquidMetal API error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _call_raindrop_bridge(self, natural_language_query: str) -> Dict[str, Any]:
        """Make API call to Raindrop Bridge (Cloudflare Worker with SmartSQL binding).
        
        Args:
            natural_language_query: The user's natural language query
            
        Returns:
            Dictionary with SQL and results
        """
        try:
            headers = {
                "Content-Type": "application/json"
            }
            
            # Add API key if configured
            if self.raindrop_api_key:
                headers["Authorization"] = f"Bearer {self.raindrop_api_key}"
            
            payload = {
                "query": natural_language_query
            }
            
            response = requests.post(
                self.raindrop_url,
                headers=headers,
                json=payload,
                timeout=self.raindrop_timeout
            )
            
            response.raise_for_status()
            
            data = response.json()
            
            # Handle Raindrop Bridge response format
            if data.get("success") is False:
                return {
                    "success": False,
                    "error": data.get("error", "Unknown error from Raindrop Bridge")
                }
            
            return {
                "success": True,
                "sql": data.get("sql", ""),
                "results": data.get("results", data.get("data", []))
            }
            
        except requests.exceptions.Timeout:
            print(f"Raindrop Bridge timeout for query: {natural_language_query}")
            return {
                "success": False,
                "error": "Raindrop Bridge request timed out"
            }
        except requests.exceptions.RequestException as e:
            print(f"Raindrop Bridge request error: {e}")
            return {
                "success": False,
                "error": f"Raindrop Bridge request failed: {str(e)}"
            }
        except Exception as e:
            print(f"Raindrop Bridge error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _call_liquidmetal_api(self, natural_language_query: str) -> Dict[str, Any]:
        """Make actual API call to LiquidMetal SmartSQL (fallback).
        
        Args:
            natural_language_query: The user's natural language query
            
        Returns:
            Dictionary with SQL and results
            
        Raises:
            Exception: If API call fails
        """
        headers = {
            "Authorization": f"Bearer {self.liquidmetal_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "query": natural_language_query,
            "context": "SmartBiz SA business database with users, businesses, invoices, and chat history"
        }
        
        response = requests.post(
            f"{self.liquidmetal_base_url}/smartsql",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        response.raise_for_status()
        
        data = response.json()
        
        return {
            "success": True,
            "sql": data.get("sql", ""),
            "results": data.get("results", [])
        }
