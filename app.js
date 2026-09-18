// Fungsi untuk mengatur perpindahan halaman saat 5 menu di bawah diklik
function switchTab(tabName) {
    // Sembunyikan semua halaman yang memiliki awalan id "page-"
    const pages = document.querySelectorAll('[id^="page-"]');
    pages.forEach(page => {
        page.style.display = "none";
        page.classList.remove("page-active");
    });

    // Tampilkan halaman yang dituju berdasarkan nama tab-nya
    const targetPage = document.getElementById("page-" + tabName);
    if (targetPage) {
        targetPage.style.display = "block";
        targetPage.classList.add("page-active");
    }

    // Pindahkan status aktif (warna menyala) pada menu navigasi bawah
    const navItems = document.querySelectorAll(".bottom-nav .nav-item");
    navItems.forEach(item => item.classList.remove("active"));
    
    const activeNav = document.getElementById("nav-" + tabName);
    if (activeNav) {
        activeNav.classList.add("active");
    }
}

// Otomatis aktifkan halaman utama saat pertama kali dibuka
document.addEventListener("DOMContentLoaded", () => {
    switchTab('game');
});
