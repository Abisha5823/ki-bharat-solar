from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from pydantic import BaseModel
from typing import Optional
import json
import os
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from bson import ObjectId
import traceback

# Custom JSON encoder for MongoDB ObjectId
class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)

# Initialize FastAPI
app = FastAPI(title="KI Bharat Energies API", version="1.0")

# Enable CORS for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection - Using environment variables for production
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb+srv://username:password@cluster.mongodb.net/")
mongo_client = None
db = None
leads_collection = None
in_memory_leads = []

# Try to connect to MongoDB Atlas
try:
    if MONGODB_URL and "mongodb+srv" in MONGODB_URL:
        mongo_client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
        mongo_client.admin.command('ping')
        db = mongo_client['solar_bharat']
        leads_collection = db['leads']
        print("✅ Connected to MongoDB Atlas")
    else:
        print("⚠️ Using in-memory storage (no MongoDB URL provided)")
        mongo_client = None
        db = None
        leads_collection = None
except Exception as e:
    print(f"⚠️ MongoDB not available: {e}")
    print("💡 Using in-memory storage instead")
    mongo_client = None
    db = None
    leads_collection = None

# Owner contact details - Use environment variables
OWNER_EMAIL = os.getenv("OWNER_EMAIL", "owner@kibharatenergies.com")
OWNER_PHONE = os.getenv("OWNER_PHONE", "9876543210")

# Email configuration - Use environment variables
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

class Lead(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    location: Optional[str] = None
    land_size: Optional[str] = None
    borewell_depth: Optional[str] = None
    interest: Optional[str] = None
    message: Optional[str] = None
    source: str
    timestamp: str
    form_type: Optional[str] = "consultation"
    preferred_time: Optional[str] = None

def send_email_notification(lead_data):
    """Send email notification to owner"""
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print("⚠️ Email not configured - skipping notification")
        return False
        
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USERNAME
        msg['To'] = OWNER_EMAIL
        
        if lead_data.get('form_type') == 'lead_generation':
            msg['Subject'] = f"📋 NEW ORDER/BOOKING: {lead_data['name']} - {lead_data['interest']}"
        else:
            msg['Subject'] = f"🔆 Consultation Request: {lead_data['name']}"
        
        if lead_data.get('form_type') == 'lead_generation':
            body = build_lead_email(lead_data)
        else:
            body = build_consultation_email(lead_data)
        
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        print(f"✅ Email sent for {lead_data['form_type']}")
        return True
    except Exception as e:
        print(f"❌ Email error: {e}")
        return False

def build_consultation_email(lead_data):
    phone = lead_data.get('phone', 'N/A')
    name = lead_data.get('name', 'N/A')
    
    return f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #ff8c00;">📞 New Consultation Request</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
            <tr style="background: #f2f2f2;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Field</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Value</th>
            </tr>
            <tr><td><strong>Name</strong></td><td>{name}</td></tr>
            <tr><td><strong>Phone</strong></td><td>{phone}</td></tr>
            <tr><td><strong>Email</strong></td><td>{lead_data.get('email', 'N/A')}</td></tr>
            <tr><td><strong>Interest</strong></td><td>{lead_data.get('interest', 'N/A')}</td></tr>
            <tr><td><strong>Message</strong></td><td>{lead_data.get('message', 'N/A')}</td></tr>
            <tr><td><strong>Time</strong></td><td>{lead_data.get('timestamp', 'N/A')}</td></tr>
        </table>
        <div style="margin-top: 30px;">
            <a href="tel:{phone}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">📞 Call</a>
            <a href="https://wa.me/91{phone}" style="background: #25D366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">📱 WhatsApp</a>
        </div>
    </body>
    </html>
    """

def build_lead_email(lead_data):
    phone = lead_data.get('phone', 'N/A')
    name = lead_data.get('name', 'N/A')
    
    return f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #ff8c00;">📋 New Order/Service Booking</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
            <tr style="background: #f2f2f2;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Field</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Value</th>
            </tr>
            <tr><td><strong>Name</strong></td><td>{name}</td></tr>
            <tr><td><strong>Phone</strong></td><td>{phone}</td></tr>
            <tr><td><strong>Email</strong></td><td>{lead_data.get('email', 'N/A')}</td></tr>
            <tr><td><strong>Location</strong></td><td>{lead_data.get('location', 'N/A')}</td></tr>
            <tr><td><strong>Land Size</strong></td><td>{lead_data.get('land_size', 'N/A')} acres</td></tr>
            <tr><td><strong>Borewell Depth</strong></td><td>{lead_data.get('borewell_depth', 'N/A')} feet</td></tr>
            <tr><td><strong>Interest</strong></td><td>{lead_data.get('interest', 'N/A')}</td></tr>
            <tr><td><strong>Message</strong></td><td>{lead_data.get('message', 'N/A')}</td></tr>
            <tr><td><strong>Time</strong></td><td>{lead_data.get('timestamp', 'N/A')}</td></tr>
        </table>
        <div style="margin-top: 30px;">
            <a href="tel:{phone}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">📞 Call</a>
            <a href="https://wa.me/91{phone}" style="background: #25D366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">📱 WhatsApp</a>
        </div>
    </body>
    </html>
    """

@app.get("/")
def read_root():
    return {
        "message": "KI Bharat Energies Solar API",
        "status": "running",
        "version": "1.0",
        "endpoints": ["/api/health", "/api/lead", "/api/leads"]
    }

@app.get("/api/health")
def health_check():
    mongo_status = "connected" if leads_collection is not None else "disconnected"
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "mongodb": mongo_status,
        "storage": "database" if leads_collection is not None else "memory",
        "email_configured": bool(SMTP_USERNAME and SMTP_PASSWORD)
    }

@app.post("/api/lead")
async def save_lead(lead: Lead):
    try:
        lead_dict = lead.dict()
        print(f"📝 Received: {lead_dict['form_type']} from {lead_dict['name']}")
        
        if leads_collection is not None:
            result = leads_collection.insert_one(lead_dict)
            lead_dict["id"] = str(result.inserted_id)
            print(f"✅ Saved to MongoDB")
        else:
            lead_dict["id"] = str(len(in_memory_leads) + 1)
            in_memory_leads.append(lead_dict)
            print(f"✅ Saved to memory")
        
        # Send email if configured
        email_sent = send_email_notification(lead_dict) if SMTP_USERNAME else False
        
        return {
            "success": True,
            "message": "Lead saved successfully",
            "lead": {
                "name": lead_dict["name"],
                "phone": lead_dict["phone"],
                "id": lead_dict["id"]
            },
            "email_sent": email_sent
        }
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/leads")
async def get_leads():
    if leads_collection is not None:
        leads = list(leads_collection.find().sort("timestamp", -1).limit(50))
        for lead in leads:
            lead["id"] = str(lead["_id"])
            del lead["_id"]
        return {"leads": leads, "count": len(leads)}
    else:
        return {"leads": in_memory_leads, "count": len(in_memory_leads)}

# For Vercel serverless
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)