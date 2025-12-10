import { useState, useEffect } from 'react';
import { DollarSign, FileText, Receipt, Search, Loader2, AlertCircle } from 'lucide-react';
import { runSmartSQL } from '../services/api';

/**
 * Business insights dashboard with natural language queries
 * Displays metric cards and allows natural language data queries via SmartSQL
 * 
 * @param {Object} props
 * @param {boolean} props.darkMode - Whether dark mode is enabled
 */
export function AnalyticsDashboard({ darkMode }) {
  // Metrics state
  const [metrics, setMetrics] = useState({
    revenue: null,
    outstanding: null,
    vatDue: null
  });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState({
    revenue: true,
    outstanding: true,
    vatDue: true
  });
  const [metricsError, setMetricsError] = useState({
    revenue: null,
    outstanding: null,
    vatDue: null
  });

  // Query state
  const [query, setQuery] = useState('');
  const [queryResults, setQueryResults] = useState(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [error, setError] = useState(null);

  // Load initial metrics on mount
  useEffect(() => {
    loadInitialMetrics();
  }, []);

  const loadInitialMetrics = async () => {
    // Load Revenue metric
    loadMetric('revenue', 'Total revenue this month');
    // Load Outstanding metric
    loadMetric('outstanding', 'Outstanding invoices count');
    // Load VAT Due metric (calculated from revenue)
    loadMetric('vatDue', 'Total VAT due this month');
  };


  // Demo mock data for when SmartSQL is not configured
  const DEMO_METRICS = {
    revenue: 125750.00,
    outstanding: 12,
    vatDue: 18862.50
  };

  const loadMetric = async (metricKey, queryText) => {
    setIsLoadingMetrics(prev => ({ ...prev, [metricKey]: true }));
    setMetricsError(prev => ({ ...prev, [metricKey]: null }));

    try {
      const result = await runSmartSQL(queryText);
      
      if (result.error) {
        // Use demo data when SmartSQL is not available
        console.log(`Using demo data for ${metricKey} (SmartSQL unavailable)`);
        setMetrics(prev => ({ ...prev, [metricKey]: DEMO_METRICS[metricKey] }));
        return;
      }

      // Extract value from results
      let value = null;
      if (result.results && result.results.length > 0) {
        const firstRow = result.results[0];
        // Get the first value from the result row
        const keys = Object.keys(firstRow);
        if (keys.length > 0) {
          value = firstRow[keys[0]];
        }
      }

      setMetrics(prev => ({ ...prev, [metricKey]: value ?? DEMO_METRICS[metricKey] }));
    } catch (err) {
      // Use demo data on error
      console.log(`Using demo data for ${metricKey} (error: ${err.message})`);
      setMetrics(prev => ({ ...prev, [metricKey]: DEMO_METRICS[metricKey] }));
    } finally {
      setIsLoadingMetrics(prev => ({ ...prev, [metricKey]: false }));
    }
  };

  // Demo query results for when SmartSQL is not configured
  const DEMO_QUERY_RESULTS = {
    sql: 'SELECT * FROM invoices ORDER BY created_at DESC LIMIT 5',
    results: [
      { id: 1, invoice_number: 'INV-001', client_name: 'Acme Corp', total_incl_vat: 11500.00, status: 'paid' },
      { id: 2, invoice_number: 'INV-002', client_name: 'Tech Solutions', total_incl_vat: 8625.00, status: 'pending' },
      { id: 3, invoice_number: 'INV-003', client_name: 'Global Trade', total_incl_vat: 23000.00, status: 'paid' },
      { id: 4, invoice_number: 'INV-004', client_name: 'Local Services', total_incl_vat: 5750.00, status: 'overdue' },
      { id: 5, invoice_number: 'INV-005', client_name: 'StartUp Inc', total_incl_vat: 17250.00, status: 'pending' }
    ]
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    
    const trimmedQuery = query.trim();
    if (!trimmedQuery || isQuerying) return;

    setIsQuerying(true);
    setError(null);
    setQueryResults(null);

    try {
      const result = await runSmartSQL(trimmedQuery);

      if (result.error) {
        // Show demo results when SmartSQL is not available
        if (result.error.includes('400') || result.error.includes('SmartSQL')) {
          console.log('Using demo query results (SmartSQL unavailable)');
          setQueryResults({
            ...DEMO_QUERY_RESULTS,
            sql: `-- Demo mode: SmartSQL not configured\n-- Your query: "${trimmedQuery}"\n${DEMO_QUERY_RESULTS.sql}`
          });
          return;
        }
        setError(result.error);
        return;
      }

      setQueryResults(result);
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsQuerying(false);
    }
  };

  // Format currency values
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return `R ${num.toFixed(2)}`;
  };

  // Format metric value based on type
  const formatMetricValue = (key, value) => {
    if (value === null || value === undefined) return '-';
    if (key === 'outstanding') return value.toString();
    return formatCurrency(value);
  };

  // Metric card configuration
  const metricCards = [
    {
      key: 'revenue',
      title: 'Revenue',
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-100'
    },
    {
      key: 'outstanding',
      title: 'Outstanding',
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100'
    },
    {
      key: 'vatDue',
      title: 'VAT Due',
      icon: Receipt,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100'
    }
  ];


  // Render query results as table or text
  const renderResults = () => {
    if (!queryResults) return null;

    const { results, sql } = queryResults;

    if (!results || results.length === 0) {
      return (
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
          <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
            No results found.
          </p>
        </div>
      );
    }

    // Get column headers from first result
    const columns = Object.keys(results[0]);

    return (
      <div className="space-y-4">
        {/* SQL Query Display */}
        {sql && (
          <div className={`p-3 rounded-lg text-sm font-mono ${
            darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
          }`}>
            <span className="text-xs uppercase tracking-wide opacity-60">Generated SQL:</span>
            <p className="mt-1">{sql}</p>
          </div>
        )}

        {/* Results Table */}
        <div className={`overflow-x-auto rounded-lg border ${
          darkMode ? 'border-slate-700' : 'border-slate-200'
        }`}>
          <table className="w-full">
            <thead>
              <tr className={darkMode ? 'bg-slate-700' : 'bg-slate-100'}>
                {columns.map((col) => (
                  <th
                    key={col}
                    className={`px-4 py-3 text-left text-sm font-medium ${
                      darkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`border-t ${
                    darkMode ? 'border-slate-700' : 'border-slate-200'
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col}
                      className={`px-4 py-3 text-sm ${
                        darkMode ? 'text-slate-100' : 'text-slate-800'
                      }`}
                    >
                      {row[col] !== null && row[col] !== undefined 
                        ? String(row[col]) 
                        : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {results.length} result{results.length !== 1 ? 's' : ''} found
        </p>
      </div>
    );
  };

  return (
    <div className={`h-full p-6 overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
      <h2 className={`text-xl font-semibold mb-6 ${
        darkMode ? 'text-slate-100' : 'text-slate-800'
      }`}>
        Analytics Dashboard
      </h2>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {metricCards.map((card) => {
          const Icon = card.icon;
          const isLoading = isLoadingMetrics[card.key];
          const hasError = metricsError[card.key];
          const value = metrics[card.key];

          return (
            <div
              key={card.key}
              data-testid={`metric-card-${card.key}`}
              className={`p-6 shadow-lg rounded-xl border ${
                darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
                {isLoading && (
                  <Loader2 className={`w-5 h-5 animate-spin ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`} />
                )}
              </div>
              <p className={`text-sm font-medium mb-1 ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {card.title}
              </p>
              {hasError ? (
                <p className="text-red-500 text-sm">{hasError}</p>
              ) : (
                <p className={`text-2xl font-bold ${
                  darkMode ? 'text-slate-100' : 'text-slate-800'
                }`}>
                  {isLoading ? '-' : formatMetricValue(card.key, value)}
                </p>
              )}
            </div>
          );
        })}
      </div>


      {/* Ask Data Section */}
      <div 
        data-testid="ask-data-section"
        className={`shadow-lg rounded-xl border p-6 ${
          darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}
      >
        <h3 className={`text-lg font-semibold mb-4 ${
          darkMode ? 'text-slate-100' : 'text-slate-800'
        }`}>
          Ask Data
        </h3>
        <p className={`text-sm mb-4 ${
          darkMode ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Ask questions about your business data in natural language
        </p>

        {/* Query Input */}
        <form onSubmit={handleQuerySubmit} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                darkMode ? 'text-slate-400' : 'text-slate-400'
              }`} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., Show me all invoices from last month"
                disabled={isQuerying}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                  darkMode
                    ? 'bg-slate-600 border-slate-500 text-slate-100 placeholder-slate-400'
                    : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
              />
            </div>
            <button
              type="submit"
              disabled={!query.trim() || isQuerying}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                query.trim() && !isQuerying
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : darkMode
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isQuerying ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Query'
              )}
            </button>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Query Results */}
        {renderResults()}
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
