import { useState } from 'react';
import { Plus, Trash2, FileText, Download, Loader2, CheckCircle } from 'lucide-react';
import { generateInvoice, downloadInvoicePdf } from '../services/api';

/**
 * Form-based interface for creating SARS-compliant tax invoices
 * Features split-screen layout with form on left and live preview on right
 * 
 * @param {Object} props
 * @param {boolean} props.darkMode - Whether dark mode is enabled
 */
export function InvoiceGenerator({ darkMode }) {
  // Form state
  const [clientName, setClientName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [lineItems, setLineItems] = useState([
    { description: '', quantity: 1, unitPrice: 0 }
  ]);
  
  // API state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + (qty * price);
  }, 0);
  
  const vatAmount = subtotal * 0.15;
  const total = subtotal + vatAmount;

  // Line item management
  const addLineItem = () => {
    setLineItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      setLineItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index, field, value) => {
    setLineItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };


  // Form validation
  const isFormValid = () => {
    if (!clientName.trim()) return false;
    if (lineItems.length === 0) return false;
    return lineItems.every(item => 
      item.description.trim() && 
      parseFloat(item.quantity) > 0 && 
      parseFloat(item.unitPrice) >= 0
    );
  };

  // Generate invoice
  const handleGenerate = async () => {
    if (!isFormValid() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setShowSuccess(false);

    const items = lineItems.map(item => ({
      description: item.description.trim(),
      quantity: parseFloat(item.quantity),
      unit_price: parseFloat(item.unitPrice)
    }));

    try {
      const result = await generateInvoice(
        'default-business', // Using default business ID
        clientName.trim(),
        items,
        vatNumber.trim() || undefined
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      setGeneratedInvoice(result);
      setShowSuccess(true);
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  // PDF download
  const handleDownload = async () => {
    if (!generatedInvoice?.id) return;
    
    try {
      const result = await downloadInvoicePdf(generatedInvoice.id);
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      // Create download link
      const url = window.URL.createObjectURL(result);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${generatedInvoice.invoice_number || 'invoice'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download PDF');
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `R ${amount.toFixed(2)}`;
  };

  return (
    <div className={`flex h-full gap-6 p-6 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
      {/* Left Panel - Form */}
      <div className={`w-1/2 p-6 overflow-y-auto shadow-lg rounded-xl border ${
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`} data-testid="invoice-form-panel">
        <h2 className={`text-xl font-semibold mb-6 ${
          darkMode ? 'text-slate-100' : 'text-slate-800'
        }`}>
          Create Invoice
        </h2>

        {/* Client Information */}
        <div className="space-y-4 mb-6">
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name"
              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                darkMode
                  ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400'
                  : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              VAT Number <span className="text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={vatNumber}
              onChange={(e) => setVatNumber(e.target.value)}
              placeholder="Enter VAT number"
              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                darkMode
                  ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400'
                  : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
            />
          </div>
        </div>


        {/* Line Items */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className={`text-sm font-medium ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Line Items
            </label>
            <button
              type="button"
              onClick={addLineItem}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  darkMode ? 'bg-slate-700' : 'bg-white border border-slate-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      placeholder="Description"
                      className={`w-full px-3 py-2 rounded border text-sm ${
                        darkMode
                          ? 'bg-slate-600 border-slate-500 text-slate-100 placeholder-slate-400'
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                      } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    />
                    <div className="flex gap-2">
                      <div className="w-1/2">
                        <label className={`block text-xs mb-1 ${
                          darkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                          className={`w-full px-3 py-2 rounded border text-sm ${
                            darkMode
                              ? 'bg-slate-600 border-slate-500 text-slate-100'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        />
                      </div>
                      <div className="w-1/2">
                        <label className={`block text-xs mb-1 ${
                          darkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          Unit Price (R)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                          className={`w-full px-3 py-2 rounded border text-sm ${
                            darkMode
                              ? 'bg-slate-600 border-slate-500 text-slate-100'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        />
                      </div>
                    </div>
                  </div>
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Success Display */}
        {showSuccess && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Invoice generated successfully!
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!isFormValid() || isGenerating}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isFormValid() && !isGenerating
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : darkMode
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Generate Invoice
              </>
            )}
          </button>

          {generatedInvoice && (
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          )}
        </div>
      </div>


      {/* Right Panel - Live Preview */}
      <div className={`w-1/2 p-6 overflow-y-auto flex items-start justify-center ${
        darkMode ? 'bg-slate-900' : 'bg-slate-100'
      }`}>
        <div 
          className="bg-white shadow-2xl rounded-xl border border-slate-200 p-8 mx-auto max-w-lg w-full"
          data-testid="invoice-preview"
        >
          {/* Invoice Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-slate-800">
              Tax Invoice
            </h3>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              SARS Compliant
            </span>
          </div>

          {/* Client Info Preview */}
          <div className="mb-6 pb-4 border-b border-slate-200">
            <p className="text-sm text-slate-500">
              Bill To:
            </p>
            <p className="font-medium text-slate-800">
              {clientName || 'Client Name'}
            </p>
            {vatNumber && (
              <p className="text-sm text-slate-500">
                VAT: {vatNumber}
              </p>
            )}
          </div>

          {/* Line Items Preview */}
          <div className="mb-6">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-500">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Price</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-slate-800">
                {lineItems.map((item, index) => {
                  const qty = parseFloat(item.quantity) || 0;
                  const price = parseFloat(item.unitPrice) || 0;
                  const amount = qty * price;
                  return (
                    <tr key={index} className="border-t border-slate-100">
                      <td className="py-2">{item.description || '-'}</td>
                      <td className="py-2 text-right">{qty}</td>
                      <td className="py-2 text-right">{formatCurrency(price)}</td>
                      <td className="py-2 text-right">{formatCurrency(amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="pt-4 border-t border-slate-200">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  Subtotal
                </span>
                <span className="text-slate-800">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">
                  VAT (15%)
                </span>
                <span className="text-slate-800">
                  {formatCurrency(vatAmount)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-lg text-slate-800">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoiceGenerator;
