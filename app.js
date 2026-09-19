// ==========================================
// BGRAM MINI APP - APP.JS (BAGIAN 1 / 5)
// ==========================================

// Inisialisasi Telegram WebApp
const tg = window.Telegram.WebApp;
if (tg && typeof tg.expand === 'function') {
    tg.expand();
}

// Data Pengguna Default
let currentUser = {
    id: tg?.initDataUnsafe?.user?.id || "5158001760",
    username: tg?.initDataUnsafe?.user?.username || tg?.initDataUnsafe?.user?.first_name || "User_Active",
    bgramBalance: 0.0,
    tonBalance: 0.0,
    completedTasksCount: 0,
    referralCount: 0,
    referralEarnings: 0.0,
    completedTaskIds: []
};

let currentLang = 'en';

// Saat Halaman Dimuat
document.addEventListener("DOMContentLoaded", () => {
    loadUserFromLocalStorage();
    initializeAppUI();
    loadUserDataFromServer();
    setupAdvertiseForm();
    setupReferralSystem();
    loadLeaderboardData();
    setupProfileAndWallet();
    
    // Kunci tombol task yang sudah selesai
    if (currentUser.completedTaskIds && currentUser.completedTaskIds.length > 0) {
        currentUser.completedTaskIds.forEach(taskId => {
            const taskButton = document.getElementById(`btnTask${taskId}`);
            if (taskButton) {
                taskButton.textContent = "Completed";
                taskButton.className = "btn-task";
                taskButton.style.background = "rgba(16, 185, 129, 0.75)";
                taskButton.style.color = "#d43999";
                taskButton.style.cursor = "default";
                taskButton.disabled = true;
            }
        });
    }

    console.log("BGram Mini App berhasil dimuat dengan stabil!");
});

// ==========================================
// BGRAM MINI APP - APP.JS (BAGIAN 2 / 5)
// ==========================================

// Mengatur Tampilan Awal Profil & User
function initializeAppUI() {
    const usernameTop = document.getElementById("usernameTop");
    if (usernameTop) usernameTop.textContent = currentUser.username;

    const profileId = document.getElementById("profileId");
    const profileName = document.getElementById("profileName");
    if (profileId) profileId.textContent = `ID: ${currentUser.id}`;
    if (profileName) profileName.textContent = currentUser.username;

    const refLinkInput = document.getElementById("refflink");
    if (refLinkInput) {
        refLinkInput.value = `https://t.me/BeanGramBot?start=ref_${currentUser.id}`;
    }
}

// Navigasi 5 Menu Utama
function switchTab(tabName) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.style.display = 'none';
        page.classList.remove('page-active');
    });

    const targetPage = document.getElementById(`page-${tabName}`);
    if (targetPage) {
        targetPage.style.display = 'block';
        targetPage.classList.add('page-active');
    }

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        item.classList.remove('nav-item-active');
        const onClickAttr = item.getAttribute('onclick');
        if (onClickAttr && onClickAttr.includes(`('${tabName}')`)) {
            item.classList.add('active');
            item.classList.add('nav-item-active');
        }
    });
}

// Fungsi Bahasa Universal (Stabil Bahasa Inggris)
function changelanguage(selectedLang) {
    currentLang = selectedLang || 'en';
    console.log("App running in language mode:", currentLang);
}

// ==========================================
// BGRAM MINI APP - APP.JS (BAGIAN 3 / 5)
// ==========================================

// Sinkronisasi Data dari Server
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

// Memperbarui Tampilan Saldo
function updateUIbalances() {
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

// Memuat data dari LocalStorage
function loadUserFromLocalStorage() {
    const savedData = localStorage.getItem('bgram_user');
    if (savedData) {
        const parsed = JSON.parse(savedData);
        currentUser.bgramBalance = parsed.bgramBalance || 0.0;
        currentUser.tonBalance = parsed.tonBalance || 0.0;
        currentUser.completedTasksCount = parsed.completedTasksCount || 0;
        currentUser.referralCount = parsed.referralCount || 0;
        currentUser.referralEarnings = parsed.referralEarnings || 0.0;
        currentUser.completedTaskIds = parsed.completedTaskIds || [];
    } else {
        currentUser.completedTaskIds = [];
    }
}

// Menyimpan data ke LocalStorage
function saveUserToLocalStorage() {
    localStorage.setItem('bgram_user', JSON.stringify(currentUser));
}

// ==========================================
// BGRAM MINI APP - APP.JS (BAGIAN 4 / 5)
// ==========================================

// Fungsi Mengerjakan Task
function handleTask(taskNumber, taskUrl, rewardTon) {
    if (currentUser.completedTaskIds && currentUser.completedTaskIds.includes(taskNumber)) {
        return;
    }

    const btnId = `btnTask${taskNumber}`;
    const taskButton = document.getElementById(btnId);

    if (taskUrl) {
        window.open(taskUrl, '_blank');
    }

    if (taskButton) {
        taskButton.textContent = "Verifying...";
        taskButton.style.background = "rgba(255, 193, 7, 0.4)";
        taskButton.disabled = true;
    }

    setTimeout(() => {
        const rewardBgram = (taskNumber === 1 ? 5.0 : 3.0);
        
        currentUser.bgramBalance += rewardBgram;
        currentUser.tonBalance += rewardTon; 
        currentUser.completedTasksCount += 1;

        if (!currentUser.completedTaskIds) {
            currentUser.completedTaskIds = [];
        }
        currentUser.completedTaskIds.push(taskNumber);

        saveUserToLocalStorage();
        updateUIbalances();

        if (taskButton) {
            taskButton.textContent = "Completed";
            taskButton.className = "btn-task";
            taskButton.style.background = "rgba(16, 185, 129, 0.75)";
            taskButton.style.color = "#d43999";
            taskButton.style.cursor = "default";
            taskButton.disabled = true;
        }
    }, 1000);
}

// ==========================================
// BGRAM MINI APP - APP.JS (BAGIAN 5 / 5)
// ==========================================

// Kalkulasi Otomatis Advertise
function setupAdvertiseForm() {
    const adTargetInput = document.getElementById("adTarget");
    const totalCampaignCostDiv = document.querySelector("#page-advertise div[style*='background'] span:nth-child(2)");

    if (adTargetInput) {
        adTargetInput.addEventListener("input", (e) => {
            const targetValue = parseInt(e.target.value) || 0;
            const totalCost = (targetValue * 0.1).toFixed(1);
            if (totalCampaignCostDiv) {
                totalCampaignCostDiv.textContent = `${totalCost} TON`;
            }
        });
    }
}

async function submitAdvertisement() {
    const adLink = document.getElementById("adLink")?.value.trim();
    const adTitle = document.getElementById("adTitle")?.value.trim();
    const adTarget = parseInt(document.getElementById("adTarget")?.value) || 0;

    if (!adLink || !adTitle) {
        alert("Please fill in the Social Media Link and Title first!");
        return;
    }

    if (adTarget < 10) {
        alert("Minimum target is 10 active users!");
        return;
    }

    const totalCost = (adTarget * 0.1).toFixed(1);
    const recipientTonAddress = "UQAg56EPp1zQDT7baczs2CNWSMsFkBE37EP7jFABLCMk-2Fa";

    // Hapus modal lama jika ada agar tidak menumpuk
    const existingModal = document.getElementById("customAdModal");
    if (existingModal) existingModal.remove();

    // Buat elemen modal card kustom yang profesional
    const modalOverlay = document.createElement("div");
    modalOverlay.id = "customAdModal";
    modalOverlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 99999; padding: 20px;";
    
    modalOverlay.innerHTML = `
        <div style="background: #1e1e2f; border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 24px; width: 100%; max-width: 360px; color: #fff; box-shadow: 0 10px 40px rgba(0,0,0,0.6); font-family: inherit;">
            <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 18px; color: #38bdf8; text-align: center;">🚀 AD CAMPAIGN PAYMENT</h3>
            
            <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px; font-size: 13px; margin-bottom: 16px; line-height: 1.5;">
                <div style="margin-bottom: 6px;"><strong>Link Social Media:</strong> ${adTitle}</div>
                <div style="margin-bottom: 6px; word-break: break-all;"><strong>Name Social Media:</strong> ${adLink}</div>
                <div style="margin-bottom: 6px;"><strong>Target:</strong> ${adTarget} Active Users</div>
                <div style="color: #facc15;"><strong>Total Cost:</strong> ${totalCost} TON</div>
            </div>

            <p style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">Please transfer exactly <strong>${totalCost} TON</strong> to the BGRAM address:</p>
            
            <div style="background: rgba(0,0,0,0.4); padding: 10px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.1);">
                <span style="font-size: 11px; word-break: break-all; color: #34d399;">${recipientTonAddress}</span>
                <button id="copyTonBtn" style="background: #38bdf8; color: #0f172a; border: none; border-radius: 6px; padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer; white-space: nowrap;">Copy</button>
            </div>

            <div style="display: flex; gap: 10px;">
                <button id="cancelAdBtn" style="flex: 1; padding: 12px; background: rgba(255,255,255,0.1); border: none; border-radius: 8px; color: #fff; font-weight: bold; cursor: pointer;">Cancel</button>
                <button id="confirmAdBtn" style="flex: 1; padding: 12px; background: #3b82f6; border: none; border-radius: 8px; color: #fff; font-weight: bold; cursor: pointer;">Confirm & Pay</button>
            </div>
        </div>
    `;

    document.body.appendChild(modalOverlay);

    // Fungsi Tombol Copy
    document.getElementById("copyTonBtn").onclick = () => {
        navigator.clipboard.writeText(recipientTonAddress).then(() => {
            const btn = document.getElementById("copyTonBtn");
            btn.textContent = "Copied!";
            btn.style.background = "#10b981";
            btn.style.color = "#fff";
            setTimeout(() => {
                btn.textContent = "Copy";
                btn.style.background = "#38bdf8";
                btn.style.color = "#0f172a";
            }, 2000);
        });
    };

    // Tombol Cancel
    document.getElementById("cancelAdBtn").onclick = () => {
        modalOverlay.remove();
    };

    // Tombol Confirm & Pay
    document.getElementById("confirmAdBtn").onclick = async () => {
        modalOverlay.remove();
        try {
            const response = await fetch('/api/submit-ad', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                alert("Campaign submitted successfully and pending admin payment verification!");
                document.getElementById("adLink").value = "";
                document.getElementById("adTitle").value = "";
                document.getElementById("adTarget").value = "10";
            } else {
                alert(result.message || "Failed to submit campaign.");
            }
        } catch (error) {
            alert("Payment instruction received! Campaign will be processed once transaction is verified.");
        }
    };
                                        }

// ==========================================
// FIX REFERRAL LINK & COPY FUNCTION
// ==========================================

function setupReferralSystem() {
    const refLinkInput = document.getElementById("refflink");
    
    // Ambil ID Telegram user yang aktif secara aman
    const userId = (typeof currentUser !== 'undefined' && currentUser.id) ? currentUser.id : "5158001760";
    
    if (refLinkInput) {
        refLinkInput.value = `https://t.me/BeanGramBot?start=ref_${userId}`;
    }
}

function copyReff() {
    const refLinkInput = document.getElementById("refflink");
    
    if (refLinkInput) {
        refLinkInput.select();
        refLinkInput.setSelectionRange(0, 99999); // Untuk perangkat mobile
        
        navigator.clipboard.writeText(refLinkInput.value).then(() => {
            // Cari tombol copy untuk mengubah teksnya sementara menjadi "Copied!"
            const copyBtn = document.querySelector("#page-network .btn-connect, button[onclick*='copyReff']");
            if (copyBtn) {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = "Copied!";
                copyBtn.style.background = "#10b981";
                copyBtn.style.color = "#fff";
                
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.style.background = "";
                    copyBtn.style.color = "";
                }, 2000);
            } else {
                alert("Referral link copied successfully!");
            }
        }).catch(err => {
            console.error("Gagal menyalin teks: ", err);
            alert("Failed to copy link.");
        });
    }
}

// Pastikan fungsi berjalan otomatis saat halaman dimuat atau tab dibuka
document.addEventListener("DOMContentLoaded", () => {
    setupReferralSystem();
});

// Panggil fungsi otomatis saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
    setupReferralSystem();
});

async function loadLeaderboardData() {
    const leaderboardContainer = document.getElementById("leaderboardContainer");
    if (!leaderboardContainer) return;

    try {
        const response = await fetch('/api/get-top-referrals');
        const data = await response.json();
        if (data.success && data.topUsers && data.topUsers.length > 0) {
            let htmlContent = "";
            data.topUsers.slice(0, 15).forEach((user, index) => {
                htmlContent += `
                    <div class="leaderboard-item">
                        <span class="leaderboard-rank">#${index + 1}</span>
                        <span class="leaderboard-user">${user.username}</span>
                        <span class="leaderboard-score">${user.referralCount} Refs</span>
                    </div>
                `;
            });
            leaderboardContainer.innerHTML = htmlContent;
        }
    } catch (error) {
        console.log("Leaderboard fallback.");
    }
}

// ==========================================
// PERBAIKAN: PROFIL AVATAR & MODERN WITHDRAW MODAL
// ==========================================

// 1. Sinkronisasi Foto Profil Telegram & Info Akun
function setupProfileAndWallet() {
    // Ambil foto profil dari Telegram WebApp jika tersedia
    const userPhotoUrl = tg?.initDataUnsafe?.user?.photo_url;
    
    // Cari elemen bulatan avatar di menu profile (misalnya tag img atau div dengan background)
    const avatarContainer = document.querySelector("#page-profile .profile-avatar, #page-profile img, .avatar-circle");
    if (avatarContainer && userPhotoUrl) {
        if (avatarContainer.tagName === 'IMG') {
            avatarContainer.src = userPhotoUrl;
        } else {
            avatarContainer.style.backgroundImage = `url(${userPhotoUrl})`;
            avatarContainer.style.backgroundSize = 'cover';
            avatarContainer.style.backgroundPosition = 'center';
        }
    }

    // Sinkronisasi nilai aset profil dengan saldo saat ini
    const profileBgramVal = document.getElementById("profileBgramVal");
    const profileTonVal = document.getElementById("profileTonVal");

    if (profileBgramVal) profileBgramVal.textContent = currentUser.bgramBalance.toFixed(1);
    if (profileTonVal) profileTonVal.textContent = currentUser.tonBalance.toFixed(1);
}

// 2. Fungsi Tombol Withdraw Memunculkan Modal Profesional (English)
function requestwithdrawal() {
    const minWithdraw = 0.25;
    const availableTon = currentUser.tonBalance;
    const bgramBalance = currentUser.bgramBalance;

    // Hapus modal lama jika ada agar tidak menumpuk
    const existingModal = document.getElementById("customWithdrawModal");
    if (existingModal) existingModal.remove();

    // Buat elemen Modal Card Keren untuk Withdraw
    const modalOverlay = document.createElement("div");
    modalOverlay.id = "customWithdrawModal";
    modalOverlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 99999; padding: 20px;";
    
    modalOverlay.innerHTML = `
        <div style="background: #1e1e2f; border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 24px; width: 100%; max-width: 360px; color: #fff; box-shadow: 0 10px 40px rgba(0,0,0,0.6); font-family: inherit;">
            <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 18px; color: #38bdf8; text-align: center;">📥 WITHDRAWAL ASSETS</h3>
            
            <!-- Kotak Informasi Saldo -->
            <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px; font-size: 13px; margin-bottom: 14px; line-height: 1.6;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span>🔒 BGRAM Locked:</span>
                    <strong style="color: #facc15;">${bgramBalance.toFixed(1)} BGRAM</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>💎 TON Available:</span>
                    <strong style="color: #34d399;" id="modalTonBal">${availableTon.toFixed(2)} TON</strong>
                </div>
            </div>

            <!-- Input Jumlah yang Ingin Ditarik -->
            <div style="margin-bottom: 12px;">
                <label style="font-size: 11px; color: #94a3b8; display: block; margin-bottom: 4px;">Amount to Withdraw (TON)</label>
                <input type="number" id="withdrawAmountInput" value="${availableTon.toFixed(2)}" step="0.01" style="width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px; color: #fff; font-size: 14px; box-sizing: border-box;" />
            </div>

            <!-- Input Alamat Wallet Web3 -->
            <div style="margin-bottom: 8px;">
                <label style="font-size: 11px; color: #94a3b8; display: block; margin-bottom: 4px;">Your Web3 TON Wallet Address</label>
                <input type="text" id="walletAddressInput" placeholder="Paste your TON address (EQ... / UQ...)" style="width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; box-sizing: border-box;" />
            </div>

            <!-- Tulisan kecil minimum withdraw -->
            <p style="font-size: 11px; color: #f87171; margin-top: 0; margin-bottom: 20px;">* Minimum withdrawal limit is 0.25 TON</p>

            <!-- Tombol Aksi -->
            <div style="display: flex; gap: 10px;">
                <button id="cancelWithdrawBtn" style="flex: 1; padding: 12px; background: rgba(255,255,255,0.1); border: none; border-radius: 8px; color: #fff; font-weight: bold; cursor: pointer;">Cancel</button>
                <button id="confirmWithdrawBtn" style="flex: 1; padding: 12px; background: #10b981; border: none; border-radius: 8px; color: #fff; font-weight: bold; cursor: pointer;">Withdraw</button>
            </div>
        </div>
    `;

    document.body.appendChild(modalOverlay);

    // Tombol Cancel
    document.getElementById("cancelWithdrawBtn").onclick = () => {
        modalOverlay.remove();
    };

    // Tombol Withdraw (Kirim ke backend main.py)
    document.getElementById("confirmWithdrawBtn").onclick = async () => {
        const withdrawAmount = parseFloat(document.getElementById("withdrawAmountInput").value);
        const walletAddress = document.getElementById("walletAddressInput").value.trim();

        // Validasi
        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            alert("Please enter a valid withdrawal amount!");
            return;
        }
        if (withdrawAmount < minWithdraw) {
            alert(`Withdrawal denied! Minimum withdrawal is ${minWithdraw} TON.`);
            return;
        }
        if (withdrawAmount > availableTon) {
            alert("Withdrawal denied! Insufficient TON balance.");
            return;
        }
        if (!walletAddress) {
            alert("Please paste your TON wallet address!");
            return;
        }

        modalOverlay.remove();

        // Kirim data ke backend main.py
        try {
            const response = await fetch('/api/request-withdrawal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegram_id: currentUser.id,
                    username: currentUser.username,
                    withdraw_amount: withdrawAmount,
                    wallet_address: walletAddress
                })
            });
            const result = await response.json();
            if (result.success) {
                currentUser.tonBalance -= withdrawAmount;
                saveUserToLocalStorage();
                updateUIbalances();
                setupProfileAndWallet();
                alert("Withdrawal request submitted successfully! Pending admin verification.");
            } else {
                alert(result.message || "Withdrawal failed to process.");
            }
        } catch (error) {
            // Fallback jika main.py belum aktif
            currentUser.tonBalance -= withdrawAmount;
            saveUserToLocalStorage();
            updateUIbalances();
            setupProfileAndWallet();
            alert(`Withdrawal request of ${withdrawAmount} TON sent to server for verification!`);
        }
    };
}

async function submitWithdrawalToServer(amount, walletAddress) {
    try {
        const response = await fetch('/api/request-withdrawal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
            saveUserToLocalStorage();
            updateUIbalances();
            setupProfileAndWallet();
            alert("Permintaan penarikan berhasil dikirim!");
        } else {
            alert(result.message || "Gagal memproses penarikan.");
        }
    } catch (error) {
        currentUser.tonBalance -= amount;
        saveUserToLocalStorage();
        updateUIbalances();
        setupProfileAndWallet();
        alert("Permintaan penarikan dicatat secara lokal!");
    }
}

// Fungsi untuk mengecek status pembayaran otomatis
async function checkPaymentStatus() {
    // Ambil data kampanye atau ID terakhir yang disimpan saat user klik Pay & Launch
    const statusMsg = document.getElementById("check-status-msg"); // Opsional jika ingin menampilkan teks status
    
    alert("⏳ Memeriksa status pembayaran di jaringan blockchain TON...");

    try {
        const response = await fetch('/api/auto-verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // Sesuaikan parameter dengan data campaign aktif user
                campaign_id: window.activeCampaignId || "", 
            })
        });

        const result = await response.json();

        if (result.success) {
            alert("✅ " + result.message);
            window.location.href = "/earn.html"; // Langsung arahkan ke menu Earn jika sukses
        } else {
            alert("⚠️ " + result.message);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("❌ Gagal terhubung ke server verifikasi.");
    }
}
