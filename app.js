async function requestWithdrawal() {
    alert("⏳ Mengirim sinyal penarikan...");

    try {
        const response = await fetch('/api/withdraw', {
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
            alert("❌ Gagal: " + (result.error || "Terjadi kesalahan."));
        }
    } catch (error) {
        console.error("Error:", error);
        alert("⚠️ Gagal terhubung ke server Vercel.");
    }
}
