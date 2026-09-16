import os
import hmac
import hashlib
import urllib.parse
import json
import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BOT_TOKEN = os.getenv("BOT_TOKEN")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

MESSAGES = {
    "en": {
        "claimed": "You have already claimed this task!",
        "bot_token_missing": "BOT_TOKEN is not configured on Vercel Server",
        "db_missing": "Supabase database is not configured",
        "telegram_error": "Telegram API Error: ",
        "not_joined": "Status: {status}. Please make sure you have joined the channel!",
        "db_error": "Failed to update database: ",
        "success": "Verification successful! Reward +{reward} BGRAM"
    },
    "id": {
        "claimed": "Tugas ini sudah kamu klaim sebelumnya!",
        "bot_token_missing": "BOT_TOKEN belum dikonfigurasi di Server Vercel",
        "db_missing": "Database Supabase belum dikonfigurasi",
        "telegram_error": "Error dari Telegram API: ",
        "not_joined": "Status akun kamu di channel: '{status}'. Kamu belum resmi bergabung!",
        "db_error": "Gagal memperbarui database: ",
        "success": "Verifikasi berhasil! Saldo bertambah +{reward} BGRAM"
    },
    "ru": {
        "claimed": "Вы уже получили награду за это задание!",
        "bot_token_missing": "BOT_TOKEN не настроен на сервере Vercel",
        "db_missing": "База данных Supabase не настроена",
        "telegram_error": "Ошибка Telegram API: ",
        "not_joined": "Статус в канале: '{status}'. Пожалуйста, подпишитесь на канал!",
        "db_error": "Ошибка обновления базы данных: ",
        "success": "Проверка прошла успешно! Награда +{reward} BGRAM"
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
    return {"status": "online", "message": "BeanGram Backend Service Active"}

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
        raise HTTPException(
            status_code=401, 
            detail="Pemeriksaan keamanan gagal! BOT_TOKEN di Vercel tidak cocok dengan Bot Telegram yang digunakan."
        )

    telegram_id = user_data.get("id")
    username = user_data.get("username", "NoUsername")

    if not supabase:
        raise HTTPException(status_code=500, detail=get_msg(lang, "db_missing"))

    # 2. Cek Anti-Double Claim
    task_check = supabase.table("user_tasks").select("*").eq("telegram_id", telegram_id).eq("task_id", task_id).execute()
    if task_check.data:
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
            "message": f"{get_msg(lang, 'telegram_error')} {error_desc}"
        }

    member_status = res_data.get("result", {}).get("status")
    valid_statuses = ["creator", "administrator", "member"]

    if member_status not in valid_statuses:
        return {
            "status": "not_joined", 
            "message": get_msg(lang, "not_joined", status=member_status)
        }

    # 4. Tambah Task & Update Saldo Supabase (Urutan Diperbaiki: Buat User dulu baru Simpan Task)
    reward_amount = 100
    
    try:
        # A. Daftarkan / perbarui user di tabel 'users'
        user_check = supabase.table("users").select("*").eq("telegram_id", telegram_id).execute()
        
        if user_check.data:
            current_balance = user_check.data[0].get("balance", 0)
            new_balance = current_balance + reward_amount
            supabase.table("users").update({"balance": new_balance, "username": username}).eq("telegram_id", telegram_id).execute()
        else:
            new_balance = reward_amount
            supabase.table("users").insert({
                "telegram_id": telegram_id,
                "username": username,
                "balance": new_balance
            }).execute()

        # B. Catat task di tabel 'user_tasks'
        supabase.table("user_tasks").insert({
            "telegram_id": telegram_id,
            "task_id": task_id
        }).execute()

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

    if not supabase:
        raise HTTPException(status_code=500, detail="Database Supabase belum terhubung")

    res = supabase.table("users").select("*").eq("telegram_id", telegram_id).execute()
    if res.data:
        return {"status": "success", "user": res.data[0]}
    return {"status": "not_found", "user": {"telegram_id": telegram_id, "balance": 0}}
