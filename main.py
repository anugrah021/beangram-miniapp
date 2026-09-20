import os
import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
ADMIN_CHAT_ID = os.environ.get("ADMIN_CHAT_ID")

class WithdrawRequest(BaseModel):
    action: str = None

@app.post("/api/withdraw")
async def handle_withdraw(req: WithdrawRequest):
    try:
        if req.action == "withdraw_clicked":
            pesan_admin = (
                "🚨 *NOTIFIKASI PENARIKAN BGRAM* 🚨\n\n"
                "👤 *Status:* Tombol Withdraw diklik di Mini App!\n"
                "⚡ *Keterangan:* Otak kendali FastAPI berhasil menerima sinyal."
            )
            
            if TELEGRAM_BOT_TOKEN and ADMIN_CHAT_ID:
                tg_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
                payload = {
                    "chat_id": ADMIN_CHAT_ID,
                    "text": pesan_admin,
                    "parse_mode": "Markdown"
                }
                requests.post(tg_url, json=payload)
            
            return {
                "success": True,
                "message": "Notifikasi berhasil dikirim oleh otak kendali FastAPI!"
            }
            
        raise HTTPException(status_code=400, detail="Aksi tidak dikenal")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
