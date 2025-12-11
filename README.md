# SmartBiz SA: The AI CFO for South African Entrepreneurs

<!-- Banner Image Placeholder -->
![SmartBiz SA Banner](./assets/banner.png)
*[Banner image placeholder - Add your custom banner here]*

<div align="center">

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_App-blue?style=for-the-badge)](https://smartbiz-sa.netlify.app)
[![LiquidMetal x Vultr](https://img.shields.io/badge/🏆_Hackathon-LiquidMetal_x_Vultr-purple?style=for-the-badge)](https://devpost.com)
[![License](https://img.shields.io/badge/📄_License-MIT-green?style=for-the-badge)](./LICENSE)

</div>

---

## 🚀 **Introduction**

**SmartBiz SA** is an AI-powered financial management platform designed specifically for South African entrepreneurs. Acting as your virtual CFO, it solves the complex challenges of SARS compliance, VAT calculations, and financial planning that small businesses face daily.

Instead of hiring an expensive CFO, SmartBiz SA provides:
- 🧾 **SARS-compliant invoicing** with automatic 15% VAT calculations
- 🤖 **AI-powered financial advice** through natural language conversations  
- 📊 **Smart analytics** that answer questions like "What's my profit this quarter?"
- 🎙️ **Voice interactions** for hands-free business management

Built for the **LiquidMetal x Vultr AI Championship**, SmartBiz SA demonstrates how cutting-edge AI can democratize financial expertise for African entrepreneurs.

---

## 🏆 **Hackathon Context**

This project was built for the **LiquidMetal x Vultr AI Championship**, showcasing innovative use of:
- **Vultr Cloud Infrastructure** for high-performance hosting
- **LiquidMetal's Raindrop.io** for intelligent data processing
- **Advanced AI technologies** to solve real-world African business challenges

---

## ✨ **Key Features**

### 🤖 **AI Business Chat**
- **Powered by**: Cerebras (Llama 3.1)
- Get instant financial advice, cash flow insights, and business strategy recommendations
- Context-aware conversations that understand your business history

### 🗣️ **Voice Interface** 
- **Powered by**: ElevenLabs
- Hands-free interaction with your financial data
- Natural voice commands for invoicing, analytics, and queries

### 📊 **Smart Analytics**
- **Powered by**: Raindrop (LiquidMetal) SmartSQL
- Ask questions in plain English: *"Show me my revenue trends"*
- Natural language database queries with instant visualizations

### 🧾 **SARS-Compliant Invoicing**
- Automatic 15% VAT calculations for South African tax compliance
- Professional invoice generation with proper SARS formatting
- PDF export functionality for record-keeping

---

## 🛠️ **Tech Stack - The Hybrid Architecture**

### **Frontend**
- **React** (Vite) - Modern component-based UI
- **TailwindCSS** - Responsive, utility-first styling
- **WorkOS** - Enterprise-grade authentication
- **Lucide React** - Beautiful, consistent icons

### **Backend** 
- **Python Flask** - Lightweight, scalable API server
- **Hosted on Vultr** - High-performance cloud infrastructure
- **SQLAlchemy** - Robust database ORM
- **Gunicorn** - Production WSGI server

### **AI & Data Intelligence**
- **Cerebras (Llama 3.1)** - Lightning-fast AI reasoning
- **ElevenLabs** - Natural voice synthesis
- **Raindrop SmartSQL** - Natural language database queries

### **Data Bridge**
- **Custom Serverless Function** - Bridges Flask backend to Raindrop SmartSQL
- **Cloudflare Workers** - Edge computing for optimal performance

---

## 🚀 **Installation & Setup**

### **Prerequisites**

Ensure you have the following installed:
- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **Git**

### **1. Clone the Repository**

```bash
git clone https://github.com/linfordlee14/smartbiz-sa.git
cd smartbiz-sa
```

### **2. Backend Setup**

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys (see Environment Variables section)

# Run the Flask server
python app.py
```

The backend will be available at `http://localhost:5000`

### **3. Frontend Setup**

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### **4. Environment Variables**

#### **Backend (.env)**
```env
# AI Services
CEREBRAS_API_KEY=your_cerebras_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Database
DATABASE_URL=sqlite:///smartbiz.db

# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your_secret_key_here

# Raindrop Integration
RAINDROP_API_URL=your_raindrop_endpoint_here
RAINDROP_API_KEY=your_raindrop_api_key_here
```

#### **Frontend (.env)**
```env
# API Configuration
VITE_API_URL=http://localhost:5000

# WorkOS Authentication
VITE_WORKOS_CLIENT_ID=your_workos_client_id_here
```

### **5. Running Tests**

```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests  
cd frontend
npm test
```

---

## 🎯 **Usage**

1. **Start the Application**: Follow the installation steps above
2. **Create Account**: Sign up using the WorkOS authentication
3. **Generate Invoices**: Use the invoice generator for SARS-compliant billing
4. **Chat with AI**: Ask financial questions in the chat interface
5. **Analyze Data**: Use natural language queries for business insights
6. **Voice Commands**: Enable voice mode for hands-free interaction

---

## 👨‍💻 **Meet the Developer**

<div align="center">

### **Linford Musiyambodza**
**Founder & Lead Developer**

*Founder of Linfy Tech Solutions. Full-stack developer passionate about using AI (Cerebras, Raindrop, ElevenLabs) to solve real-world African challenges.*

[![GitHub](https://img.shields.io/badge/GitHub-linfordlee14-black?style=for-the-badge&logo=github)](https://github.com/linfordlee14)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-linfordlee14-blue?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/linfordlee14)

</div>

---

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **LiquidMetal & Vultr** for hosting the AI Championship
- **Cerebras** for providing cutting-edge AI infrastructure
- **ElevenLabs** for natural voice synthesis technology
- **Raindrop.io** for intelligent data processing capabilities
- The South African entrepreneurial community for inspiring this solution

---

<div align="center">

**Built with ❤️ for South African Entrepreneurs**

[![Live Demo](https://img.shields.io/badge/🚀_Try_SmartBiz_SA-Live_Demo-blue?style=for-the-badge)](https://smartbiz-sa.netlify.app)

</div>