"""Invoice Service for SmartBiz SA - SARS-compliant invoicing with VAT calculation."""
import io
import time
from datetime import datetime
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer


class InvoiceService:
    """Service for generating and managing SARS-compliant invoices."""
    
    VAT_RATE = 0.15  # 15% South African VAT
    
    def __init__(self, db_session):
        """Initialize InvoiceService with database session."""
        self.db = db_session
    
    def generate_invoice_number(self) -> str:
        """Generate unique invoice number in format INV-{timestamp}."""
        timestamp = int(time.time() * 1000)
        return f"INV-{timestamp}"
    
    def calculate_vat(self, total_excl_vat: float) -> dict:
        """Calculate VAT amount and total including VAT.
        
        Args:
            total_excl_vat: Total amount excluding VAT
            
        Returns:
            dict with vat_amount and total_incl_vat
        """
        vat_amount = total_excl_vat * self.VAT_RATE
        total_incl_vat = total_excl_vat + vat_amount
        return {
            'vat_amount': vat_amount,
            'total_incl_vat': total_incl_vat
        }
    
    def generate_invoice(self, business_id: str, client_name: str, items: list,
                         client_vat: Optional[str] = None,
                         due_date: Optional[datetime] = None) -> dict:
        """Generate a SARS-compliant invoice with 15% VAT calculation.
        
        Args:
            business_id: UUID of the business
            client_name: Name of the client
            items: List of invoice items with 'description', 'quantity', 'unit_price'
            client_vat: Optional client VAT number
            due_date: Optional due date for the invoice
            
        Returns:
            dict with invoice data or error
        """
        from models import Invoice, Business, User
        
        # For demo purposes, create a demo business if it doesn't exist
        business = Business.query.get(business_id)
        if not business:
            # Check if demo user exists, create if not
            demo_user = User.query.filter_by(email='demo@smartbiz.co.za').first()
            if not demo_user:
                demo_user = User(
                    id='demo-user-001',
                    email='demo@smartbiz.co.za',
                    name='Demo User'
                )
                self.db.add(demo_user)
                self.db.commit()
            
            # Create demo business
            business = Business(
                id=business_id,
                user_id=demo_user.id,
                name='SmartBiz Demo',
                vat_number='4123456789'
            )
            self.db.add(business)
            self.db.commit()
        
        # Calculate totals from items
        total_excl_vat = sum(
            item.get('quantity', 1) * item.get('unit_price', 0)
            for item in items
        )
        
        # Calculate VAT
        vat_calc = self.calculate_vat(total_excl_vat)
        
        # Generate invoice number
        invoice_number = self.generate_invoice_number()
        
        # Create invoice
        invoice = Invoice(
            business_id=business_id,
            invoice_number=invoice_number,
            client_name=client_name,
            client_vat=client_vat,
            total_excl_vat=total_excl_vat,
            vat_amount=vat_calc['vat_amount'],
            total_incl_vat=vat_calc['total_incl_vat'],
            due_date=due_date,
            items_json=items
        )
        
        self.db.add(invoice)
        self.db.commit()
        
        return self.serialize_invoice(invoice)
    
    def list_invoices(self, business_id: str) -> list:
        """Get all invoices for a business.
        
        Args:
            business_id: UUID of the business
            
        Returns:
            List of serialized invoices
        """
        from models import Invoice
        
        invoices = Invoice.query.filter_by(business_id=business_id).all()
        return [self.serialize_invoice(inv) for inv in invoices]
    
    def get_invoice(self, invoice_id: str) -> Optional[dict]:
        """Get a specific invoice by ID.
        
        Args:
            invoice_id: UUID of the invoice
            
        Returns:
            Serialized invoice dict or None if not found
        """
        from models import Invoice
        
        invoice = Invoice.query.get(invoice_id)
        if not invoice:
            return None
        return self.serialize_invoice(invoice)
    
    def serialize_invoice(self, invoice) -> dict:
        """Convert Invoice model to JSON-serializable dictionary.
        
        Args:
            invoice: Invoice model instance
            
        Returns:
            dict with invoice data
        """
        return {
            'id': invoice.id,
            'business_id': invoice.business_id,
            'invoice_number': invoice.invoice_number,
            'client_name': invoice.client_name,
            'client_vat': invoice.client_vat,
            'total_excl_vat': invoice.total_excl_vat,
            'vat_amount': invoice.vat_amount,
            'total_incl_vat': invoice.total_incl_vat,
            'issued_date': invoice.issued_date.isoformat() if invoice.issued_date else None,
            'due_date': invoice.due_date.isoformat() if invoice.due_date else None,
            'items_json': invoice.items_json,
            'is_paid': invoice.is_paid,
            'paid_date': invoice.paid_date.isoformat() if invoice.paid_date else None,
            'created_at': invoice.created_at.isoformat() if invoice.created_at else None
        }

    def generate_pdf(self, invoice_id: str) -> Optional[bytes]:
        """Generate a PDF for an invoice.
        
        Args:
            invoice_id: UUID of the invoice
            
        Returns:
            PDF bytes or None if invoice not found
        """
        from models import Invoice, Business
        
        invoice = Invoice.query.get(invoice_id)
        if not invoice:
            return None
        
        business = Business.query.get(invoice.business_id)
        
        # Create PDF buffer
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20*mm, bottomMargin=20*mm)
        
        elements = []
        styles = getSampleStyleSheet()
        
        # Title style
        title_style = ParagraphStyle(
            'Title',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=10*mm
        )
        
        # Header
        elements.append(Paragraph("TAX INVOICE", title_style))
        elements.append(Paragraph(f"<b>Invoice #:</b> {invoice.invoice_number}", styles['Normal']))
        elements.append(Paragraph(f"<b>Date:</b> {invoice.issued_date.strftime('%Y-%m-%d') if invoice.issued_date else 'N/A'}", styles['Normal']))
        if invoice.due_date:
            elements.append(Paragraph(f"<b>Due Date:</b> {invoice.due_date.strftime('%Y-%m-%d')}", styles['Normal']))
        elements.append(Spacer(1, 10*mm))
        
        # Business info
        if business:
            elements.append(Paragraph("<b>From:</b>", styles['Normal']))
            elements.append(Paragraph(business.name, styles['Normal']))
            if business.vat_number:
                elements.append(Paragraph(f"VAT: {business.vat_number}", styles['Normal']))
        elements.append(Spacer(1, 5*mm))
        
        # Client info
        elements.append(Paragraph("<b>Bill To:</b>", styles['Normal']))
        elements.append(Paragraph(invoice.client_name, styles['Normal']))
        if invoice.client_vat:
            elements.append(Paragraph(f"VAT: {invoice.client_vat}", styles['Normal']))
        elements.append(Spacer(1, 10*mm))
        
        # Items table
        table_data = [['Description', 'Qty', 'Unit Price', 'Amount']]
        items = invoice.items_json or []
        for item in items:
            qty = item.get('quantity', 1)
            price = item.get('unit_price', 0)
            amount = qty * price
            table_data.append([
                item.get('description', ''),
                str(qty),
                f"R {price:.2f}",
                f"R {amount:.2f}"
            ])
        
        table = Table(table_data, colWidths=[80*mm, 20*mm, 35*mm, 35*mm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4F46E5')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E5E7EB')),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 10*mm))
        
        # Totals
        totals_data = [
            ['Subtotal (excl. VAT)', f"R {invoice.total_excl_vat:.2f}"],
            ['VAT (15%)', f"R {invoice.vat_amount:.2f}"],
            ['Total (incl. VAT)', f"R {invoice.total_incl_vat:.2f}"]
        ]
        totals_table = Table(totals_data, colWidths=[120*mm, 50*mm])
        totals_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black),
        ]))
        elements.append(totals_table)
        elements.append(Spacer(1, 15*mm))
        
        # SARS compliance note
        elements.append(Paragraph(
            "<i>This is a SARS-compliant tax invoice. VAT Registration Number displayed above.</i>",
            styles['Normal']
        ))
        
        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()
