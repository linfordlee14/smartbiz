import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  buildWorkOSLoginUrl,
  extractCallbackParams,
  readSessionFromStorage,
  writeSessionToStorage,
  clearSessionFromStorage,
} from './AuthContext';

const STORAGE_KEY = 'smartbiz_auth_session';

/**
 * **Feature: workos-auth-login, Property 2: WorkOS URL construction**
 * *For any* valid client ID and redirect URI, the constructed WorkOS login URL
 * SHALL contain both parameters correctly encoded.
 * **Validates: Requirements 1.3, 5.3**
 */
describe('Property 2: WorkOS URL construction', () => {
  // Generator for valid client IDs (alphanumeric strings)
  const clientIdArb = fc.stringMatching(/^[a-zA-Z0-9_-]{1,50}$/);
  
  // Generator for valid redirect URIs
  const redirectUriArb = fc.webUrl();

  it('constructed URL contains client_id parameter with correct value', () => {
    fc.assert(
      fc.property(clientIdArb, redirectUriArb, (clientId, redirectUri) => {
        const url = buildWorkOSLoginUrl(clientId, redirectUri);
        const parsedUrl = new URL(url);
        expect(parsedUrl.searchParams.get('client_id')).toBe(clientId);
      }),
      { numRuns: 100 }
    );
  });

  it('constructed URL contains redirect_uri parameter with correct value', () => {
    fc.assert(
      fc.property(clientIdArb, redirectUriArb, (clientId, redirectUri) => {
        const url = buildWorkOSLoginUrl(clientId, redirectUri);
        const parsedUrl = new URL(url);
        expect(parsedUrl.searchParams.get('redirect_uri')).toBe(redirectUri);
      }),
      { numRuns: 100 }
    );
  });

  it('constructed URL is a valid URL with WorkOS base', () => {
    fc.assert(
      fc.property(clientIdArb, redirectUriArb, (clientId, redirectUri) => {
        const url = buildWorkOSLoginUrl(clientId, redirectUri);
        const parsedUrl = new URL(url);
        expect(parsedUrl.origin).toBe('https://api.workos.com');
        expect(parsedUrl.pathname).toBe('/user_management/authorize');
      }),
      { numRuns: 100 }
    );
  });

  it('constructed URL contains response_type=code', () => {
    fc.assert(
      fc.property(clientIdArb, redirectUriArb, (clientId, redirectUri) => {
        const url = buildWorkOSLoginUrl(clientId, redirectUri);
        const parsedUrl = new URL(url);
        expect(parsedUrl.searchParams.get('response_type')).toBe('code');
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: workos-auth-login, Property 3: Authorization code extraction**
 * *For any* callback URL containing a `code` query parameter, the system
 * SHALL correctly extract the authorization code value.
 * **Validates: Requirements 2.1**
 */
describe('Property 3: Authorization code extraction', () => {
  // Generator for valid authorization codes (alphanumeric strings with common OAuth characters)
  const codeArb = fc.stringMatching(/^[a-zA-Z0-9_-]{1,100}$/);

  it('extracts code parameter from URL search string', () => {
    fc.assert(
      fc.property(codeArb, (code) => {
        const search = `?code=${encodeURIComponent(code)}`;
        const result = extractCallbackParams(search);
        
        expect(result.code).toBe(code);
        expect(result.error).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('extracts code when other parameters are present', () => {
    fc.assert(
      fc.property(codeArb, fc.string(), (code, state) => {
        const search = `?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
        const result = extractCallbackParams(search);
        
        expect(result.code).toBe(code);
      }),
      { numRuns: 100 }
    );
  });

  it('returns null code when code parameter is missing', () => {
    const result = extractCallbackParams('?other=value');
    expect(result.code).toBeNull();
  });

  it('returns null code for empty search string', () => {
    const result = extractCallbackParams('');
    expect(result.code).toBeNull();
  });
});


/**
 * **Feature: workos-auth-login, Property 5: Error parameter handling**
 * *For any* callback URL containing an `error` query parameter, the system
 * SHALL remain unauthenticated and display the error.
 * **Validates: Requirements 2.4**
 */
describe('Property 5: Error parameter handling', () => {
  // Generator for OAuth error codes (common error strings)
  const errorArb = fc.stringMatching(/^[a-zA-Z0-9_-]{1,50}$/);

  it('extracts error parameter from URL search string', () => {
    fc.assert(
      fc.property(errorArb, (error) => {
        const search = `?error=${encodeURIComponent(error)}`;
        const result = extractCallbackParams(search);
        
        expect(result.error).toBe(error);
        expect(result.code).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('error takes precedence - both code and error present returns both', () => {
    fc.assert(
      fc.property(errorArb, fc.stringMatching(/^[a-zA-Z0-9_-]{1,50}$/), (error, code) => {
        const search = `?error=${encodeURIComponent(error)}&code=${encodeURIComponent(code)}`;
        const result = extractCallbackParams(search);
        
        // Both should be extracted - the component decides how to handle
        expect(result.error).toBe(error);
        expect(result.code).toBe(code);
      }),
      { numRuns: 100 }
    );
  });

  it('returns null error when error parameter is missing', () => {
    const result = extractCallbackParams('?code=abc123');
    expect(result.error).toBeNull();
  });

  it('returns null error for empty search string', () => {
    const result = extractCallbackParams('');
    expect(result.error).toBeNull();
  });
});


/**
 * **Feature: workos-auth-login, Property 4: Session persistence round-trip**
 * *For any* valid session data stored in LocalStorage, reloading the application
 * SHALL restore the same authenticated state.
 * **Validates: Requirements 2.2, 3.1**
 */
describe('Property 4: Session persistence round-trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // Generator for valid authorization codes (alphanumeric strings)
  const codeArb = fc.stringMatching(/^[a-zA-Z0-9_-]{1,100}$/);
  
  // Generator for valid timestamps
  const timestampArb = fc.integer({ min: 0, max: Date.now() + 1000000000 });

  it('writing then reading session returns the same code', () => {
    fc.assert(
      fc.property(codeArb, timestampArb, (code, timestamp) => {
        const session = { code, timestamp };
        
        writeSessionToStorage(session);
        const retrieved = readSessionFromStorage();
        
        expect(retrieved).not.toBeNull();
        expect(retrieved.code).toBe(code);
        expect(retrieved.timestamp).toBe(timestamp);
      }),
      { numRuns: 100 }
    );
  });

  it('session data persists across read operations', () => {
    fc.assert(
      fc.property(codeArb, timestampArb, (code, timestamp) => {
        const session = { code, timestamp };
        
        writeSessionToStorage(session);
        
        // Multiple reads should return the same data
        const read1 = readSessionFromStorage();
        const read2 = readSessionFromStorage();
        
        expect(read1).toEqual(read2);
        expect(read1.code).toBe(code);
      }),
      { numRuns: 100 }
    );
  });

  it('reading from empty storage returns null', () => {
    localStorage.clear();
    const result = readSessionFromStorage();
    expect(result).toBeNull();
  });

  it('reading corrupted data returns null', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json');
    const result = readSessionFromStorage();
    expect(result).toBeNull();
  });

  it('reading session without code property returns null', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ timestamp: 123 }));
    const result = readSessionFromStorage();
    expect(result).toBeNull();
  });
});


/**
 * **Feature: workos-auth-login, Property 6: Logout clears session**
 * *For any* authenticated session, calling logout SHALL clear LocalStorage
 * and reset authentication state to unauthenticated.
 * **Validates: Requirements 4.1, 4.3**
 */
describe('Property 6: Logout clears session', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // Generator for valid authorization codes
  const codeArb = fc.stringMatching(/^[a-zA-Z0-9_-]{1,100}$/);
  
  // Generator for valid timestamps
  const timestampArb = fc.integer({ min: 0, max: Date.now() + 1000000000 });

  it('clearing session removes data from storage', () => {
    fc.assert(
      fc.property(codeArb, timestampArb, (code, timestamp) => {
        // Set up an authenticated session
        const session = { code, timestamp };
        writeSessionToStorage(session);
        
        // Verify session exists
        expect(readSessionFromStorage()).not.toBeNull();
        
        // Clear the session (logout)
        clearSessionFromStorage();
        
        // Verify session is cleared
        expect(readSessionFromStorage()).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('clearing session is idempotent', () => {
    fc.assert(
      fc.property(codeArb, timestampArb, (code, timestamp) => {
        const session = { code, timestamp };
        writeSessionToStorage(session);
        
        // Clear multiple times
        clearSessionFromStorage();
        clearSessionFromStorage();
        clearSessionFromStorage();
        
        // Should still be null
        expect(readSessionFromStorage()).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('clearing empty storage does not throw', () => {
    localStorage.clear();
    expect(() => clearSessionFromStorage()).not.toThrow();
    expect(readSessionFromStorage()).toBeNull();
  });
});
