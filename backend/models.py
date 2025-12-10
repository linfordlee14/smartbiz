"""SmartBiz SA Database Models."""
import uuid
from datetime import datetime
from extensions import db


def generate_uuid():
    """Generate a UUID string for primary keys."""
    return str(uuid.uuid4())


class User(db.Model):
    """User model for SmartBiz SA users."""
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    email = db.Column(db.String(255), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    businesses = db.relationship('Business', backref='user', lazy=True, cascade='all, delete-orphan')
    chat_history = db.relationship('ChatHistory', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.email}>'


class Business(db.Model):
    """Business model for user businesses."""
    __tablename__ = 'businesses'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    vat_number = db.Column(db.String(20), nullable=True)
    industry = db.Column(db.String(100), nullable=True)
    registration_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    invoices = db.relationship('Invoice', backref='business', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Business {self.name}>'


class Invoice(db.Model):
    """Invoice model for SARS-compliant invoices."""
    __tablename__ = 'invoices'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    business_id = db.Column(db.String(36), db.ForeignKey('businesses.id'), nullable=False)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)
    client_name = db.Column(db.String(255), nullable=False)
    client_vat = db.Column(db.String(20), nullable=True)
    total_excl_vat = db.Column(db.Float, nullable=False)
    vat_amount = db.Column(db.Float, nullable=False)
    total_incl_vat = db.Column(db.Float, nullable=False)
    issued_date = db.Column(db.DateTime, default=datetime.utcnow)
    due_date = db.Column(db.DateTime, nullable=True)
    items_json = db.Column(db.JSON, nullable=True)
    is_paid = db.Column(db.Boolean, default=False)
    paid_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Invoice {self.invoice_number}>'


class ChatHistory(db.Model):
    """ChatHistory model for storing chat interactions."""
    __tablename__ = 'chat_history'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=False)
    used_voice = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<ChatHistory {self.id}>'
