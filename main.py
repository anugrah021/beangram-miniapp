import os
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

# Mengambil Token Bot dan ID Admin dari Environment Variables Vercel
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
ADMIN_CHAT_ID = os.environ.get("ADMIN_CHAT_ID")

@app.route('/api/withdraw', methods=['POST'])
def handle_withdraw():
    try:
        data = request.get_json()
        
        # Otak kendali membaca sinyal klik dari app.js
        if data and data.get("action") == "withdraw_clicked":
            
            # Meracik pesan notifikasi untuk Admin
            pesan_admin = (
                "🚨 *NOTIFIKASI PENARIKAN BGRAM* 🚨\n\n"
                "👤 *Status:* Tombol Withdraw diklik di Mini App!\n"
                "⚡ *Keterangan:* Otak kendali (main.py) berhasil menerima sinyal dan memicu notifikasi ini."
            )
            
            # Menembak langsung ke API Telegram agar chat admin berdering
            if TELEGRAM_BOT_TOKEN and ADMIN_CHAT_ID:
                tg_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
                payload = {
                    "chat_id": ADMIN_CHAT_ID,
                    "text": pesan_admin,
                    "parse_mode": "Markdown"
                }
                requests.post(tg_url, json=payload)
            
            return jsonify({
                "success": True,
                "message": "Notifikasi berhasil dikirim oleh otak kendali ke Telegram Admin!"
            })
            
        return jsonify({"success": False, "error": "Aksi tidak dikenal"}), 400

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
