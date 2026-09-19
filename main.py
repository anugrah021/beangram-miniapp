from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any

app = FastAPI()

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
