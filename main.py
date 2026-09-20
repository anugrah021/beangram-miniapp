import os
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

# Mengambil Token Bot dan ID Admin dari Environment Variables Vercel
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
ADMIN_CHAT_ID = os.environ.get("ADMIN_CHAT_ID")  # ID Telegram Anda tempat notifikasi masuk

@app.route('/api/withdraw', methods=['POST'])
def handle_withdraw():
    try:
        data = request.get_json()
        
        # Memastikan sinyal klik dari app.js diterima
        if data and data.get("action") == "withdraw_clicked":
            
            # Otak kendali (main.py) meracik data notifikasi secara mandiri
            pesan_admin = (
                "🚨 *NOTIFIKASI PENARIKAN BARU* 🚨\n\n"
                "👤 *Status:* User mengajukan Withdraw\n"
                "💰 *Jumlah:* 24.0 BGRAM (Contoh)\n"
                "⚡ *Sinyal:* Berhasil diterima oleh Otak Backend Vercel!"
            )
            
            # Mengirim perintah langsung ke API Telegram untuk membunyikan chat admin
            if TELEGRAM_BOT_TOKEN and ADMIN_CHAT_ID:
                tg_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
                payload = {
                    "chat_id": ADMIN_CHAT_ID,
                    "text": pesan_admin,
                    "parse_mode": "Markdown"
                }
                requests.post(tg_url, json=payload)
            
            # Memberikan respons sukses kembali ke app.js
            return jsonify({
                "success": True,
                "message": "Permintaan penarikan diproses oleh otak kendali!"
            })
            
        return jsonify({"success": False, "error": "Aksi tidak dikenal"}), 400

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
