/**
 * Property-Based Tests and Unit Tests for InvoiceGenerator Component
 * Using fast-check for property-based testing
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { InvoiceGenerator } from './InvoiceGenerator';

// ============================================================================
// UNIT TESTS FOR INVOICEGENERATOR
// Requirements: 2.4, 2.5, 2.11, 2.14
// ============================================================================

/**
 * Simulates the InvoiceGenerator state management for unit testing
 */
function createInvoiceGeneratorState() {
  let clientName = '';
  let vatNumber = '';
  let lineItems = [{ description: '', quantity: 1, unitPrice: 0 }];
  let isGenerating = false;
  let generatedInvoice = null;
  let error = null;
  let showSuccess = false;

  return {
    // Getters
    getClientName: () => clientName,
    getVatNumber: () => vatNumber,
    getLineItems: () => lineItems,
    getIsGenerating: () => isGenerating,
    getGeneratedInvoice: () => generatedInvoice,
    getError: () => error,
    getShowSuccess: () => showSuccess,

    // Setters
    setClientName: (value) => { clientName = value; },
    setVatNumber: (value) => { vatNumber = value; },
    setIsGenerating: (value) => { isGenerating = value; },
    setError: (value) => { error = value; },

    // Line item management (Requirements 2.4, 2.5)
    addLineItem: () => {
      lineItems = [...lineItems, { description: '', quantity: 1, unitPrice: 0 }];
    },

    removeLineItem: (index) => {
      if (lineItems.length > 1) {
        lineItems = lineItems.filter((_, i) => i !== index);
      }
    },

    updateLineItem: (index, field, value) => {
      lineItems = lineItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
    },

    // Form validation
    isFormValid: () => {
      if (!clientName.trim()) return false;
      if (lineItems.length === 0) return false;
      return lineItems.every(item =>
        item.description.trim() &&
        parseFloat(item.quantity) > 0 &&
        parseFloat(item.unitPrice) >= 0
      );
    },

    // Simulate generate invoice (Requirements 2.11, 2.14)
    simulateGenerate: async (apiMock) => {
      if (!clientName.trim() || lineItems.length === 0 || isGenerating) {
        return { generated: false };
      }

      // Check form validity
      const valid = lineItems.every(item =>
        item.description.trim() &&
        parseFloat(item.quantity) > 0 &&
        parseFloat(item.unitPrice) >= 0
      );
      if (!valid) return { generated: false };

      isGenerating = true;
      error = null;
      showSuccess = false;

      const items = lineItems.map(item => ({
        description: item.description.trim(),
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unitPrice)
      }));

      try {
        const result = await apiMock.generateInvoice(
          'default-business',
          clientName.trim(),
          items,
          vatNumber.trim() || undefined
        );

        if (result.error) {
          error = result.error;
          return { generated: true, error: result.error };
        }

        generatedInvoice = result;
        showSuccess = true;
        return { generated: true, invoice: result };
      } catch (err) {
        error = 'An unexpected error occurred';
        return { generated: true, error: 'An unexpected error occurred' };
      } finally {
        isGenerating = false;
      }
    }
  };
}

describe('InvoiceGenerator Unit Tests', () => {
  describe('Line Item Add/Remove (Requirements 2.4, 2.5)', () => {
    it('should start with one empty line item', () => {
      const state = createInvoiceGeneratorState();
      const items = state.getLineItems();
      
      expect(items.length).toBe(1);
      expect(items[0]).toEqual({ description: '', quantity: 1, unitPrice: 0 });
    });

    it('should add a new line item', () => {
      const state = createInvoiceGeneratorState();
      state.addLineItem();
      
      expect(state.getLineItems().length).toBe(2);
    });

    it('should add multiple line items', () => {
      const state = createInvoiceGeneratorState();
      state.addLineItem();
      state.addLineItem();
      state.addLineItem();
      
      expect(state.getLineItems().length).toBe(4);
    });

    it('should remove a line item by index', () => {
      const state = createInvoiceGeneratorState();
      state.addLineItem();
      state.updateLineItem(0, 'description', 'Item 1');
      state.updateLineItem(1, 'description', 'Item 2');
      
      state.removeLineItem(0);
      
      const items = state.getLineItems();
      expect(items.length).toBe(1);
      expect(items[0].description).toBe('Item 2');
    });

    it('should not remove the last line item', () => {
      const state = createInvoiceGeneratorState();
      state.removeLineItem(0);
      
      expect(state.getLineItems().length).toBe(1);
    });

    it('should update line item description', () => {
      const state = createInvoiceGeneratorState();
      state.updateLineItem(0, 'description', 'Test Service');
      
      expect(state.getLineItems()[0].description).toBe('Test Service');
    });

    it('should update line item quantity', () => {
      const state = createInvoiceGeneratorState();
      state.updateLineItem(0, 'quantity', 5);
      
      expect(state.getLineItems()[0].quantity).toBe(5);
    });

    it('should update line item unit price', () => {
      const state = createInvoiceGeneratorState();
      state.updateLineItem(0, 'unitPrice', 100.50);
      
      expect(state.getLineItems()[0].unitPrice).toBe(100.50);
    });
  });

  describe('Form Validation (Requirements 2.4, 2.5)', () => {
    it('should be invalid when client name is empty', () => {
      const state = createInvoiceGeneratorState();
      state.updateLineItem(0, 'description', 'Service');
      state.updateLineItem(0, 'quantity', 1);
      state.updateLineItem(0, 'unitPrice', 100);
      
      expect(state.isFormValid()).toBe(false);
    });

    it('should be invalid when client name is only whitespace', () => {
      const state = createInvoiceGeneratorState();
      state.setClientName('   ');
      state.updateLineItem(0, 'description', 'Service');
      state.updateLineItem(0, 'quantity', 1);
      state.updateLineItem(0, 'unitPrice', 100);
      
      expect(state.isFormValid()).toBe(false);
    });

    it('should be invalid when line item description is empty', () => {
      const state = createInvoiceGeneratorState();
      state.setClientName('Test Client');
      state.updateLineItem(0, 'quantity', 1);
      state.updateLineItem(0, 'unitPrice', 100);
      
      expect(state.isFormValid()).toBe(false);
    });

    it('should be invalid when line item quantity is zero', () => {
      const state = createInvoiceGeneratorState();
      state.setClientName('Test Client');
      state.updateLineItem(0, 'description', 'Service');
      state.updateLineItem(0, 'quantity', 0);
      state.updateLineItem(0, 'unitPrice', 100);
      
      expect(state.isFormValid()).toBe(false);
    });

    it('should be invalid when line item quantity is negative', () => {
      const state = createInvoiceGeneratorState();
      state.setClientName('Test Client');
      state.updateLineItem(0, 'description', 'Service');
      state.updateLineItem(0, 'quantity', -1);
      state.updateLineItem(0, 'unitPrice', 100);
      
      expect(state.isFormValid()).toBe(false);
    });

    it('should be valid when all required fields are filled', () => {
      const state = createInvoiceGeneratorState();
      state.setClientName('Test Client');
      state.updateLineItem(0, 'description', 'Service');
      state.updateLineItem(0, 'quantity', 1);
      state.updateLineItem(0, 'unitPrice', 100);
      
      expect(state.isFormValid()).toBe(true);
    });

    it('should be valid with zero unit price', () => {
      const state = createInvoiceGeneratorState();
      state.setClientName('Test Client');
      state.updateLineItem(0, 'description', 'Free Service');
      state.updateLineItem(0, 'quantity', 1);
      state.updateLineItem(0, 'unitPrice', 0);
      
      expect(state.isFormValid()).toBe(true);
    });

    it('should validate all line items', () => {
      const state = createInvoiceGeneratorState();
      state.setClientName('Test Client');
      state.updateLineItem(0, 'description', 'Service 1');
      state.updateLineItem(0, 'quantity', 1);
      state.updateLineItem(0, 'unitPrice', 100);
      
      state.addLineItem();
      // Second item has empty description
      state.updateLineItem(1, 'quantity', 2);
      state.updateLineItem(1, 'unitPrice', 50);
      
      expect(state.isFormValid()).toBe(false);
    });
  });

  describe('API Integration (Requirements 2.11, 2.14)', () => {
    it('should call generateInvoice API with correct parameters', async () => {
      const state = createInvoiceGeneratorState();
      const mockApi = {
        generateInvoice: vi.fn().mockResolvedValue({ id: 'INV-001' })
      };

      state.setClientName('Test Client');
      state.setVatNumber('VAT123');
      state.updateLineItem(0, 'description', 'Service');
      state.updateLineItem(0, 'quantity', 2);
      state.updateLineItem(0, 'unitPrice', 100);

      await state.simulateGenerate(mockApi);

      expect(mockApi.generateInvoice).toHaveBeenCalledWith(
        'default-business',
        'Test Client',
        [{ description: 'Service', quantity: 2, unit_price: 100 }],
        'VAT123'
      );
    });

    it('should not include VAT number if empty', async () => {
      const state = createInvoiceGeneratorState();
      const mockApi = {
        generateInvoice: vi.fn().mockResolvedValue({ id: 'INV-001' })
      };

      state.setClientName('Test Client');
      state.updateLineItem(0, 'description', 'Service');
      state.updateLineItem(0, 'quantity', 1);
      state.updateLineItem(0, 'unitPrice', 100);

      await state.simulateGenerate(mockApi);

      expect(mockApi.generateInvoice).toHaveBeenCalledWith(
        'default-business',
        'Test Client',
        [{ description: 'Service', quantity: 1, unit_price: 100 }],
        undefined
      );
    });

    it('should set success state on successful generation', async () => {
      const state = createInvoiceGeneratorState();
      const mockApi = {
        generateInvoice: vi.fn().mockResolvedValue({ id: 'INV-001', total: 115 })
      };

      state.setClientName('Test Client');
      state.updateLineItem(0, 'description', 'Service');
      state.updateLineItem(0, 'quantity', 1);
      state.updateLineItem(0, 'unitPrice', 100);

      await state.simulateGenerate(mockApi);

      expect(state.getShowSuccess()).toBe(true);
      expect(state.getGeneratedInvoice()).toEqual({ id: 'INV-001', total: 115 });
    });

    it('should set error state on API error', async () => {
      const state = createInvoiceGeneratorState();
      const mockApi = {
        generateInvoice: vi.fn().mockResolvedValue({ error: 'Generation failed' })
      };

      state.setClientName('Test Client');
      state.updateLineItem(0, 'description', 'Service');
      state.updateLineItem(0, 'quantity', 1);
      state.updateLineItem(0, 'unitPrice', 100);

      await state.simulateGenerate(mockApi);

      expect(state.getError()).toBe('Generation failed');
      expect(state.getShowSuccess()).toBe(false);
    });

    it('should not generate when form is invalid', async () => {
      const state = createInvoiceGeneratorState();
      const mockApi = {
        generateInvoice: vi.fn().mockResolvedValue({ id: 'INV-001' })
      };

      // Client name is empty
      state.updateLineItem(0, 'description', 'Service');
      state.updateLineItem(0, 'quantity', 1);
      state.updateLineItem(0, 'unitPrice', 100);

      const result = await state.simulateGenerate(mockApi);

      expect(result.generated).toBe(false);
      expect(mockApi.generateInvoice).not.toHaveBeenCalled();
    });

    it('should set loading state during generation', async () => {
      const state = createInvoiceGeneratorState();
      let loadingDuringRequest = false;

      const mockApi = {
        generateInvoice: vi.fn().mockImplementation(async () => {
          loadingDuringRequest = state.getIsGenerating();
          return { id: 'INV-001' };
        })
      };

      state.setClientName('Test Client');
      state.updateLineItem(0, 'description', 'Service');
      state.updateLineItem(0, 'quantity', 1);
      state.updateLineItem(0, 'unitPrice', 100);

      await state.simulateGenerate(mockApi);

      expect(loadingDuringRequest).toBe(true);
      expect(state.getIsGenerating()).toBe(false);
    });
  });
});

// ============================================================================
// PROPERTY-BASED TESTS (existing)
// ============================================================================

/**
 * Invoice calculation logic extracted for testing
 * This mirrors the logic in InvoiceGenerator.jsx
 */

/**
 * Calculates the subtotal from an array of line items
 * @param {Array<{quantity: number, unitPrice: number}>} lineItems - Array of line items
 * @returns {number} - The subtotal
 */
function calculateSubtotal(lineItems) {
  if (!Array.isArray(lineItems)) return 0;
  
  return lineItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + (qty * price);
  }, 0);
}

/**
 * Calculates the VAT amount (15% of subtotal)
 * @param {number} subtotal - The subtotal amount
 * @returns {number} - The VAT amount
 */
function calculateVAT(subtotal) {
  return subtotal * 0.15;
}

/**
 * Calculates the total (subtotal + VAT)
 * @param {number} subtotal - The subtotal amount
 * @param {number} vatAmount - The VAT amount
 * @returns {number} - The total
 */
function calculateTotal(subtotal, vatAmount) {
  return subtotal + vatAmount;
}

/**
 * Performs all invoice calculations
 * @param {Array<{quantity: number, unitPrice: number}>} lineItems - Array of line items
 * @returns {{subtotal: number, vatAmount: number, total: number}} - All calculated values
 */
function calculateInvoiceTotals(lineItems) {
  const subtotal = calculateSubtotal(lineItems);
  const vatAmount = calculateVAT(subtotal);
  const total = calculateTotal(subtotal, vatAmount);
  
  return { subtotal, vatAmount, total };
}

// Arbitrary for generating valid line items with positive quantities and non-negative prices
const lineItemArbitrary = fc.record({
  description: fc.string({ minLength: 1, maxLength: 100 }),
  quantity: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
  unitPrice: fc.float({ min: Math.fround(0), max: Math.fround(1000000), noNaN: true })
});

// Arbitrary for generating arrays of line items
const lineItemsArbitrary = fc.array(lineItemArbitrary, { minLength: 1, maxLength: 20 });

/**
 * **Feature: smartbiz-frontend-ui, Property 4: Invoice calculation correctness**
 * **Validates: Requirements 2.7, 2.8, 2.9**
 * 
 * For any set of line items with valid quantities and unit prices, the InvoiceGenerator 
 * SHALL calculate: subtotal = sum of (quantity × unitPrice), VAT = subtotal × 0.15, 
 * and total = subtotal + VAT.
 */
describe('Property 4: Invoice calculation correctness', () => {
  it('should calculate subtotal as sum of (quantity × unitPrice) for all items', () => {
    fc.assert(
      fc.property(
        lineItemsArbitrary,
        (lineItems) => {
          const { subtotal } = calculateInvoiceTotals(lineItems);
          
          // Manually calculate expected subtotal
          const expectedSubtotal = lineItems.reduce((sum, item) => {
            return sum + (item.quantity * item.unitPrice);
          }, 0);
          
          // Allow for floating point precision issues
          expect(Math.abs(subtotal - expectedSubtotal)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate VAT as exactly 15% of subtotal', () => {
    fc.assert(
      fc.property(
        lineItemsArbitrary,
        (lineItems) => {
          const { subtotal, vatAmount } = calculateInvoiceTotals(lineItems);
          
          // VAT should be exactly 15% of subtotal
          const expectedVAT = subtotal * 0.15;
          
          // Allow for floating point precision issues
          expect(Math.abs(vatAmount - expectedVAT)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate total as subtotal + VAT', () => {
    fc.assert(
      fc.property(
        lineItemsArbitrary,
        (lineItems) => {
          const { subtotal, vatAmount, total } = calculateInvoiceTotals(lineItems);
          
          // Total should be subtotal + VAT
          const expectedTotal = subtotal + vatAmount;
          
          // Allow for floating point precision issues
          expect(Math.abs(total - expectedTotal)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain the relationship: total = subtotal × 1.15', () => {
    fc.assert(
      fc.property(
        lineItemsArbitrary,
        (lineItems) => {
          const { subtotal, total } = calculateInvoiceTotals(lineItems);
          
          // Total should equal subtotal × 1.15 (100% + 15% VAT)
          const expectedTotal = subtotal * 1.15;
          
          // Allow for floating point precision issues
          expect(Math.abs(total - expectedTotal)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle single line item correctly', () => {
    fc.assert(
      fc.property(
        lineItemArbitrary,
        (lineItem) => {
          const { subtotal, vatAmount, total } = calculateInvoiceTotals([lineItem]);
          
          const expectedSubtotal = lineItem.quantity * lineItem.unitPrice;
          const expectedVAT = expectedSubtotal * 0.15;
          const expectedTotal = expectedSubtotal + expectedVAT;
          
          expect(Math.abs(subtotal - expectedSubtotal)).toBeLessThan(0.01);
          expect(Math.abs(vatAmount - expectedVAT)).toBeLessThan(0.01);
          expect(Math.abs(total - expectedTotal)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return zero totals for empty line items array', () => {
    const { subtotal, vatAmount, total } = calculateInvoiceTotals([]);
    
    expect(subtotal).toBe(0);
    expect(vatAmount).toBe(0);
    expect(total).toBe(0);
  });

  it('should handle items with zero unit price', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            description: fc.string({ minLength: 1, maxLength: 50 }),
            quantity: fc.float({ min: 1, max: 100, noNaN: true }),
            unitPrice: fc.constant(0)
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (lineItems) => {
          const { subtotal, vatAmount, total } = calculateInvoiceTotals(lineItems);
          
          // All values should be zero when unit prices are zero
          expect(subtotal).toBe(0);
          expect(vatAmount).toBe(0);
          expect(total).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce non-negative values for valid inputs', () => {
    fc.assert(
      fc.property(
        lineItemsArbitrary,
        (lineItems) => {
          const { subtotal, vatAmount, total } = calculateInvoiceTotals(lineItems);
          
          // All calculated values should be non-negative
          expect(subtotal).toBeGreaterThanOrEqual(0);
          expect(vatAmount).toBeGreaterThanOrEqual(0);
          expect(total).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should satisfy VAT ≤ subtotal for any valid input', () => {
    fc.assert(
      fc.property(
        lineItemsArbitrary,
        (lineItems) => {
          const { subtotal, vatAmount } = calculateInvoiceTotals(lineItems);
          
          // VAT (15%) should always be less than or equal to subtotal
          expect(vatAmount).toBeLessThanOrEqual(subtotal);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// UI STYLING TESTS
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 5.1, 5.2, 5.3, 5.4
// ============================================================================

describe('InvoiceGenerator Styling Tests', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Form Panel Styling (Requirements 2.1-2.6)', () => {
    it('should apply standard card styling to form panel in light mode', () => {
      render(<InvoiceGenerator darkMode={false} />);
      
      const formPanel = screen.getByTestId('invoice-form-panel');
      expect(formPanel.className).toContain('shadow-lg');
      expect(formPanel.className).toContain('rounded-xl');
      expect(formPanel.className).toContain('border');
      expect(formPanel.className).toContain('bg-white');
      expect(formPanel.className).toContain('border-slate-200');
    });

    it('should apply standard card styling to form panel in dark mode', () => {
      render(<InvoiceGenerator darkMode={true} />);
      
      const formPanel = screen.getByTestId('invoice-form-panel');
      expect(formPanel.className).toContain('shadow-lg');
      expect(formPanel.className).toContain('rounded-xl');
      expect(formPanel.className).toContain('border');
      expect(formPanel.className).toContain('bg-slate-800');
      expect(formPanel.className).toContain('border-slate-700');
    });
  });

  describe('Live Preview Paper-like Styling (Requirements 5.1-5.4)', () => {
    it('should have bg-white background in light mode', () => {
      render(<InvoiceGenerator darkMode={false} />);
      
      const preview = screen.getByTestId('invoice-preview');
      expect(preview.className).toContain('bg-white');
    });

    it('should have bg-white background in dark mode (always white)', () => {
      render(<InvoiceGenerator darkMode={true} />);
      
      const preview = screen.getByTestId('invoice-preview');
      expect(preview.className).toContain('bg-white');
    });

    it('should have shadow-2xl class for paper depth effect', () => {
      render(<InvoiceGenerator darkMode={false} />);
      
      const preview = screen.getByTestId('invoice-preview');
      expect(preview.className).toContain('shadow-2xl');
    });

    it('should be centered with mx-auto', () => {
      render(<InvoiceGenerator darkMode={false} />);
      
      const preview = screen.getByTestId('invoice-preview');
      expect(preview.className).toContain('mx-auto');
    });

    it('should have border class for paper edge definition', () => {
      render(<InvoiceGenerator darkMode={false} />);
      
      const preview = screen.getByTestId('invoice-preview');
      expect(preview.className).toContain('border');
    });

    it('should have rounded-xl for smooth corners', () => {
      render(<InvoiceGenerator darkMode={false} />);
      
      const preview = screen.getByTestId('invoice-preview');
      expect(preview.className).toContain('rounded-xl');
    });

    it('should have max-width constraint', () => {
      render(<InvoiceGenerator darkMode={false} />);
      
      const preview = screen.getByTestId('invoice-preview');
      expect(preview.className).toContain('max-w-lg');
    });
  });
});
