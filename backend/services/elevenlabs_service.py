"""ElevenLabs Service for SmartBiz SA - Text-to-speech conversion using ElevenLabs API."""
import os
import requests
from typing import Optional


class ElevenLabsService:
    """Service for converting text to speech using ElevenLabs API."""
    
    def __init__(self):
        """Initialize ElevenLabsService with API configuration."""
        self.api_key = os.getenv('ELEVENLABS_API_KEY')
        self.base_url = "https://api.elevenlabs.io/v1"
        self.default_voice_id = os.getenv('ELEVENLABS_VOICE_ID', 'rachel')
    
    def text_to_speech(self, text: str, voice_id: Optional[str] = None) -> dict:
        """Convert text to MP3 audio using ElevenLabs API.
        
        Args:
            text: The text to convert to speech
            voice_id: Optional voice ID to use (defaults to configured default)
            
        Returns:
            dict with either:
                - {"success": True, "audio_data": bytes} on success
                - {"success": False, "error": str} on failure
        """
        if not self.api_key:
            return {
                "success": False,
                "error": "ElevenLabs API key not configured"
            }
        
        if not text or not text.strip():
            return {
                "success": False,
                "error": "Text is required for speech synthesis"
            }
        
        voice = voice_id or self.default_voice_id
        
        try:
            return self._call_elevenlabs_api(text, voice)
        except requests.exceptions.Timeout:
            print("ElevenLabs API timeout")
            return {
                "success": False,
                "error": "ElevenLabs API request timed out"
            }
        except requests.exceptions.RequestException as e:
            print(f"ElevenLabs API request error: {e}")
            return {
                "success": False,
                "error": f"ElevenLabs API request failed: {str(e)}"
            }
        except Exception as e:
            print(f"ElevenLabs API error: {e}")
            return {
                "success": False,
                "error": f"Failed to generate speech: {str(e)}"
            }


    def _call_elevenlabs_api(self, text: str, voice_id: str) -> dict:
        """Make actual API call to ElevenLabs text-to-speech endpoint.
        
        Args:
            text: The text to convert to speech
            voice_id: The voice ID to use
            
        Returns:
            dict with success status and audio_data or error
            
        Raises:
            requests.exceptions.RequestException: If API call fails
        """
        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
        }
        
        payload = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }
        
        response = requests.post(
            f"{self.base_url}/text-to-speech/{voice_id}",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            return {
                "success": True,
                "audio_data": response.content
            }
        else:
            error_message = f"ElevenLabs API returned status {response.status_code}"
            try:
                error_data = response.json()
                if "detail" in error_data:
                    error_message = error_data["detail"]
                elif "message" in error_data:
                    error_message = error_data["message"]
            except Exception:
                pass
            
            return {
                "success": False,
                "error": error_message
            }

    def get_available_voices(self) -> list:
        """Get list of available voices from ElevenLabs.
        
        Returns:
            list of voice dictionaries with id, name, and preview_url,
            or empty list if API call fails
        """
        if not self.api_key:
            return self._get_demo_voices()
        
        try:
            return self._fetch_voices_from_api()
        except Exception as e:
            print(f"ElevenLabs voices API error: {e}")
            return self._get_demo_voices()

    def _fetch_voices_from_api(self) -> list:
        """Fetch voices from ElevenLabs API.
        
        Returns:
            list of voice dictionaries
            
        Raises:
            Exception: If API call fails
        """
        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{self.base_url}/voices",
            headers=headers,
            timeout=15
        )
        
        response.raise_for_status()
        
        data = response.json()
        voices = []
        
        for voice in data.get("voices", []):
            voices.append({
                "id": voice.get("voice_id"),
                "name": voice.get("name"),
                "preview_url": voice.get("preview_url")
            })
        
        return voices

    def _get_demo_voices(self) -> list:
        """Get demo voice list when API is unavailable.
        
        Returns:
            list of demo voice dictionaries
        """
        return [
            {"id": "rachel", "name": "Rachel", "preview_url": None},
            {"id": "drew", "name": "Drew", "preview_url": None},
            {"id": "clyde", "name": "Clyde", "preview_url": None},
            {"id": "paul", "name": "Paul", "preview_url": None},
            {"id": "domi", "name": "Domi", "preview_url": None},
            {"id": "dave", "name": "Dave", "preview_url": None},
            {"id": "fin", "name": "Fin", "preview_url": None},
            {"id": "sarah", "name": "Sarah", "preview_url": None},
            {"id": "antoni", "name": "Antoni", "preview_url": None},
            {"id": "thomas", "name": "Thomas", "preview_url": None}
        ]
