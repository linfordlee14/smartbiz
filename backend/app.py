"""SmartBiz SA Flask Backend - Main Application."""
import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from extensions import db

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///smartbiz.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize CORS with frontend URL
frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
CORS(app, origins=[frontend_url])

# Initialize SQLAlchemy with app
db.init_app(app)

# Import models after db initialization to register them
from models import User, Business, Invoice, ChatHistory

# Import and register blueprints
from routes.invoice import invoice_bp
from routes.chat import chat_bp
app.register_blueprint(invoice_bp)
app.register_blueprint(chat_bp)


# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Return health status and version information."""
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0',
        'service': 'SmartBiz SA Backend'
    })


# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    """Handle 404 errors with JSON response."""
    return jsonify({'error': 'Resource not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors with JSON response."""
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500


# Create database tables
with app.app_context():
    db.create_all()


if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
