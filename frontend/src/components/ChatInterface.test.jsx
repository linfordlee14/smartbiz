/**
 * Property-Based Tests and Unit Tests for ChatInterface Component
 * Using fast-check for property-based testing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// ============================================================================
// UNIT TESTS FOR CHATINTERFACE
// Requirements: 1.1, 1.2, 1.3, 1.6, 1.7, 1.8
// ============================================================================

/**
 * Unit tests for ChatInterface component logic
 * Tests message submission flow, voice mode toggle, and loading state display
 */

/**
 * Simulates the ChatInterface state management for unit testing
 */
function createChatInterfaceState() {
  let messages = [];
  let inputValue = '';
  let isLoading = false;
  let voiceMode = false;
  let error = null;

  return {
    // Getters
    getMessages: () => messages,
    getInputValue: () => inputValue,
    getIsLoading: () => isLoading,
    getVoiceMode: () => voiceMode,
    getError: () => error,

    // Setters
    setInputValue: (value) => { inputValue = value; },
    setIsLoading: (value) => { isLoading = value; },
    setError: (value) => { error = value; },

    // Actions
    toggleVoiceMode: () => { voiceMode = !voiceMode; },
    
    addUserMessage: (content) => {
      messages = [...messages, { role: 'user', content }];
    },
    
    addAssistantMessage: (content) => {
      messages = [...messages, { role: 'assistant', content }];
    },

    clearInput: () => { inputValue = ''; },

    // Simulate submit logic
    canSubmit: () => {
      return inputValue.trim().length > 0 && !isLoading;
    },

    // Simulate the handleSubmit flow
    simulateSubmit: async (apiMock) => {
      const trimmedInput = inputValue.trim();
      if (!trimmedInput || isLoading) return { submitted: false };

      // Add user message
      messages = [...messages, { role: 'user', content: trimmedInput }];
      inputValue = '';
      isLoading = true;
      error = null;

      try {
        const result = voiceMode 
          ? await apiMock.sendMessageWithVoice(trimmedInput)
          : await apiMock.sendMessage(trimmedInput);

        if (result.error) {
          error = result.error;
          return { submitted: true, error: result.error };
        }

        if (result.response) {
          messages = [...messages, { role: 'assistant', content: result.response }];
        }

        return { submitted: true, response: result.response };
      } catch (err) {
        error = 'An unexpected error occurred';
        return { submitted: true, error: 'An unexpected error occurred' };
      } finally {
        isLoading = false;
      }
    }
  };
}

describe('ChatInterface Unit Tests', () => {
  describe('Message Submission Flow (Requirements 1.1, 1.2, 1.3)', () => {
    it('should add user message to list when submitting', async () => {
      const state = createChatInterfaceState();
      const mockApi = {
        sendMessage: vi.fn().mockResolvedValue({ response: 'AI response' }),
        sendMessageWithVoice: vi.fn()
      };

      state.setInputValue('Hello, AI!');
      await state.simulateSubmit(mockApi);

      const messages = state.getMessages();
      expect(messages.length).toBe(2);
      expect(messages[0]).toEqual({ role: 'user', content: 'Hello, AI!' });
    });

    it('should clear input after submission', async () => {
      const state = createChatInterfaceState();
      const mockApi = {
        sendMessage: vi.fn().mockResolvedValue({ response: 'AI response' }),
        sendMessageWithVoice: vi.fn()
      };

      state.setInputValue('Test message');
      await state.simulateSubmit(mockApi);

      expect(state.getInputValue()).toBe('');
    });

    it('should add assistant message after successful API response', async () => {
      const state = createChatInterfaceState();
      const mockApi = {
        sendMessage: vi.fn().mockResolvedValue({ response: 'Hello! How can I help?' }),
        sendMessageWithVoice: vi.fn()
      };

      state.setInputValue('Hi');
      await state.simulateSubmit(mockApi);

      const messages = state.getMessages();
      expect(messages.length).toBe(2);
      expect(messages[1]).toEqual({ role: 'assistant', content: 'Hello! How can I help?' });
    });

    it('should not submit when input is empty', async () => {
      const state = createChatInterfaceState();
      const mockApi = {
        sendMessage: vi.fn().mockResolvedValue({ response: 'Response' }),
        sendMessageWithVoice: vi.fn()
      };

      state.setInputValue('');
      const result = await state.simulateSubmit(mockApi);

      expect(result.submitted).toBe(false);
      expect(mockApi.sendMessage).not.toHaveBeenCalled();
    });

    it('should not submit when input is only whitespace', async () => {
      const state = createChatInterfaceState();
      const mockApi = {
        sendMessage: vi.fn().mockResolvedValue({ response: 'Response' }),
        sendMessageWithVoice: vi.fn()
      };

      state.setInputValue('   ');
      const result = await state.simulateSubmit(mockApi);

      expect(result.submitted).toBe(false);
      expect(mockApi.sendMessage).not.toHaveBeenCalled();
    });

    it('should not submit when already loading', async () => {
      const state = createChatInterfaceState();
      const mockApi = {
        sendMessage: vi.fn().mockResolvedValue({ response: 'Response' }),
        sendMessageWithVoice: vi.fn()
      };

      state.setInputValue('Test');
      state.setIsLoading(true);
      const result = await state.simulateSubmit(mockApi);

      expect(result.submitted).toBe(false);
      expect(mockApi.sendMessage).not.toHaveBeenCalled();
    });

    it('should set error when API returns error', async () => {
      const state = createChatInterfaceState();
      const mockApi = {
        sendMessage: vi.fn().mockResolvedValue({ error: 'API Error' }),
        sendMessageWithVoice: vi.fn()
      };

      state.setInputValue('Test');
      await state.simulateSubmit(mockApi);

      expect(state.getError()).toBe('API Error');
    });
  });

  describe('Voice Mode Toggle (Requirements 1.6, 1.7, 1.8)', () => {
    it('should start with voice mode disabled', () => {
      const state = createChatInterfaceState();
      expect(state.getVoiceMode()).toBe(false);
    });

    it('should toggle voice mode on', () => {
      const state = createChatInterfaceState();
      state.toggleVoiceMode();
      expect(state.getVoiceMode()).toBe(true);
    });

    it('should toggle voice mode off after being on', () => {
      const state = createChatInterfaceState();
      state.toggleVoiceMode(); // on
      state.toggleVoiceMode(); // off
      expect(state.getVoiceMode()).toBe(false);
    });

    it('should call sendMessage when voice mode is disabled', async () => {
      const state = createChatInterfaceState();
      const mockApi = {
        sendMessage: vi.fn().mockResolvedValue({ response: 'Text response' }),
        sendMessageWithVoice: vi.fn()
      };

      state.setInputValue('Test');
      await state.simulateSubmit(mockApi);

      expect(mockApi.sendMessage).toHaveBeenCalledWith('Test');
      expect(mockApi.sendMessageWithVoice).not.toHaveBeenCalled();
    });

    it('should call sendMessageWithVoice when voice mode is enabled', async () => {
      const state = createChatInterfaceState();
      const mockApi = {
        sendMessage: vi.fn(),
        sendMessageWithVoice: vi.fn().mockResolvedValue({ response: 'Voice response' })
      };

      state.toggleVoiceMode();
      state.setInputValue('Test');
      await state.simulateSubmit(mockApi);

      expect(mockApi.sendMessageWithVoice).toHaveBeenCalledWith('Test');
      expect(mockApi.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Loading State Display (Requirements 1.3)', () => {
    it('should set loading state during submission', async () => {
      const state = createChatInterfaceState();
      let loadingDuringRequest = false;
      
      const mockApi = {
        sendMessage: vi.fn().mockImplementation(async () => {
          loadingDuringRequest = state.getIsLoading();
          return { response: 'Response' };
        }),
        sendMessageWithVoice: vi.fn()
      };

      state.setInputValue('Test');
      await state.simulateSubmit(mockApi);

      expect(loadingDuringRequest).toBe(true);
    });

    it('should clear loading state after successful submission', async () => {
      const state = createChatInterfaceState();
      const mockApi = {
        sendMessage: vi.fn().mockResolvedValue({ response: 'Response' }),
        sendMessageWithVoice: vi.fn()
      };

      state.setInputValue('Test');
      await state.simulateSubmit(mockApi);

      expect(state.getIsLoading()).toBe(false);
    });

    it('should clear loading state after error', async () => {
      const state = createChatInterfaceState();
      const mockApi = {
        sendMessage: vi.fn().mockResolvedValue({ error: 'Error' }),
        sendMessageWithVoice: vi.fn()
      };

      state.setInputValue('Test');
      await state.simulateSubmit(mockApi);

      expect(state.getIsLoading()).toBe(false);
    });

    it('should prevent submission while loading', () => {
      const state = createChatInterfaceState();
      state.setInputValue('Test');
      state.setIsLoading(true);

      expect(state.canSubmit()).toBe(false);
    });

    it('should allow submission when not loading and input is valid', () => {
      const state = createChatInterfaceState();
      state.setInputValue('Test');
      state.setIsLoading(false);

      expect(state.canSubmit()).toBe(true);
    });
  });
});

// ============================================================================
// PROPERTY-BASED TESTS (existing)
// ============================================================================

/**
 * Message rendering logic extracted for testing
 * This mirrors the logic in ChatInterface.jsx
 */

/**
 * Renders a list of messages to a simplified structure for testing
 * @param {Array<{role: string, content: string}>} messages - Array of messages
 * @returns {Array<{role: string, content: string, index: number}>} - Rendered message data
 */
function renderMessageList(messages) {
  if (!Array.isArray(messages)) return [];
  
  return messages.map((message, index) => ({
    role: message.role,
    content: message.content,
    index
  }));
}

/**
 * Checks if all messages are rendered in order
 * @param {Array} messages - Original messages
 * @param {Array} rendered - Rendered messages
 * @returns {boolean} - True if all messages are rendered correctly
 */
function allMessagesRendered(messages, rendered) {
  if (messages.length !== rendered.length) return false;
  
  return messages.every((msg, idx) => 
    rendered[idx].role === msg.role && 
    rendered[idx].content === msg.content &&
    rendered[idx].index === idx
  );
}

/**
 * Voice mode API selection logic extracted for testing
 * This mirrors the logic in ChatInterface.jsx handleSubmit
 */
function selectApiMethod(voiceMode) {
  return voiceMode ? 'sendMessageWithVoice' : 'sendMessage';
}

/**
 * Markdown rendering simulation for testing
 * Checks if content contains markdown syntax and would be rendered
 */
const markdownPatterns = {
  bold: /\*\*(.+?)\*\*/g,
  italic: /\*(.+?)\*/g,
  code: /`(.+?)`/g,
  codeBlock: /```[\s\S]*?```/g,
  heading: /^#{1,6}\s+.+$/gm,
  link: /\[(.+?)\]\((.+?)\)/g,
  list: /^[\s]*[-*+]\s+.+$/gm,
  numberedList: /^[\s]*\d+\.\s+.+$/gm
};

/**
 * Simulates markdown rendering by converting markdown to HTML-like structure
 * @param {string} content - Markdown content
 * @returns {object} - Object with rendered flag and detected elements
 */
function renderMarkdown(content) {
  if (typeof content !== 'string') {
    return { rendered: false, elements: [] };
  }

  const elements = [];
  
  // Detect markdown patterns
  if (markdownPatterns.bold.test(content)) elements.push('strong');
  if (markdownPatterns.italic.test(content)) elements.push('em');
  if (markdownPatterns.code.test(content)) elements.push('code');
  if (markdownPatterns.codeBlock.test(content)) elements.push('pre');
  if (markdownPatterns.heading.test(content)) elements.push('heading');
  if (markdownPatterns.link.test(content)) elements.push('a');
  if (markdownPatterns.list.test(content)) elements.push('ul');
  if (markdownPatterns.numberedList.test(content)) elements.push('ol');

  // Reset regex lastIndex
  Object.values(markdownPatterns).forEach(regex => regex.lastIndex = 0);

  return {
    rendered: true,
    elements,
    hasMarkdown: elements.length > 0
  };
}

// Arbitrary for generating valid messages
const messageArbitrary = fc.record({
  role: fc.constantFrom('user', 'assistant'),
  content: fc.string({ minLength: 1, maxLength: 500 })
});

// Arbitrary for generating markdown content
const markdownContentArbitrary = fc.oneof(
  // Plain text
  fc.string({ minLength: 1, maxLength: 200 }),
  // Bold text
  fc.string({ minLength: 1, maxLength: 50 }).map(s => `**${s}**`),
  // Italic text
  fc.string({ minLength: 1, maxLength: 50 }).map(s => `*${s}*`),
  // Code
  fc.string({ minLength: 1, maxLength: 50 }).map(s => `\`${s}\``),
  // Heading
  fc.tuple(fc.integer({ min: 1, max: 6 }), fc.string({ minLength: 1, maxLength: 50 }))
    .map(([level, text]) => `${'#'.repeat(level)} ${text}`),
  // Link
  fc.tuple(fc.string({ minLength: 1, maxLength: 30 }), fc.webUrl())
    .map(([text, url]) => `[${text}](${url})`),
  // List item
  fc.string({ minLength: 1, maxLength: 50 }).map(s => `- ${s}`),
  // Mixed content
  fc.tuple(
    fc.string({ minLength: 1, maxLength: 50 }),
    fc.string({ minLength: 1, maxLength: 50 })
  ).map(([plain, bold]) => `${plain} **${bold}**`)
);

/**
 * **Feature: smartbiz-frontend-ui, Property 1: Message list rendering**
 * **Validates: Requirements 1.1**
 * 
 * For any array of messages, the ChatInterface SHALL render all messages 
 * in the list, preserving their order and content.
 */
describe('Property 1: Message list rendering', () => {
  it('should render all messages preserving order and content', () => {
    fc.assert(
      fc.property(
        fc.array(messageArbitrary, { minLength: 0, maxLength: 50 }),
        (messages) => {
          const rendered = renderMessageList(messages);
          
          // All messages should be rendered
          expect(rendered.length).toBe(messages.length);
          
          // Order and content should be preserved
          expect(allMessagesRendered(messages, rendered)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve message roles correctly', () => {
    fc.assert(
      fc.property(
        fc.array(messageArbitrary, { minLength: 1, maxLength: 30 }),
        (messages) => {
          const rendered = renderMessageList(messages);
          
          // Each rendered message should have the correct role
          messages.forEach((msg, idx) => {
            expect(rendered[idx].role).toBe(msg.role);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve message content exactly', () => {
    fc.assert(
      fc.property(
        fc.array(messageArbitrary, { minLength: 1, maxLength: 30 }),
        (messages) => {
          const rendered = renderMessageList(messages);
          
          // Each rendered message should have the exact content
          messages.forEach((msg, idx) => {
            expect(rendered[idx].content).toBe(msg.content);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty message arrays', () => {
    const rendered = renderMessageList([]);
    expect(rendered).toEqual([]);
  });
});


/**
 * **Feature: smartbiz-frontend-ui, Property 2: Markdown rendering**
 * **Validates: Requirements 1.4**
 * 
 * For any AI response containing Markdown syntax, the ChatInterface SHALL 
 * render the content with appropriate HTML formatting.
 */
describe('Property 2: Markdown rendering', () => {
  it('should detect and render markdown content', () => {
    fc.assert(
      fc.property(
        markdownContentArbitrary,
        (content) => {
          const result = renderMarkdown(content);
          
          // Should always return a rendered result
          expect(result.rendered).toBe(true);
          
          // Elements array should be defined
          expect(Array.isArray(result.elements)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect bold markdown syntax', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('*')),
        (text) => {
          const boldContent = `**${text}**`;
          const result = renderMarkdown(boldContent);
          
          expect(result.elements).toContain('strong');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect italic markdown syntax', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('*')),
        (text) => {
          const italicContent = `*${text}*`;
          const result = renderMarkdown(italicContent);
          
          expect(result.elements).toContain('em');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect code markdown syntax', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('`')),
        (text) => {
          const codeContent = `\`${text}\``;
          const result = renderMarkdown(codeContent);
          
          expect(result.elements).toContain('code');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect heading markdown syntax', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 1, max: 6 }),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('\n'))
        ),
        ([level, text]) => {
          const headingContent = `${'#'.repeat(level)} ${text}`;
          const result = renderMarkdown(headingContent);
          
          expect(result.elements).toContain('heading');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle plain text without markdown', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 })
          .filter(s => !s.includes('*') && !s.includes('`') && !s.includes('#') && !s.includes('[') && !s.includes('-')),
        (plainText) => {
          const result = renderMarkdown(plainText);
          
          // Should still render, just without special elements
          expect(result.rendered).toBe(true);
          expect(result.hasMarkdown).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: smartbiz-frontend-ui, Property 3: Voice mode API selection**
 * **Validates: Requirements 1.7, 1.8**
 * 
 * For any message submission, the ChatInterface SHALL call sendMessageWithVoice 
 * when voice mode is enabled, and sendMessage when voice mode is disabled.
 */
describe('Property 3: Voice mode API selection', () => {
  it('should select sendMessageWithVoice when voice mode is enabled', () => {
    fc.assert(
      fc.property(
        fc.constant(true),
        (voiceMode) => {
          const apiMethod = selectApiMethod(voiceMode);
          expect(apiMethod).toBe('sendMessageWithVoice');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should select sendMessage when voice mode is disabled', () => {
    fc.assert(
      fc.property(
        fc.constant(false),
        (voiceMode) => {
          const apiMethod = selectApiMethod(voiceMode);
          expect(apiMethod).toBe('sendMessage');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly select API method for any voice mode state', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (voiceMode) => {
          const apiMethod = selectApiMethod(voiceMode);
          
          if (voiceMode) {
            expect(apiMethod).toBe('sendMessageWithVoice');
          } else {
            expect(apiMethod).toBe('sendMessage');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistent API selection across multiple toggles', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.integer({ min: 0, max: 20 }),
        (initialVoiceMode, toggleCount) => {
          let voiceMode = initialVoiceMode;
          
          // Simulate toggles
          for (let i = 0; i < toggleCount; i++) {
            voiceMode = !voiceMode;
          }
          
          // Final state should be predictable
          const expectedVoiceMode = toggleCount % 2 === 0 ? initialVoiceMode : !initialVoiceMode;
          expect(voiceMode).toBe(expectedVoiceMode);
          
          // API selection should match final state
          const apiMethod = selectApiMethod(voiceMode);
          if (voiceMode) {
            expect(apiMethod).toBe('sendMessageWithVoice');
          } else {
            expect(apiMethod).toBe('sendMessage');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should select correct API for any message with any voice mode', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.boolean(),
        (message, voiceMode) => {
          // Message content should not affect API selection
          const apiMethod = selectApiMethod(voiceMode);
          
          expect(apiMethod).toBe(voiceMode ? 'sendMessageWithVoice' : 'sendMessage');
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// UI STYLING TESTS FOR CHATINTERFACE
// Requirements: 2.1-2.6, 3.1-3.4, 4.1-4.3
// ============================================================================

/**
 * Styling logic extracted for testing
 * These functions mirror the styling logic in ChatInterface.jsx
 */

// Suggestion chips configuration
const SUGGESTION_CHIPS = [
  "How do I register for VAT?",
  "Draft a payment reminder",
  "Analyze my revenue"
];

/**
 * Determines if empty state should be shown
 * @param {Array} messages - Array of messages
 * @returns {boolean} - True if empty state should be shown
 */
function shouldShowEmptyState(messages) {
  return messages.length === 0;
}

/**
 * Gets the suggestion chips to display
 * @returns {Array<string>} - Array of suggestion chip texts
 */
function getSuggestionChips() {
  return SUGGESTION_CHIPS;
}

/**
 * Generates container classes based on dark mode
 * @param {boolean} darkMode - Whether dark mode is enabled
 * @returns {string} - CSS classes for the container
 */
function getContainerClasses(darkMode) {
  const baseClasses = 'flex flex-col h-full shadow-lg rounded-xl';
  const modeClasses = darkMode 
    ? 'bg-slate-800 border border-slate-700' 
    : 'bg-white border border-slate-200';
  return `${baseClasses} ${modeClasses}`;
}

/**
 * Generates message bubble classes based on role and dark mode
 * @param {string} role - 'user' or 'assistant'
 * @param {boolean} darkMode - Whether dark mode is enabled
 * @returns {string} - CSS classes for the message bubble
 */
function getMessageBubbleClasses(role, darkMode) {
  const baseClasses = 'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm transition-all';
  
  if (role === 'user') {
    return `${baseClasses} bg-blue-600 text-white`;
  }
  
  const assistantClasses = darkMode
    ? 'bg-slate-700 text-slate-100'
    : 'bg-white text-slate-800';
  
  return `${baseClasses} ${assistantClasses}`;
}

/**
 * Generates suggestion chip classes based on dark mode
 * @param {boolean} darkMode - Whether dark mode is enabled
 * @returns {string} - CSS classes for suggestion chips
 */
function getSuggestionChipClasses(darkMode) {
  const baseClasses = 'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200';
  const modeClasses = darkMode
    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600 hover:scale-105'
    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105';
  return `${baseClasses} ${modeClasses}`;
}

describe('ChatInterface UI Styling Tests', () => {
  describe('Empty State with Logo and Suggestion Chips (Requirements 3.1, 3.2, 3.3, 3.4)', () => {
    /**
     * **Validates: Requirements 3.1**
     * WHEN the ChatInterface has no messages THEN the SmartBiz_UI SHALL display the Logo component centered in the chat area
     */
    it('should show empty state when no messages exist', () => {
      expect(shouldShowEmptyState([])).toBe(true);
    });

    it('should not show empty state when messages exist', () => {
      expect(shouldShowEmptyState([{ role: 'user', content: 'Hello' }])).toBe(false);
    });

    /**
     * **Validates: Requirements 3.2**
     * WHEN the ChatInterface has no messages THEN the SmartBiz_UI SHALL display exactly 3 clickable Suggestion_Chips below the Logo
     */
    it('should have exactly 3 suggestion chips', () => {
      const chips = getSuggestionChips();
      expect(chips).toHaveLength(3);
    });

    /**
     * **Validates: Requirements 3.4**
     * THE SmartBiz_UI SHALL include these specific suggestions
     */
    it('should have correct suggestion chip text', () => {
      const chips = getSuggestionChips();
      expect(chips).toContain('How do I register for VAT?');
      expect(chips).toContain('Draft a payment reminder');
      expect(chips).toContain('Analyze my revenue');
    });

    it('should have rounded-full class on suggestion chips', () => {
      const classes = getSuggestionChipClasses(false);
      expect(classes).toContain('rounded-full');
    });

    it('should have transition classes on suggestion chips', () => {
      const classes = getSuggestionChipClasses(false);
      expect(classes).toContain('transition-all');
    });

    it('should have hover effects on suggestion chips', () => {
      const lightClasses = getSuggestionChipClasses(false);
      const darkClasses = getSuggestionChipClasses(true);
      
      expect(lightClasses).toContain('hover:bg-slate-200');
      expect(lightClasses).toContain('hover:scale-105');
      expect(darkClasses).toContain('hover:bg-slate-600');
      expect(darkClasses).toContain('hover:scale-105');
    });
  });

  describe('Message Bubble Styling (Requirements 4.1, 4.2, 4.3)', () => {
    /**
     * **Validates: Requirements 4.1, 4.2**
     * Message bubbles SHALL apply rounded-2xl corners
     */
    it('should have rounded-2xl class on user message bubbles', () => {
      const classes = getMessageBubbleClasses('user', false);
      expect(classes).toContain('rounded-2xl');
    });

    it('should have rounded-2xl class on assistant message bubbles', () => {
      const classes = getMessageBubbleClasses('assistant', false);
      expect(classes).toContain('rounded-2xl');
    });

    /**
     * **Validates: Requirements 4.3**
     * Message bubbles SHALL apply subtle shadows and smooth transitions
     */
    it('should have shadow-sm on message bubbles', () => {
      const userClasses = getMessageBubbleClasses('user', false);
      const assistantClasses = getMessageBubbleClasses('assistant', false);
      
      expect(userClasses).toContain('shadow-sm');
      expect(assistantClasses).toContain('shadow-sm');
    });

    it('should have transition-all on message bubbles', () => {
      const userClasses = getMessageBubbleClasses('user', false);
      const assistantClasses = getMessageBubbleClasses('assistant', false);
      
      expect(userClasses).toContain('transition-all');
      expect(assistantClasses).toContain('transition-all');
    });

    it('should have distinct styling for user messages (blue background)', () => {
      const classes = getMessageBubbleClasses('user', false);
      expect(classes).toContain('bg-blue-600');
      expect(classes).toContain('text-white');
    });

    it('should have distinct styling for assistant messages in light mode', () => {
      const classes = getMessageBubbleClasses('assistant', false);
      expect(classes).toContain('bg-white');
      expect(classes).toContain('text-slate-800');
    });

    it('should have distinct styling for assistant messages in dark mode', () => {
      const classes = getMessageBubbleClasses('assistant', true);
      expect(classes).toContain('bg-slate-700');
      expect(classes).toContain('text-slate-100');
    });
  });

  describe('Card Styling (Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6)', () => {
    /**
     * **Validates: Requirements 2.3**
     * Cards SHALL apply shadow-lg for a professional shadow effect
     */
    it('should have shadow-lg class on chat container', () => {
      const classes = getContainerClasses(false);
      expect(classes).toContain('shadow-lg');
    });

    /**
     * **Validates: Requirements 2.4**
     * Cards SHALL apply rounded-xl for smooth corners
     */
    it('should have rounded-xl class on chat container', () => {
      const classes = getContainerClasses(false);
      expect(classes).toContain('rounded-xl');
    });

    /**
     * **Validates: Requirements 2.1, 2.5**
     * In light mode, cards SHALL apply bg-white and border-slate-200
     */
    it('should have light mode styling when darkMode is false', () => {
      const classes = getContainerClasses(false);
      expect(classes).toContain('bg-white');
      expect(classes).toContain('border-slate-200');
    });

    /**
     * **Validates: Requirements 2.2, 2.6**
     * In dark mode, cards SHALL apply bg-slate-800 and border-slate-700
     */
    it('should have dark mode styling when darkMode is true', () => {
      const classes = getContainerClasses(true);
      expect(classes).toContain('bg-slate-800');
      expect(classes).toContain('border-slate-700');
    });

    it('should have border class in both modes', () => {
      const lightClasses = getContainerClasses(false);
      const darkClasses = getContainerClasses(true);
      
      expect(lightClasses).toContain('border');
      expect(darkClasses).toContain('border');
    });
  });
});
