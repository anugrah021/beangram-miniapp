import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List

app = FastAPI()

# Konfigurasi Bot Telegram
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "MASUKKAN_TOKEN_BOT_ANDA_DI_SINI")
ADMIN_CHAT_ID = os.getenv("ADMIN_CHAT_ID", "MASUKKAN_CHAT_ID_ANDA_DI_SINI")

# Konfigurasi Wallet Penampung Platform
ADMIN_WALLET_ADDRESS = "UQA5G6EPp1zQDT7baczs2CNWSmsfKbE37Ep7jFABLCNk-2Fa"
TONCENTER_API_URL = "https://toncenter.com/api/v2/getTransactions"

# Konfigurasi CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === DATABASE SERVER ===
users_db: Dict[str, Dict[str, Any]] = {}
campaigns_db: List[dict] = []

# === FUNGSI PENGIRIM NOTIFIKASI KE BOT TELEGRAM ===
def send_telegram_notification(message: str):
    if TELEGRAM_BOT_TOKEN == "MASUKKAN_TOKEN_BOT_ANDA_DI_SINI":
        return False
        
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": ADMIN_CHAT_ID,
        "text": message,
        "parse_mode": "Markdown"
    }
    try:
        response = requests.post(url, json=payload)
        return response.json()
    except Exception as e:
        print(f"Gagal mengirim pesan Telegram: {e}")
        return None

@app.get("/")
def read_root():
    return {"status": "success", "message": "BeanGram Backend API is running successfully!"}
class TaskRequest(BaseModel):
    telegram_id: str
    task_number: int

@app.get("/api/get-user")
def get_user(telegram_id: str):
    if telegram_id not in users_db:
        users_db[telegram_id] = {
            "id": telegram_id,
            "bgramBalance": 0.0,
            "tonBalance": 0.0,
            "completedTasksCount": 0,
            "completedTaskIds": []
        }
    
    user_data = users_db[telegram_id]
    return {
        "success": True,
        "bgramBalance": user_data["bgramBalance"],
        "tonBalance": user_data["tonBalance"],
        "completedTasksCount": user_data["completedTasksCount"],
        "completedTaskIds": user_data["completedTaskIds"],
        "referralCount": 0,
        "referralEarnings": 0.0
    }

@app.post("/api/complete-task")
def complete_task(data: TaskRequest):
    t_id = data.telegram_id
    task_no = data.task_number

    if t_id not in users_db:
        users_db[t_id] = {
            "id": t_id,
            "bgramBalance": 0.0,
            "tonBalance": 0.0,
            "completedTasksCount": 0,
            "completedTaskIds": []
        }

    user_data = users_db[t_id]

    if task_no in user_data["completedTaskIds"]:
        raise HTTPException(status_code=400, detail="Task already completed!")

    reward_bgram = 5.0 if task_no == 1 else (3.0 if task_no == 2 else 1.0)
    reward_ton = 0.01

    user_data["bgramBalance"] += reward_bgram
    user_data["tonBalance"] += reward_ton
    user_data["completedTasksCount"] += 1
    user_data["completedTaskIds"].append(task_no)

    return {
        "success": True,
        "message": f"Task {task_no} verified successfully!",
        "bgramBalance": user_data["bgramBalance"],
        "tonBalance": user_data["tonBalance"],
        "completedTasksCount": user_data["completedTasksCount"],
        "completedTaskIds": user_data["completedTaskIds"]
    }

class AdRequest(BaseModel):
    telegram_id: str
    social_link: str
    title: str
    target_members: int
    total_cost: float
    ton_address: str

class BotPaymentVerifyRequest(BaseModel):
    campaign_id: str
    status: str

@app.post("/api/submit-ad")
def submit_ad(data: AdRequest):
    if not data.social_link or ("t.me/" not in data.social_link and "http" not in data.social_link):
        return {"success": False, "message": "Invalid social media link format!"}

    if not data.title:
        return {"success": False, "message": "Campaign title cannot be empty!"}

    if data.target_members < 10:
        return {"success": False, "message": "Minimum target is 10 active users!"}

    campaign_id = f"CAMP_{len(campaigns_db) + 1}_{data.telegram_id}"

    new_campaign = {
        "campaign_id": campaign_id,
        "telegram_id": data.telegram_id,
        "social_link": data.social_link,
        "title": data.title,
        "target_members": data.target_members,
        "total_cost": data.total_cost,
        "status": "pending"
    }
    
    campaigns_db.append(new_campaign)

    notif_msg = (
        f"📢 *PENGAJUAN IKLAN BARU (PENDING)*\n\n"
        f"👤 ID User: `{data.telegram_id}`\n"
        f"🔗 Link: {data.social_link}\n"
        f"📌 Judul: {data.title}\n"
        f"🎯 Target: {data.target_members} User\n"
        f"💎 Biaya: {data.total_cost} TON\n"
        f"🆔 Campaign ID: `{campaign_id}`\n\n"
        f"_Silakan cek mutasi dompet TON Anda. Jika sudah masuk, verifikasi via sistem._"
    )
    send_telegram_notification(notif_msg)

    return {
        "success": True,
        "message": "Campaign submitted successfully. Waiting for payment verification.",
        "campaign_id": campaign_id
    }

@app.get("/api/get-active-ads")
def get_active_ads():
    active_ads = [camp for camp in campaigns_db if camp["status"] == "active"]
    return {
        "success": True,
        "ads": active_ads
    }

class CampaignSubmitRequest(BaseModel):
    telegram_id: str
    social_link: str
    title: str
    target_members: int
    total_cost: float
    campaign_id: str

@app.post("/api/submit-and-verify-advertisement")
async def submit_and_verify_advertisement(data: CampaignSubmitRequest):
    try:
        params = {
            "address": ADMIN_WALLET_ADDRESS,
            "limit": 30,
            "archival": True
        }
        response = requests.get(TONCENTER_API_URL, params=params)
        res_data = response.json()

        if not res_data.get("ok"):
            return {
                "success": False,
                "message": "Gagal terhubung ke jaringan blockchain explorer. Silakan coba beberapa saat lagi."
            }

        transactions = res_data.get("result", [])
        is_paid = False
        paid_amount = 0.0

        for tx in transactions:
            in_msg = tx.get("in_msg", {})
            if in_msg:
                value_nano = int(in_msg.get("value", 0))
                value_ton = value_nano / 1_000_000_000

                if value_ton >= data.total_cost:
                    is_paid = True
                    paid_amount = value_ton
                    break

        if is_paid:
            new_campaign = {
                "campaign_id": data.campaign_id,
                "telegram_id": data.telegram_id,
                "social_link": data.social_link,
                "title": data.title,
                "target_members": data.target_members,
                "total_cost": paid_amount,
                "status": "active"
            }
            campaigns_db.append(new_campaign)

            return {
                "success": True,
                "message": f"Transaksi {paid_amount} TON terdeteksi sah di blockchain! Iklan otomatis dipublikasikan ke menu Earn.",
                "campaign": new_campaign
            }
        else:
            return {
                "success": False,
                "message": "Pembayaran gagal. Belum ada transaksi masuk dengan nominal yang sesuai di blockchain wallet admin."
            }

    except Exception as e:
        return {
            "success": False,
            "message": f"Terjadi kesalahan pada sistem backend: {str(e)}"
        }
