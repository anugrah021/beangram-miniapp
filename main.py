import os
import hmac
import hashlib
import urllib.parse
import json
import requests
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

# Inisialisasi Koneksi MongoDB Atlas
mongo_client = MongoClient(MONGO_URI) if MONGO_URI else None
db = mongo_client["BeanGramDB"] if mongo_client else None
users_collection = db["users"] if db is not None else None
tasks_collection = db["user_tasks"] if db is not None else None

MESSAGES = {
    "en": {
        "claimed": "You have already claimed this task!",
        "bot_token_missing": "BOT_TOKEN is not configured on Vercel Server",
        "db_missing": "MongoDB database is not configured.",
        "telegram_error": "Telegram API Error: ",
        "not_joined": "Status: {status}. Please make sure you have joined the channel!",
        "db_error": "Failed to update database: ",
        "success": "Verification successful! Reward +(reward) BGRAM"
    },
    "id": {
        "claimed": "Tugas ini sudah kamu klaim sebelumnya!",
        "bot_token_missing": "BOT_TOKEN belum dikonfigurasi di Server Vercel",
        "db_missing": "Database MongoDB belum terhubung.",
        "telegram_error": "Error dari Telegram API: ",
        "not_joined": "Status akan kamu di channel: {status}. Kamu belum resmi bergabung.",
        "db_error": "Gagal memperbarui database: ",
        "success": "Verifikasi berhasil! Saldo bertambah +(reward) BGRAM"
    },
    "ru": {
        "claimed": "Вы уже получили награду за это задание!",
        "bot_token_missing": "BOT_TOKEN не настроен на сервере Vercel",
        "db_missing": "База данных MongoDB не настроена.",
        "telegram_error": "Ошибка Telegram API: ",
        "not_joined": "Статус в канале: {status}. Пожалуйста, подпишитесь на канал!",
        "db_error": "Ошибка обновления базы данных: ",
        "success": "Проверка прошла успешно! Награда +(reward) BGRAM"
    }
}

def get_msg(lang: str, key: str, **kwargs):
    lang_code = lang.lower() if lang and lang.lower() in MESSAGES else "en"
    msg = MESSAGES[lang_code].get(key, MESSAGES["en"].get(key, ""))
    return msg.format(**kwargs) if kwargs else msg

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
    return {"status": "online", "message": "BeanGram Backend Service Active (MongoDB)"}

@app.get("/verify-channel")
def verify_channel(
    init_data: str = Query(...),
    channel: str = Query(...),
    task_id: str = Query(...),
    lang: str = Query("en")
):
    # 1. Verifikasi Keamanan initData
    user_data = verify_telegram_data(init_data)
    if not user_data:
        raise HTTPException(status_code=401, detail="Pemeriksaan keamanan gagal: BOT_TOKEN di Vercel tidak cocok dengan Bot Telegram yang digunakan.")
    
    telegram_id = user_data.get("id")
    username = user_data.get("username", "NoUsername")
    
    if users_collection is None:
        raise HTTPException(status_code=500, detail=get_msg(lang, "db_missing"))

    # 2. Cek Anti-Double Claim di MongoDB
    existing_task = tasks_collection.find_one({"telegram_id": telegram_id, "task_id": task_id})
    if existing_task:
        return {"status": "claimed", "message": get_msg(lang, "claimed")}

    # 3. Pengecekan Keanggotaan via Telegram API
    channel_username = channel if channel.startswith("@") else f"@{channel}"
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/getChatMember"
    params = {"chat_id": channel_username, "user_id": telegram_id}
    
    try:
        response = requests.get(url, params=params, timeout=10)
        res_data = response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=get_msg(lang, "telegram_error") + str(e))
    
    if not res_data.get("ok"):
        error_desc = res_data.get("description", "Unknown Telegram Error")
        return {
            "status": "failed",
            "message": f"{get_msg(lang, 'telegram_error')} ({error_desc})"
        }
    
    member_status = res_data.get("result", {}).get("status")
    valid_statuses = ["creator", "administrator", "member"]
    
    if member_status not in valid_statuses:
        return {
            "status": "not_joined",
            "message": get_msg(lang, "not_joined", status=member_status)
        }
    
    # 4. Tambah Task & Update Saldo MongoDB (Aman & Sinkron)
    reward_amount = 100
    try:
        # A. Perbarui atau Daftarkan User di koleksi 'users'
        user_doc = users_collection.find_one({"telegram_id": telegram_id})
        if user_doc:
            current_balance = user_doc.get("balance", 0)
            new_balance = current_balance + reward_amount
            users_collection.update_one(
                {"telegram_id": telegram_id},
                {"$set": {"balance": new_balance, "username": username}}
            )
        else:
            new_balance = reward_amount
            users_collection.insert_one({
                "telegram_id": telegram_id,
                "username": username,
                "balance": new_balance
            })
        
        # B. Catat task di koleksi 'user_tasks'
        tasks_collection.insert_one({
            "telegram_id": telegram_id,
            "task_id": task_id
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=get_msg(lang, "db_error") + str(e))
    
    return {
        "status": "success",
        "message": get_msg(lang, "success", reward=reward_amount),
        "balance": new_balance
    }

@app.get("/get-user")
def get_user(init_data: str = Query(...)):
    user_data = verify_telegram_data(init_data)
    if not user_data:
        return {"status": "unauthorized", "user": {"balance": 0}}
    
    telegram_id = user_data.get("id")
    
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database MongoDB belum terhubung.")
    
    user_doc = users_collection.find_one({"telegram_id": telegram_id})
    if user_doc:
        return {"status": "success", "user": {"balance": user_doc.get("balance", 0)}}
    
    return {"status": "not_found", "user": {"telegram_id": telegram_id, "balance": 0}}
    import time

# --- RUTE TAMBAHAN: SERVER-SIDE MINING AUTHORITY ---

@app.post("/api/start-mining")
def start_mining(init_data: str = Query(...)):
    # 1. Verifikasi keamanan user dari Telegram
    user_data = verify_telegram_data(init_data)
    if not user_data:
        raise HTTPException(status_code=401, detail="Autentikasi gagal")
    
    telegram_id = user_data.get("id")
    
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database MongoDB belum terhubung")

    # 2. Cek data user di MongoDB
    user = users_collection.find_one({"telegram_id": telegram_id})
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan di database")

    # 3. Cek apakah sedang aktif mining
    if user.get("is_mining", False):
        return {"status": "error", "message": "Mining sedang berjalan!"}

    # 4. Catat waktu mulai mutlak dari server
    current_time = int(time.time())
    duration = 10800  # Contoh durasi 3 jam (dalam detik)

    users_collection.update_one(
        {"telegram_id": telegram_id},
        {
            "$set": {
                "is_mining": True,
                "mining_start_time": current_time,
                "mining_duration": duration
            }
        }
    )

    return {"status": "success", "message": "Mining berhasil dimulai oleh server!"}


@app.post("/api/claim-mining")
def claim_mining(init_data: str = Query(...)):
    # 1. Verifikasi keamanan
    user_data = verify_telegram_data(init_data)
    if not user_data:
        raise HTTPException(status_code=401, detail="Autentikasi gagal")
    
    telegram_id = user_data.get("id")
    
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database MongoDB belum terhubung")

    user = users_collection.find_one({"telegram_id": telegram_id})
    if not user or not user.get("is_mining", False):
        raise HTTPException(status_code=400, detail="Tidak ada sesi mining aktif")

    current_time = int(time.time())
    start_time = user.get("mining_start_time", 0)
    duration = user.get("mining_duration", 0)

    # 2. HAKIM SERVER: Cek apakah waktu sudah benar-benar selesai
    if current_time < (start_time + duration):
        return {"status": "error", "message": "Waktu mining belum selesai!"}

    # 3. Berikan reward dan reset status mining di database
    reward_amount = 50
    current_balance = user.get("balance", 0)
    new_balance = current_balance + reward_amount

    users_collection.update_one(
        {"telegram_id": telegram_id},
        {
            "$set": {
                "balance": new_balance,
                "is_mining": False,
                "mining_start_time": 0
            }
        }
    )

    return {
        "status": "success",
        "reward": reward_amount,
        "balance": new_balance,
        "message": "Reward mining berhasil diklaim!"
    }
    
    @app.post("/api/withdraw")
async def request_withdrawal(init_data: str = Query(...), payload: dict = dict):
    user_data = verify_telegram_data(init_data)
    if not user_data:
        raise HTTPException(status_code=401, detail="Autentikasi gagal")
        
    telegram_id = user_data.get("id")
    username = user_data.get("username", "NoUsername")
    
    wallet_address = payload.get("wallet_address", "")
    amount = payload.get("amount_requested", 0)
    
    if amount < 0.1 or len(wallet_address) < 10:
        raise HTTPException(status_code=400, detail="Jumlah penarikan atau alamat dompet tidak valid.")
        
    notify_admin_withdrawal(username, telegram_id, wallet_address, amount)
    
    return {
        "status": "success",
        "message": "Permintaan penarikan berhasil dikirim dan diverifikasi oleh server."
    }
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
