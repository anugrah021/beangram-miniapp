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
                <div style="margin-bottom: 6px;"><strong>Title:</strong> ${adTitle}</div>
                <div style="margin-bottom: 6px; word-break: break-all;"><strong>Link:</strong> ${adLink}</div>
                <div style="margin-bottom: 6px;"><strong>Target:</strong> ${adTarget} Active Users</div>
                <div style="color: #facc15;"><strong>Total Cost:</strong> ${totalCost} TON</div>
            </div>

            <p style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">Please transfer exactly <strong>${totalCost} TON</strong> to the official address:</p>
            
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

// Referral System
function setupReferralSystem() {
    const refLinkInput = document.getElementById("refflink");
    if (refLinkInput && currentUser.id) {
        refLinkInput.value = `https://t.me/BeanGramBot?start=ref_${currentUser.id}`;
    }
}

function copyReff() {
    const refLinkInput = document.getElementById("refflink");
    if (refLinkInput) {
        refLinkInput.select();
        navigator.clipboard.writeText(refLinkInput.value).then(() => {
            alert("Referral link berhasil disalin!");
        });
    }
}

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

function setupProfileAndWallet() {
    const profileBgramVal = document.getElementById("profileBgramVal");
    const profileTonVal = document.getElementById("profileTonVal");
    if (profileBgramVal) profileBgramVal.textContent = currentUser.bgramBalance.toFixed(1);
    if (profileTonVal) profileTonVal.textContent = currentUser.tonBalance.toFixed(1);
}

function requestwithdrawal() {
    const minWithdraw = 0.2;
    const availableTon = currentUser.tonBalance;
    const inputAmount = prompt(`Available TON: ${availableTon.toFixed(2)}\nMinimum Withdraw: ${minWithdraw}\nMasukkan jumlah TON:`, availableTon.toFixed(2));

    if (inputAmount === null) return;
    const withdrawAmount = parseFloat(inputAmount);

    if (isNaN(withdrawAmount) || withdrawAmount < minWithdraw) {
        alert(`Jumlah penarikan tidak valid atau kurang dari minimum ${minWithdraw} TON!`);
        return;
    }
    if (withdrawAmount > availableTon) {
        alert("Saldo TON tidak mencukupi!");
        return;
    }

    const userWalletAddress = prompt("Masukkan Alamat Web3 TON Wallet Anda (EQ...):");
    if (!userWalletAddress) return;

    submitWithdrawalToServer(withdrawAmount, userWalletAddress.trim());
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
