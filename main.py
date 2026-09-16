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

@app.get("/")
def home():
    return {"status": "online", "message": "BeanGram Backend Service Running"}

@app.get("/verify-channel")
def verify_channel(
    telegram_id: int = Query(...), 
    username: str = Query(None), 
    channel: str = Query(...),
    task_id: str = Query(...)
):
    if not BOT_TOKEN:
        raise HTTPException(status_code=500, detail="BOT_TOKEN belum dikonfigurasi di Server")
    
    if not supabase:
        raise HTTPException(status_code=500, detail="Database Supabase belum dikonfigurasi")

    task_check = supabase.table("user_tasks").select("*").eq("telegram_id", telegram_id).eq("task_id", task_id).execute()
    if task_check.data:
        return {"status": "claimed", "message": "Tugas ini sudah kamu klaim sebelumnya!"}

    channel_username = channel if channel.startswith("@") else f"@{channel}"
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/getChatMember"
    params = {"chat_id": channel_username, "user_id": telegram_id}

    try:
        response = requests.get(url, params=params, timeout=10)
        res_data = response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menghubungi Telegram API: {str(e)}")

    if not res_data.get("ok"):
        return {"status": "failed", "message": "Pastikan kamu sudah bergabung ke channel!"}

    member_status = res_data.get("result", {}).get("status")
    valid_statuses = ["creator", "administrator", "member"]

    if member_status not in valid_statuses:
        return {"status": "not_joined", "message": "Kamu belum menjadi anggota channel."}

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
        raise HTTPException(status_code=500, detail=f"Gagal memperbarui database: {str(e)}")

    return {
        "status": "success",
        "message": f"Verifikasi berhasil! Saldo bertambah +{reward_amount} BGRAM",
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
