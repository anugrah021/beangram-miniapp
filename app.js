window.alert = function(text) {
    console.log("Notifikasi sistem:", text);
};

const tg = window.Telegram.WebApp;
tg.expand();

const BACKEND_URL = "https://beangram-miniapp.vercel.app";
const initData = tg.initData || "";

function triggerHaptic(type) {
    try {
        if (tg.HapticFeedback) {
            if (type === 'impact') tg.HapticFeedback.impactOccurred('medium');
            else if (type === 'notification') tg.HapticFeedback.notificationOccurred('success');
            else if (type === 'selection') tg.HapticFeedback.selectionChanged();
        }
    } catch (e) {}
}

const translations = {
    en: {
        connect: "Connect", tier: "🫘 BGRAM MINE", vault: "Vault", rate: "Rate", withdraw: "💳 WITHDRAW",
        startFarming: "START FARMING", claim: "CLAIM BGRAM", tasksTitle: "Community Tasks",
        tasksDesc: "Complete social tasks to earn extra BGRAM & TON!", task1: "Join Official Channel", task2: "Follow Official X/Twitter",
        task3: "Invite 3 Active Friends", btnJoin: "Join Channel", btnFollow: "Follow X", btnInvite: "Invite",
        friendsTitle: "Invite Friends & Earn", friendsDesc: "Get commission bonus from every friend who joins using your link!",
        invited: "Invited Friends", reffReward: "Referral Rewards", reffTitle: "YOUR REFERRAL LINK", copy: "Copy",
        totalFarmed: "Total Farmed", minerTier: "Miner Tier", completedTasks: "Completed Tasks", totalReferrals: "Total Referrals",
        walletTitle: "WEB3 TON WALLET", notConnected: "Not Connected", supportTitle: "COMMUNITY", channel: "Channel",
        navMine: "Mine", navTasks: "Tasks", navFriends: "Friends", navProfile: "Profile", wdTitle: "Token Withdrawal",
        wdStatus: "AIRDROP & TGE PHASE", wdDesc: "Withdrawals will open soon upon Token Listing. Please connect your TON wallet.",
        wdBtnConfirm: "HUBUNGKAN TON WALLET", wdBtnClose: "Close", alertWallet: "TON Wallet integration coming soon!", alertCopied: "Referral link copied!"
    },
    ru: {
        connect: "Кошелек", tier: "🫘 Шахта Биграм", vault: "Хранилище", rate: "Скорость", withdraw: "💳 ВЫВОД",
        startFarming: "НАЧАТЬ ФАРМИНГ", claim: "ЗАБРАТЬ BGRAM", tasksTitle: "Задания Сообщества",
        tasksDesc: "Выполняйте задания и получайте больше BGRAM & TON!", task1: "Подписаться на Канал", task2: "Подписаться на X/Twitter",
        task3: "Пригласить 3 Друзей", btnJoin: "В канал", btnFollow: "Читать X", btnInvite: "Звать",
        friendsTitle: "Зови Друзей и Зарабатывай", friendsDesc: "Получайте бонусы с каждого приглашенного друга!",
        invited: "Приглашено Друзей", reffReward: "Награды за Рефералов", reffTitle: "ВАША РЕФЕРАЛЬНАЯ ССЫЛКА", copy: "Копировать",
        totalFarmed: "Всего Добыто", minerTier: "Уровень Майнера", completedTasks: "Выполнено Задач", totalReferrals: "Всего Рефералов",
        walletTitle: "WEB3 TON КОШЕЛЕК", notConnected: "Не Подключен", supportTitle: "СООБЩЕСТВО", channel: "Канал",
        navMine: "Майнинг", navTasks: "Задания", navFriends: "Друзья", navProfile: "Профиль", wdTitle: "Вывод BGRAM",
        wdStatus: "ФАЗА AIRDROP И TGE", wdDesc: "Вывод средств откроется скоро после листинга токена. Подключите ваш TON кошелек.",
        wdBtnConfirm: "ПОДКЛЮЧИТЬ TON КОШЕЛЕК", wdBtnClose: "Закрыть", alertWallet: "Интеграция TON кошелька скоро!", alertCopied: "Реферальная ссылка скопирована!"
    },
    id: {
        connect: "Connect", tier: "🫘 TAMBANG BGRAM", vault: "Vault", rate: "Rate", withdraw: "💳 PENARIKAN",
        startFarming: "MULAI FARMING", claim: "KLAIM BGRAM", tasksTitle: "Misi Komunitas",
        tasksDesc: "Selesaikan tugas sosial untuk menambah saldo BGRAM & TON!", task1: "Join Official Channel", task2: "Follow Official X/Twitter",
        task3: "Undang 3 Teman Aktif", btnJoin: "Join Channel", btnFollow: "Follow X", btnInvite: "Undang",
        friendsTitle: "Undang Teman & Dapatkan Bonus", friendsDesc: "Dapatkan bonus komisi BGRAM & TON dari setiap teman yang bergabung!",
        invited: "Teman Diundang", reffReward: "Bonus Referral", reffTitle: "LINK REFERRAL KAMU", copy: "Salin",
        totalFarmed: "Total Hasil Tambang", minerTier: "Tier Penambang", completedTasks: "Misi Selesai", totalReferrals: "Total Referral",
        walletTitle: "WEB3 TON WALLET", notConnected: "Belum Terhubung", supportTitle: "KOMUNITAS", channel: "Channel",
        navMine: "Tambang", navTasks: "Misi", navFriends: "Teman", navProfile: "Profil", wdTitle: "Penarikan BGRAM",
        wdStatus: "FASE AIRDROP & TGE", wdDesc: "Penarikan akan segera dibuka setelah Listing Token. Harap hubungkan wallet TON kamu.",
        wdBtnConfirm: "HUBUNGKAN TON WALLET", wdBtnClose: "Tutup", alertWallet: "Integrasi Wallet TON segera hadir!", alertCopied: "Link Referral berhasil disalin!"
    }
};

const tgUserLang = (tg.initDataUnsafe?.user?.language_code || "").toLowerCase();
let defaultLang = 'en';
if (tgUserLang.startsWith('id')) defaultLang = 'id';
else if (tgUserLang.startsWith('ru')) defaultLang = 'ru';

let currentLang = localStorage.getItem('bgram_lang') || defaultLang;
let currentTranslations = translations[currentLang];

function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('bgram_lang', lang);
    currentTranslations = translations[lang];

    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };

    setText('btnConnectTop', currentTranslations.connect);
    setText('btnConnectProfile', currentTranslations.connect);
    setText('txtTier', currentTranslations.tier);
    setText('txtVaultLabel', currentTranslations.vault);
    setText('txtRateLabel', currentTranslations.rate);
    setText('btnWithdraw', currentTranslations.withdraw);
    
    setText('txtTasksTitle', currentTranslations.tasksTitle);
    setText('txtTasksDesc', currentTranslations.tasksDesc);
    setText('txtTask1', currentTranslations.task1);
    setText('txtTask2', currentTranslations.task2);
    setText('txtTask3', currentTranslations.task3);

    setText('txtFriendsTitle', currentTranslations.friendsTitle);
    setText('txtFriendsDesc', currentTranslations.friendsDesc);
    setText('lblInvited', currentTranslations.invited);
    setText('lblReffReward', currentTranslations.reffReward);
    setText('txtReffTitle', currentTranslations.reffTitle);
    setText('btnCopy', currentTranslations.copy);

    setText('lblTotalFarmed', currentTranslations.totalFarmed);
    setText('lblMinerTier', currentTranslations.minerTier);
    setText('lblCompletedTasks', currentTranslations.completedTasks);
    setText('lblTotalReferrals', currentTranslations.totalReferrals);
    setText('txtWalletTitle', currentTranslations.walletTitle);
    setText('walletStatus', currentTranslations.notConnected);
    setText('txtSupportTitle', currentTranslations.supportTitle);
    setText('btnChannel', currentTranslations.channel);

    setText('navTxtMine', currentTranslations.navMine);
    setText('navTxtTasks', currentTranslations.navTasks);
    setText('navTxtFriends', currentTranslations.navFriends);
    setText('navTxtProfile', currentTranslations.navProfile);

    updateUI();
    updateTaskUI();
}

function switchTab(tab) {
    triggerHaptic('selection');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const page = document.getElementById(`page-${tab}`);
    const nav = document.getElementById(`nav-${tab}`);
    if (page) page.classList.add('active');
    if (nav) nav.classList.add('active');
}

function handleCoinClick(event) {
    triggerHaptic('impact');
    const wrapper = document.getElementById('coinWrapper');
    if (!wrapper) return;
    
    wrapper.classList.remove('wobble');
    void wrapper.offsetWidth;
    wrapper.classList.add('wobble');

    const rect = wrapper.getBoundingClientRect();
    const x = event.clientX ? event.clientX - rect.left : rect.width / 2;
    const y = event.clientY ? event.clientY - rect.top : rect.height / 2;

    const floatElem = document.createElement('div');
    floatElem.className = 'floating-number';
    floatElem.innerText = '+0.001';
    floatElem.style.left = `${x}px`;
    floatElem.style.top = `${y}px`;
    
    wrapper.appendChild(floatElem);
    setTimeout(() => { floatElem.remove(); }, 800);
}

const FARM_DURATION = 5 * 60 * 60 * 1000;
const TOTAL_REWARD = 2.0;

let totalBalance = parseFloat(localStorage.getItem('bgram_balance')) || 0;
let tonBalance = parseFloat(localStorage.getItem('bgram_ton_balance')) || 0;
let miningStartTime = parseInt(localStorage.getItem('bgram_start_time')) || 0;

function updateUI() {
    const totalBalanceElem = document.getElementById('totalBalance');
    const vaultBalanceElem = document.getElementById('vaultBalance');
    const profileTotal = document.getElementById('profileTotal');
    const statusBadge = document.getElementById('statusBadge');
    const miningDisplayBox = document.getElementById('miningDisplayBox');
    const unclaimedText = document.getElementById('unclaimedText');
    const actionBtn = document.getElementById('actionBtn');

    if (totalBalanceElem) totalBalanceElem.innerText = totalBalance.toFixed(4) + " BGRAM";
    if (vaultBalanceElem) vaultBalanceElem.innerText = totalBalance.toFixed(4);
    if (profileTotal) profileTotal.innerText = totalBalance.toFixed(4) + " BGRAM";

    if (miningStartTime === 0) {
        if (statusBadge) { statusBadge.innerText = "IDLE"; statusBadge.style.background = "#0284c7"; }
        if (miningDisplayBox) miningDisplayBox.style.display = "none";
        if (actionBtn) { actionBtn.innerText = currentTranslations.startFarming; actionBtn.className = "main-btn btn-start"; }
    } else {
        const now = Date.now();
        const elapsedTime = now - miningStartTime;

        if (elapsedTime >= FARM_DURATION) {
            if (statusBadge) { statusBadge.innerText = "READY"; statusBadge.style.background = "#10b981"; }
            if (miningDisplayBox) miningDisplayBox.style.display = "flex";
            if (unclaimedText) unclaimedText.innerText = "+" + TOTAL_REWARD.toFixed(4);
            if (actionBtn) { actionBtn.innerText = currentTranslations.claim; actionBtn.className = "main-btn btn-claim"; }
        } else {
            if (statusBadge) { statusBadge.innerText = "MINING"; statusBadge.style.background = "#0ea5e9"; }
            
            const progressRatio = elapsedTime / FARM_DURATION;
            const currentReward = progressRatio * TOTAL_REWARD;
            
            if (miningDisplayBox) miningDisplayBox.style.display = "flex";
            if (unclaimedText) unclaimedText.innerText = "+" + currentReward.toFixed(4);

            const remainingTime = FARM_DURATION - elapsedTime;
            const hours = Math.floor(remainingTime / (1000 * 60 * 60));
            const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

            const hStr = hours < 10 ? "0" + hours : hours;
            const mStr = minutes < 10 ? "0" + minutes : minutes;
            const sStr = seconds < 10 ? "0" + seconds : seconds;

            if (actionBtn) {
                actionBtn.innerText = `${hStr}:${mStr}:${sStr}`;
                actionBtn.className = "main-btn btn-mining";
            }
        }
    }
}

function handleButtonClick() {
    triggerHaptic('impact');
    const now = Date.now();

    if (miningStartTime === 0) {
        miningStartTime = now;
        localStorage.setItem('bgram_start_time', miningStartTime);
        updateUI();
    } else if ((now - miningStartTime) >= FARM_DURATION) {
        triggerHaptic('notification');
        totalBalance += TOTAL_REWARD;
        localStorage.setItem('bgram_balance', totalBalance);
        
        miningStartTime = 0;
        localStorage.removeItem('bgram_start_time');
        updateUI();
        syncDataToServer('claim_mining');
    }
}

let taskState = JSON.parse(localStorage.getItem('bgram_tasks')) || { 1: 'init', 2: 'init' };

function updateTaskUI() {
    let completedCount = 0;

    for (let id = 1; id <= 2; id++) {
        const btn = document.getElementById(`btnTask${id}`);
        const state = taskState[id] || 'init';

        if (!btn) continue;

        if (state === 'init') {
            btn.innerText = id === 1 ? currentTranslations.btnJoin : currentTranslations.btnFollow;
            btn.className = "btn-task";
        } else if (state === 'checking') {
            btn.innerText = "Checking...";
            btn.className = "btn-task checking";
        } else if (state === 'claimable') {
            btn.innerText = "Claim Reward";
            btn.className = "btn-task claimable";
        } else if (state === 'completed') {
            btn.innerText = "✓ Done";
            btn.className = "btn-task completed";
            completedCount++;
        }
    }
    const profileStats = document.getElementById('profileTaskStats');
    if (profileStats) profileStats.innerText = `${completedCount}/3`;
}

function processTaskAction(id, url, taskType, rewardBgram, rewardTon) {
    triggerHaptic('impact');
    let currentTaskState = JSON.parse(localStorage.getItem('bgram_tasks')) || {};
    const state = currentTaskState[id] || 'init';

    if (state === 'init') {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTelegramLink) {
            window.Telegram.WebApp.openTelegramLink(url);
        } else {
            window.open(url, '_blank');
        }

        currentTaskState[id] = 'claimable';
        localStorage.setItem('bgram_tasks', JSON.stringify(currentTaskState));
        updateTaskUI();
        triggerHaptic('notification');
    } 
    else if (state === 'claimable') {
        totalBalance += rewardBgram;
        tonBalance += rewardTon;

        localStorage.setItem('bgram_balance', totalBalance);
        localStorage.setItem('bgram_ton_balance', tonBalance);

        currentTaskState[id] = 'completed';
        localStorage.setItem('bgram_tasks', JSON.stringify(currentTaskState));

        triggerHaptic('notification');
        updateUI();
        updateTaskUI();
        syncDataToServer(`complete_task_${taskType}`, { bgram_added: rewardBgram, ton_added: rewardTon });
    }
}

async function syncDataToServer(actionType, extraData = {}) {
    try {
        const payload = {
            telegram_id: String(tg.initDataUnsafe?.user?.id || "unknown"),
            username: tg.initDataUnsafe?.user?.username || "unknown",
            bgram_balance: parseFloat(localStorage.getItem('bgram_balance')) || 0,
            ton_balance: parseFloat(localStorage.getItem('bgram_ton_balance')) || 0,
            friends_count: parseInt(localStorage.getItem('bgram_friends_count')) || 0,
            friends_reward: parseFloat(localStorage.getItem('bgram_friends_reward')) || 0,
            action: actionType,
            details: extraData,
            timestamp: new Date().toISOString()
        };

        await fetch(`${BACKEND_URL}/api/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.warn("Sync background mode:", error);
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const btnTask1 = document.getElementById('btnTask1');
    const btnTask2 = document.getElementById('btnTask2');

    if (btnTask1) {
        btnTask1.onclick = function() {
            processTaskAction(1, 'https://t.me/BeanGram_Official', 'telegram', 5.0, 0.05);
        };
    }

    if (btnTask2) {
        btnTask2.onclick = function() {
            processTaskAction(2, 'https://x.com', 'twitter', 5.0, 0.0);
        };
    }

    const langSelect = document.getElementById('langSelect');
    if (langSelect) langSelect.value = currentLang;
    changeLanguage(currentLang);
    updateUI();
    updateTaskUI();
    setInterval(updateUI, 1000);
});

function switchWdTab(tab) {
    triggerHaptic('selection');
    const btnTon = document.getElementById('wdTabTon');
    const btnBgram = document.getElementById('wdTabBgram');
    const contentTon = document.getElementById('wdContentTon');
    const contentBgram = document.getElementById('wdContentBgram');

    if (tab === 'ton') {
        if (btnTon) { btnTon.style.background = "#bae6fd"; btnTon.style.color = "#0369a1"; }
        if (btnBgram) { btnBgram.style.background = "transparent"; btnBgram.style.color = "#64748b"; }
        if (contentTon) contentTon.style.display = "block";
        if (contentBgram) contentBgram.style.display = "none";
    } else {
        if (btnBgram) { btnBgram.style.background = "rgba(239,68,68,0.15)"; btnBgram.style.color = "#ef4444"; }
        if (btnTon) { btnTon.style.background = "transparent"; btnTon.style.color = "#64748b"; }
        if (contentBgram) contentBgram.style.display = "block";
        if (contentTon) contentTon.style.display = "none";
        const lockedVal = document.getElementById('lockedBgramVal');
        if (lockedVal) lockedVal.innerText = totalBalance.toFixed(4) + " BGRAM";
    }
}

function openWithdrawModal() {
    triggerHaptic('selection');
    const modal = document.getElementById('withdrawModal');
    if (modal) modal.classList.add('active');
    const tonAvail = document.getElementById('tonAvailableBalance');
    if (tonAvail) tonAvail.innerText = tonBalance.toFixed(4) + " TON";
}

function closeWithdrawModal() {
    triggerHaptic('selection');
    const modal = document.getElementById('withdrawModal');
    if (modal) modal.classList.remove('active');
}

function requestTonWithdraw() {
    triggerHaptic('impact');
    const addrInput = document.getElementById('tonWalletInput');
    const amtInput = document.getElementById('tonAmountInput');
    
    const address = addrInput ? addrInput.value.trim() : "";
    const amount = amtInput ? parseFloat(amtInput.value) : 0;

    if (!address || address.length < 10) {
        console.log("Alamat dompet TON tidak valid");
        return;
    }
    if (isNaN(amount) || amount < 0.1) {
        console.log("Minimum penarikan 0.1 TON");
        return;
    }
    if (amount > tonBalance) {
        console.log("Saldo TON tidak mencukupi");
        return;
    }

    tonBalance -= amount;
    localStorage.setItem('bgram_ton_balance', tonBalance);
    
    const tonAvail = document.getElementById('tonAvailableBalance');
    if (tonAvail) tonAvail.innerText = tonBalance.toFixed(4) + " TON";
    
    syncDataToServer('request_withdrawal', { wallet: address, amount: amount });
    closeWithdrawModal();
}

function copyReffLink() {
    triggerHaptic('notification');
    const input = document.getElementById('reffLink');
    if (input) {
        input.select();
        document.execCommand('copy');
    }
}

document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});
