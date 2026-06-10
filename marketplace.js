const API_BASE = window.location.origin;
const vendorGrid = document.getElementById('vendor-grid');
const resultsBox = document.getElementById('marketplace-results');
const searchInput = document.getElementById('market-search-input');
const searchBtn = document.getElementById('market-search-btn');
const merchantForm = document.getElementById('merchant-join');
const merchantName = document.getElementById('merchant-name');
const merchantPlatform = document.getElementById('merchant-platform');
const merchantUrl = document.getElementById('merchant-url');
const merchantEmail = document.getElementById('merchant-email');
const merchantPhone = document.getElementById('merchant-phone');
const merchantCategories = document.getElementById('merchant-categories');
const merchantDescription = document.getElementById('merchant-description');
const merchantSubmit = document.getElementById('merchant-submit');
const merchantMsg = document.getElementById('merchant-msg');

window.addEventListener('DOMContentLoaded', function() {
    loadVendors();
    bindSearch();
    bindMerchantForm();
});

async function loadVendors() {
    try {
        const res = await fetch(API_BASE + '/api/vendors');
        const vendors = await res.json();
        if (!Array.isArray(vendors) || vendors.length === 0) {
            vendorGrid.innerHTML = '<div class="loader-card">Tidak ada vendor partner ditemukan.</div>';
            return;
        }

        vendorGrid.innerHTML = vendors.map(renderVendorCard).join('');
    } catch (error) {
        console.error('Vendor load error:', error);
        vendorGrid.innerHTML = '<div class="loader-card">Gagal memuat vendor partner. Coba lagi nanti.</div>';
    }
}

function renderVendorCard(vendor) {
    return `<div class="vendor-card">
        <div class="vendor-logo"><img src="${vendor.logo || 'https://via.placeholder.com/120x120?text=Vendor'}" alt="${vendor.name}"></div>
        <div class="vendor-body">
            <h3>${vendor.name}</h3>
            <p class="vendor-platform">${vendor.platform}</p>
            <p>${vendor.description}</p>
            <p class="vendor-categories">Kategori: ${vendor.categories || 'Umum'}</p>
        </div>
        <a href="${vendor.storeUrl}" target="_blank" class="btn vendor-btn">Kunjungi Toko</a>
    </div>`;
}

function bindSearch() {
    searchBtn.addEventListener('click', runSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            runSearch();
        }
    });
}

async function runSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        resultsBox.innerHTML = '<div class="search-empty">Masukkan kata kunci untuk mencari produk.</div>';
        return;
    }

    resultsBox.innerHTML = '<div class="loader-card">Mencari produk di marketplace...</div>';

    try {
        const res = await fetch(API_BASE + '/api/search?q=' + encodeURIComponent(query));
        const data = await res.json();
        renderMarketplaceResults(data, query);
    } catch (error) {
        console.error('Marketplace search error:', error);
        resultsBox.innerHTML = '<div class="loader-card">Gagal mencari produk. Coba lagi nanti.</div>';
    }
}

function renderMarketplaceResults(data, query) {
    const localHits = data.local || [];
    const marketplaceHits = data.marketplace || [];

    if (localHits.length === 0 && marketplaceHits.length === 0) {
        resultsBox.innerHTML = `<div class="search-empty">Tidak ada produk ditemukan untuk "${query}".</div>`;
        return;
    }

    const localSection = localHits.length > 0 ? `
        <div class="search-group-title">Produk LUXE.M</div>
        <div class="result-grid">
            ${localHits.map(renderLocalResult).join('')}
        </div>
    ` : '';

    const marketplaceSection = marketplaceHits.length > 0 ? `
        <div class="search-group-title">Marketplace Partner</div>
        <div class="result-grid">
            ${marketplaceHits.map(renderMarketplaceResult).join('')}
        </div>
    ` : '';

    resultsBox.innerHTML = localSection + marketplaceSection;
}

function renderLocalResult(item) {
    return `<div class="marketplace-item-card">
        <img src="${item.img || 'https://via.placeholder.com/200x200?text=Image'}" alt="${item.name}">
        <div class="marketplace-item-body">
            <h4>${item.name}</h4>
            <p>${item.brand}</p>
            <p class="marketplace-price">Rp ${parseInt(item.price, 10).toLocaleString('id-ID')}</p>
            <p class="marketplace-badge">Lokal</p>
        </div>
    </div>`;
}

function renderMarketplaceResult(item) {
    return `<div class="marketplace-item-card">
        <img src="${item.img || 'https://via.placeholder.com/200x200?text=Image'}" alt="${item.name}">
        <div class="marketplace-item-body">
            <h4>${item.name}</h4>
            <p>${item.brand}</p>
            <p class="marketplace-price">Rp ${parseInt(item.price, 10).toLocaleString('id-ID')}</p>
            <p class="marketplace-badge">${item.source || 'Marketplace'}</p>
            <a href="${item.sourceUrl}" target="_blank" class="btn btn-small">Lihat di Toko</a>
        </div>
    </div>`;
}

function bindMerchantForm() {
    if (!merchantSubmit) return;
    merchantSubmit.addEventListener('click', submitMerchantApplication);
}

async function submitMerchantApplication() {
    if (!merchantName.value.trim() || !merchantUrl.value.trim() || !merchantEmail.value.trim()) {
        showMerchantMessage('Isi nama toko, email, dan URL toko terlebih dahulu.', 'error');
        return;
    }

    merchantSubmit.disabled = true;
    merchantSubmit.textContent = 'Mengirim...';
    showMerchantMessage('', '');

    const payload = {
        name: merchantName.value.trim(),
        platform: merchantPlatform.value,
        storeUrl: merchantUrl.value.trim(),
        email: merchantEmail.value.trim(),
        phone: merchantPhone.value.trim(),
        categories: merchantCategories.value.trim(),
        description: merchantDescription.value.trim()
    };

    try {
        const res = await fetch(API_BASE + '/api/merchants/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal mengirim aplikasi merchant');

        showMerchantMessage('Terima kasih! Aplikasi merchant Anda telah terkirim.', 'success');
        merchantName.value = '';
        merchantUrl.value = '';
        merchantEmail.value = '';
        merchantPhone.value = '';
        merchantCategories.value = '';
        merchantDescription.value = '';
    } catch (error) {
        console.error('Merchant application error:', error);
        showMerchantMessage(error.message || 'Gagal mengirim aplikasi.', 'error');
    } finally {
        merchantSubmit.disabled = false;
        merchantSubmit.textContent = 'Daftar Merchant';
    }
}

function showMerchantMessage(text, type) {
    if (!merchantMsg) return;
    merchantMsg.textContent = text;
    merchantMsg.style.color = type === 'success' ? '#27ae60' : '#e74c3c';
}
