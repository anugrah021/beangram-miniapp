import os
import hmac
import hashlib
import urllib.parse
import json
import requests
import time
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BOT_TOKEN = os.getenv("BOT_TOKEN")
MONGO_URI = os.getenv("MONGO_URI")

mongo_client = MongoClient(MONGO_URI) if MONGO_URI else None
db = mongo_client["BeanGramDB"] if mongo_client else None
users_collection = db["users"] if db is not None else None
tasks_collection = db["user_tasks"] if db is not None else None

def verify_telegram_data(init_data: str) -> dict:
    if not BOT_TOKEN:
        return None
    try:
        parsed_data = dict(urllib.parse.parse_qsl(init_data))
        if "hash" not in parsed_data:
            return None
        
        received_hash = parsed_data.pop("hash")
        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed_data.items()))
        
        secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        
        if calculated_hash == received_hash:
            return json.loads(parsed_data.get("user", "{}"))
        return None
    except Exception:
        return None

@app.get("/")
def home():
    return {"status": "online", "message": "BeanGram Backend Service Active & Secured"}

@app.get("/verify-channel")
def verify_channel(
    init_data: str = Query(...),
    channel: str = Query(...),
    task_id: str = Query(...)
):
    user_data = verify_telegram_data(init_data)
    if not user_data:
        raise HTTPException(status_code=401, detail="Autentikasi Telegram gagal.")
    
    telegram_id = user_data.get("id")
    username = user_data.get("username", "NoUsername")
    
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database MongoDB belum terhubung.")

    existing_task = tasks_collection.find_one({"telegram_id": telegram_id, "task_id": task_id})
    if existing_task:
        return {"status": "claimed", "message": "Task already claimed."}

    channel_username = channel if channel.startswith("@") else f"@{channel}"
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/getChatMember"
    params = {"chat_id": channel_username, "user_id": telegram_id}
    
    try:
        response = requests.get(url, params=params, timeout=10)
        res_data = response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Telegram API Error: {str(e)}")
    
    if not res_data.get("ok"):
        return {"status": "failed", "message": "Gagal memverifikasi keanggotaan channel."}
    
    member_status = res_data.get("result", {}).get("status")
    valid_statuses = ["creator", "administrator", "member"]
    
    if member_status not in valid_statuses:
        return {"status": "not_joined", "message": "User belum bergabung ke channel."}
    
    try:
        tasks_collection.insert_one({
            "telegram_id": telegram_id,
            "task_id": task_id,
            "timestamp": time.time()
        })
    except Exception:
        pass
    
    return {"status": "success", "message": "Verifikasi channel berhasil!"}

@app.get("/get-user")
def get_user(init_data: str = Query(...)):
    user_data = verify_telegram_data(init_data)
    if not user_data:
        return {"status": "unauthorized", "user": {"balance": 0}}
    
    telegram_id = user_data.get("id")
    if users_collection is None:
        return {"status": "error", "user": {"balance": 0}}
    
    user_doc = users_collection.find_one({"telegram_id": telegram_id})
    if user_doc:
        return {"status": "success", "user": user_doc}
    
    return {"status": "not_found", "user": {"telegram_id": telegram_id, "balance": 0}}

@app.post("/api/sync")
def sync_user_data(payload: dict):
    telegram_id = payload.get("telegram_id")
    if not telegram_id or telegram_id == "unknown":
        return {"success": False, "message": "Invalid user ID"}
    
    if users_collection is None:
        return {"success": False, "message": "Database error"}
    
    users_collection.update_one(
        {"telegram_id": telegram_id},
        {"$set": {
            "username": payload.get("username"),
            "balance": payload.get("bgram_balance"),
            "ton_balance": payload.get("ton_balance"),
            "friends_count": payload.get("friends_count"),
            "friends_reward": payload.get("friends_reward"),
            "last_updated": payload.get("timestamp")
        }},
        upsert=True
    )
    return {"success": True, "message": "Data synced successfully"}

# --- FUNGSI NOTIFIKASI PENARIKAN KE ADMIN ---
def notify_admin_withdrawal(username, telegram_id, wallet, amount):
    message = (
        f"🚨 *KONFIRMASI PENARIKAN TON VALID!* 🚨\n\n"
        f"👤 Username: @{username}\n"
        f"🆔 Telegram ID: `{telegram_id}`\n"
        f"💰 Jumlah Valid: *{amount} TON*\n"
        f"👛 Alamat Dompet: `{wallet}`\n\n"
        f"✅ Status: Lolos validasi anti-bot, saldo, & task. Silakan transfer TON secara manual."
    )
    
    bot_token = os.getenv("BOT_TOKEN", "")
    admin_id = os.getenv("ADMIN_TELEGRAM_ID", "")
    
    if not bot_token or not admin_id:
        return
        
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": admin_id,
        "text": message,
        "parse_mode": "Markdown"
    }
    
    try:
        requests.post(url, json=payload)
    except Exception as e:
        print(f"Gagal mengirim notifikasi ke Telegram: {e}")
