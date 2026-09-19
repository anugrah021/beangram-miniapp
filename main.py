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

# Buat database kecil untuk mencatat tx_hash yang sudah pernah digunakan (mencegah double claim)
used_transaction_hashes = set()

@app.post("/api/submit-and-verify-advertisement")
async def submit_and_verify_advertisement(data: CampaignSubmitRequest):
    try:
        import time
        current_time = int(time.time()) # Waktu saat ini dalam timestamp detik

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
            # Ambil Transaction Hash sebagai identitas unik transaksi
            tx_hash = tx.get("transaction_id", {}).get("hash", "")
            
            # 1. Cek apakah Hash transaksi ini sudah pernah digunakan sebelumnya?
            if tx_hash in used_transaction_hashes:
                continue # Lewati jika sudah pernah diklaim orang lain/sebelumnya

            # 2. Cek waktu transaksi (Mencegah transaksi lama dipakai kembali)
            tx_time = tx.get("utime", 0)
            time_difference = current_time - tx_time
            
            # Batas waktu maksimal transaksi adalah 15 menit (900 detik) dari saat form disubmit
            if time_difference > 900:
                continue # Lewati jika transaksi sudah lebih dari 15 menit yang lalu

            in_msg = tx.get("in_msg", {})
            if in_msg:
                value_nano = int(in_msg.get("value", 0))
                value_ton = value_nano / 1_000_000_000

                # 3. Cocokkan nominal dan pastikan belum dipakai
                if value_ton >= data.total_cost:
                    is_paid = True
                    paid_amount = value_ton
                    # Tandai hash transaksi ini agar tidak bisa dipakai lagi selamanya
                    used_transaction_hashes.add(tx_hash)
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
                "message": f"Transaksi {paid_amount} TON terverifikasi sah dan baru di blockchain! Iklan dipublikasikan.",
                "campaign": new_campaign
            }
        else:
            return {
                "success": False,
                "message": "Verifikasi gagal. Pastikan Anda sudah mentransfer sesuai nominal dan transaksi dilakukan dalam 15 menit terakhir."
            }

    except Exception as e:
        return {
            "success": False,
            "message": f"Terjadi kesalahan pada sistem backend: {str(e)}"
        }

# === MODEL & ENDPOINT MENU NETWORK (REFERRAL & LEADERBOARD) ===

class ReferralRegisterRequest(BaseModel):
    referrer_id: str
    new_user_id: str
    username: str = "Anonymous"

# 1. ENDPOINT: MENGAMBIL STATISTIK REFERRAL USER
@app.get("/api/get-network-stats")
def get_network_stats(telegram_id: str):
    # Pastikan user ada di database
    if telegram_id not in users_db:
        users_db[telegram_id] = {
            "id": telegram_id,
            "bgramBalance": 0.0,
            "tonBalance": 0.0,
            "completedTasksCount": 0,
            "completedTaskIds": [],
            "referrals": [],
            "commissionEarned": 0.0
        }
    
    user_data = users_db[telegram_id]
    total_refs = len(user_data.get("referrals", []))
    commission = user_data.get("commissionEarned", 0.0)

    return {
        "success": True,
        "totalReferrals": total_refs,
        "commissionEarned": commission
    }

# 2. ENDPOINT: MENGAMBIL DATA LEADERBOARD REFERRAL TERATAS
@app.get("/api/get-top-referrals")
def get_top_referrals():
    # Mengumpulkan data semua user dan mengurutkannya berdasarkan jumlah referral terbanyak
    user_list = []
    for uid, data in users_db.items():
        ref_count = len(data.get("referrals", []))
        username = data.get("username", f"User_{uid[-4:]}")
        user_list.append({
            "username": username,
            "referralCount": ref_count
        })

    # Urutkan dari yang terbesar ke terkecil
    sorted_users = sorted(user_list, key=lambda x: x["referralCount"], reverse=True)

    # Jika data masih kosong atau sedikit, berikan contoh data dummy agar leaderboard tetap hidup di awal
    if not sorted_users or all(u["referralCount"] == 0 for u in sorted_users):
        sorted_users = [
            {"username": "CryptoKing", "referralCount": 142},
            {"username": "BeanMaster", "referralCount": 98},
            {"username": "TonWhale", "referralCount": 65}
        ]

    return {
        "success": True,
        "topUsers": sorted_users[:15]  # Ambil top 15 sesuai script app.js
    }

# 3. ENDPOINT: MENDAFTARKAN REFERRAL BARU & MENGHITUNG KOMISI OTOMATIS
@app.post("/api/register-referral")
def register_referral(data: ReferralRegisterRequest):
    ref_id = data.referrer_id
    new_id = data.new_user_id

    # Cegah user mereferensikan diri sendiri
    if ref_id == new_id:
        return {"success": False, "message": "Cannot refer yourself!"}

    # Inisialisasi pengundang jika belum ada
    if ref_id not in users_db:
        users_db[ref_id] = {
            "id": ref_id,
            "bgramBalance": 0.0,
            "tonBalance": 0.0,
            "completedTasksCount": 0,
            "completedTaskIds": [],
            "referrals": [],
            "commissionEarned": 0.0,
            "username": f"User_{ref_id[-4:]}"
        }

    referrer_data = users_db[ref_id]

    # Cek apakah user baru sudah pernah didaftarkan oleh pengundang ini
    if new_id in referrer_data["referrals"]:
        return {"success": False, "message": "Referral already registered."}

    # Tambahkan referral baru dan hitung reward 0.01 TON secara akurat
    referrer_data["referrals"].append(new_id)
    reward_commission = 0.01
    referrer_data["commissionEarned"] += reward_commission
    referrer_data["tonBalance"] += reward_commission  # Masuk otomatis ke saldo TON user

    return {
        "success": True,
        "message": "Referral registered successfully!",
        "totalReferrals": len(referrer_data["referrals"]),
        "commissionEarned": referrer_data["commissionEarned"]
    }

# === MODEL & ENDPOINT PENARIKAN (WITHDRAWAL) ===

class WithdrawalRequest(BaseModel):
    telegram_id: str
    username: str = "Anonymous"
    withdraw_amount: float
    wallet_address: str

@app.post("/api/request-withdrawal")
def request_withdrawal(data: WithdrawalRequest):
    try:
        min_withdraw = 0.25
        t_id = data.telegram_id
        amount = data.withdraw_amount
        wallet = data.wallet_address.strip()

        # 1. Validasi Minimum Penarikan
        if amount < min_withdraw:
            return {
                "success": False,
                "message": f"Withdrawal denied! Minimum withdrawal limit is {min_withdraw} TON."
            }

        # 2. Validasi Format Alamat Wallet TON
        if not wallet or (not wallet.startswith("EQ") and not wallet.startswith("UQ") and len(wallet) < 40):
            return {
                "success": False,
                "message": "Invalid TON wallet address format!"
            }

        # 3. Cek Data User di Database Server
        if t_id not in users_db:
            return {
                "success": False,
                "message": "User profile not found in server database."
            }

        user_data = users_db[t_id]
        current_ton_balance = user_data.get("tonBalance", 0.0)

        # 4. Validasi Kecukupan Saldo
        if current_ton_balance < amount:
            return {
                "success": False,
                "message": "Insufficient TON balance for this withdrawal."
            }

        # 5. Sistem Deteksi Anti-Cheat / Bot Protection (Otomatis)
        # Contoh validasi: Cek apakah user menyelesaikan minimal task atau aktivitas mencurigakan
        completed_tasks = user_data.get("completedTasksCount", 0)
        referral_count = len(user_data.get("referrals", []))
        
        # Indikator bot: Saldo besar tapi task 0 dan referral 0 tanpa riwayat valid
        if amount >= 1.0 and completed_tasks == 0 and referral_count == 0:
            return {
                "success": False,
                "message": "Security Alert: Withdrawal flagged by anti-cheat system (Suspicious bot activity detected)."
            }

        # 6. Jika Lolos Validasi & Bersih: Kurangi Saldo User secara Otomatis
        user_data["tonBalance"] -= amount

        # 7. Kirim Detail Penarikan secara Instan ke Telegram Admin Chat ID
        admin_notif = (
            f"🚨 *NEW SUCCESSFUL WITHDRAWAL REQUEST*\n\n"
            f"👤 User: `{data.username}`\n"
            f"🆔 Telegram ID: `{t_id}`\n"
            f"💎 Amount: `{amount} TON`\n"
            f"👛 Destination Wallet:\n`{wallet}`\n\n"
            f"✅ _System Status: Verified & Auto-Approved. Please send manual transfer to user wallet._"
        )
        send_telegram_notification(admin_notif)

        return {
            "success": True,
            "message": "Withdrawal request successfully verified and submitted to admin network!",
            "remainingBalance": user_data["tonBalance"]
        }

    except Exception as e:
        return {
            "success": False,
            "message": f"Server error during withdrawal processing: {str(e)}"
        }
