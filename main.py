from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime

app = FastAPI(title="BeanGram Backend API", version="2.0")

# Mengizinkan akses lintas domain (CORS) untuk frontend Mini App
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Konfigurasi MongoDB Atlas BeanGramProDB
MONGO_URI = "mongodb+srv://agentanugrah_db_user:AeQxBtxGbMGJhEp7@beangramprodb.rwz4bgo.mongodb.net/?retryWrites=true&w=majority&appName=BeanGramProDB"
client = AsyncIOMotorClient(MONGO_URI)
db = client.bg_database

# Koleksi Database
users_collection = db.users
tasks_collection = db.tasks
user_tasks_collection = db.user_tasks
ads_collection = db.ads_campaigns
withdrawals_collection = db.withdrawals

@app.get("/")
def root():
    return {"status": "success", "message": "BeanGram Backend API is running perfectly!"}

# Model Pydantic untuk Validasi Data Masuk
class UserLogin(BaseModel):
    telegram_id: str
    username: str
    referred_by: str = None

class TaskComplete(BaseModel):
    telegram_id: str
    task_id: str

class AdCampaign(BaseModel):
    advertiser_id: str
    social_link: str
    title: str
    target_members: int
    total_cost_ton: float

class WithdrawalRequest(BaseModel):
    telegram_id: str
    amount_ton: float
    wallet_address: str

# 1. Endpoint Login / Registrasi User Otomatis
@app.post("/api/user/login")
async def user_login(data: UserLogin):
    existing_user = await users_collection.find_one({"telegram_id": data.telegram_id})
    
    if existing_user:
        await users_collection.update_one(
            {"telegram_id": data.telegram_id},
            {"$set": {"username": data.username}}
        )
        return {"status": "success", "message": "User logged in successfully", "data": existing_user}
    
    new_user = {
        "telegram_id": data.telegram_id,
        "username": data.username,
        "bgram_balance": 0.0,
        "ton_balance": 0.0,
        "referred_by": data.referred_by if data.referred_by else None,
        "referral_count": 0,
        "is_verified": False,
        "created_at": datetime.utcnow()
    }
    
    if data.referred_by:
        referrer = await users_collection.find_one({"telegram_id": data.referred_by})
        if referrer:
            await users_collection.update_one(
                {"telegram_id": data.referred_by},
                {"$inc": {"referral_count": 1, "bgram_balance": 10.0}}
            )

    await users_collection.insert_one(new_user)
    return {"status": "success", "message": "New user registered successfully", "data": new_user}

# 2. Endpoint Mengambil Data Profil & Saldo User
@app.get("/api/user/profile/{telegram_id}")
async def get_user_profile(telegram_id: str):
    user = await users_collection.find_one({"telegram_id": telegram_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "data": user}

# 3. Endpoint Menyelesaikan Task / Misi (Earn)
@app.post("/api/task/complete")
async def complete_task(data: TaskComplete):
    existing_claim = await user_tasks_collection.find_one({
        "telegram_id": data.telegram_id,
        "task_id": data.task_id
    })
    
    if existing_claim:
        raise HTTPException(status_code=400, detail="Task already completed by this user")
    
    await user_tasks_collection.insert_one({
        "telegram_id": data.telegram_id,
        "task_id": data.task_id,
        "completed_at": datetime.utcnow()
    })
    
    await users_collection.update_one(
        {"telegram_id": data.telegram_id},
        {"$inc": {"bgram_balance": 5.0}}
    )
    
    return {"status": "success", "message": "Task completed successfully, reward added!"}

# 4. Endpoint Membuat Kampanye Iklan Baru (Advertiser Hub)
@app.post("/api/ads/create")
async def create_ad_campaign(data: AdCampaign):
    campaign_id = f"AD-{int(datetime.utcnow().timestamp())}"
    
    new_campaign = {
        "campaign_id": campaign_id,
        "advertiser_id": data.advertiser_id,
        "social_link": data.social_link,
        "title": data.title,
        "target_members": data.target_members,
        "total_cost_ton": data.total_cost_ton,
        "status": "active",
        "created_at": datetime.utcnow()
    }
    
    await ads_collection.insert_one(new_campaign)
    return {"status": "success", "message": "Ad campaign launched successfully", "campaign_id": campaign_id}

# 5. Endpoint Permintaan Penarikan TON (Withdrawal)
@app.post("/api/withdrawal/request")
async def request_withdrawal(data: WithdrawalRequest):
    user = await users_collection.find_one({"telegram_id": data.telegram_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user["ton_balance"] < data.amount_ton:
        raise HTTPException(status_code=400, detail="Insufficient TON balance")
        
    withdrawal_id = f"WD-{int(datetime.utcnow().timestamp())}"
    
    withdrawal_record = {
        "withdrawal_id": withdrawal_id,
        "telegram_id": data.telegram_id,
        "amount_ton": data.amount_ton,
        "wallet_address": data.wallet_address,
        "status": "pending",
        "requested_at": datetime.utcnow()
    }
    
    await withdrawals_collection.insert_one(withdrawal_record)
    await users_collection.update_one(
        {"telegram_id": data.telegram_id},
        {"$inc": {"ton_balance": -data.amount_ton}}
    )
    
    return {"status": "success", "message": "Withdrawal request submitted successfully", "withdrawal_id": withdrawal_id}
