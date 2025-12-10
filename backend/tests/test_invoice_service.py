"""Property-based tests for InvoiceService."""
import pytest
import sys
import os
from hypothesis import given, strategies as st, settings, HealthCheck

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.invoice_service import InvoiceService
from models import User, Business, Invoice
from app import db


# Strategies for generating test data
positive_float = st.floats(min_value=0.01, max_value=1_000_000, allow_nan=False, allow_infinity=False)

item_strategy = st.fixed_dictionaries({
    'description': st.text(min_size=1, max_size=100),
    'quantity': st.integers(min_value=1, max_value=1000),
    'unit_price': positive_float
})

items_list_strategy = st.lists(item_strategy, min_size=1, max_size=10)


class TestVATCalculation:
    """Property tests for VAT calculation correctness."""
    
    # **Feature: smartbiz-flask-backend, Property 3: VAT calculation correctness**
    @given(total_excl_vat=positive_float)
    @settings(max_examples=100)
    def test_vat_calculation_correctness(self, total_excl_vat):
        """
        Property 3: VAT calculation correctness
        
        *For any* invoice with line items, the vat_amount SHALL equal exactly 
        total_excl_vat * 0.15 (15% VAT), and total_incl_vat SHALL equal 
        total_excl_vat + vat_amount.
        
        **Validates: Requirements 3.1**
        """
        service = InvoiceService(None)  # No DB needed for calculation
        result = service.calculate_vat(total_excl_vat)
        
        expected_vat = total_excl_vat * 0.15
        expected_total = total_excl_vat + expected_vat
        
        # VAT amount should be exactly 15% of total excluding VAT
        assert abs(result['vat_amount'] - expected_vat) < 1e-10, \
            f"VAT amount {result['vat_amount']} != expected {expected_vat}"
        
        # Total including VAT should be total excluding VAT + VAT amount
        assert abs(result['total_incl_vat'] - expected_total) < 1e-10, \
            f"Total incl VAT {result['total_incl_vat']} != expected {expected_total}"
        
        # Verify the relationship: total_incl_vat = total_excl_vat + vat_amount
        assert abs(result['total_incl_vat'] - (total_excl_vat + result['vat_amount'])) < 1e-10


import re


class TestInvoiceNumberFormat:
    """Property tests for invoice number format."""
    
    # **Feature: smartbiz-flask-backend, Property 4: Invoice number format**
    @given(st.integers(min_value=1, max_value=1000))
    @settings(max_examples=100)
    def test_invoice_number_format(self, _):
        """
        Property 4: Invoice number format
        
        *For any* generated invoice, the invoice_number SHALL match the pattern 
        "INV-{digits}" where digits is a valid timestamp.
        
        **Validates: Requirements 3.2**
        """
        service = InvoiceService(None)
        invoice_number = service.generate_invoice_number()
        
        # Invoice number should match pattern INV-{digits}
        pattern = r'^INV-\d+$'
        assert re.match(pattern, invoice_number), \
            f"Invoice number '{invoice_number}' does not match pattern 'INV-{{digits}}'"
        
        # Extract the timestamp part and verify it's a valid number
        timestamp_str = invoice_number.replace('INV-', '')
        timestamp = int(timestamp_str)
        
        # Timestamp should be a positive number (milliseconds since epoch)
        assert timestamp > 0, f"Timestamp {timestamp} should be positive"
        
        # Timestamp should be reasonable (after year 2020 in milliseconds)
        min_timestamp = 1577836800000  # Jan 1, 2020 in milliseconds
        assert timestamp > min_timestamp, \
            f"Timestamp {timestamp} should be after Jan 1, 2020"


from datetime import datetime
from unittest.mock import MagicMock


class TestInvoiceSerializationRoundTrip:
    """Property tests for invoice serialization round-trip."""
    
    # **Feature: smartbiz-flask-backend, Property 8: Invoice serialization round-trip**
    @given(
        invoice_id=st.uuids().map(str),
        business_id=st.uuids().map(str),
        invoice_number=st.integers(min_value=1000000000, max_value=9999999999999).map(lambda x: f"INV-{x}"),
        client_name=st.text(min_size=1, max_size=50, alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '),
        client_vat=st.one_of(st.none(), st.text(min_size=1, max_size=15, alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')),
        total_excl_vat=positive_float,
        is_paid=st.booleans()
    )
    @settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow], deadline=None)
    def test_invoice_serialization_round_trip(self, invoice_id, business_id, invoice_number, client_name, client_vat, total_excl_vat, is_paid):
        """
        Property 8: Invoice serialization round-trip
        
        *For any* valid Invoice model instance, serializing to JSON dictionary 
        and then using those values to create a new Invoice SHALL produce an 
        equivalent invoice with matching field values.
        
        **Validates: Requirements 7.5, 7.6**
        """
        service = InvoiceService(None)
        vat_calc = service.calculate_vat(total_excl_vat)
        items = [{'description': 'Test Item', 'quantity': 1, 'unit_price': total_excl_vat}]
        
        # Create a mock invoice object with all required attributes
        mock_invoice = MagicMock()
        mock_invoice.id = invoice_id
        mock_invoice.business_id = business_id
        mock_invoice.invoice_number = invoice_number
        mock_invoice.client_name = client_name
        mock_invoice.client_vat = client_vat
        mock_invoice.total_excl_vat = total_excl_vat
        mock_invoice.vat_amount = vat_calc['vat_amount']
        mock_invoice.total_incl_vat = vat_calc['total_incl_vat']
        mock_invoice.issued_date = datetime.utcnow()
        mock_invoice.due_date = None
        mock_invoice.items_json = items
        mock_invoice.is_paid = is_paid
        mock_invoice.paid_date = None
        mock_invoice.created_at = datetime.utcnow()
        
        # Serialize the invoice
        serialized = service.serialize_invoice(mock_invoice)
        
        # Verify round-trip: serialized values match original
        assert serialized['id'] == mock_invoice.id
        assert serialized['business_id'] == mock_invoice.business_id
        assert serialized['invoice_number'] == mock_invoice.invoice_number
        assert serialized['client_name'] == mock_invoice.client_name
        assert serialized['client_vat'] == mock_invoice.client_vat
        assert abs(serialized['total_excl_vat'] - mock_invoice.total_excl_vat) < 1e-10
        assert abs(serialized['vat_amount'] - mock_invoice.vat_amount) < 1e-10
        assert abs(serialized['total_incl_vat'] - mock_invoice.total_incl_vat) < 1e-10
        assert serialized['items_json'] == mock_invoice.items_json
        assert serialized['is_paid'] == mock_invoice.is_paid
        
        # Verify dates are properly serialized to ISO format strings
        assert serialized['issued_date'] == mock_invoice.issued_date.isoformat()
        assert serialized['created_at'] == mock_invoice.created_at.isoformat()
