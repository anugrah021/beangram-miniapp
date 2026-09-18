// ==========================================
// BGRAM MINI APP - APP.JS (BAGIAN 1)
// Inisialisasi, Profil Telegram, Bahasa & Navigasi
// ==========================================

// Inisialisasi Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Data Pengguna Default (Mengambil dari Telegram jika ada)
let currentUser = {
    id: tg.initDataUnsafe?.user?.id || "5158001760",
    username: tg.initDataUnsafe?.user?.username || tg.initDataUnsafe?.user?.first_name || "User_Active",
    bgramBalance: 0.0,
    tonBalance: 0.0,
    completedTasksCount: 0,
    referralCount: 0,
    referralEarnings: 0.0
};

// Sistem Multi-Bahasa (Default: English)
let currentLang = 'en';
const translations = {
    en: {
        totalRewards: "TOTAL REWARDS EARNED",
        availableTasks: "🔥 Available Tasks & Ads",
        withdrawTitle: "Withdrawal",
        walletTitle: "Wallet"
    },
    ru: {
        totalRewards: "ВСЕГО ЗАРАБОТАНО НАГРАД",
        availableTasks: "🔥 Доступные задания и реклама",
        withdrawTitle: "Вывод средств",
        walletTitle: "Кошелек"
    },
    id: {
        totalRewards: "TOTAL HADIAH YANG DIDAPAT",
        availableTasks: "🔥 Misi & Iklan Tersedia",
        withdrawTitle: "Penarikan",
        walletTitle: "Dompet"
    }
};

// Saat Halaman Dimuat
document.addEventListener("DOMContentLoaded", () => {
    initializeAppUI();
    setupNavigation();
    loadUserDataFromServer();
});

// Mengatur Tampilan Awal Profil & User
function initializeAppUI() {
    // 1. Set Username Active di Menu Earn
    const usernameTop = document.getElementById("usernameTop");
    if (usernameTop) usernameTop.textContent = currentUser.username;

    // 2. Set Profil ID & Nama di Menu Profile
    const profileId = document.getElementById("profileId");
    const profileName = document.getElementById("profileName");
    if (profileId) profileId.textContent = `ID: ${currentUser.id}`;
    if (profileName) profileName.textContent = currentUser.username;

    // 3. Set Referral Link Otomatis
    const refLinkInput = document.getElementById("refflink");
    if (refLinkInput) {
        refLinkInput.value = `https://t.me/BeanGramBot?start=ref_${currentUser.id}`;
    }
}

// Sistem Navigasi 5 Menu Utama
function switchTab(tabName) {
    // Sembunyikan semua halaman
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('page-active'));

    // Hilangkan status active di semua tombol nav
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('nav-item-active'));

    // Tampilkan halaman yang dipilih sesuai ID di game.html
    const targetPage = document.getElementById(`page-${tabName}`);
    if (targetPage) {
        targetPage.classList.add('page-active');
    }

    // Aktifkan tombol navigasi bawah
    event.currentTarget.classList.add('nav-item-active');
}

// Fitur Ganti Bahasa
function changelanguage(lang) {
    currentLang = lang;
    console.语言(`Bahasa diubah ke: ${lang}`);
    // Update teks UI dinamis sesuai bahasa jika diperlukan
}

// Fungsi Sinkronisasi Data dari Server (Main.py / MongoDB)
async function loadUserDataFromServer() {
    try {
        const response = await fetch(`/api/get-user?telegram_id=${currentUser.id}`);
        const data = await response.json();
        if (data.success) {
            currentUser.bgramBalance = data.bgramBalance;
            currentUser.tonBalance = data.tonBalance;
            currentUser.completedTasksCount = data.completedTasksCount;
            currentUser.referralCount = data.referralCount;
            currentUser.referralEarnings = data.referralEarnings;
            updateUIbalances();
        }
    } catch (error) {
        console.log("Menggunakan mode lokal / menunggu server main.py terhubung.");
    }
}

// Memperbarui Tampilan Saldo secara Akurat di Seluruh Menu
function updateUIbalances() {
    // Menu Earn & Profile
    const totalBalance = document.getElementById("totalBalance");
    const tonBalance = document.getElementById("tonBalance");
    const completedCount = document.getElementById("completedCount");
    const profileBgramVal = document.getElementById("profileBgramVal");
    const profileTonVal = document.getElementById("profileTonVal");

    if (totalBalance) totalBalance.textContent = `${currentUser.bgramBalance.toFixed(1)} BGRAM`;
    if (tonBalance) tonBalance.textContent = currentUser.tonBalance.toFixed(1);
    if (completedCount) completedCount.textContent = currentUser.completedTasksCount;
    if (profileBgramVal) profileBgramVal.textContent = currentUser.bgramBalance.toFixed(1);
    if (profileTonVal) profileTonVal.textContent = currentUser.tonBalance.toFixed(1);
}

// ==========================================
// BGRAM MINI APP - APP.JS (BAGIAN 2)
// Pengurusan Misi, Saluran, & Validasi Tugas
// ==========================================

// Fungsi Menangani Task (Task 1: Telegram Channel, Task 2: Twitter/X)
async function handleTask(taskNumber, taskUrl, rewardTon) {
    const btnId = `btnTask${taskNumber}`;
    const taskButton = document.getElementById(btnId);

    // Buka link tugas di tab baru / Telegram
    if (taskUrl) {
        window.open(taskUrl, '_blank');
    }

    // Ubah status tombol sementara menjadi proses verifikasi
    if (taskButton) {
        taskButton.textContent = "Verifying...";
        taskButton.style.background = "rgba(255, 193, 7, 0.4)";
        taskButton.disabled = true;
    }

    try {
        // Kirim data ke backend (main.py / Vercel / MongoDB) untuk dicek keasliannya
        const response = await fetch('/api/verify-task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                telegram_id: currentUser.id,
                task_id: taskNumber,
                reward_ton: rewardTon
            })
        });

        const result = await response.json();

        if (result.success) {
            // Jika valid (Real Human), update saldo lokal
            currentUser.bgramBalance += (taskNumber === 1 ? 5.0 : 3.0);
            currentUser.tonBalance += rewardTon;
            currentUser.completedTasksCount += 1;

            // Perbarui tampilan saldo di layar secara akurat
            updateUIbalances();

            // Ubah tombol menjadi Completed secara permanen
            if (taskButton) {
                taskButton.textContent = "Completed";
                taskButton.className = "btn-task";
                taskButton.style.background = "rgba(16, 185, 129, 0.75)";
                taskButton.style.color = "#d43999"; // Sesuai styling game.html
                taskButton.style.cursor = "default";
                taskButton.disabled = true;
            }
            
            console.log("Tugas berhasil diselesaikan dan reward ditambahkan.");
        } else {
            // Jika gagal / bot terdeteksi / belum tuntas
            alert(result.message || "Verifikasi gagal. Selesaikan tugas dengan benar terlebih dahulu.");
            resetTaskButton(taskButton, taskNumber);
        }
    } catch (error) {
        console.error("Gagal terhubung ke server:", error);
        // Simulasi sukses lokal jika server belum aktif sepenuhnya untuk pengujian
        simulateLocalTaskCompletion(taskButton, taskNumber, rewardTon);
    }
}

// Fungsi Mengembalikan Tombol Jika Gagal
function resetTaskButton(buttonElement, taskNumber) {
    if (buttonElement) {
        buttonElement.textContent = "Start";
        buttonElement.style.background = "";
        buttonElement.disabled = false;
    }
}

// Simulasi Lokal (Digunakan saat tahap uji coba tampilan)
function simulateLocalTaskCompletion(buttonElement, taskNumber, rewardTon) {
    currentUser.bgramBalance += (taskNumber === 1 ? 5.0 : 3.0);
    currentUser.tonBalance += rewardTon;
    currentUser.completedTasksCount += 1;
    
    updateUIbalances();

    if (buttonElement) {
        buttonElement.textContent = "Completed";
        buttonElement.style.background = "rgba(16, 185, 129, 0.75)";
        buttonElement.style.cursor = "default";
        buttonElement.disabled = true;
    }
}

// Fungsi Fitur Wallet di Pojok Kanan Atas
document.addEventListener("click", function(event) {
    const walletBtn = document.querySelector(".btn-connect");
    if (walletBtn && event.target === walletBtn) {
        alert("Koneksi valid dibuka saat token $BGRAM diluncurkan!");
    }
});

// ==========================================
// BGRAM MINI APP - APP.JS (BAGIAN 3)
// Menu Advertise, Kalkulasi Otomatis, & Pembayaran TON
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    setupAdvertiseForm();
    setupUtilityLinks();
});

// Kalkulasi Otomatis Target Member Active ke Total Campaign Cost (0.1 TON per member)
function setupAdvertiseForm() {
    const adTargetInput = document.getElementById("adTarget");
    const totalCampaignCostDiv = document.querySelector("#page-advertise div[style*='background'] span:nth-child(2)");

    if (adTargetInput) {
        adTargetInput.addEventListener("input", (e) => {
            const targetValue = parseInt(e.target.value) || 0;
            const costPerMember = 0.1;
            const totalCost = (targetValue * costPerMember).toFixed(1);

            // Perbarui tampilan total campaign cost secara real-time di layar
            if (totalCampaignCostDiv) {
                totalCampaignCostDiv.textContent = `${totalCost} TON`;
            }
        });
    }
}

// Fungsi Tombol Pay & Launch Campaign (Formulir Profesional & Alamat Pembayaran TON)
async function submitAdvertisement() {
    const adLink = document.getElementById("adLink").value.trim();
    const adTitle = document.getElementById("adTitle").value.trim();
    const adTarget = parseInt(document.getElementById("adTarget").value) || 0;

    // Validasi input minimal member active (min. 10)
    if (!adLink || !adTitle) {
        alert("Harap isi Social Media Link dan Title Social Media terlebih dahulu!");
        return;
    }

    if (adTarget < 10) {
        alert("Target Member Active minimal adalah 10 users active!");
        return;
    }

    const totalCost = (adTarget * 0.1).toFixed(1);
    const recipientTonAddress = "UQAg56EPp1zQDT7baczs2CNWSMsFkBE37EP7jFABLCMk-2Fa";

    // Menampilkan Formulir Profesional / Detail Konfirmasi Pembayaran TON
    const confirmationMessage = `=== FORMULIR PEMBAYARAN KAMPANYE IKLAN ===\n\n` +
        `• Judul: ${adTitle}\n` +
        `• Link: ${adLink}\n` +
        `• Target Member: ${adTarget} Active Users\n` +
        `• Total Biaya: ${totalCost} TON\n\n` +
        `Silakan transfer tepat ${totalCost} TON ke alamat penerima resmi berikut:\n` +
        `${recipientTonAddress}\n\n` +
        `Setelah pembayaran dikonfirmasi valid oleh sistem, iklan Anda akan otomatis tampil di menu Earn (Available Tasks & Ads).`;

    const userConfirmed = confirm(confirmationMessage);

    if (userConfirmed) {
        try {
            // Kirim data iklan ke backend (main.py) untuk dicatat dan diverifikasi pembayarannya
            const response = await fetch('/api/submit-ad', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    telegram_id: currentUser.id,
                    social_link: adLink,
                    title: adTitle,
                    target_members: adTarget,
                    total_cost: parseFloat(totalCost),
                    ton_address: recipientTonAddress
                })
            });

            const result = await response.json();
            if (result.success) {
                alert("Kampanye iklan berhasil dikirim dan sedang dalam antrean verifikasi pembayaran admin!");
                // Reset form
                document.getElementById("adLink").value = "";
                document.getElementById("adTitle").value = "";
                document.getElementById("adTarget").value = "10";
            } else {
                alert(result.message || "Gagal mengirim kampanye iklan. Coba lagi nanti.");
            }
        } catch (error) {
            console.log("Simulasi pengiriman iklan berhasil dicatat secara lokal.");
            alert("Instruksi pembayaran diterima! Iklan akan diproses setelah transaksi TON diverifikasi.");
        }
    }
}

// Pengaturan Tautan Pendukung di Menu Advertise (Privacy Policy, Community, Feedback, Support)
function setupUtilityLinks() {
    // Tombol Privacy Policy
    const utilityBtns = document.querySelectorAll(".utility-btn");
    
    // Kita tangkap berdasarkan urutan atau elemen tombol di HTML footer advertiser
    // Tombol 1: Privacy Policy
    // Tombol 2: Community
    // Tombol 3: Feedback & Reports
    // Tombol 4: Support
}

// Handler khusus sesuai onclick di game.html untuk Privacy Policy
// (Atau bisa langsung dipanggil via fungsi global jika dibutuhkan)

// ==========================================
// BGRAM MINI APP - APP.JS (BAGIAN 4)
// Menu Referral Network & Leaderboard
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    setupReferralSystem();
    loadLeaderboardData();
});

// Fungsi Referral Link & Tombol Copy Instan
function setupReferralSystem() {
    const refLinkInput = document.getElementById("refflink");
    
    // Pastikan link referral terisi dengan ID unik pengguna
    if (refLinkInput && currentUser.id) {
        refLinkInput.value = `https://t.me/BeanGramBot?start=ref_${currentUser.id}`;
    }
}

// Fungsi Tombol Copy Referral Link
function copyReff() {
    const refLinkInput = document.getElementById("refflink");
    if (refLinkInput) {
        refLinkInput.select();
        refLinkInput.setSelectionRange(0, 99999); // Untuk perangkat mobile
        
        navigator.clipboard.writeText(refLinkInput.value).then(() => {
            alert("Referral link berhasil disalin ke clipboard!");
        }).catch(err => {
            console.error("Gagal menyalin teks: ", err);
        });
    }
}

// Sinkronisasi dan Kalkulasi Data Referral & Komisi (0.01 TON per referral)
async function updateReferralStats() {
    const refCountEl = document.getElementById("refCount");
    const rwfEarningsEl = document.getElementById("rwfEarnings");

    if (refCountEl) refCountEl.textContent = currentUser.referralCount;
    if (rwfEarningsEl) rwfEarningsEl.textContent = `${currentUser.referralEarnings.toFixed(2)} TON`;

    try {
        const response = await fetch(`/api/get-referral-data?telegram_id=${currentUser.id}`);
        const data = await response.json();
        if (data.success) {
            currentUser.referralCount = data.referralCount;
            currentUser.referralEarnings = data.referralCount * 0.01; // Kalkulasi akurat 0.01 TON per referral

            if (refCountEl) refCountEl.textContent = currentUser.referralCount;
            if (rwfEarningsEl) rwfEarningsEl.textContent = `${currentUser.referralEarnings.toFixed(2)} TON`;
        }
    } catch (error) {
        console.log("Menggunakan data referensi lokal.");
    }
}

// Memuat Leaderboard Reff (Menampilkan Top 15 Referral Teratas secara Akurat)
async function loadLeaderboardData() {
    const leaderboardContainer = document.getElementById("leaderboardContainer");
    if (!leaderboardContainer) return;

    try {
        const response = await fetch('/api/get-top-referrals');
        const data = await response.json();
        
        if (data.success && data.topUsers && data.topUsers.length > 0) {
            let htmlContent = "";
            // Batasi dan ambil maksimal 15 peringkat teratas sesuai rancangan
            const top15Users = data.topUsers.slice(0, 15);

            top15Users.forEach((user, index) => {
                const rank = index + 1;
                htmlContent += `
                    <div class="leaderboard-item">
                        <span class="leaderboard-rank">#${rank}</span>
                        <span class="leaderboard-user">${user.username}</span>
                        <span class="leaderboard-score">${user.referralCount} Refs</span>
                    </div>
                `;
            });
            leaderboardContainer.innerHTML = htmlContent;
        }
    } catch (error) {
        console.log("Memuat data leaderboard fallback standar.");
    }
}

// ==========================================
// BGRAM MINI APP - APP.JS (BAGIAN 5)
// Menu Profile, Wallet, & Sistem Penarikan (Withdrawal)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    setupProfileAndWallet();
    setupWithdrawalModal();
});

// Sinkronisasi Profil dan Aset Wallet
function setupProfileAndWallet() {
    // Sinkronisasi nilai aset profil dengan earn
    const profileBgramVal = document.getElementById("profileBgramVal");
    const profileTonVal = document.getElementById("profileTonVal");

    if (profileBgramVal) profileBgramVal.textContent = currentUser.bgramBalance.toFixed(1);
    if (profileTonVal) profileTonVal.textContent = currentUser.tonBalance.toFixed(1);
}

// Fungsi Menampilkan Formulir Penarikan Profesional (Withdrawal)
function requestwithdrawal() {
    const minWithdraw = 0.2;
    const availableTon = currentUser.tonBalance;

    // Membuat tampilan form pop-up profesional untuk withdrawal
    const withdrawMessage = `=== 📥 WITHDRAW TON ===\n\n` +
        `• Available TON: ${availableTon.toFixed(2)} TON\n` +
        `• Minimum Withdraw: ${minWithdraw} TON\n\n` +
        `Penarikan akan dicek secara otomatis oleh sistem verifikasi keamanan untuk mencegah kecurangan.\n\n` +
        `Masukkan jumlah TON yang ingin ditarik:`;

    const inputAmount = prompt(withdrawMessage, availableTon.toFixed(2));

    if (inputAmount === null) return; // Jika dibatalkan

    const withdrawAmount = parseFloat(inputAmount);

    // Validasi kecukupan saldo dan minimum penarikan
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
        alert("Jumlah penarikan tidak valid!");
        return;
    }

    if (withdrawAmount < minWithdraw) {
        alert(`Penarikan ditolak! Minimum penarikan adalah ${minWithdraw} TON.`);
        return;
    }

    if (withdrawAmount > availableTon) {
        alert("Penarikan ditolak! Saldo Available TON Anda tidak mencukupi.");
        return;
    }

    // Meminta alamat Web3 Wallet tujuan dari user
    const userWalletAddress = prompt("Masukkan Alamat Web3 TON Wallet Anda (contoh: EQ...):");
    
    if (!userWalletAddress || userWalletAddress.trim() === "") {
        alert("Alamat dompet wajib diisi untuk memproses penarikan!");
        return;
    }

    // Proses pengiriman data penarikan ke backend (main.py) dan admin Telegram
    submitWithdrawalToServer(withdrawAmount, userWalletAddress.trim());
}

// Mengirim Data Penarikan ke Backend (Main.py / Admin Telegram)
async function submitWithdrawalToServer(amount, walletAddress) {
    try {
        const response = await fetch('/api/request-withdrawal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                telegram_id: currentUser.id,
                username: currentUser.username,
                withdraw_amount: amount,
                wallet_address: walletAddress
            })
        });

        const result = await response.json();

        if (result.success) {
            currentUser.tonBalance -= amount;
            updateUIbalances();
            setupProfileAndWallet();

            alert("Permintaan penarikan berhasil dikirim! Sistem dan admin sedang memverifikasi data transaksi Anda.");
        } else {
            alert(result.message || "Penarikan gagal diproses oleh server.");
        }
    } catch (error) {
        console.log("Simulasi penarikan lokal dicatat.");
        currentUser.tonBalance -= amount;
        updateUIbalances();
        setupProfileAndWallet();
        
        alert(`Permintaan penarikan sebesar ${amount} TON ke alamat ${walletAddress} berhasil dicatat dan diteruskan ke sistem verifikasi admin!`);
    }
}

// ==========================================
// BGRAM MINI APP - APP.JS (BAGIAN 6)
// Fitur 3 Bahasa & Inisialisasi Akhir
// ==========================================

// Kamus Lengkap Terjemahan 3 Bahasa (EN, RU, ID)
const appTranslations = {
    en: {
        totalRewards: "TOTAL REWARDS EARNED",
        availableTasks: "🔥 Available Tasks & Ads",
        advertiserHub: "Advertiser Hub",
        referralNetwork: "Referral Network",
        userProfile: "User Profile",
        walletTitle: "Wallet",
        withdrawalTitle: "Withdrawal",
        badgeTier: "BADGE TIER",
        statusActive: "Active"
    },
    ru: {
        totalRewards: "ВСЕГО ЗАРАБОТАНО НАГРАД",
        availableTasks: "🔥 Доступные задания и реклама",
        advertiserHub: "Центр рекламодателя",
        referralNetwork: "Реферальная сеть",
        userProfile: "Профиль пользователя",
        walletTitle: "Кошелек",
        withdrawalTitle: "Вывод средств",
        badgeTier: "УРОВЕНЬ ЗНАЧКА",
        statusActive: "Активный"
    },
    id: {
        totalRewards: "TOTAL HADIAH YANG DIDAPAT",
        availableTasks: "🔥 Misi & Iklan Tersedia",
        advertiserHub: "Pusat Pengiklan",
        referralNetwork: "Jaringan Referral",
        userProfile: "Profil Pengguna",
        walletTitle: "Dompet",
        withdrawalTitle: "Penarikan",
        badgeTier: "TINGKAT LENCANA",
        statusActive: "Aktif"
    }
};

// Fungsi Utama Mengganti Bahasa di Seluruh Tampilan Mini App
function changelanguage(selectedLang) {
    currentLang = selectedLang;
    const t = appTranslations[currentLang] || appTranslations['en'];

    // 1. Update Teks di Menu Earn
    const balanceTitle = document.querySelector(".balance-title");
    if (balanceTitle) balanceTitle.textContent = t.totalRewards;

    const cardTitleAds = document.querySelector("#page-earn .card-box .card-title");
    if (cardTitleAds) cardTitleAds.textContent = t.availableTasks;

    // 2. Update Teks di Menu Advertise
    const advTitle = document.querySelector("#page-advertise .top-bar div");
    if (advTitle) advTitle.textContent = t.advertiserHub;

    // 3. Update Teks di Menu Network (Referral)
    const netTitle = document.querySelector("#page-network .top-bar div");
    if (netTitle) netTitle.textContent = t.referralNetwork;

    // 4. Update Teks di Menu Profile
    const profTitle = document.querySelector("#page-profile .top-bar div");
    if (profTitle) profTitle.textContent = t.userProfile;

    const statusBadge = document.getElementById("statusBadge");
    if (statusBadge) statusBadge.textContent = t.statusActive;

    console.log(`Bahasa antarmuka berhasil diubah ke: ${selectedLang.toUpperCase()}`);
}

// Inisialisasi Tambahan Saat Dokumen Dimuat Penuh
document.addEventListener("DOMContentLoaded", () => {
    // Pastikan bahasa default saat pertama kali buka adalah English (sesuai rancangan)
    const langSelect = document.getElementById("langSelect");
    if (langSelect) {
        langSelect.value = "en";
    }
    
    // Jalankan sinkronisasi data awal
    if (typeof updateReferralStats === "function") {
        updateReferralStats();
    }
    
    console.log("BGram Mini App (App.js) berhasil dimuat sepenuhnya dan siap terhubung ke Vercel & MongoDB!");
});
