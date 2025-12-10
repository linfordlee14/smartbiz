"""Unit tests for SmartBiz SA database models."""
import pytest
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from models import User, Business, Invoice, ChatHistory
from app import db


class TestUserModel:
    """Tests for User model."""
    
    def test_create_user_with_valid_data(self, test_app, db_session):
        """Test creating a user with valid data."""
        user = User(email='test@example.com', name='Test User')
        db_session.add(user)
        db_session.commit()
        
        assert user.id is not None
        assert len(user.id) == 36  # UUID format
        assert user.email == 'test@example.com'
        assert user.name == 'Test User'
        assert user.created_at is not None
    
    def test_user_email_unique_constraint(self, test_app, db_session):
        """Test that email must be unique."""
        user1 = User(email='duplicate@example.com', name='User 1')
        db_session.add(user1)
        db_session.commit()
        
        user2 = User(email='duplicate@example.com', name='User 2')
        db_session.add(user2)
        
        with pytest.raises(IntegrityError):
            db_session.commit()


class TestBusinessModel:
    """Tests for Business model."""
    
    def test_create_business_with_valid_data(self, test_app, db_session):
        """Test creating a business with valid data."""
        user = User(email='owner@example.com', name='Business Owner')
        db_session.add(user)
        db_session.commit()
        
        business = Business(
            user_id=user.id,
            name='Test Business',
            vat_number='4123456789',
            industry='Technology'
        )
        db_session.add(business)
        db_session.commit()
        
        assert business.id is not None
        assert business.user_id == user.id
        assert business.name == 'Test Business'
        assert business.vat_number == '4123456789'

    
    def test_business_user_relationship(self, test_app, db_session):
        """Test relationship between Business and User."""
        user = User(email='owner2@example.com', name='Owner')
        db_session.add(user)
        db_session.commit()
        
        business = Business(user_id=user.id, name='My Business')
        db_session.add(business)
        db_session.commit()
        
        assert business.user == user
        assert business in user.businesses


class TestInvoiceModel:
    """Tests for Invoice model."""
    
    def test_create_invoice_with_valid_data(self, test_app, db_session):
        """Test creating an invoice with valid data."""
        user = User(email='invoiceowner@example.com', name='Invoice Owner')
        db_session.add(user)
        db_session.commit()
        
        business = Business(user_id=user.id, name='Invoice Business')
        db_session.add(business)
        db_session.commit()
        
        invoice = Invoice(
            business_id=business.id,
            invoice_number='INV-1234567890',
            client_name='Client Corp',
            client_vat='9876543210',
            total_excl_vat=1000.00,
            vat_amount=150.00,
            total_incl_vat=1150.00,
            items_json=[{'description': 'Service', 'amount': 1000.00}]
        )
        db_session.add(invoice)
        db_session.commit()
        
        assert invoice.id is not None
        assert invoice.invoice_number == 'INV-1234567890'
        assert invoice.total_excl_vat == 1000.00
        assert invoice.vat_amount == 150.00
        assert invoice.is_paid == False
    
    def test_invoice_number_unique_constraint(self, test_app, db_session):
        """Test that invoice_number must be unique."""
        user = User(email='unique@example.com', name='User')
        db_session.add(user)
        db_session.commit()
        
        business = Business(user_id=user.id, name='Business')
        db_session.add(business)
        db_session.commit()
        
        invoice1 = Invoice(
            business_id=business.id,
            invoice_number='INV-DUPLICATE',
            client_name='Client 1',
            total_excl_vat=100.00,
            vat_amount=15.00,
            total_incl_vat=115.00
        )
        db_session.add(invoice1)
        db_session.commit()
        
        invoice2 = Invoice(
            business_id=business.id,
            invoice_number='INV-DUPLICATE',
            client_name='Client 2',
            total_excl_vat=200.00,
            vat_amount=30.00,
            total_incl_vat=230.00
        )
        db_session.add(invoice2)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_invoice_business_relationship(self, test_app, db_session):
        """Test relationship between Invoice and Business."""
        user = User(email='reltest@example.com', name='Rel User')
        db_session.add(user)
        db_session.commit()
        
        business = Business(user_id=user.id, name='Rel Business')
        db_session.add(business)
        db_session.commit()
        
        invoice = Invoice(
            business_id=business.id,
            invoice_number='INV-REL-001',
            client_name='Rel Client',
            total_excl_vat=500.00,
            vat_amount=75.00,
            total_incl_vat=575.00
        )
        db_session.add(invoice)
        db_session.commit()
        
        assert invoice.business == business
        assert invoice in business.invoices


class TestChatHistoryModel:
    """Tests for ChatHistory model."""
    
    def test_create_chat_history_with_valid_data(self, test_app, db_session):
        """Test creating a chat history entry with valid data."""
        user = User(email='chatuser@example.com', name='Chat User')
        db_session.add(user)
        db_session.commit()
        
        chat = ChatHistory(
            user_id=user.id,
            message='Hello, how can I register my business?',
            response='To register your business in South Africa...',
            used_voice=True
        )
        db_session.add(chat)
        db_session.commit()
        
        assert chat.id is not None
        assert chat.message == 'Hello, how can I register my business?'
        assert chat.used_voice == True
        assert chat.created_at is not None
    
    def test_chat_history_user_relationship(self, test_app, db_session):
        """Test relationship between ChatHistory and User."""
        user = User(email='chatrel@example.com', name='Chat Rel User')
        db_session.add(user)
        db_session.commit()
        
        chat = ChatHistory(
            user_id=user.id,
            message='Test message',
            response='Test response'
        )
        db_session.add(chat)
        db_session.commit()
        
        assert chat.user == user
        assert chat in user.chat_history
