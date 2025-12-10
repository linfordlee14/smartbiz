"""Cerebras Service for SmartBiz SA - AI-powered chat using Cerebras llama-3.1-8b model."""
import os
import requests
from typing import Optional


class CerebrasService:
    """Service for generating AI responses using Cerebras API."""
    
    def __init__(self):
        """Initialize CerebrasService with API configuration."""
        self.api_key = os.getenv('CEREBRAS_API_KEY')
        self.base_url = "https://api.cerebras.ai/v1"
        self.model = "llama-3.1-8b"
        
        # South African business context for system prompt
        self.system_prompt = """You are SmartBiz SA, an AI-powered business assistant 
specifically designed for South African entrepreneurs and small business owners.

Your expertise includes:
- South African tax regulations (SARS compliance, VAT at 15%)
- BBBEE (Broad-Based Black Economic Empowerment) requirements
- Local business registration and compliance
- South African labor laws and employment regulations
- Financial management for South African businesses
- Local market insights and business opportunities

Always provide advice relevant to the South African business context. When discussing 
taxes, use the South African VAT rate of 15%. Reference SARS (South African Revenue 
Service) guidelines when applicable. Be helpful, professional, and supportive of 
entrepreneurs building businesses in South Africa."""
    
    # Demo responses for when API key is missing or API fails
    DEMO_RESPONSES = [
        "As a South African business owner, it's important to register with SARS and obtain your tax clearance certificate. This is essential for doing business with government entities and larger corporations.",
        "For VAT registration in South Africa, you must register if your taxable turnover exceeds R1 million in any consecutive 12-month period. The standard VAT rate is 15%.",
        "BBBEE compliance is crucial for South African businesses. Consider getting your BBBEE certificate to improve your chances of winning government tenders and contracts with large corporations.",
        "When invoicing in South Africa, ensure your invoices include your VAT number (if registered), the VAT amount clearly stated, and comply with SARS requirements for tax invoices.",
        "South African small businesses can benefit from various government support programs. Check out SEDA (Small Enterprise Development Agency) for free business development services."
    ]
    
    def get_response(self, message: str, context: Optional[str] = "") -> str:
        """Get AI response from Cerebras API.
        
        Falls back to demo responses when API key is missing or API errors occur.
        
        Args:
            message: The user's message/question
            context: Optional additional context for the conversation
            
        Returns:
            AI-generated response string
        """
        # If no API key, return demo response
        if not self.api_key:
            return self._get_demo_response(message)
        
        try:
            return self._call_cerebras_api(message, context)
        except Exception as e:
            print(f"Cerebras API error: {e}")
            return self._get_demo_response(message)

    def _call_cerebras_api(self, message: str, context: Optional[str] = "") -> str:
        """Make actual API call to Cerebras.
        
        Args:
            message: The user's message
            context: Optional additional context
            
        Returns:
            AI response from Cerebras
            
        Raises:
            Exception: If API call fails
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Build messages array
        messages = [
            {"role": "system", "content": self.system_prompt}
        ]
        
        # Add context if provided
        if context:
            messages.append({
                "role": "system",
                "content": f"Additional context: {context}"
            })
        
        messages.append({"role": "user", "content": message})
        
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": 1024,
            "temperature": 0.7
        }
        
        response = requests.post(
            f"{self.base_url}/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        response.raise_for_status()
        
        data = response.json()
        return data["choices"][0]["message"]["content"]
    
    def _get_demo_response(self, message: str) -> str:
        """Get a demo response based on the message content.
        
        Provides contextually relevant demo responses for South African business topics.
        
        Args:
            message: The user's message
            
        Returns:
            Demo response string
        """
        message_lower = message.lower()
        
        # Try to match message to relevant demo response
        if any(word in message_lower for word in ['vat', 'tax', 'sars']):
            return self.DEMO_RESPONSES[1]  # VAT/tax response
        elif any(word in message_lower for word in ['bbbee', 'bee', 'empowerment']):
            return self.DEMO_RESPONSES[2]  # BBBEE response
        elif any(word in message_lower for word in ['invoice', 'billing', 'payment']):
            return self.DEMO_RESPONSES[3]  # Invoice response
        elif any(word in message_lower for word in ['support', 'help', 'government', 'seda']):
            return self.DEMO_RESPONSES[4]  # Government support response
        else:
            return self.DEMO_RESPONSES[0]  # Default registration response
