import os
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

# Kamus Pesan Server 3 Bahasa (EN, ID, RU)
MESSAGES = {
    "en": {
        "claimed": "You have already claimed this task!",
        "bot_token_missing": "BOT_TOKEN is not configured on the server",
        "db_missing": "Supabase database is not configured",
        "telegram_error": "Failed to connect to Telegram API: ",
        "not_joined": "You have not joined the channel yet.",
        "failed": "Make sure you have joined the channel!",
        "db_error": "Failed to update database: ",
        "success": "Verification successful! Reward +{reward} BGRAM"
    },
    "id": {
        "claimed": "Tugas ini sudah kamu klaim sebelumnya!",
        "bot_token_missing": "BOT_TOKEN belum dikonfigurasi di Server",
        "db_missing": "Database Supabase belum dikonfigurasi",
        "telegram_error": "Gagal menghubungi Telegram API: ",
        "not_joined": "Kamu belum menjadi anggota channel.",
        "failed": "Pastikan kamu sudah bergabung ke channel!",
        "db_error": "Gagal memperbarui database: ",
        "success": "Verifikasi berhasil! Saldo bertambah +{reward} BGRAM"
    },
    "ru": {
        "claimed": "Вы уже получили награду за das задание!",
        "bot_token_missing": "BOT_TOKEN не настроен на сервере",
        "db_missing": "База данных Supabase не настроена",
        "telegram_error": "Не удалось связаться с Telegram API: ",
        "not_joined": "Вы еще не вступили в канал.",
        "failed": "Убедитесь, что вы вступили в канал!",
        "db_error": "Ошибка обновления базы данных: ",
        "success": "Проверка прошла успешно! Награда +{reward} BGRAM"
    }
}

def get_msg(lang: str, key: str, **kwargs):
    lang_code = lang.lower() if lang and lang.lower() in MESSAGES else "en"
    msg = MESSAGES[lang_code].get(key, MESSAGES["en"].get(key, ""))
    return msg.format(**kwargs) if kwargs else msg

@app.get("/")
def home():
    return {"status": "online", "message": "BeanGram Backend Service Running"}

@app.get("/verify-channel")
def verify_channel(
    telegram_id: int = Query(...), 
    username: str = Query(None), 
    channel: str = Query(...),
    task_id: str = Query(...),
    lang: str = Query("en")
):
    if not BOT_TOKEN:
        raise HTTPException(status_code=500, detail=get_msg(lang, "bot_token_missing"))
    
    if not supabase:
        raise HTTPException(status_code=500, detail=get_msg(lang, "db_missing"))

    # 1. Cek Anti Double Claim
    task_check = supabase.table("user_tasks").select("*").eq("telegram_id", telegram_id).eq("task_id", task_id).execute()
    if task_check.data:
        return {"status": "claimed", "message": get_msg(lang, "claimed")}

    # 2. Cek Keanggotaan Telegram
    channel_username = channel if channel.startswith("@") else f"@{channel}"
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/getChatMember"
    params = {"chat_id": channel_username, "user_id": telegram_id}

    try:
        response = requests.get(url, params=params, timeout=10)
        res_data = response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=get_msg(lang, "telegram_error") + str(e))

    if not res_data.get("ok"):
        return {"status": "failed", "message": get_msg(lang, "failed")}

    member_status = res_data.get("result", {}).get("status")
    valid_statuses = ["creator", "administrator", "member"]

    if member_status not in valid_statuses:
        return {"status": "not_joined", "message": get_msg(lang, "not_joined")}

    # 3. Simpan Task & Update Saldo
    reward_amount = 500
    
    try:
        supabase.table("user_tasks").insert({
            "telegram_id": telegram_id,
            "task_id": task_id
        }).execute()

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

    except Exception as e:
        raise HTTPException(status_code=500, detail=get_msg(lang, "db_error") + str(e))

    return {
        "status": "success",
        "message": get_msg(lang, "success", reward=reward_amount),
        "balance": new_balance
    }

@app.get("/get-user")
def get_user(telegram_id: int = Query(...)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database Supabase belum terhubung")

    res = supabase.table("users").select("*").eq("telegram_id", telegram_id).execute()
    if res.data:
        return {"status": "success", "user": res.data[0]}
    return {"status": "not_found", "user": {"telegram_id": telegram_id, "balance": 0}}
