// Konfigurasi URL Backend FastAPI di Vercel (Ganti dengan domain Vercel Anda nantinya)
const API_BASE_URL = "https://beangram-miniapp.vercel.app"; // Sesuaikan nanti dengan link vercel Anda

// Data User Global
let currentUser = {
    telegram_id: "123456789", // Default dummy untuk testing, nanti dibaca dari Telegram WebApp API
    username: "BeanUser",
    bgram_balance: 0.0,
    ton_balance: 0.0,
    referral_count: 0
};

// 1. Fungsi Inisialisasi & Login Otomatis saat Mini App Dibuka
async function initBeanGramApp() {
    try {
        // Cek apakah dibuka di dalam Telegram WebApp asli
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe?.user) {
            const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
            currentUser.telegram_id = tgUser.id.toString();
            currentUser.username = tgUser.username || tgUser.first_name || "BeanGramUser";
        }

        // Kirim data ke backend untuk login/registrasi otomatis
        const response = await fetch(`${API_BASE_URL}/api/user/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                telegram_id: currentUser.telegram_id,
                username: currentUser.username,
                referred_by: null // Bisa dikembangkan untuk menangkap parameter ref dari Telegram
            })
        });

        const result = await response.json();
        if (result.status === "success") {
            currentUser = result.data;
            updateUIbalances();
            console.log("BeanGram User Logged In Successfully:", currentUser);
        }
    } catch (error) {
        console.error("Gagal terhubung ke backend server:", error);
    }
}

// Fungsi memperbarui tampilan saldo di layar HTML
function updateUIbalances() {
    const bgramEl = document.getElementById("bgram-balance-display");
    const tonEl = document.getElementById("ton-balance-display");
    if (bgramEl) bgramEl.innerText = currentUser.bgram_balance.toFixed(2);
    if (tonEl) tonEl.innerText = currentUser.ton_balance.toFixed(4);
}

// 2. Sistem Navigasi Tab / Perpindahan Halaman Menu
document.addEventListener("DOMContentLoaded", () => {
    // Jalankan inisialisasi login saat halaman dimuat
    initBeanGramApp();

    const navButtons = document.querySelectorAll(".nav-btn, [data-tab]");
    const tabContents = document.querySelectorAll(".tab-content, .screen");

    navButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            e.preventDefault();
            const targetTab = button.getAttribute("data-tab") || button.getAttribute("href")?.replace("#", "");
            
            if (!targetTab) return;

            // Sembunyikan semua konten tab
            tabContents.forEach(content => {
                content.style.display = "none";
            });

            // Tampilkan tab yang dituju
            const activeContent = document.getElementById(targetTab);
            if (activeContent) {
                activeContent.style.display = "block";
            }

            // Atur status aktif pada tombol navigasi
            navButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
        });
    });
});

// 3. Logika Misi (Earn / Task) & Hub Pasang Iklan (Advertiser)
async function claimTask(taskId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/task/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                telegram_id: currentUser.telegram_id,
                task_id: taskId
            })
        });

        const result = await response.json();
        if (response.ok) {
            alert("Berhasil! " + result.message);
            // Update saldo lokal setelah klaim misi sukses
            currentUser.bgram_balance += 5.0;
            updateUIbalances();
        } else {
            alert("Gagal: " + (result.detail || "Task sudah pernah diselesaikan"));
        }
    } catch (error) {
        console.error("Kesalahan saat mengklaim task:", error);
        alert("Terjadi kesalahan koneksi ke server.");
    }
}

async function createAdvertiserCampaign(title, socialLink, targetMembers, costTon) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/ads/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                advertiser_id: currentUser.telegram_id,
                social_link: socialLink,
                title: title,
                target_members: parseInt(targetMembers),
                total_cost_ton: parseFloat(costTon)
            })
        });

        const result = await response.json();
        if (response.ok) {
            alert("Kampanye Iklan Berhasil Dibuat! ID: " + result.campaign_id);
        } else {
            alert("Gagal membuat iklan: " + (result.detail || "Periksa kembali input Anda"));
        }
    } catch (error) {
        console.error("Kesalahan saat membuat iklan:", error);
        alert("Terjadi kesalahan koneksi ke server.");
    }
}

// 4. Sistem Penarikan TON (Withdrawal) & Sinkronisasi Saldo
async function requestWithdrawal() {
    // Memunculkan kotak dialog interaktif di layar HP user
    const amountInput = prompt("Masukkan jumlah TON yang ingin ditarik (Contoh: 0.5):");
    if (!amountInput) return; // Jika dibatalkan
    
    const amountTon = parseFloat(amountInput);
    if (isNaN(amountTon) || amountTon <= 0) {
        alert("Nominal penarikan tidak valid!");
        return;
    }

    const walletAddress = prompt("Masukkan Alamat Wallet TON Anda (Contoh: UQB...):");
    if (!walletAddress || walletAddress.trim() === "") {
        alert("Alamat wallet tidak boleh kosong!");
        return;
    }

    // Konfirmasi sebelum mengirim ke backend
    const confirmWithdraw = confirm(`Konfirmasi Penarikan:\nJumlah: ${amountTon} TON\nKe Wallet: ${walletAddress}\n\nLanjutkan?`);
    if (!confirmWithdraw) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/withdrawal/request`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                telegram_id: currentUser.telegram_id,
                amount_ton: amountTon,
                wallet_address: walletAddress.trim()
            })
        });

        const result = await response.json();
        if (response.ok) {
            alert("Berhasil! " + result.message + "\nID Transaksi: " + result.withdrawal_id);
            // Kurangi saldo lokal secara otomatis
            currentUser.ton_balance -= amountTon;
            updateUIbalances();
        } else {
            alert("Penarikan Gagal: " + (result.detail || "Saldo tidak mencukupi"));
        }
    } catch (error) {
        console.error("Kesalahan saat memproses penarikan:", error);
        alert("Terjadi kesalahan koneksi ke server.");
    }
}
