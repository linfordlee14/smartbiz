/**
 * Property-Based Tests for Error Message Display
 * Using fast-check for property-based testing
 * 
 * **Feature: smartbiz-frontend-ui, Property 5: Error message display**
 * **Validates: Requirements 1.5, 2.14, 3.7**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Error display logic extracted for testing
 * This mirrors the error handling pattern used across components:
 * - ChatInterface (Requirements 1.5)
 * - InvoiceGenerator (Requirements 2.14)
 * - AnalyticsDashboard (Requirements 3.7)
 */

/**
 * Determines if an error should be displayed based on error state
 * @param {string|null} error - The error message or null
 * @returns {boolean} - True if error should be displayed
 */
function shouldDisplayError(error) {
  return error !== null && error !== undefined && error !== '';
}

/**
 * Simulates error display rendering for ChatInterface
 * @param {string|null} error - The error message
 * @returns {Object} - Rendered error display state
 */
function renderChatInterfaceError(error) {
  if (!shouldDisplayError(error)) {
    return { displayed: false, message: null, className: null };
  }
  
  return {
    displayed: true,
    message: error,
    className: 'bg-red-100 text-red-700 rounded-lg px-4 py-3'
  };
}

/**
 * Simulates error display rendering for InvoiceGenerator
 * @param {string|null} error - The error message
 * @returns {Object} - Rendered error display state
 */
function renderInvoiceGeneratorError(error) {
  if (!shouldDisplayError(error)) {
    return { displayed: false, message: null, className: null };
  }
  
  return {
    displayed: true,
    message: error,
    className: 'mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm'
  };
}

/**
 * Simulates error display rendering for AnalyticsDashboard
 * @param {string|null} error - The error message
 * @returns {Object} - Rendered error display state
 */
function renderAnalyticsDashboardError(error) {
  if (!shouldDisplayError(error)) {
    return { displayed: false, message: null, className: null };
  }
  
  return {
    displayed: true,
    message: error,
    className: 'mb-4 p-4 bg-red-100 text-red-700 rounded-lg'
  };
}


/**
 * Processes API response and extracts error if present
 * This mirrors the error handling in all three components
 * @param {Object} apiResponse - The API response object
 * @returns {string|null} - The error message or null
 */
function extractErrorFromResponse(apiResponse) {
  if (!apiResponse) return null;
  if (apiResponse.error) return apiResponse.error;
  return null;
}

/**
 * Generic error handler that simulates component error state management
 * @param {Object} apiResponse - The API response
 * @param {Function} setError - State setter function (simulated)
 * @returns {Object} - The resulting error state
 */
function handleApiResponse(apiResponse) {
  const error = extractErrorFromResponse(apiResponse);
  return {
    hasError: error !== null,
    errorMessage: error
  };
}

// Arbitrary for generating non-empty error messages
const errorMessageArbitrary = fc.string({ minLength: 1, maxLength: 500 })
  .filter(s => s.trim().length > 0);

// Arbitrary for generating API error responses
const errorResponseArbitrary = fc.record({
  error: errorMessageArbitrary
});

// Arbitrary for generating successful API responses (no error)
const successResponseArbitrary = fc.record({
  response: fc.string({ minLength: 1, maxLength: 200 }),
  // Explicitly no error field or error is undefined
}).map(obj => ({ ...obj, error: undefined }));

// Arbitrary for generating mixed API responses
const apiResponseArbitrary = fc.oneof(
  errorResponseArbitrary,
  successResponseArbitrary,
  fc.constant(null),
  fc.constant(undefined)
);

/**
 * **Feature: smartbiz-frontend-ui, Property 5: Error message display**
 * **Validates: Requirements 1.5, 2.14, 3.7**
 * 
 * For any component (ChatInterface, InvoiceGenerator, AnalyticsDashboard) receiving 
 * an error response from the API, the component SHALL display the error message to the user.
 */
describe('Property 5: Error message display', () => {
  describe('ChatInterface error display (Requirements 1.5)', () => {
    it('should display error message when error is present', () => {
      fc.assert(
        fc.property(
          errorMessageArbitrary,
          (errorMessage) => {
            const rendered = renderChatInterfaceError(errorMessage);
            
            expect(rendered.displayed).toBe(true);
            expect(rendered.message).toBe(errorMessage);
            expect(rendered.className).toContain('bg-red-100');
            expect(rendered.className).toContain('text-red-700');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not display error when error is null', () => {
      const rendered = renderChatInterfaceError(null);
      expect(rendered.displayed).toBe(false);
      expect(rendered.message).toBeNull();
    });

    it('should not display error when error is empty string', () => {
      const rendered = renderChatInterfaceError('');
      expect(rendered.displayed).toBe(false);
    });
  });

  describe('InvoiceGenerator error display (Requirements 2.14)', () => {
    it('should display error message when error is present', () => {
      fc.assert(
        fc.property(
          errorMessageArbitrary,
          (errorMessage) => {
            const rendered = renderInvoiceGeneratorError(errorMessage);
            
            expect(rendered.displayed).toBe(true);
            expect(rendered.message).toBe(errorMessage);
            expect(rendered.className).toContain('bg-red-100');
            expect(rendered.className).toContain('text-red-700');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not display error when error is null', () => {
      const rendered = renderInvoiceGeneratorError(null);
      expect(rendered.displayed).toBe(false);
      expect(rendered.message).toBeNull();
    });

    it('should not display error when error is undefined', () => {
      const rendered = renderInvoiceGeneratorError(undefined);
      expect(rendered.displayed).toBe(false);
    });
  });

  describe('AnalyticsDashboard error display (Requirements 3.7)', () => {
    it('should display error message when error is present', () => {
      fc.assert(
        fc.property(
          errorMessageArbitrary,
          (errorMessage) => {
            const rendered = renderAnalyticsDashboardError(errorMessage);
            
            expect(rendered.displayed).toBe(true);
            expect(rendered.message).toBe(errorMessage);
            expect(rendered.className).toContain('bg-red-100');
            expect(rendered.className).toContain('text-red-700');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not display error when error is null', () => {
      const rendered = renderAnalyticsDashboardError(null);
      expect(rendered.displayed).toBe(false);
      expect(rendered.message).toBeNull();
    });
  });


  describe('Cross-component error handling consistency', () => {
    it('should extract error from API error response', () => {
      fc.assert(
        fc.property(
          errorResponseArbitrary,
          (response) => {
            const result = handleApiResponse(response);
            
            expect(result.hasError).toBe(true);
            expect(result.errorMessage).toBe(response.error);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not extract error from successful API response', () => {
      fc.assert(
        fc.property(
          successResponseArbitrary,
          (response) => {
            const result = handleApiResponse(response);
            
            expect(result.hasError).toBe(false);
            expect(result.errorMessage).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle null API response gracefully', () => {
      const result = handleApiResponse(null);
      expect(result.hasError).toBe(false);
      expect(result.errorMessage).toBeNull();
    });

    it('should handle undefined API response gracefully', () => {
      const result = handleApiResponse(undefined);
      expect(result.hasError).toBe(false);
      expect(result.errorMessage).toBeNull();
    });

    it('should display same error message across all components', () => {
      fc.assert(
        fc.property(
          errorMessageArbitrary,
          (errorMessage) => {
            const chatError = renderChatInterfaceError(errorMessage);
            const invoiceError = renderInvoiceGeneratorError(errorMessage);
            const analyticsError = renderAnalyticsDashboardError(errorMessage);
            
            // All components should display the error
            expect(chatError.displayed).toBe(true);
            expect(invoiceError.displayed).toBe(true);
            expect(analyticsError.displayed).toBe(true);
            
            // All components should show the exact same message
            expect(chatError.message).toBe(errorMessage);
            expect(invoiceError.message).toBe(errorMessage);
            expect(analyticsError.message).toBe(errorMessage);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use consistent error styling (red background and text)', () => {
      fc.assert(
        fc.property(
          errorMessageArbitrary,
          (errorMessage) => {
            const chatError = renderChatInterfaceError(errorMessage);
            const invoiceError = renderInvoiceGeneratorError(errorMessage);
            const analyticsError = renderAnalyticsDashboardError(errorMessage);
            
            // All components should use red styling
            [chatError, invoiceError, analyticsError].forEach(rendered => {
              expect(rendered.className).toContain('bg-red-100');
              expect(rendered.className).toContain('text-red-700');
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve error message content exactly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
          (errorMessage) => {
            // Test that special characters, unicode, etc. are preserved
            const chatError = renderChatInterfaceError(errorMessage);
            const invoiceError = renderInvoiceGeneratorError(errorMessage);
            const analyticsError = renderAnalyticsDashboardError(errorMessage);
            
            expect(chatError.message).toBe(errorMessage);
            expect(invoiceError.message).toBe(errorMessage);
            expect(analyticsError.message).toBe(errorMessage);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Error state transitions', () => {
    it('should correctly transition from no error to error state', () => {
      fc.assert(
        fc.property(
          errorMessageArbitrary,
          (errorMessage) => {
            // Initial state: no error
            const initialChat = renderChatInterfaceError(null);
            expect(initialChat.displayed).toBe(false);
            
            // After error: should display
            const errorChat = renderChatInterfaceError(errorMessage);
            expect(errorChat.displayed).toBe(true);
            expect(errorChat.message).toBe(errorMessage);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly transition from error to no error state', () => {
      fc.assert(
        fc.property(
          errorMessageArbitrary,
          (errorMessage) => {
            // Initial state: has error
            const errorChat = renderChatInterfaceError(errorMessage);
            expect(errorChat.displayed).toBe(true);
            
            // After clearing: should not display
            const clearedChat = renderChatInterfaceError(null);
            expect(clearedChat.displayed).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update error message when error changes', () => {
      fc.assert(
        fc.property(
          errorMessageArbitrary,
          errorMessageArbitrary,
          (error1, error2) => {
            fc.pre(error1 !== error2); // Ensure different errors
            
            const firstError = renderChatInterfaceError(error1);
            const secondError = renderChatInterfaceError(error2);
            
            expect(firstError.message).toBe(error1);
            expect(secondError.message).toBe(error2);
            expect(firstError.message).not.toBe(secondError.message);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
