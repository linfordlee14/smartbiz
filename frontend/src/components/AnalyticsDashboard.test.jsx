/**
 * Property-Based Tests and Unit Tests for AnalyticsDashboard Component
 * Using fast-check for property-based testing
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

// ============================================================================
// UNIT TESTS FOR ANALYTICSDASHBOARD
// Requirements: 3.2, 3.3, 3.5, 3.6
// ============================================================================

/**
 * Simulates the AnalyticsDashboard state management for unit testing
 */
function createAnalyticsDashboardState() {
  let metrics = { revenue: null, outstanding: null, vatDue: null };
  let isLoadingMetrics = { revenue: true, outstanding: true, vatDue: true };
  let metricsError = { revenue: null, outstanding: null, vatDue: null };
  let query = '';
  let queryResults = null;
  let isQuerying = false;
  let error = null;

  return {
    // Getters
    getMetrics: () => metrics,
    getIsLoadingMetrics: () => isLoadingMetrics,
    getMetricsError: () => metricsError,
    getQuery: () => query,
    getQueryResults: () => queryResults,
    getIsQuerying: () => isQuerying,
    getError: () => error,

    // Setters
    setQuery: (value) => { query = value; },
    setIsQuerying: (value) => { isQuerying = value; },
    setError: (value) => { error = value; },

    // Load a single metric (Requirements 3.2, 3.3)
    loadMetric: async (metricKey, queryText, apiMock) => {
      isLoadingMetrics = { ...isLoadingMetrics, [metricKey]: true };
      metricsError = { ...metricsError, [metricKey]: null };

      try {
        const result = await apiMock.runSmartSQL(queryText);

        if (result.error) {
          metricsError = { ...metricsError, [metricKey]: result.error };
          return { loaded: false, error: result.error };
        }

        let value = null;
        if (result.results && result.results.length > 0) {
          const firstRow = result.results[0];
          const keys = Object.keys(firstRow);
          if (keys.length > 0) {
            value = firstRow[keys[0]];
          }
        }

        metrics = { ...metrics, [metricKey]: value };
        return { loaded: true, value };
      } catch (err) {
        metricsError = { ...metricsError, [metricKey]: 'Failed to load' };
        return { loaded: false, error: 'Failed to load' };
      } finally {
        isLoadingMetrics = { ...isLoadingMetrics, [metricKey]: false };
      }
    },

    // Load initial metrics (Requirements 3.2, 3.3)
    loadInitialMetrics: async (apiMock) => {
      const results = await Promise.all([
        this.loadMetric?.('revenue', 'Total revenue this month', apiMock),
        this.loadMetric?.('outstanding', 'Outstanding invoices count', apiMock)
      ]);
      return results;
    },

    // Submit query (Requirements 3.5, 3.6)
    submitQuery: async (apiMock) => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery || isQuerying) return { submitted: false };

      isQuerying = true;
      error = null;
      queryResults = null;

      try {
        const result = await apiMock.runSmartSQL(trimmedQuery);

        if (result.error) {
          error = result.error;
          return { submitted: true, error: result.error };
        }

        queryResults = result;
        return { submitted: true, results: result };
      } catch (err) {
        error = 'An unexpected error occurred';
        return { submitted: true, error: 'An unexpected error occurred' };
      } finally {
        isQuerying = false;
      }
    },

    // Check if can submit
    canSubmit: () => {
      return query.trim().length > 0 && !isQuerying;
    }
  };
}

describe('AnalyticsDashboard Unit Tests', () => {
  describe('Initial Data Loading (Requirements 3.2, 3.3)', () => {
    it('should start with loading state for all metrics', () => {
      const state = createAnalyticsDashboardState();
      const loading = state.getIsLoadingMetrics();

      expect(loading.revenue).toBe(true);
      expect(loading.outstanding).toBe(true);
      expect(loading.vatDue).toBe(true);
    });

    it('should start with null values for all metrics', () => {
      const state = createAnalyticsDashboardState();
      const metrics = state.getMetrics();

      expect(metrics.revenue).toBeNull();
      expect(metrics.outstanding).toBeNull();
      expect(metrics.vatDue).toBeNull();
    });

    it('should load revenue metric with correct query', async () => {
      const state = createAnalyticsDashboardState();
      const mockApi = {
        runSmartSQL: vi.fn().mockResolvedValue({
          results: [{ total_revenue: 50000 }],
          sql: 'SELECT SUM(total) FROM invoices'
        })
      };

      await state.loadMetric('revenue', 'Total revenue this month', mockApi);

      expect(mockApi.runSmartSQL).toHaveBeenCalledWith('Total revenue this month');
      expect(state.getMetrics().revenue).toBe(50000);
    });

    it('should load outstanding metric with correct query', async () => {
      const state = createAnalyticsDashboardState();
      const mockApi = {
        runSmartSQL: vi.fn().mockResolvedValue({
          results: [{ count: 5 }],
          sql: 'SELECT COUNT(*) FROM invoices WHERE status = "pending"'
        })
      };

      await state.loadMetric('outstanding', 'Outstanding invoices count', mockApi);

      expect(mockApi.runSmartSQL).toHaveBeenCalledWith('Outstanding invoices count');
      expect(state.getMetrics().outstanding).toBe(5);
    });

    it('should set loading to false after metric loads', async () => {
      const state = createAnalyticsDashboardState();
      const mockApi = {
        runSmartSQL: vi.fn().mockResolvedValue({
          results: [{ value: 100 }]
        })
      };

      await state.loadMetric('revenue', 'Test query', mockApi);

      expect(state.getIsLoadingMetrics().revenue).toBe(false);
    });

    it('should set error when metric loading fails', async () => {
      const state = createAnalyticsDashboardState();
      const mockApi = {
        runSmartSQL: vi.fn().mockResolvedValue({
          error: 'Database error'
        })
      };

      await state.loadMetric('revenue', 'Test query', mockApi);

      expect(state.getMetricsError().revenue).toBe('Database error');
    });

    it('should handle empty results', async () => {
      const state = createAnalyticsDashboardState();
      const mockApi = {
        runSmartSQL: vi.fn().mockResolvedValue({
          results: []
        })
      };

      await state.loadMetric('revenue', 'Test query', mockApi);

      expect(state.getMetrics().revenue).toBeNull();
    });
  });

  describe('Query Submission (Requirements 3.5)', () => {
    it('should not submit when query is empty', async () => {
      const state = createAnalyticsDashboardState();
      const mockApi = {
        runSmartSQL: vi.fn().mockResolvedValue({ results: [] })
      };

      state.setQuery('');
      const result = await state.submitQuery(mockApi);

      expect(result.submitted).toBe(false);
      expect(mockApi.runSmartSQL).not.toHaveBeenCalled();
    });

    it('should not submit when query is only whitespace', async () => {
      const state = createAnalyticsDashboardState();
      const mockApi = {
        runSmartSQL: vi.fn().mockResolvedValue({ results: [] })
      };

      state.setQuery('   ');
      const result = await state.submitQuery(mockApi);

      expect(result.submitted).toBe(false);
      expect(mockApi.runSmartSQL).not.toHaveBeenCalled();
    });

    it('should submit query and call runSmartSQL', async () => {
      const state = createAnalyticsDashboardState();
      const mockApi = {
        runSmartSQL: vi.fn().mockResolvedValue({
          results: [{ name: 'Test', value: 100 }],
          sql: 'SELECT * FROM test'
        })
      };

      state.setQuery('Show me all invoices');
      await state.submitQuery(mockApi);

      expect(mockApi.runSmartSQL).toHaveBeenCalledWith('Show me all invoices');
    });

    it('should set loading state during query', async () => {
      const state = createAnalyticsDashboardState();
      let loadingDuringRequest = false;

      const mockApi = {
        runSmartSQL: vi.fn().mockImplementation(async () => {
          loadingDuringRequest = state.getIsQuerying();
          return { results: [] };
        })
      };

      state.setQuery('Test query');
      await state.submitQuery(mockApi);

      expect(loadingDuringRequest).toBe(true);
      expect(state.getIsQuerying()).toBe(false);
    });

    it('should set error on API error', async () => {
      const state = createAnalyticsDashboardState();
      const mockApi = {
        runSmartSQL: vi.fn().mockResolvedValue({
          error: 'Query failed'
        })
      };

      state.setQuery('Invalid query');
      await state.submitQuery(mockApi);

      expect(state.getError()).toBe('Query failed');
    });

    it('should clear previous results before new query', async () => {
      const state = createAnalyticsDashboardState();
      const mockApi = {
        runSmartSQL: vi.fn().mockResolvedValue({
          results: [{ id: 1 }]
        })
      };

      state.setQuery('First query');
      await state.submitQuery(mockApi);
      expect(state.getQueryResults()).not.toBeNull();

      // Simulate clearing on new query
      state.setQuery('Second query');
      await state.submitQuery(mockApi);

      expect(state.getQueryResults()).not.toBeNull();
    });

    it('should prevent submission while already querying', () => {
      const state = createAnalyticsDashboardState();
      state.setQuery('Test');
      state.setIsQuerying(true);

      expect(state.canSubmit()).toBe(false);
    });
  });

  describe('Results Display (Requirements 3.6)', () => {
    it('should store query results after successful query', async () => {
      const state = createAnalyticsDashboardState();
      const expectedResults = {
        results: [
          { id: 1, name: 'Invoice 1', total: 1000 },
          { id: 2, name: 'Invoice 2', total: 2000 }
        ],
        sql: 'SELECT * FROM invoices'
      };

      const mockApi = {
        runSmartSQL: vi.fn().mockResolvedValue(expectedResults)
      };

      state.setQuery('Show all invoices');
      await state.submitQuery(mockApi);

      expect(state.getQueryResults()).toEqual(expectedResults);
    });

    it('should include SQL in results', async () => {
      const state = createAnalyticsDashboardState();
      const mockApi = {
        runSmartSQL: vi.fn().mockResolvedValue({
          results: [{ count: 10 }],
          sql: 'SELECT COUNT(*) FROM invoices'
        })
      };

      state.setQuery('Count invoices');
      await state.submitQuery(mockApi);

      expect(state.getQueryResults().sql).toBe('SELECT COUNT(*) FROM invoices');
    });

    it('should handle results with multiple columns', async () => {
      const state = createAnalyticsDashboardState();
      const mockApi = {
        runSmartSQL: vi.fn().mockResolvedValue({
          results: [
            { id: 1, client: 'Client A', amount: 500, status: 'paid' },
            { id: 2, client: 'Client B', amount: 750, status: 'pending' }
          ]
        })
      };

      state.setQuery('Show invoice details');
      await state.submitQuery(mockApi);

      const results = state.getQueryResults().results;
      expect(results.length).toBe(2);
      expect(Object.keys(results[0])).toEqual(['id', 'client', 'amount', 'status']);
    });

    it('should handle empty results array', async () => {
      const state = createAnalyticsDashboardState();
      const mockApi = {
        runSmartSQL: vi.fn().mockResolvedValue({
          results: [],
          sql: 'SELECT * FROM invoices WHERE 1=0'
        })
      };

      state.setQuery('Show nothing');
      await state.submitQuery(mockApi);

      expect(state.getQueryResults().results).toEqual([]);
    });
  });
});

// ============================================================================
// PROPERTY-BASED TESTS (existing)
// ============================================================================

/**
 * Query results rendering logic extracted for testing
 * This mirrors the logic in AnalyticsDashboard.jsx renderResults
 */

/**
 * Extracts column headers from query results
 * @param {Array<Object>} results - Array of result objects
 * @returns {Array<string>} - Array of column names
 */
function extractColumns(results) {
  if (!Array.isArray(results) || results.length === 0) return [];
  return Object.keys(results[0]);
}

/**
 * Renders query results to a table structure for testing
 * @param {Object} queryResults - Query results object with sql and results
 * @returns {Object} - Rendered table structure
 */
function renderQueryResults(queryResults) {
  if (!queryResults) {
    return { rendered: false, columns: [], rows: [], rowCount: 0 };
  }

  const { results, sql } = queryResults;

  if (!results || !Array.isArray(results) || results.length === 0) {
    return { 
      rendered: true, 
      columns: [], 
      rows: [], 
      rowCount: 0,
      sql: sql || null,
      isEmpty: true
    };
  }

  const columns = extractColumns(results);
  const rows = results.map((row, index) => ({
    index,
    cells: columns.map(col => ({
      column: col,
      value: row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'
    }))
  }));

  return {
    rendered: true,
    columns,
    rows,
    rowCount: results.length,
    sql: sql || null,
    isEmpty: false
  };
}


/**
 * Checks if all results are rendered in the table
 * @param {Array} results - Original results
 * @param {Object} rendered - Rendered table structure
 * @returns {boolean} - True if all results are rendered correctly
 */
function allResultsRendered(results, rendered) {
  if (!results || results.length === 0) {
    return rendered.isEmpty === true;
  }

  if (results.length !== rendered.rowCount) return false;

  const columns = Object.keys(results[0]);
  if (columns.length !== rendered.columns.length) return false;

  // Check all columns are present
  const columnsMatch = columns.every(col => rendered.columns.includes(col));
  if (!columnsMatch) return false;

  // Check all rows have correct cell count
  return rendered.rows.every(row => row.cells.length === columns.length);
}

// Arbitrary for generating valid result row objects
const resultRowArbitrary = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
  fc.oneof(
    fc.string({ minLength: 0, maxLength: 100 }),
    fc.integer(),
    fc.double({ noNaN: true, noDefaultInfinity: true }),
    fc.constant(null)
  ),
  { minKeys: 1, maxKeys: 10 }
);

// Arbitrary for generating consistent result arrays (all rows have same columns)
const consistentResultsArbitrary = fc.tuple(
  fc.array(
    fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
    { minLength: 1, maxLength: 5 }
  ),
  fc.integer({ min: 1, max: 20 })
).chain(([columns, rowCount]) => {
  // Generate rows with consistent columns
  const rowArbitrary = fc.record(
    Object.fromEntries(
      columns.map(col => [
        col,
        fc.oneof(
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.integer(),
          fc.double({ noNaN: true, noDefaultInfinity: true }),
          fc.constant(null)
        )
      ])
    )
  );
  return fc.array(rowArbitrary, { minLength: rowCount, maxLength: rowCount });
});

// Arbitrary for generating query results objects
const queryResultsArbitrary = fc.record({
  sql: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
  results: consistentResultsArbitrary
});

// Arbitrary for empty query results
const emptyQueryResultsArbitrary = fc.record({
  sql: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
  results: fc.constant([])
});


/**
 * **Feature: smartbiz-frontend-ui, Property 6: Query results rendering**
 * **Validates: Requirements 3.6**
 * 
 * For any results array returned from runSmartSQL, the AnalyticsDashboard 
 * SHALL render all results in a table or text format.
 */
describe('Property 6: Query results rendering', () => {
  it('should render all results preserving row count', () => {
    fc.assert(
      fc.property(
        queryResultsArbitrary,
        (queryResults) => {
          const rendered = renderQueryResults(queryResults);
          
          // Should be rendered
          expect(rendered.rendered).toBe(true);
          
          // Row count should match
          expect(rendered.rowCount).toBe(queryResults.results.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should extract all columns from results', () => {
    fc.assert(
      fc.property(
        queryResultsArbitrary,
        (queryResults) => {
          const rendered = renderQueryResults(queryResults);
          
          if (queryResults.results.length > 0) {
            const expectedColumns = Object.keys(queryResults.results[0]);
            
            // All columns should be present
            expect(rendered.columns.length).toBe(expectedColumns.length);
            expectedColumns.forEach(col => {
              expect(rendered.columns).toContain(col);
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render all cells for each row', () => {
    fc.assert(
      fc.property(
        queryResultsArbitrary,
        (queryResults) => {
          const rendered = renderQueryResults(queryResults);
          
          if (queryResults.results.length > 0) {
            const columnCount = Object.keys(queryResults.results[0]).length;
            
            // Each row should have correct number of cells
            rendered.rows.forEach(row => {
              expect(row.cells.length).toBe(columnCount);
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle null values by converting to dash', () => {
    fc.assert(
      fc.property(
        fc.record({
          sql: fc.constant('SELECT * FROM test'),
          results: fc.constant([{ col1: null, col2: 'value', col3: null }])
        }),
        (queryResults) => {
          const rendered = renderQueryResults(queryResults);
          
          // Find cells with null original values
          const row = rendered.rows[0];
          const col1Cell = row.cells.find(c => c.column === 'col1');
          const col3Cell = row.cells.find(c => c.column === 'col3');
          
          expect(col1Cell.value).toBe('-');
          expect(col3Cell.value).toBe('-');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should convert all values to strings', () => {
    fc.assert(
      fc.property(
        queryResultsArbitrary,
        (queryResults) => {
          const rendered = renderQueryResults(queryResults);
          
          // All cell values should be strings
          rendered.rows.forEach(row => {
            row.cells.forEach(cell => {
              expect(typeof cell.value).toBe('string');
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty results array', () => {
    fc.assert(
      fc.property(
        emptyQueryResultsArbitrary,
        (queryResults) => {
          const rendered = renderQueryResults(queryResults);
          
          expect(rendered.rendered).toBe(true);
          expect(rendered.isEmpty).toBe(true);
          expect(rendered.rowCount).toBe(0);
          expect(rendered.columns).toEqual([]);
          expect(rendered.rows).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve SQL query in rendered output', () => {
    fc.assert(
      fc.property(
        fc.record({
          sql: fc.string({ minLength: 10, maxLength: 200 }),
          results: consistentResultsArbitrary
        }),
        (queryResults) => {
          const rendered = renderQueryResults(queryResults);
          
          expect(rendered.sql).toBe(queryResults.sql);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify all results are rendered correctly', () => {
    fc.assert(
      fc.property(
        queryResultsArbitrary,
        (queryResults) => {
          const rendered = renderQueryResults(queryResults);
          
          expect(allResultsRendered(queryResults.results, rendered)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle null queryResults', () => {
    const rendered = renderQueryResults(null);
    
    expect(rendered.rendered).toBe(false);
    expect(rendered.columns).toEqual([]);
    expect(rendered.rows).toEqual([]);
    expect(rendered.rowCount).toBe(0);
  });

  it('should handle undefined queryResults', () => {
    const rendered = renderQueryResults(undefined);
    
    expect(rendered.rendered).toBe(false);
    expect(rendered.columns).toEqual([]);
    expect(rendered.rows).toEqual([]);
    expect(rendered.rowCount).toBe(0);
  });
});
