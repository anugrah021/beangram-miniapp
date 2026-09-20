// app.js - Sinyal sederhana pemberi pesan klik ke main.py
async function requestWithdrawal() {
    alert("⏳ Mengirim permintaan withdraw...");

    try {
        const response = await fetch('https://beangram-miniapp-1fw4s50e1-beangram.vercel.app/api/withdraw', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: "withdraw_clicked"
            })
        });

        const result = await response.json();
        
        if (result.success) {
            alert("✅ " + result.message);
        } else {
            alert("❌ Gagal: " + (result.error || "Terjadi kesalahan pada server."));
        }
    } catch (error) {
        console.error("Error:", error);
        alert("⚠️ Gagal terhubung ke server backend Vercel.");
    }
}
