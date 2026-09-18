from fastapi import FastAPI

# Kerangka dasar FastAPI agar Vercel tidak error saat deployment
app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "success", "message": "BeanGram Backend API is running!"}

@app.post("/api/verify-task")
def verify_task():
    # Placeholder sementara untuk verifikasi task
    return {"success": True, "message": "Task verified successfully"}
