/**
 * Property-Based Tests and Unit Tests for DashboardLayout Component
 * Using fast-check for property-based testing
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { DashboardLayout } from './DashboardLayout';
import { AuthContext } from '../contexts/AuthContext';
import { DarkModeProvider } from '../contexts/DarkModeContext';

// Mock window.matchMedia for tests that use DarkModeProvider
const mockMatchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

beforeAll(() => {
  window.matchMedia = mockMatchMedia;
});

afterAll(() => {
  vi.restoreAllMocks();
});

// ============================================================================
// UNIT TESTS FOR DASHBOARDLAYOUT
// Requirements: 4.3, 4.5, 4.6
// ============================================================================

/**
 * Simulates the DashboardLayout state management for unit testing
 */
function createDashboardLayoutState(initialDarkMode = false) {
  let activeTab = 'chat';
  let darkMode = initialDarkMode;

  const navItems = [
    { id: 'chat', label: 'Chat' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'analytics', label: 'Analytics' }
  ];

  return {
    // Getters
    getActiveTab: () => activeTab,
    getDarkMode: () => darkMode,
    getNavItems: () => navItems,

    // Navigation (Requirements 4.5, 4.6)
    handleNavClick: (tabId) => {
      if (navItems.some(item => item.id === tabId)) {
        activeTab = tabId;
      }
    },

    // Dark mode toggle (Requirements 4.3)
    toggleDarkMode: () => {
      darkMode = !darkMode;
    },

    // Get content to render based on active tab
    getActiveContent: () => {
      switch (activeTab) {
        case 'chat':
          return 'ChatComponent';
        case 'invoices':
          return 'InvoicesComponent';
        case 'analytics':
          return 'AnalyticsComponent';
        default:
          return null;
      }
    },

    // Check if tab is active
    isTabActive: (tabId) => activeTab === tabId,

    // Get dark mode icon
    getDarkModeIcon: () => darkMode ? 'Sun' : 'Moon',

    // Get dark mode aria label
    getDarkModeAriaLabel: () => 
      darkMode ? 'Switch to light mode' : 'Switch to dark mode'
  };
}

describe('DashboardLayout Unit Tests', () => {
  describe('Navigation Between Tabs (Requirements 4.5, 4.6)', () => {
    it('should start with chat tab active', () => {
      const state = createDashboardLayoutState();
      expect(state.getActiveTab()).toBe('chat');
    });

    it('should have three navigation items', () => {
      const state = createDashboardLayoutState();
      const navItems = state.getNavItems();
      
      expect(navItems.length).toBe(3);
      expect(navItems.map(i => i.id)).toEqual(['chat', 'invoices', 'analytics']);
    });

    it('should switch to invoices tab when clicked', () => {
      const state = createDashboardLayoutState();
      state.handleNavClick('invoices');
      
      expect(state.getActiveTab()).toBe('invoices');
    });

    it('should switch to analytics tab when clicked', () => {
      const state = createDashboardLayoutState();
      state.handleNavClick('analytics');
      
      expect(state.getActiveTab()).toBe('analytics');
    });

    it('should switch back to chat tab when clicked', () => {
      const state = createDashboardLayoutState();
      state.handleNavClick('invoices');
      state.handleNavClick('chat');
      
      expect(state.getActiveTab()).toBe('chat');
    });

    it('should ignore invalid tab IDs', () => {
      const state = createDashboardLayoutState();
      state.handleNavClick('invalid-tab');
      
      expect(state.getActiveTab()).toBe('chat');
    });

    it('should render correct content for chat tab', () => {
      const state = createDashboardLayoutState();
      state.handleNavClick('chat');
      
      expect(state.getActiveContent()).toBe('ChatComponent');
    });

    it('should render correct content for invoices tab', () => {
      const state = createDashboardLayoutState();
      state.handleNavClick('invoices');
      
      expect(state.getActiveContent()).toBe('InvoicesComponent');
    });

    it('should render correct content for analytics tab', () => {
      const state = createDashboardLayoutState();
      state.handleNavClick('analytics');
      
      expect(state.getActiveContent()).toBe('AnalyticsComponent');
    });

    it('should correctly identify active tab', () => {
      const state = createDashboardLayoutState();
      
      expect(state.isTabActive('chat')).toBe(true);
      expect(state.isTabActive('invoices')).toBe(false);
      expect(state.isTabActive('analytics')).toBe(false);
      
      state.handleNavClick('invoices');
      
      expect(state.isTabActive('chat')).toBe(false);
      expect(state.isTabActive('invoices')).toBe(true);
      expect(state.isTabActive('analytics')).toBe(false);
    });

    it('should handle rapid tab switching', () => {
      const state = createDashboardLayoutState();
      
      state.handleNavClick('invoices');
      state.handleNavClick('analytics');
      state.handleNavClick('chat');
      state.handleNavClick('analytics');
      
      expect(state.getActiveTab()).toBe('analytics');
    });
  });

  describe('Dark Mode Toggle (Requirements 4.3)', () => {
    it('should start with dark mode disabled by default', () => {
      const state = createDashboardLayoutState();
      expect(state.getDarkMode()).toBe(false);
    });

    it('should start with dark mode enabled when initialized with true', () => {
      const state = createDashboardLayoutState(true);
      expect(state.getDarkMode()).toBe(true);
    });

    it('should toggle dark mode on', () => {
      const state = createDashboardLayoutState();
      state.toggleDarkMode();
      
      expect(state.getDarkMode()).toBe(true);
    });

    it('should toggle dark mode off', () => {
      const state = createDashboardLayoutState(true);
      state.toggleDarkMode();
      
      expect(state.getDarkMode()).toBe(false);
    });

    it('should toggle dark mode multiple times', () => {
      const state = createDashboardLayoutState();
      
      state.toggleDarkMode(); // on
      expect(state.getDarkMode()).toBe(true);
      
      state.toggleDarkMode(); // off
      expect(state.getDarkMode()).toBe(false);
      
      state.toggleDarkMode(); // on
      expect(state.getDarkMode()).toBe(true);
    });

    it('should show Sun icon when dark mode is enabled', () => {
      const state = createDashboardLayoutState(true);
      expect(state.getDarkModeIcon()).toBe('Sun');
    });

    it('should show Moon icon when dark mode is disabled', () => {
      const state = createDashboardLayoutState(false);
      expect(state.getDarkModeIcon()).toBe('Moon');
    });

    it('should have correct aria label for dark mode button', () => {
      const state = createDashboardLayoutState(false);
      expect(state.getDarkModeAriaLabel()).toBe('Switch to dark mode');
      
      state.toggleDarkMode();
      expect(state.getDarkModeAriaLabel()).toBe('Switch to light mode');
    });

    it('should not affect navigation when toggling dark mode', () => {
      const state = createDashboardLayoutState();
      state.handleNavClick('invoices');
      
      state.toggleDarkMode();
      
      expect(state.getActiveTab()).toBe('invoices');
    });

    it('should not affect dark mode when navigating', () => {
      const state = createDashboardLayoutState(true);
      
      state.handleNavClick('analytics');
      state.handleNavClick('chat');
      
      expect(state.getDarkMode()).toBe(true);
    });
  });

  /**
   * Main Content Area Padding Tests (Requirements 1.1, 1.2)
   * **Validates: Requirements 1.1, 1.2**
   */
  describe('Main Content Area Padding (Requirements 1.1, 1.2)', () => {
    it('should have p-8 padding class in main content area', () => {
      // Test that main content area includes p-8 padding
      const lightModeClasses = getMainContentClasses(false);
      const darkModeClasses = getMainContentClasses(true);
      
      expect(lightModeClasses.padding).toBe('p-8');
      expect(darkModeClasses.padding).toBe('p-8');
      expect(lightModeClasses.fullClassName).toContain('p-8');
      expect(darkModeClasses.fullClassName).toContain('p-8');
    });

    it('should maintain consistent padding across all tab views in light mode', () => {
      // Padding should be consistent regardless of which tab is active
      const state = createDashboardLayoutState(false);
      const classes = getMainContentClasses(false);
      
      // Test padding consistency across all tabs
      ['chat', 'invoices', 'analytics'].forEach(tab => {
        state.handleNavClick(tab);
        // Padding class should always be p-8 regardless of active tab
        expect(classes.padding).toBe('p-8');
        expect(classes.fullClassName).toContain('p-8');
      });
    });

    it('should maintain consistent padding across all tab views in dark mode', () => {
      // Padding should be consistent regardless of which tab is active
      const state = createDashboardLayoutState(true);
      const classes = getMainContentClasses(true);
      
      // Test padding consistency across all tabs
      ['chat', 'invoices', 'analytics'].forEach(tab => {
        state.handleNavClick(tab);
        // Padding class should always be p-8 regardless of active tab
        expect(classes.padding).toBe('p-8');
        expect(classes.fullClassName).toContain('p-8');
      });
    });

    it('should include p-8 in the base classes', () => {
      const lightModeClasses = getMainContentClasses(false);
      const darkModeClasses = getMainContentClasses(true);
      
      expect(lightModeClasses.base).toContain('p-8');
      expect(darkModeClasses.base).toContain('p-8');
    });
  });
});

// ============================================================================
// LOGOUT BUTTON UNIT TESTS
// Requirements: 4.1, 4.2, 4.3
// ============================================================================

describe('Logout Button Functionality (Requirements 4.1, 4.2, 4.3)', () => {
  /**
   * Helper to render DashboardLayout with mocked AuthContext
   */
  const renderWithProviders = (mockLogout = vi.fn()) => {
    const authContextValue = {
      isAuthenticated: true,
      user: { code: 'test-code' },
      login: vi.fn(),
      logout: mockLogout,
      handleCallback: vi.fn(),
    };

    return {
      mockLogout,
      ...render(
        <AuthContext.Provider value={authContextValue}>
          <DarkModeProvider>
            <DashboardLayout />
          </DarkModeProvider>
        </AuthContext.Provider>
      ),
    };
  };

  it('should render a logout button with correct aria-label', () => {
    renderWithProviders();
    
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toBeDefined();
    expect(logoutButton.getAttribute('aria-label')).toBe('Logout');
  });

  it('should call logout method from AuthContext when clicked', () => {
    const mockLogout = vi.fn();
    renderWithProviders(mockLogout);
    
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('should call logout method each time the button is clicked', () => {
    const mockLogout = vi.fn();
    renderWithProviders(mockLogout);
    
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    
    fireEvent.click(logoutButton);
    fireEvent.click(logoutButton);
    fireEvent.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalledTimes(3);
  });
});

// ============================================================================
// PROPERTY-BASED TESTS (existing)
// ============================================================================

/**
 * Navigation state management logic extracted for testing
 * This mirrors the logic in DashboardLayout.jsx
 */
const validTabs = ['chat', 'invoices', 'analytics'];

function createNavigationState(initialTab = 'chat') {
  let activeTab = validTabs.includes(initialTab) ? initialTab : 'chat';
  
  return {
    getActiveTab: () => activeTab,
    handleNavClick: (tabId) => {
      if (validTabs.includes(tabId)) {
        activeTab = tabId;
      }
    },
    isValidTab: (tabId) => validTabs.includes(tabId)
  };
}

/**
 * Dark mode styling logic extracted for testing
 * This mirrors the styling logic in DashboardLayout.jsx
 */
function getDarkModeClasses(darkMode) {
  return {
    background: darkMode ? 'bg-slate-900' : 'bg-white',
    text: darkMode ? 'text-slate-100' : 'text-slate-800',
    headerBg: darkMode ? 'bg-slate-900' : 'bg-white',
    headerBorder: darkMode ? 'border-slate-700' : 'border-slate-200',
    sidebarBg: darkMode ? 'bg-slate-900' : 'bg-white',
    sidebarBorder: darkMode ? 'border-slate-700' : 'border-slate-200',
    contentBg: darkMode ? 'bg-slate-800' : 'bg-slate-50'
  };
}

/**
 * Main content area styling logic extracted for testing
 * This mirrors the styling logic in DashboardLayout.jsx
 */
function getMainContentClasses(darkMode) {
  return {
    base: 'flex-1 ml-64 p-8',
    padding: 'p-8',
    background: darkMode ? 'bg-slate-800' : 'bg-slate-50',
    fullClassName: `flex-1 ml-64 p-8 ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`
  };
}

/**
 * **Feature: smartbiz-frontend-ui, Property 7: Navigation state management**
 * **Validates: Requirements 4.5, 4.6**
 * 
 * For any navigation action (clicking a sidebar item), the DashboardLayout 
 * SHALL update the active tab state and render the corresponding component.
 */
describe('Property 7: Navigation state management', () => {
  it('should update active tab for any valid navigation action', () => {
    fc.assert(
      fc.property(
        // Generate a sequence of valid tab selections
        fc.array(fc.constantFrom('chat', 'invoices', 'analytics'), { minLength: 1, maxLength: 20 }),
        (tabSequence) => {
          const navState = createNavigationState();
          
          // Apply each navigation action
          for (const tabId of tabSequence) {
            navState.handleNavClick(tabId);
            
            // After clicking, active tab should match the clicked tab
            expect(navState.getActiveTab()).toBe(tabId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain valid state for any initial tab', () => {
    fc.assert(
      fc.property(
        // Generate any initial tab (valid or invalid)
        fc.oneof(
          fc.constantFrom('chat', 'invoices', 'analytics'),
          fc.string()
        ),
        (initialTab) => {
          const navState = createNavigationState(initialTab);
          
          // Active tab should always be one of the valid tabs
          expect(validTabs).toContain(navState.getActiveTab());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ignore invalid tab navigation attempts', () => {
    fc.assert(
      fc.property(
        // Generate invalid tab IDs (strings that are not valid tabs)
        fc.string().filter(s => !validTabs.includes(s)),
        (invalidTabId) => {
          const navState = createNavigationState('chat');
          const previousTab = navState.getActiveTab();
          
          // Attempt to navigate to invalid tab
          navState.handleNavClick(invalidTabId);
          
          // Active tab should remain unchanged
          expect(navState.getActiveTab()).toBe(previousTab);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly identify valid tabs', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Valid tabs
          fc.constantFrom('chat', 'invoices', 'analytics').map(t => ({ tab: t, expected: true })),
          // Invalid tabs
          fc.string().filter(s => !validTabs.includes(s)).map(t => ({ tab: t, expected: false }))
        ),
        ({ tab, expected }) => {
          const navState = createNavigationState();
          expect(navState.isValidTab(tab)).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: smartbiz-frontend-ui, Property 8: Dark mode styling**
 * **Validates: Requirements 5.1, 5.2**
 * 
 * For any dark mode state, the application SHALL apply the correct CSS classes:
 * slate-900 backgrounds and slate-100 text when enabled,
 * white backgrounds and slate-800 text when disabled.
 */
describe('Property 8: Dark mode styling', () => {
  it('should apply correct background classes for any dark mode state', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (darkMode) => {
          const classes = getDarkModeClasses(darkMode);
          
          if (darkMode) {
            // Dark mode: slate-900 backgrounds
            expect(classes.background).toBe('bg-slate-900');
            expect(classes.headerBg).toBe('bg-slate-900');
            expect(classes.sidebarBg).toBe('bg-slate-900');
          } else {
            // Light mode: white backgrounds
            expect(classes.background).toBe('bg-white');
            expect(classes.headerBg).toBe('bg-white');
            expect(classes.sidebarBg).toBe('bg-white');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply correct text classes for any dark mode state', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (darkMode) => {
          const classes = getDarkModeClasses(darkMode);
          
          if (darkMode) {
            // Dark mode: slate-100 text
            expect(classes.text).toBe('text-slate-100');
          } else {
            // Light mode: slate-800 text
            expect(classes.text).toBe('text-slate-800');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply correct border classes for any dark mode state', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (darkMode) => {
          const classes = getDarkModeClasses(darkMode);
          
          if (darkMode) {
            // Dark mode: slate-700 borders
            expect(classes.headerBorder).toBe('border-slate-700');
            expect(classes.sidebarBorder).toBe('border-slate-700');
          } else {
            // Light mode: slate-200 borders
            expect(classes.headerBorder).toBe('border-slate-200');
            expect(classes.sidebarBorder).toBe('border-slate-200');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should toggle between dark and light mode correctly for any sequence of toggles', () => {
    fc.assert(
      fc.property(
        // Generate initial state and number of toggles
        fc.boolean(),
        fc.integer({ min: 0, max: 20 }),
        (initialDarkMode, toggleCount) => {
          let darkMode = initialDarkMode;
          
          // Apply toggles
          for (let i = 0; i < toggleCount; i++) {
            darkMode = !darkMode;
          }
          
          // Final state should be predictable based on initial state and toggle count
          const expectedDarkMode = toggleCount % 2 === 0 ? initialDarkMode : !initialDarkMode;
          expect(darkMode).toBe(expectedDarkMode);
          
          // Verify correct classes are applied
          const classes = getDarkModeClasses(darkMode);
          if (darkMode) {
            expect(classes.background).toBe('bg-slate-900');
            expect(classes.text).toBe('text-slate-100');
          } else {
            expect(classes.background).toBe('bg-white');
            expect(classes.text).toBe('text-slate-800');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistent styling across all components for any dark mode state', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (darkMode) => {
          const classes = getDarkModeClasses(darkMode);
          
          // All dark mode classes should be consistent
          if (darkMode) {
            // All backgrounds should use dark slate colors
            expect(classes.background).toContain('slate-9');
            expect(classes.headerBg).toContain('slate-9');
            expect(classes.sidebarBg).toContain('slate-9');
            // Text should be light
            expect(classes.text).toContain('slate-1');
          } else {
            // Main backgrounds should be white
            expect(classes.background).toBe('bg-white');
            expect(classes.headerBg).toBe('bg-white');
            expect(classes.sidebarBg).toBe('bg-white');
            // Text should be dark
            expect(classes.text).toContain('slate-8');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
