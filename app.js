// Fungsi Kirim Permintaan Penarikan (Withdraw) ke Backend Vercel
async function requestWithdrawal() {
    // Mengambil data pengguna dari Telegram WebApp secara aman
    const tgUser = window.Telegram && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user;
    const username = tgUser ? tgUser.username || tgUser.first_name : "BGRAMERS_TestUser";
    const userId = tgUser ? tgUser.id : "75726";

    // Mengambil nilai saldo dari elemen HTML profil yang sudah ada
    const bgramVal = document.getElementById('profileBgramVal') ? document.getElementById('profileBgramVal').innerText : "24.0";
    const amountToWithdraw = bgramVal + " BGRAM";

    // Menampilkan pemberitahuan awal di layar
    alert("⏳ Mengirim permintaan withdraw ke server...");

    try {
        // PERHATIAN: Ganti URL di bawah dengan domain backend Vercel Anda yang aktif
        const response = await fetch('https://project-anda.vercel.app/api/withdraw', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                username: username,
                amount: amountToWithdraw
            })
        });

        const result = await response.json();
        
        if (result.success) {
            alert("✅ Berhasil! Permintaan penarikan telah dikirim & Notifikasi masuk ke Telegram Admin.");
        } else {
            alert("❌ Gagal: " + (result.error || "Terjadi kesalahan pada server."));
        }
    } catch (error) {
        console.error("Error:", error);
        alert("⚠️ Gagal terhubung ke server backend Vercel.");
    }
}
