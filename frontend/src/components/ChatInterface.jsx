import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { sendMessage, sendMessageWithVoice } from '../services/api';
import { Logo } from './Logo';

/**
 * ChatGPT-style conversational interface for business advice
 * Supports text and voice modes with Markdown rendering
 * 
 * @param {Object} props
 * @param {boolean} props.darkMode - Whether dark mode is enabled
 */
export function ChatInterface({ darkMode }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const toggleVoiceMode = () => {
    setVoiceMode(prev => !prev);
  };

  const playAudio = (blob) => {
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audio.play().catch(err => {
      console.error('Audio playback failed:', err);
    });
    // Clean up URL after playback
    audio.onended = () => URL.revokeObjectURL(audioUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    // Add user message
    const userMessage = { role: 'user', content: trimmedInput };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);


    try {
      let result;
      
      if (voiceMode) {
        result = await sendMessageWithVoice(trimmedInput);
      } else {
        result = await sendMessage(trimmedInput);
      }

      // Handle error response
      if (result.error) {
        setError(result.error);
        return;
      }

      // Handle audio blob response (voice mode success)
      if (result instanceof Blob) {
        // For voice responses, we need to also get the text response
        // The blob is the audio, but we should show a placeholder message
        const assistantMessage = { 
          role: 'assistant', 
          content: '🔊 *Voice response played*' 
        };
        setMessages(prev => [...prev, assistantMessage]);
        playAudio(result);
        return;
      }

      // Handle voice_error case (voice failed but text succeeded)
      if (result.voice_error) {
        console.warn('Voice generation failed:', result.voice_error);
      }

      // Handle text response
      if (result.response) {
        const assistantMessage = { role: 'assistant', content: result.response };
        setMessages(prev => [...prev, assistantMessage]);
        
        // If we got a blob alongside text (shouldn't happen but handle it)
        if (result instanceof Blob) {
          playAudio(result);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle suggestion chip click - submit the suggestion as a message
  const handleSuggestionClick = (suggestion) => {
    if (isLoading) return;
    
    // Directly submit the suggestion without going through input
    const userMessage = { role: 'user', content: suggestion };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        let result;
        
        if (voiceMode) {
          result = await sendMessageWithVoice(suggestion);
        } else {
          result = await sendMessage(suggestion);
        }

        if (result.error) {
          setError(result.error);
          return;
        }

        if (result instanceof Blob) {
          const assistantMessage = { 
            role: 'assistant', 
            content: '🔊 *Voice response played*' 
          };
          setMessages(prev => [...prev, assistantMessage]);
          playAudio(result);
          return;
        }

        if (result.voice_error) {
          console.warn('Voice generation failed:', result.voice_error);
        }

        if (result.response) {
          const assistantMessage = { role: 'assistant', content: result.response };
          setMessages(prev => [...prev, assistantMessage]);
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    })();
  };

  return (
    <div className={`flex flex-col h-full shadow-lg rounded-xl ${
      darkMode 
        ? 'bg-slate-800 border border-slate-700' 
        : 'bg-white border border-slate-200'
    }`}>
      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-8">
            {/* Centered Logo */}
            <div className="mb-8">
              <Logo darkMode={darkMode} />
            </div>
            
            {/* Suggestion Chips */}
            <div className="flex flex-wrap justify-center gap-3 max-w-md">
              {[
                "How do I register for VAT?",
                "Draft a payment reminder",
                "Analyze my revenue"
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    darkMode
                      ? 'bg-slate-700 text-slate-200 hover:bg-slate-600 hover:scale-105'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105'
                  }`}
                  data-testid="suggestion-chip"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              data-testid="message-bubble"
              className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm transition-all ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : darkMode
                    ? 'bg-slate-700 text-slate-100'
                    : 'bg-white text-slate-800'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className={`rounded-2xl px-4 py-3 shadow-sm transition-all ${
              darkMode ? 'bg-slate-700 text-slate-100' : 'bg-white text-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-100 text-red-700 rounded-lg px-4 py-3 max-w-[80%]">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`border-t p-4 ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Voice mode toggle */}
          <button
            type="button"
            onClick={toggleVoiceMode}
            className={`p-2 rounded-lg transition-colors ${
              voiceMode
                ? 'bg-blue-600 text-white'
                : darkMode
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            aria-label={voiceMode ? 'Disable voice mode' : 'Enable voice mode'}
            title={voiceMode ? 'Voice Mode On' : 'Voice Mode Off'}
          >
            {voiceMode ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isLoading}
            className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
              darkMode
                ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-blue-500'
                : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`p-2 rounded-lg transition-colors ${
              inputValue.trim() && !isLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : darkMode
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatInterface;
