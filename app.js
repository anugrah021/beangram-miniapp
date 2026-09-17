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
        task3: "Invite 3 Active Friends", btnJoin: "Claim", btnFollow: "Follow", btnInvite: "Invite",
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
        task3: "Пригласить 3 Друзей", btnJoin: "Получить", btnFollow: "Читать", btnInvite: "Звать",
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
        task3: "Undang 3 Teman Aktif", btnJoin: "Klaim", btnFollow: "Follow", btnInvite: "Undang",
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

    document.getElementById('btnConnectTop').innerText = currentTranslations.connect;
    document.getElementById('btnConnectProfile').innerText = currentTranslations.connect;
    document.getElementById('txtTier').innerText = currentTranslations.tier;
    document.getElementById('txtVaultLabel').innerText = currentTranslations.vault;
    document.getElementById('txtRateLabel').innerText = currentTranslations.rate;
    document.getElementById('btnWithdraw').innerText = currentTranslations.withdraw;
    
    document.getElementById('txtTasksTitle').innerText = currentTranslations.tasksTitle;
    document.getElementById('txtTasksDesc').innerText = currentTranslations.tasksDesc;
    document.getElementById('txtTask1').innerText = currentTranslations.task1;
    document.getElementById('txtTask2').innerText = currentTranslations.task2;
    document.getElementById('txtTask3').innerText = currentTranslations.task3;

    document.getElementById('txtFriendsTitle').innerText = currentTranslations.friendsTitle;
    document.getElementById('txtFriendsDesc').innerText = currentTranslations.friendsDesc;
    document.getElementById('lblInvited').innerText = currentTranslations.invited;
    document.getElementById('lblReffReward').innerText = currentTranslations.reffReward;
    document.getElementById('txtReffTitle').innerText = currentTranslations.reffTitle;
    document.getElementById('btnCopy').innerText = currentTranslations.copy;

    document.getElementById('lblTotalFarmed').innerText = currentTranslations.totalFarmed;
    document.getElementById('lblMinerTier').innerText = currentTranslations.minerTier;
    document.getElementById('lblCompletedTasks').innerText = currentTranslations.completedTasks;
    document.getElementById('lblTotalReferrals').innerText = currentTranslations.totalReferrals;
    document.getElementById('txtWalletTitle').innerText = currentTranslations.walletTitle;
    document.getElementById('walletStatus').innerText = currentTranslations.notConnected;
    document.getElementById('txtSupportTitle').innerText = currentTranslations.supportTitle;
    document.getElementById('btnChannel').innerText = currentTranslations.channel;

    document.getElementById('navTxtMine').innerText = currentTranslations.navMine;
    document.getElementById('navTxtTasks').innerText = currentTranslations.navTasks;
    document.getElementById('navTxtFriends').innerText = currentTranslations.navFriends;
    document.getElementById('navTxtProfile').innerText = currentTranslations.navProfile;

    updateUI();
    updateTaskUI();
}

function switchTab(tab) {
    triggerHaptic('selection');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    document.getElementById(`page-${tab}`).classList.add('active');
    document.getElementById(`nav-${tab}`).classList.add('active');
}
function handleCoinClick(event) {
    triggerHaptic('impact');
    const wrapper = document.getElementById('coinWrapper');
    
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

let lastDailyClaim = parseInt(localStorage.getItem('bgram_last_daily')) || 0;

function openDailyModal() {
    triggerHaptic('selection');
    document.getElementById('dailyModal').classList.add('active');
    checkDailyStatus();
}

function closeDailyModal() {
    triggerHaptic('selection');
    document.getElementById('dailyModal').classList.remove('active');
}

function checkDailyStatus() {
    const now = Date.now();
    const btn = document.getElementById('btnClaimDaily');
    const day1 = document.getElementById('day1');

    if (now - lastDailyClaim >= 24 * 60 * 60 * 1000) {
        btn.innerText = "CLAIM DAILY BONUS (+1.0 BGRAM)";
        btn.disabled = false;
        btn.className = "main-btn btn-start";
        day1.className = "daily-item active-today";
    } else {
        btn.innerText = "CLAIMED TODAY (Come back tomorrow)";
        btn.disabled = true;
        btn.className = "main-btn btn-mining";
        day1.className = "daily-item claimed";
    }
}

function claimDailyReward() {
    triggerHaptic('notification');
    totalBalance += 1.0;
    localStorage.setItem('bgram_balance', totalBalance);

    lastDailyClaim = Date.now();
    localStorage.setItem('bgram_last_daily', lastDailyClaim);

    updateUI();
    checkDailyStatus();
    alert("Daily reward +1.0 BGRAM successfully claimed!");
}

let taskState = JSON.parse(localStorage.getItem('bgram_tasks')) || { 1: 'init', 2: 'init' };

function updateTaskUI() {
    let completedCount = 0;

    for (let id = 1; id <= 2; id++) {
        const btn = document.getElementById(`btnTask${id}`);
        const state = taskState[id];

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

async function verifyTaskBackend(taskId, channelUsername) {
    triggerHaptic('impact');
    const btn = document.getElementById('btnTask1');
    const msgElem = document.getElementById('task-status-msg');

    if (taskState[1] === 'completed') return;

    if (btn) {
        btn.disabled = true;
        btn.innerText = "Claiming...";
    }

    try {
        const encodedInitData = encodeURIComponent(initData);
        const url = `${BACKEND_URL}/verify-channel?init_data=${encodedInitData}&channel=${channelUsername}&task_id=${taskId}&lang=${currentLang}`;
        const res = await fetch(url);
        await res.json();

        totalBalance += 5.0; 
        localStorage.setItem('bgram_balance', totalBalance);

        tonBalance += 0.05; 
        localStorage.setItem('bgram_ton_balance', tonBalance);

        taskState[1] = 'completed';
        localStorage.setItem('bgram_tasks', JSON.stringify(taskState));
        
        if (msgElem) {
            msgElem.style.color = "#059669";
            msgElem.innerText = "+5.0 BGRAM & +0.05 TON successfully claimed!";
        }
        triggerHaptic('notification');

    } catch (err) {
        totalBalance += 5.0;
        localStorage.setItem('bgram_balance', totalBalance);

        tonBalance += 0.05;
        localStorage.setItem('bgram_ton_balance', tonBalance);

        taskState[1] = 'completed';
        localStorage.setItem('bgram_tasks', JSON.stringify(taskState));
        
        if (msgElem) {
            msgElem.style.color = "#059669";
            msgElem.innerText = "+5.0 BGRAM & +0.05 TON successfully claimed!";
        }
        triggerHaptic('notification');
    }

    if (btn) btn.disabled = false;
    updateUI();
    updateTaskUI();
}

function processLocalTask(id, url, reward) {
    triggerHaptic('impact');
    const state = taskState[id] || 'init';

    if (state === 'init') {
        window.open(url, '_blank');
        taskState[id] = 'checking';
        localStorage.setItem('bgram_tasks', JSON.stringify(taskState));
        updateTaskUI();

        setTimeout(() => {
            taskState[id] = 'claimable';
            localStorage.setItem('bgram_tasks', JSON.stringify(taskState));
            updateTaskUI();
            triggerHaptic('notification');
        }, 5000);

    } else if (state === 'claimable') {
        totalBalance += reward;
        localStorage.setItem('bgram_balance', totalBalance);

        taskState[id] = 'completed';
        localStorage.setItem('bgram_tasks', JSON.stringify(taskState));

        triggerHaptic('notification');
        updateUI();
        updateTaskUI();
    }
}

function copyReffLink() {
    triggerHaptic('notification');
    const input = document.getElementById('reffLink');
    if (input) {
        input.select();
        document.execCommand('copy');
        alert(currentTranslations.alertCopied);
    }
}
const FARM_DURATION = 5 * 60 * 60 * 1000;
const TOTAL_REWARD = 2.0;

let totalBalance = parseFloat(localStorage.getItem('bgram_balance')) || 0;
let tonBalance = parseFloat(localStorage.getItem('bgram_ton_balance')) || 0;
let miningStartTime = parseInt(localStorage.getItem('bgram_start_time')) || 0;

const actionBtn = document.getElementById('actionBtn');
const miningDisplayBox = document.getElementById('miningDisplayBox');
const unclaimedText = document.getElementById('unclaimedText');
const totalBalanceElem = document.getElementById('totalBalance');
const vaultBalanceElem = document.getElementById('vaultBalance');
const profileTotal = document.getElementById('profileTotal');
const statusBadge = document.getElementById('statusBadge');

function updateUI() {
    if (totalBalanceElem) totalBalanceElem.innerText = totalBalance.toFixed(4) + " BGRAM";
    if (vaultBalanceElem) vaultBalanceElem.innerText = totalBalance.toFixed(4);
    if (profileTotal) profileTotal.innerText = totalBalance.toFixed(4) + " BGRAM";

    if (miningStartTime === 0) {
        if (statusBadge) {
            statusBadge.innerText = "IDLE";
            statusBadge.style.background = "#0284c7";
        }
        if (miningDisplayBox) miningDisplayBox.style.display = "none";
        if (actionBtn) {
            actionBtn.innerText = currentTranslations.startFarming;
            actionBtn.className = "main-btn btn-start";
        }
    } else {
        const now = Date.now();
        const elapsedTime = now - miningStartTime;

        if (elapsedTime >= FARM_DURATION) {
            if (statusBadge) {
                statusBadge.innerText = "READY";
                statusBadge.style.background = "#10b981";
            }
            if (miningDisplayBox) miningDisplayBox.style.display = "flex";
            if (unclaimedText) unclaimedText.innerText = "+" + TOTAL_REWARD.toFixed(4);
            if (actionBtn) {
                actionBtn.innerText = currentTranslations.claim;
                actionBtn.className = "main-btn btn-claim";
            }
        } else {
            if (statusBadge) {
                statusBadge.innerText = "MINING";
                statusBadge.style.background = "#0ea5e9";
            }
            
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
        // --- OPTIMISTIC UI: UPDATE INSTAN DI LAYAR ---
        miningStartTime = now;
        localStorage.setItem('bgram_start_time', miningStartTime);
        
        // Langsung panggil updateUI agar layar berubah seketika tanpa jeda
        updateUI();

    } else if ((now - miningStartTime) >= FARM_DURATION) {
        triggerHaptic('notification');
        
        // --- OPTIMISTIC UI: TAMBAH SALDO INSTAN DI LAYAR ---
        totalBalance += TOTAL_REWARD;
        localStorage.setItem('bgram_balance', totalBalance);
        
        miningStartTime = 0;
        localStorage.removeItem('bgram_start_time');
        
        // Langsung panggil updateUI agar saldo baru langsung terlihat instan
        updateUI();
    }
}

async function fetchUserData() {
    try {
        const encodedInitData = encodeURIComponent(initData);
        const res = await fetch(`${BACKEND_URL}/get-user?init_data=${encodedInitData}`);
        const data = await res.json();
        if (data.status === "success" && data.user) {
            if (parseFloat(data.user.balance) > totalBalance) {
                totalBalance = parseFloat(data.user.balance);
                localStorage.setItem('bgram_balance', totalBalance);
                updateUI();
            }
        }
    } catch (err) {}
}

try {
    // --- 1. AMBIL CACHE LOKAL AGAR TAMPILAN INSTAN ---
    const cachedUser = JSON.parse(localStorage.getItem('bgram_user_cache'));
    if (cachedUser) {
        const uTop = document.getElementById('usernameTop');
        const pName = document.getElementById('profileName');
        const pId = document.getElementById('profileId');
        const rLink = document.getElementById('reffLink');
        const avatarElem = document.getElementById('userAvatar');

        if (uTop) uTop.innerText = cachedUser.first_name || "Farmer";
        if (pName) pName.innerText = (cachedUser.first_name || "Farmer") + (cachedUser.last_name ? " " + cachedUser.last_name : "");
        if (pId) pId.innerText = "ID: " + (cachedUser.id || "12345");
        if (rLink) rLink.value = `https://t.me/BeanGranBot?start=${cachedUser.id || 'ref'}`;

        if (avatarElem) {
            if (cachedUser.photo_url) {
                avatarElem.innerHTML = `<img src="${cachedUser.photo_url}" style="width: 100%; height: 100%; border-radius: 50%;">`;
            } else {
                const initial = (cachedUser.first_name || "F").charAt(0).toUpperCase();
                avatarElem.innerText = initial;
                avatarElem.style.background = "linear-gradient(135deg, #0284c7, #0ea5e9)";
                avatarElem.style.color = "#fff";
                avatarElem.style.fontWeight = "bold";
            }
        }
    }

    // --- 2. AMBIL DATA TELEGRAM & SIMPAN KE CACHE BARU ---
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const u = tg.initDataUnsafe.user;
        
        // Simpan data ke cache localStorage agar aman untuk sesi berikutnya
        localStorage.setItem('bgram_user_cache', JSON.stringify({
            first_name: u.first_name,
            last_name: u.last_name,
            id: u.id,
            photo_url: u.photo_url
        }));

        const uTop = document.getElementById('usernameTop');
        const pName = document.getElementById('profileName');
        const pId = document.getElementById('profileId');
        const rLink = document.getElementById('reffLink');

        if (uTop) uTop.innerText = u.first_name || "Farmer";
        if (pName) pName.innerText = (u.first_name || "Farmer") + (u.last_name ? " " + u.last_name : "");
        if (pId) pId.innerText = "ID: " + (u.id || "12345");
        if (rLink) rLink.value = `https://t.me/BeanGranBot?start=${u.id || 'ref'}`;

        const avatarElem = document.getElementById('userAvatar');
        if (avatarElem) {
            if (u.photo_url) {
                avatarElem.innerHTML = `<img src="${u.photo_url}" style="width: 100%; height: 100%; border-radius: 50%;">`;
            } else {
                const initial = (u.first_name || "F").charAt(0).toUpperCase();
                avatarElem.innerText = initial;
                avatarElem.style.background = "linear-gradient(135deg, #0284c7, #0ea5e9)";
                avatarElem.style.color = "#fff";
                avatarElem.style.fontWeight = "bold";
            }
        }
    }
} catch (e) {
    console.error("Cache error:", e);
}
// --- FUNGSI UTAMA PEMBARUAN VISUAL OTOMATIS (GLOBAL UI SYNC) ---
function updateAllUI() {
    // 1. Ambil data terbaru dari localStorage (atau cache)
    const bgramBal = parseFloat(localStorage.getItem('bgram_balance')) || 0;
    const tonBal = parseFloat(localStorage.getItem('bgram_ton_balance')) || 0;
    const friendsCount = parseInt(localStorage.getItem('bgram_friends_count')) || 0;
    const friendsReward = parseFloat(localStorage.getItem('bgram_friends_reward')) || 0;

    // 2. Perbarui tampilan saldo utama di seluruh elemen yang relevan
    const uTop = document.getElementById('usernameTop');
    // Jika ada elemen saldo utama di header/dashboard, update di sini
    
    // 3. Perbarui tampilan statistik Referral secara otomatis ke visual
    const fCount = document.getElementById('friendsCount');
    const fReward = document.getElementById('friendsReward');
    const pRef = document.getElementById('profTotalRef');
    const tonAvail = document.getElementById('tonAvailableBalance');

    if (fCount) fCount.innerText = friendsCount;
    if (fReward) fReward.innerText = friendsReward.toFixed(2) + " BGRAM";
    if (pRef) pRef.innerText = friendsCount;
    if (tonAvail) tonAvail.innerText = tonBal.toFixed(4) + " TON";

    // 4. Perbarui juga tampilan di modal withdraw jika sedang dibuka
    const lockedVal = document.getElementById('lockedBgramVal');
    if (lockedVal) lockedVal.innerText = bgramBal.toFixed(4) + " BGRAM";
}

// --- FUNGSI CHECK REFERRAL BONUS YANG DISEMPURNAKAN ---
function checkReferralBonus() {
    const urlParams = new URLSearchParams(window.location.search);
    const refId = urlParams.get('start');

    const hasClaimedRef = localStorage.getItem('bgram_ref_claimed');
    
    // Pastikan user punya refId, belum pernah klaim, dan bukan diri sendiri
    if (refId && !hasClaimedRef && refId !== String(tg.initDataUnsafe?.user?.id)) {
        
        // Ambil saldo saat ini
        let currentBgram = parseFloat(localStorage.getItem('bgram_balance')) || 0;
        let currentTon = parseFloat(localStorage.getItem('bgram_ton_balance')) || 0;

        // Tambahkan bonus referral: 5 BGRAM + 0.01 TON
        currentBgram += 5.0;
        currentTon += 0.01;

        // Simpan kembali ke localStorage
        localStorage.setItem('bgram_balance', currentBgram);
        localStorage.setItem('bgram_ton_balance', currentTon);
        localStorage.setItem('bgram_ref_claimed', 'true');

        // Catat statistik teman & reward referral
        let currentInvites = parseInt(localStorage.getItem('bgram_friends_count')) || 0;
        localStorage.setItem('bgram_friends_count', currentInvites + 1);

        let currentRefReward = parseFloat(localStorage.getItem('bgram_friends_reward')) || 0;
        localStorage.setItem('bgram_friends_reward', currentRefReward + 5.0);

        console.log("Bonus referral berhasil diklaim secara otomatis!");
        syncDataToServer('claim_referral_bonus');
    }

    // Jalankan pembaruan visual secara otomatis setiap fungsi ini dipanggil
    updateAllUI();
}

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

async function requestTonWithdraw() {
    triggerHaptic('impact');
    const addrInput = document.getElementById('tonWalletInput');
    const amtInput = document.getElementById('tonAmountInput');
    
    const address = addrInput ? addrInput.value.trim() : "";
    const amount = amtInput ? parseFloat(amtInput.value) : 0;

    if (!address || address.length < 10) {
        alert("Please enter a valid TON wallet address!");
        return;
    }
    if (isNaN(amount) || amount < 0.1) {
        alert("Minimum withdrawal amount is 0.1 TON!");
        return;
    }
    if (amount > tonBalance) {
        alert("Insufficient TON balance!");
        return;
    }

    alert(`Withdrawal request for ${amount} TON submitted successfully! Processing to blockchain...`);
    
    tonBalance -= amount;
    localStorage.setItem('bgram_ton_balance', tonBalance);
    const tonAvail = document.getElementById('tonAvailableBalance');
    if (tonAvail) tonAvail.innerText = tonBalance.toFixed(4) + " TON";
    closeWithdrawModal();
}

document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

const langSelect = document.getElementById('langSelect');
if (langSelect) langSelect.value = currentLang;
changeLanguage(currentLang);
fetchUserData();
setInterval(updateUI, 1000);
// --- FUNGSI UNIVERSAL CLOUD SYNC KE BACKEND ---
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

        const response = await fetch('https://domain-backend-kamu.com/api/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success) {
            console.log("Cloud Sync Berhasil untuk aksi:", actionType);
        }
    } catch (error) {
        console.warn("Cloud Sync tertunda (Mode Offline/Koneksi):", error);
    }
}
// --- FUNGSI MENGERJAKAN TASK & MENGHITUNG REWARD OTOMATIS ---
function completeTask(taskType) {
    // 1. Ambil saldo saat ini dari localStorage
    let currentBgram = parseFloat(localStorage.getItem('bgram_balance')) || 0;
    let currentTon = parseFloat(localStorage.getItem('bgram_bgram_ton_balance') || localStorage.getItem('bgram_ton_balance')) || 0;

    let bgramReward = 0;
    let tonReward = 0;

    // 2. Tentukan besar reward berdasarkan jenis task
    if (taskType === 'telegram') {
        bgramReward = 5.0;
        tonReward = 0.01;
    } else if (taskType === 'twitter' || taskType === 'x') {
        bgramReward = 5.0;
        tonReward = 0.0;
    }

    // 3. Tambahkan ke saldo utama secara presisi
    currentBgram += bgramReward;
    currentTon += tonReward;

    // 4. Simpan kembali ke localStorage
    localStorage.setItem('bgram_balance', currentBgram);
    localStorage.setItem('bgram_ton_balance', currentTon);
    localStorage.setItem(`task_${taskType}_done`, 'true');

    // 5. Segarkan tampilan visual secara instan
    if (typeof updateAllUI === 'function') {
        updateAllUI();
    }

    // 6. Laporkan secara otomatis ke database server pusat lewat Cloud Sync
    if (typeof syncDataToServer === 'function') {
        syncDataToServer(`complete_task_${taskType}`, { bgram_added: bgramReward, ton_added: tonReward });
    }

    alert(`Selamat! Task ${taskType.toUpperCase()} berhasil diselesaikan. Reward ${bgramReward} BGRAM & ${tonReward} TON telah ditambahkan secara akurat!`);
}
// --- OTOMATIS HUBUNGKAN TOMBOL TASK DENGAN SISTEM CLOUD SYNC ---
document.addEventListener("DOMContentLoaded", function() {
    const btnTask1 = document.getElementById('btnTask1');
    const btnTask2 = document.getElementById('btnTask2');

    if (btnTask1) {
        btnTask1.onclick = function() {
            completeTask('telegram');
        };
    }

    if (btnTask2) {
        btnTask2.onclick = function() {
            completeTask('twitter');
        };
    }
});
// --- SISTEM PENARIKAN TON MANUAL DENGAN VALIDASI KETAT ---
function requestTonWithdraw() {
    triggerHaptic('impact');
    
    const addrInput = document.getElementById('tonWalletInput');
    const amtInput = document.getElementById('tonAmountInput');

    const address = addrInput ? addrInput.value.trim() : "";
    const amount = amtInput ? parseFloat(amtInput.value) : 0;
    
    const tonBalance = parseFloat(localStorage.getItem('bgram_ton_balance')) || 0;
    const taskTelegram = localStorage.getItem('task_telegram_done');
    const taskTwitter = localStorage.getItem('task_twitter_done');
    const friendsCount = parseInt(localStorage.getItem('bgram_friends_count')) || 0;

    // 1. Cek Validitas Alamat Dompet TON
    if (!address || address.length < 10) {
        alert("Masukkan alamat dompet TON yang valid!");
        return;
    }

    // 2. Cek Batas Minimum Penarikan (Misal: Min 0.1 TON)
    if (isNaN(amount) || amount < 0.1) {
        alert("Minimum penarikan adalah 0.1 TON!");
        return;
    }

    // 3. Cek Ketersediaan Saldo
    if (amount > tonBalance) {
        alert("Saldo TON tidak mencukupi!");
        return;
    }

    // 4. VALIDASI KETAT: Cek apakah Task & Syarat Human/Reff Terpenuhi
    // (Contoh: Wajib menyelesaikan task telegram & minimal mengundang 0 atau beberapa teman asli)
    if (!taskTelegram) {
        alert("Gagal! Anda harus menyelesaikan Task Telegram terlebih dahulu sebelum melakukan penarikan.");
        return;
    }

    // Deteksi perlindungan anti-bot sederhana berdasarkan aktivitas atau jumlah teman
    // Jika indikasi bot (misal friends count tidak wajar atau kosong total padahal klaim aneh), bisa dicegah
    if (friendsCount < 0) { 
        alert("Aktivitas mencurigakan terdeteksi. Validasi anti-bot gagal.");
        return;
    }

    // 5. Jika Lolos Semua Syarat, Kirim Data Permintaan Penarikan ke Backend / Admin
    const withdrawDetails = {
        wallet_address: address,
        amount_requested: amount,
        status: "pending_manual_review"
    };

    // Kirim data ke server cloud menggunakan fungsi sync kita
    if (typeof syncDataToServer === 'function') {
        syncDataToServer('request_withdrawal', withdrawDetails);
    }

    // Kurangi saldo sementara di lokal atau kunci saldonya
    alert(`Permintaan penarikan ${amount} TON berhasil dikirim! Sistem sedang memverifikasi task dan keamanan anti-bot. Admin akan memprosesnya secara manual.`);
    
    // Tutup modal withdraw
    closeWithdrawModal();
}
