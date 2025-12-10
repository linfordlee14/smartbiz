"""Flask extensions initialization."""
from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy without app binding
db = SQLAlchemy()
