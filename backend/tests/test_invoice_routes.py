"""Property-based tests for Invoice routes."""
import pytest
import sys
import os
from hypothesis import given, strategies as st, settings, assume

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, db
from models import User, Business, Invoice


class TestInvoiceGenerationValidation:
    """Property tests for invoice generation validation."""
    
    # **Feature: smartbiz-flask-backend, Property 5: Invoice generation validation**
    @given(
        has_business_id=st.booleans(),
        has_client_name=st.booleans(),
        has_items=st.booleans()
    )
    @settings(max_examples=100, deadline=None)
    def test_invoice_generation_missing_fields_returns_400(
        self, has_business_id, has_client_name, has_items
    ):
        """
        Property 5: Invoice generation validation
        
        *For any* request to /api/invoice/generate missing any of business_id, 
        client_name, or items, the endpoint SHALL return HTTP 400 with error 
        message "Missing required fields".
        
        **Validates: Requirements 3.3**
        """
        # Skip if all fields are present (that's a valid request, not what we're testing)
        assume(not (has_business_id and has_client_name and has_items))
        
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        
        with app.app_context():
            db.create_all()
            
            # Build request data with missing fields
            data = {}
            if has_business_id:
                data['business_id'] = 'some-uuid-value'
            if has_client_name:
                data['client_name'] = 'Test Client'
            if has_items:
                data['items'] = [{'description': 'Item', 'quantity': 1, 'unit_price': 100.0}]
            
            client = app.test_client()
            response = client.post('/api/invoice/generate', json=data)
            
            # Should return 400 with "Missing required fields"
            assert response.status_code == 400, \
                f"Expected 400, got {response.status_code} for data: {data}"
            
            response_data = response.get_json()
            assert response_data.get('error') == 'Missing required fields', \
                f"Expected 'Missing required fields', got: {response_data}"


class TestInvoiceListFiltering:
    """Property tests for invoice list filtering."""
    
    # **Feature: smartbiz-flask-backend, Property 6: Invoice list filtering**
    @given(
        num_invoices_b1=st.integers(min_value=0, max_value=3),
        num_invoices_b2=st.integers(min_value=0, max_value=3)
    )
    @settings(max_examples=100, deadline=None)
    def test_invoice_list_returns_only_matching_business_invoices(self, num_invoices_b1, num_invoices_b2):
        """
        Property 6: Invoice list filtering
        
        *For any* business_id, all invoices returned by /api/invoice/list/{business_id} 
        SHALL have business_id matching the requested business_id.
        
        **Validates: Requirements 3.4**
        """
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        
        with app.app_context():
            db.drop_all()
            db.create_all()
            
            # Create test user with unique email
            user = User(email=f'test{unique_id}@example.com', name='Test User')
            db.session.add(user)
            db.session.commit()
            
            # Create two businesses
            business1 = Business(user_id=user.id, name='Business 1')
            business2 = Business(user_id=user.id, name='Business 2')
            db.session.add(business1)
            db.session.add(business2)
            db.session.commit()
            
            business1_id = business1.id
            business2_id = business2.id
            
            # Create invoices for business1
            for i in range(num_invoices_b1):
                invoice = Invoice(
                    business_id=business1_id,
                    invoice_number=f'INV-{unique_id}-{i}-B1',
                    client_name=f'Client {i}',
                    total_excl_vat=100.0,
                    vat_amount=15.0,
                    total_incl_vat=115.0
                )
                db.session.add(invoice)
            
            # Create invoices for business2 (should not appear in business1 list)
            for i in range(num_invoices_b2):
                invoice = Invoice(
                    business_id=business2_id,
                    invoice_number=f'INV-{unique_id}-{i}-B2',
                    client_name=f'Other Client {i}',
                    total_excl_vat=200.0,
                    vat_amount=30.0,
                    total_incl_vat=230.0
                )
                db.session.add(invoice)
            
            db.session.commit()
            
            client = app.test_client()
            
            # Test business1 list
            response = client.get(f'/api/invoice/list/{business1_id}')
            assert response.status_code == 200
            response_data = response.get_json()
            invoices = response_data.get('invoices', [])
            
            # All returned invoices should belong to business1
            assert len(invoices) == num_invoices_b1, \
                f"Expected {num_invoices_b1} invoices for B1, got {len(invoices)}"
            
            for inv in invoices:
                assert inv['business_id'] == business1_id, \
                    f"Invoice {inv['invoice_number']} has wrong business_id: {inv['business_id']}"
            
            # Test business2 list
            response2 = client.get(f'/api/invoice/list/{business2_id}')
            assert response2.status_code == 200
            response_data2 = response2.get_json()
            invoices2 = response_data2.get('invoices', [])
            
            # All returned invoices should belong to business2
            assert len(invoices2) == num_invoices_b2, \
                f"Expected {num_invoices_b2} invoices for B2, got {len(invoices2)}"
            
            for inv in invoices2:
                assert inv['business_id'] == business2_id, \
                    f"Invoice {inv['invoice_number']} has wrong business_id: {inv['business_id']}"
            
            db.session.remove()
            db.drop_all()
