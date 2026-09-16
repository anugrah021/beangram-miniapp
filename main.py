from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)  # Izinkan akses dari Mini App (GitHub Pages)

# MASUKKAN TOKEN BOT TELEGRAM KAMU DI SINI
BOT_TOKEN = "8923223484:AAGEGkiPm8HqCfPPalL5_QT1ATRceadgN6U"
CHANNEL_ID = "@BeanGram_Official"

@app.route("/")
def home():
    return jsonify({"status": "BeanGram Backend Server Active!"})

@app.route("/verify-channel")
def verify_channel():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Missing user_id"}), 400

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/getChatMember"
    params = {"chat_id": CHANNEL_ID, "user_id": user_id}

    try:
        res = requests.get(url, params=params).json()
        if res.get("ok"):
            status = res["result"]["status"]
            # Status sah jika user beneran sudah join channel
            if status in ["member", "administrator", "creator"]:
                return jsonify({"success": True, "message": "Verified! User is member."})

        return jsonify({"success": False, "message": "User has not joined the channel yet."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
