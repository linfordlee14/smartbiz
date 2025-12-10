"""Chat routes for SmartBiz SA - AI-powered chat endpoints."""
from flask import Blueprint, request, jsonify, Response
from services.cerebras_service import CerebrasService
from services.elevenlabs_service import ElevenLabsService
from services.smartsql_service import SmartSQLService

chat_bp = Blueprint('chat', __name__, url_prefix='/api')


@chat_bp.route('/chat', methods=['POST'])
def chat():
    """Text chat endpoint with Cerebras AI.
    
    Request body:
        message: The user's message (required)
        context: Optional additional context
    
    Returns:
        200: AI response
        400: Message required
    """
    data = request.get_json() or {}
    
    message = data.get('message', '')
    
    # Validate message - empty, whitespace-only, or missing returns 400
    if not message or not message.strip():
        return jsonify({'error': 'Message required'}), 400
    
    # Get optional context
    context = data.get('context', '')
    
    # Get AI response from Cerebras service
    service = CerebrasService()
    response = service.get_response(message, context)
    
    return jsonify({'response': response}), 200


@chat_bp.route('/chat/voice', methods=['POST'])
def chat_voice():
    """Voice-enabled chat endpoint with Cerebras AI and ElevenLabs TTS.
    
    Request body:
        message: The user's message (required)
        context: Optional additional context
        enable_voice: Whether to return audio (default: True)
        voice_id: Optional voice ID for TTS
    
    Returns:
        200: MP3 audio (audio/mpeg) when voice enabled and successful
        200: JSON with response and voice_error when voice fails
        200: JSON with response when enable_voice is false
        400: Message required
    """
    data = request.get_json() or {}
    
    message = data.get('message', '')
    
    # Validate message - empty, whitespace-only, or missing returns 400
    if not message or not message.strip():
        return jsonify({'error': 'Message required'}), 400
    
    # Get optional parameters
    context = data.get('context', '')
    enable_voice = data.get('enable_voice', True)
    voice_id = data.get('voice_id')
    
    # Get AI response from Cerebras service
    cerebras_service = CerebrasService()
    response_text = cerebras_service.get_response(message, context)
    
    # If voice is not enabled, return text response only
    if not enable_voice:
        return jsonify({'response': response_text}), 200
    
    # Convert response to speech using ElevenLabs
    elevenlabs_service = ElevenLabsService()
    tts_result = elevenlabs_service.text_to_speech(response_text, voice_id)
    
    if tts_result.get('success'):
        # Return MP3 audio
        return Response(
            tts_result['audio_data'],
            mimetype='audio/mpeg',
            headers={
                'Content-Disposition': 'inline; filename="response.mp3"'
            }
        )
    else:
        # Return text response with voice_error
        return jsonify({
            'response': response_text,
            'voice_error': tts_result.get('error', 'Voice synthesis failed')
        }), 200


@chat_bp.route('/chat/voices', methods=['GET'])
def get_voices():
    """Get list of available ElevenLabs voices.
    
    Returns:
        200: List of available voices with id, name, and preview_url
    """
    elevenlabs_service = ElevenLabsService()
    voices = elevenlabs_service.get_available_voices()
    
    return jsonify({'voices': voices}), 200


@chat_bp.route('/smartsql', methods=['POST'])
def smartsql():
    """Natural language database query endpoint using SmartSQL.
    
    Request body:
        query: The natural language query (required)
    
    Returns:
        200: Query results with SQL and data
        400: Query required
        500: SmartSQL service error
    """
    data = request.get_json() or {}
    
    query = data.get('query', '')
    
    # Validate query - empty, whitespace-only, or missing returns 400
    if not query or not query.strip():
        return jsonify({'error': 'Query required'}), 400
    
    # Execute query via SmartSQL service
    service = SmartSQLService()
    result = service.execute_query(query)
    
    if result.get('success'):
        return jsonify({
            'sql': result.get('sql', ''),
            'results': result.get('results', [])
        }), 200
    else:
        return jsonify({'error': result.get('error', 'SmartSQL query failed')}), 500
