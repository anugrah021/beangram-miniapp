from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any

app = FastAPI()

import os
import requests

# Konfigurasi Bot Telegram (Akan membaca dari environment variable Vercel secara aman)
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "MASUKKAN_TOKEN_BOT_ANDA_DI_SINI")
ADMIN_CHAT_ID = os.getenv("ADMIN_CHAT_ID", "MASUKKAN_CHAT_ID_ANDA_DI_SINI")

# === FUNGSI PENGIRIM NOTIFIKASI KE BOT TELEGRAM ===
def send_telegram_notification(message: str):
    if TELEGRAM_BOT_TOKEN == "MASUKKAN_TOKEN_BOT_ANDA_DI_SINI":
        return False  # Lewati jika token belum diatur
        
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

# Konfigurasi CORS agar frontend (game.html / app.js) bisa berkomunikasi dengan aman
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === DATABASE SEMENTARA DI SERVER (IN-MEMORY STORAGE) ===
# Menyimpan data pengguna berdasarkan telegram_id
users_db: Dict[str, Dict[str, Any]] = {}

# Model data yang dikirim dari app.js saat menyelesaikan task
class TaskRequest(BaseModel):
    telegram_id: str
    task_number: int

@app.get("/")
def read_root():
    return {"status": "success", "message": "BeanGram Backend API is running successfully!"}

# === 1. ENDPOINT: MENGAMBIL DATA USER & STATUS TASK ===
@app.get("/api/get-user")
def get_user(telegram_id: str):
    # Jika user belum ada di database server, buatkan profil default
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

# === 2. ENDPOINT: MEMPROSES PENYELESAIAN TASK & MENGIRIM KEPUTUSAN KE APP.JS ===
@app.post("/api/complete-task")
def complete_task(data: TaskRequest):
    t_id = data.telegram_id
    task_no = data.task_number

    # Inisialisasi jika user baru
    if t_id not in users_db:
        users_db[t_id] = {
            "id": t_id,
            "bgramBalance": 0.0,
            "tonBalance": 0.0,
            "completedTasksCount": 0,
            "completedTaskIds": []
        }

    user_data = users_db[t_id]

    # Validasi Anti-Cheat: Cek apakah task sudah pernah diselesaikan
    if task_no in user_data["completedTaskIds"]:
        raise HTTPException(status_code=400, detail="Task already completed!")

    # Tentukan reward berdasarkan nomor task (Sinkron dengan app.js & game.html)
    # Task 1: +5.0 BGRAM & +0.01 TON
    # Task 2: +3.0 BGRAM & +0.01 TON
    reward_bgram = 5.0 if task_no == 1 else (3.0 if task_no == 2 else 1.0)
    reward_ton = 0.01

    # Update data di database server
    user_data["bgramBalance"] += reward_bgram
    user_data["tonBalance"] += reward_ton
    user_data["completedTasksCount"] += 1
    user_data["completedTaskIds"].append(task_no)

    # Kirim balik keputusan/data terbaru ke app.js secara instan
    return {
        "success": True,
        "message": f"Task {task_no} verified successfully!",
        "bgramBalance": user_data["bgramBalance"],
        "tonBalance": user_data["tonBalance"],
        "completedTasksCount": user_data["completedTasksCount"],
        "completedTaskIds": user_data["completedTaskIds"]
    }

from typing import List

# === DATABASE & MODEL UNTUK MENU ADVERTISE ===
# Database sementara untuk menyimpan daftar iklan/kampanye
campaigns_db: List[dict] = []

# Model data yang dikirim dari app.js saat submit iklan
class AdRequest(BaseModel):
    telegram_id: str
    social_link: str
    title: str
    target_members: int
    total_cost: float
    ton_address: str

# Model data untuk webhook / keputusan dari Bot Telegram (Payment Bridge)
class BotPaymentVerifyRequest(BaseModel):
    campaign_id: str
    status: str  # "success" atau "failed"

# === 1. ENDPOINT: MENERIMA & MEMVALIDASI PENGAJUAN IKLAN ===
@app.post("/api/submit-ad")
def submit_ad(data: AdRequest):
    # Validasi 1: Cek apakah link sosial media valid
    if not data.social_link or ("t.me/" not in data.social_link and "http" not in data.social_link):
        return {"success": False, "message": "Invalid social media link format!"}

    # Validasi 2: Cek apakah judul kosong
    if not data.title:
        return {"success": False, "message": "Campaign title cannot be empty!"}

    # Validasi 3: Cek target member minimal 10 aktif
    if data.target_members < 10:
        return {"success": False, "message": "Minimum target is 10 active users!"}

    # Buat ID unik untuk kampanye iklan
    campaign_id = f"CAMP_{len(campaigns_db) + 1}_{data.telegram_id}"

    # Simpan data iklan ke database dengan status "pending" (menunggu verifikasi bot pembayaran)
    new_campaign = {
        "campaign_id": campaign_id,
        "telegram_id": data.telegram_id,
        "social_link": data.social_link,
        "title": data.title,
        "target_members": data.target_members,
        "total_cost": data.total_cost,
        "status": "pending"  # Pending pembayaran diverifikasi bot
    }
    
    
    campaigns_db.append(new_campaign)

    # ---> KIRIM NOTIFIKASI OTOMATIS KE BOT TELEGRAM ANDA <---
    notif_msg = (
        f"📢 *PENGAJUAN IKLAN BARU (PENDING)*\n\n"
        f"🆔 ID User: `{data.telegram_id}`\n"
        f"🔗 Link: {data.social_link}\n"
        f"📌 Judul: {data.title}\n"
        f"👥 Target: {data.target_members} User\n"
        f"💰 Biaya: {data.total_cost} TON\n"
        f"🆔 Campaign ID: `{campaign_id}`\n\n"
        f"_Silakan cek mutasi dompet TON Anda. Jika sudah masuk, verifikasi via sistem._"
    )
    send_telegram_notification(notif_msg)

    # Kirim respon kembali ke app.js
    return {
        "success": True,
        "message": "Campaign submitted successfully. Waiting for payment verification.",
        "campaign_id": campaign_id
    }

# === 2. ENDPOINT: WEBHOOK / VERIFIKASI PEMBAYARAN DARI BOT TELEGRAM ===
@app.post("/api/verify-payment")
def verify_payment(data: BotPaymentVerifyRequest):
    # Cari kampanye iklan berdasarkan campaign_id
    target_campaign = None
    for camp in campaigns_db:
        if camp["campaign_id"] == data.campaign_id:
            target_campaign = camp
            break

    if not target_campaign:
        raise HTTPException(status_code=404, detail="Campaign not found!")

    # Jika bot telegram menyatakan pembayaran sukses/valid
    if data.status.lower() == "success":
        target_campaign["status"] = "active"
        return {
            "success": True,
            "message": f"Campaign {data.campaign_id} verified and activated successfully!"
        }
    else:
        # Jika pembayaran gagal atau tidak valid
        target_campaign["status"] = "rejected"
        return {
            "success": False,
            "message": f"Payment invalid. Campaign {data.campaign_id} rejected."
        }

# === 3. ENDPOINT: MENGAMBIL DAFTAR IKLAN AKTIF UNTUK MENU EARN ===
@app.get("/api/get-active-ads")
def get_active_ads():
    # Menyaring iklan yang statusnya sudah "active" (sudah dibayar & di-acc bot)
    active_ads = [camp for camp in campaigns_db if camp["status"] == "active"]
    return {
        "success": True,
        "ads": active_ads
    }

import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

ADMIN_WALLET_ADDRESS = "UQA5G6EPp1zQDT7baczs2CNWSmsfKbE37Ep7jFABLCNk-2Fa"
TONCENTER_API_URL = "https://toncenter.com/api/v2/getTransactions"

# Database sementara untuk menyimpan data kampanye iklan (bisa disesuaikan dengan database Anda)
campaigns_db = []

class CampaignSubmitRequest(BaseModel):
    telegram_id: str
    social_link: str
    title: str
    target_members: int
    total_cost: float
    campaign_id: str  # Digunakan juga sebagai Memo unik transfer TON

@app.post("/api/submit-and-verify-advertisement")
async def submit_and_verify_advertisement(data: CampaignSubmitRequest):
    try:
        # 1. Pindai riwayat transaksi masuk di blockchain wallet admin
        params = {
            "address": UQAg56EPp1zQDT7baczs2CNWSMsFkBE37EP7jFABLCMk-2Fa
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

        # 2. Cek langsung ke TX blockchain: Cocokkan nominal dan wallet pengirim
        for tx in transactions:
            in_msg = tx.get("in_msg", {})
            if in_msg:
                sender_address = in_msg.get("source", "") # Alamat wallet pengirim
                value_nano = int(in_msg.get("value", 0))
                value_ton = value_nano / 1_000_000_000  # Konversi NanoTON ke TON

                # Validasi langsung dari TX blockchain: 
                # Apakah nominalnya sesuai dengan total cost iklan?
                # (Opsional: Jika user melampirkan wallet pengirim di data request, bisa dicocokkan juga dengan sender_address)
                if value_ton >= data.total_cost:
                    is_paid = True
                    paid_amount = value_ton
                    break

        # 3. Keputusan Otomatis Berdasarkan Mutasi TX Blockchain
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
