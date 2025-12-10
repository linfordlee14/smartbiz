"""Invoice routes for SmartBiz SA - SARS-compliant invoicing endpoints."""
from flask import Blueprint, request, jsonify, Response
from extensions import db
from services.invoice_service import InvoiceService

invoice_bp = Blueprint('invoice', __name__, url_prefix='/api/invoice')


@invoice_bp.route('/generate', methods=['POST'])
def generate_invoice():
    """Generate a SARS-compliant invoice with 15% VAT calculation.
    
    Request body:
        business_id: UUID of the business (optional, uses default for demo)
        client_name: Name of the client
        items: List of items with description, quantity, unit_price
        client_vat: Optional client VAT number
        due_date: Optional due date (ISO format)
    
    Returns:
        201: Invoice created successfully
        400: Missing required fields
    """
    data = request.get_json() or {}
    
    # Validate required fields
    # Use a default business_id for demo purposes if not provided
    business_id = data.get('business_id') or 'demo-business-001'
    client_name = data.get('client_name')
    items = data.get('items')
    
    if not client_name or not items:
        return jsonify({'error': 'Missing required fields: client_name and items are required'}), 400
    
    # Optional fields
    client_vat = data.get('client_vat')
    due_date = data.get('due_date')
    
    # Generate invoice
    service = InvoiceService(db.session)
    result = service.generate_invoice(
        business_id=business_id,
        client_name=client_name,
        items=items,
        client_vat=client_vat,
        due_date=due_date
    )
    
    if 'error' in result:
        return jsonify(result), 400
    
    return jsonify(result), 201


@invoice_bp.route('/list/<business_id>', methods=['GET'])
def list_invoices(business_id):
    """List all invoices for a business.
    
    Args:
        business_id: UUID of the business
    
    Returns:
        200: List of invoices
    """
    service = InvoiceService(db.session)
    invoices = service.list_invoices(business_id)
    return jsonify({'invoices': invoices}), 200


@invoice_bp.route('/<invoice_id>', methods=['GET'])
def get_invoice(invoice_id):
    """Get a specific invoice by ID.
    
    Args:
        invoice_id: UUID of the invoice
    
    Returns:
        200: Invoice details
        404: Invoice not found
    """
    service = InvoiceService(db.session)
    invoice = service.get_invoice(invoice_id)
    
    if not invoice:
        return jsonify({'error': 'Invoice not found'}), 404
    
    return jsonify(invoice), 200


@invoice_bp.route('/<invoice_id>/pdf', methods=['GET'])
def download_invoice_pdf(invoice_id):
    """Download invoice as PDF.
    
    Args:
        invoice_id: UUID of the invoice
    
    Returns:
        200: PDF file
        404: Invoice not found
    """
    service = InvoiceService(db.session)
    pdf_bytes = service.generate_pdf(invoice_id)
    
    if not pdf_bytes:
        return jsonify({'error': 'Invoice not found'}), 404
    
    # Get invoice number for filename
    invoice = service.get_invoice(invoice_id)
    filename = f"{invoice['invoice_number']}.pdf" if invoice else f"invoice-{invoice_id}.pdf"
    
    return Response(
        pdf_bytes,
        mimetype='application/pdf',
        headers={'Content-Disposition': f'attachment; filename={filename}'}
    )
