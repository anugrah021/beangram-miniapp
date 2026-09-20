import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List

# --- INISIALISASI UTAMA VERCEL ---
app = FastAPI()

# --- KONFIGURASI CORS AGAR TIDAK DIBLOKIR ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- FUNGSI DASAR PENGIRIM TELEGRAM ---
def send_telegram_notification(message: str):
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    admin_chat_id = os.getenv("ADMIN_CHAT_ID")
    if not bot_token or not admin_chat_id:
        return None
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": admin_chat_id,
        "text": message,
        "parse_mode": "Markdown"
    }
    try:
        response = requests.post(url, json=payload)
        return response.json()
    except Exception as e:
        print(f"Gagal mengirim pesan Telegram: {e}")
        return None

# --- ROUTE UTAMA CEK SERVER ---
@app.get("/")
def read_root():
    return {"status": "success", "message": "BeanGram Backend API is running successfully!"}


# --- MODEL DATA UNTUK WITHDRAW ---
class WithdrawRequest(BaseModel):
    user_id: str
    username: str
    amount: str


# --- ENDPOINT API PENARIKAN (WITHDRAW) ---
@app.post("/api/withdraw")
def handle_withdraw(data: WithdrawRequest):
    try:
        # Menyusun format pesan notifikasi untuk Admin
        message = (
            f"🚨 **NOTIFIKASI WITHDRAW MASUK!** 🚨\n\n"
            f"👤 Dari User: @{data.username}\n"
            f"🆔 Telegram ID: `{data.user_id}`\n"
            f"💰 Nominal: {data.amount}\n\n"
            f"Status: Menunggu verifikasi admin."
        )

        # Mengirim pesan langsung ke Telegram Admin
        res = send_telegram_notification(message)
        
        if res and res.get("ok"):
            return {"success": True}
        else:
            return {"success": False, "error": "Gagal mengirim pesan ke Telegram Bot API. Periksa kembali Token/Chat ID."}

    except Exception as e:
        return {"success": False, "error": str(e)}
