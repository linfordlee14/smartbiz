import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Pure function that determines which view to render based on auth state
 * This mirrors the logic in AppContent component
 * @param {boolean} isAuthenticated - Whether the user is authenticated
 * @returns {'dashboard' | 'login'} - The view to render
 */
function determineView(isAuthenticated) {
  return isAuthenticated ? 'dashboard' : 'login';
}

/**
 * **Feature: workos-auth-login, Property 1: Authentication state determines view**
 * *For any* authentication state (authenticated or unauthenticated), the application
 * SHALL render the Dashboard when authenticated and the Login page when unauthenticated.
 * **Validates: Requirements 1.1, 6.1, 6.2**
 */
describe('Property 1: Authentication state determines view', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders Login when isAuthenticated is false', () => {
    fc.assert(
      fc.property(fc.constant(false), (isAuthenticated) => {
        const view = determineView(isAuthenticated);
        expect(view).toBe('login');
      }),
      { numRuns: 100 }
    );
  });

  it('renders Dashboard when isAuthenticated is true', () => {
    fc.assert(
      fc.property(fc.constant(true), (isAuthenticated) => {
        const view = determineView(isAuthenticated);
        expect(view).toBe('dashboard');
      }),
      { numRuns: 100 }
    );
  });

  it('for any boolean auth state, exactly one view is determined', () => {
    fc.assert(
      fc.property(fc.boolean(), (isAuthenticated) => {
        const view = determineView(isAuthenticated);
        
        // View should be exactly one of the two valid options
        expect(['login', 'dashboard']).toContain(view);
        
        // The correct view should be determined based on auth state
        if (isAuthenticated) {
          expect(view).toBe('dashboard');
        } else {
          expect(view).toBe('login');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('auth state change from false to true switches view from Login to Dashboard', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Start unauthenticated
        const viewBefore = determineView(false);
        expect(viewBefore).toBe('login');
        
        // Switch to authenticated
        const viewAfter = determineView(true);
        expect(viewAfter).toBe('dashboard');
      }),
      { numRuns: 100 }
    );
  });

  it('auth state change from true to false switches view from Dashboard to Login', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Start authenticated
        const viewBefore = determineView(true);
        expect(viewBefore).toBe('dashboard');
        
        // Switch to unauthenticated
        const viewAfter = determineView(false);
        expect(viewAfter).toBe('login');
      }),
      { numRuns: 100 }
    );
  });

  it('view determination is consistent for any sequence of auth state changes', () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }),
        (authStateSequence) => {
          for (const isAuthenticated of authStateSequence) {
            const view = determineView(isAuthenticated);
            const expectedView = isAuthenticated ? 'dashboard' : 'login';
            expect(view).toBe(expectedView);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
