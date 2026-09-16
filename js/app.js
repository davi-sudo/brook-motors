// ==========================================================================
// BROOK MOTORS - INTERACTIVE LOGIC (BMW.COM AESTHETIC)
// ==========================================================================

const WHATSAPP_NUMBER = '5519999398473'; // (19) 99939-8473

// State
let currentCategory = 'all';
let searchQuery = '';
let currentSort = 'default';
let activeModalCar = null;
let featuredVisibleCount = 2;
const FEATURED_STEP = 2;
let catalogVisibleCount = 2;
const CATALOG_STEP = 2;

document.addEventListener('DOMContentLoaded', () => {
  initStoreStatus();
  initFeaturedVehicles();
  initCatalogPagination();
  renderCatalog();
  initCategoryFilters();
  initSearchAndSort();
  initTradeInAndFinancing();
  initHeaderScroll();
  initMobileMenu();
});

// 1. Header Scroll effect
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// 2. Mobile Menu Toggle & Drawer
function initMobileMenu() {
  const toggleBtn = document.querySelector('.mobile-menu-toggle');
  const nav = document.querySelector('.main-nav');
  const closeBtn = document.getElementById('mobileNavClose');

  if (toggleBtn && nav) {
    toggleBtn.addEventListener('click', () => {
      nav.classList.add('mobile-active');
      document.body.style.overflow = 'hidden';
    });
  }

  if (closeBtn && nav) {
    closeBtn.addEventListener('click', () => {
      nav.classList.remove('mobile-active');
      document.body.style.overflow = '';
    });
  }

  if (nav) {
    nav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('mobile-active');
        document.body.style.overflow = '';
      });
    });
  }
}

// 3. Store Status (Aberto / Fechado em Tempo Real)
function initStoreStatus() {
  const statusEl = document.getElementById('storeStatus');
  if (!statusEl) return;

  const now = new Date();
  const day = now.getDay(); // 0 = Dom, 1 = Seg, ... 6 = Sab
  const hour = now.getHours();
  const min = now.getMinutes();
  const time = hour + min / 60;

  let isOpen = false;
  let statusText = '';

  if (day >= 1 && day <= 5) {
    // Seg a Sex: 08:00 - 18:00
    if (time >= 8 && time < 18) {
      isOpen = true;
      statusText = 'Aberto agora · Atendimento na loja até às 18:00';
    } else {
      statusText = 'Fechado no momento · Reabrimos às 08:00 (WhatsApp 24h)';
    }
  } else if (day === 6) {
    // Sábado: 08:00 - 13:00
    if (time >= 8 && time < 13) {
      isOpen = true;
      statusText = 'Aberto agora · Atendimento hoje até às 13:00';
    } else {
      statusText = 'Fechado no momento · Reabrimos segunda-feira às 08:00';
    }
  } else {
    // Domingo fechado
    statusText = 'Fechado aos domingos · Atendimento online via WhatsApp';
  }

  statusEl.innerHTML = `
    <span class="pulse-dot ${isOpen ? '' : 'closed'}"></span>
    <span>${statusText}</span>
  `;

  // Highlight today in hours list
  const hoursItems = document.querySelectorAll('.location-hours-item');
  if (hoursItems.length >= 7) {
    hoursItems.forEach(item => item.classList.remove('today'));
    // 0=Sun (item 6), 1=Mon (item 0), 2=Tue (item 1)...
    const idx = day === 0 ? 6 : day - 1;
    if (hoursItems[idx]) {
      hoursItems[idx].classList.add('today');
      const badge = document.createElement('span');
      badge.style.cssText = 'font-size:0.75rem; color:#10b981; font-weight:700; margin-left:8px;';
      badge.textContent = '(Hoje)';
      hoursItems[idx].appendChild(badge);
    }
  }
}

// 4. Render & Controle Destaques Showroom (Colapsado com 2 itens iniciais e paginação de 2 em 2)
function initFeaturedVehicles() {
  const loadMoreBtn = document.getElementById('featuredLoadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      const allFeatured = VEHICLES.filter(v => v.is_featured);
      if (featuredVisibleCount < allFeatured.length) {
        featuredVisibleCount = Math.min(featuredVisibleCount + FEATURED_STEP, allFeatured.length);
      } else {
        // Se já está tudo visível, colapsa de volta para 2 itens
        featuredVisibleCount = 2;
        const destaquesSection = document.getElementById('destaques');
        if (destaquesSection) {
          destaquesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      renderFeaturedVehicles();
    });
  }
  renderFeaturedVehicles();
}

function renderFeaturedVehicles() {
  const container = document.getElementById('featuredVehiclesGrid');
  const loadMoreBtn = document.getElementById('featuredLoadMoreBtn');
  if (!container) return;

  const allFeatured = VEHICLES.filter(v => v.is_featured);
  const visibleFeatured = allFeatured.slice(0, featuredVisibleCount);
  container.innerHTML = visibleFeatured.map(car => createVehicleCardHtml(car)).join('');

  if (loadMoreBtn) {
    if (allFeatured.length <= 2) {
      loadMoreBtn.style.display = 'none';
    } else if (featuredVisibleCount >= allFeatured.length) {
      loadMoreBtn.innerHTML = `
        <span>Recolher destaques</span>
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>
      `;
      loadMoreBtn.classList.add('collapsed-state');
    } else {
      loadMoreBtn.innerHTML = `
        <span>Clique para ver mais</span>
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
      `;
      loadMoreBtn.classList.remove('collapsed-state');
    }
  }
}

// 6. Filtragem e Paginação do Catálogo Geral
function getFilteredVehicles() {
  let filtered = [...VEHICLES];

  // Category Filter
  if (currentCategory !== 'all') {
    filtered = filtered.filter(v => v.category === currentCategory);
  }

  // Text Search
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(v => 
      v.title.toLowerCase().includes(q) ||
      v.brand.toLowerCase().includes(q) ||
      v.year.toLowerCase().includes(q) ||
      v.color.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (currentSort === 'price-asc') {
    filtered.sort((a, b) => a.price_num - b.price_num);
  } else if (currentSort === 'price-desc') {
    filtered.sort((a, b) => b.price_num - a.price_num);
  } else if (currentSort === 'year-desc') {
    filtered.sort((a, b) => b.year_num - a.year_num);
  } else if (currentSort === 'km-asc') {
    filtered.sort((a, b) => parseInt(a.km) - parseInt(b.km));
  }

  return filtered;
}

function initCatalogPagination() {
  const loadMoreBtn = document.getElementById('catalogLoadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      const filtered = getFilteredVehicles();
      if (catalogVisibleCount < filtered.length) {
        catalogVisibleCount = Math.min(catalogVisibleCount + CATALOG_STEP, filtered.length);
      } else {
        catalogVisibleCount = 2;
        const estoqueSection = document.getElementById('estoque');
        if (estoqueSection) {
          estoqueSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      renderCatalog();
    });
  }
}

function renderCatalog() {
  const container = document.getElementById('catalogVehiclesGrid');
  const counterEl = document.getElementById('catalogCount');
  const loadMoreBtn = document.getElementById('catalogLoadMoreBtn');
  if (!container) return;

  const filtered = getFilteredVehicles();

  if (filtered.length === 0) {
    if (counterEl) counterEl.textContent = '0 veículos disponíveis';
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <svg width="48" height="48" fill="none" stroke="#a1a1aa" stroke-width="1.5" viewBox="0 0 24 24" style="margin: 0 auto 16px;">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <h3 style="font-weight: 500; font-size: 1.15rem; margin-bottom: 8px;">Nenhum veículo encontrado</h3>
        <p style="color: #71717a; font-size: 0.9rem; margin-bottom: 20px;">Tente buscar por outro termo ou limpe os filtros para ver todos os modelos.</p>
        <button class="btn btn-primary" onclick="resetCatalogFilters()">Ver Todos os Veículos</button>
      </div>
    `;
    return;
  }

  const visibleList = filtered.slice(0, catalogVisibleCount);
  container.innerHTML = visibleList.map(car => createVehicleCardHtml(car)).join('');

  if (counterEl) {
    counterEl.textContent = `Exibindo ${visibleList.length} de ${filtered.length} ${filtered.length === 1 ? 'veículo disponível' : 'veículos disponíveis'}`;
  }

  if (loadMoreBtn) {
    if (filtered.length <= 2) {
      loadMoreBtn.style.display = 'none';
    } else if (catalogVisibleCount >= filtered.length) {
      loadMoreBtn.style.display = 'inline-flex';
      loadMoreBtn.innerHTML = `
        <span>Recolher estoque</span>
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>
      `;
      loadMoreBtn.classList.add('collapsed-state');
    } else {
      loadMoreBtn.style.display = 'inline-flex';
      loadMoreBtn.innerHTML = `
        <span>Clique para ver mais</span>
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
      `;
      loadMoreBtn.classList.remove('collapsed-state');
    }
  }
}

// Helper: Card HTML Generator
function createVehicleCardHtml(car) {
  const mainImage = car.images && car.images.length > 0 
    ? car.images[0] 
    : 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80';
    
  const photoCount = car.images ? car.images.length : 1;
  const whatsappMsg = encodeURIComponent(`Olá! Vi o veículo ${car.title} (${car.year}) no site da Brook Motors e gostaria de mais informações e condições.`);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`;

  return `
    <article class="car-card" data-id="${car.id}">
      <div class="car-card-img-wrap" onclick="openVehicleModal('${car.id}')" style="cursor:pointer;">
        <img 
          class="car-card-img" 
          src="${mainImage}" 
          alt="${car.title}" 
          loading="lazy"
          onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80';"
        />
        <div class="car-badge-wrap">
          ${car.is_featured ? '<span class="car-badge car-badge-featured">Destaque</span>' : ''}
          <span class="car-badge car-badge-cautelar">Laudo 100%</span>
        </div>
        ${photoCount > 1 ? `
          <div class="car-photos-count">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            <span>${photoCount} fotos</span>
          </div>
        ` : ''}
      </div>

      <div class="car-card-body">
        <div class="car-brand-category">
          <span class="car-brand-name">${car.brand}</span>
          <span style="font-size: 0.72rem; color: #a1a1aa;">${car.category_label}</span>
        </div>

        <h3 class="car-title" onclick="openVehicleModal('${car.id}')" style="cursor:pointer;">${car.title}</h3>

        <div class="car-specs-grid">
          <div class="car-spec-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            <span>${car.year}</span>
          </div>
          <div class="car-spec-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m12 6 4 6-4 6"/></svg>
            <span>${car.km}</span>
          </div>
          <div class="car-spec-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <span>${car.cambio}</span>
          </div>
          <div class="car-spec-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><line x1="12" x2="12" y1="2" y2="6"/></svg>
            <span>${car.color}</span>
          </div>
        </div>

        <div class="car-card-footer">
          <div class="car-price-block">
            <span class="car-price-label">Valor à vista</span>
            <span class="car-price-val">${car.price}</span>
          </div>

          <div class="car-card-actions">
            <button class="btn-card-details" onclick="openVehicleModal('${car.id}')">Ficha</button>
            <a href="${whatsappUrl}" target="_blank" rel="noopener" class="btn-card-whatsapp" title="Falar no WhatsApp sobre este veículo">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.04 20.16C10.63 20.16 9.25 19.79 8.03 19.07L7.69 18.87L4.47 19.72L5.33 16.58L5.11 16.23C4.31 14.97 3.89 13.46 3.89 11.92C3.89 7.38 7.59 3.67 12.05 3.67Z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </article>
  `;
}

// 7. Category Filters
function initCategoryFilters() {
  const buttons = document.querySelectorAll('.filter-cat-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      catalogVisibleCount = 2;
      renderCatalog();
    });
  });
}

// 8. Search & Sort
function initSearchAndSort() {
  const searchInput = document.getElementById('catalogSearchInput');
  const sortSelect = document.getElementById('catalogSortSelect');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      catalogVisibleCount = 2;
      renderCatalog();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      catalogVisibleCount = 2;
      renderCatalog();
    });
  }

  // Quick Hero Search Form
  const heroForm = document.getElementById('heroSearchForm');
  if (heroForm) {
    heroForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const catVal = document.getElementById('heroCategorySelect').value;
      const brandVal = document.getElementById('heroBrandSelect').value;
      const priceVal = document.getElementById('heroPriceSelect').value;

      if (catVal !== 'all') {
        currentCategory = catVal;
        document.querySelectorAll('.filter-cat-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.category === catVal);
        });
      }

      if (brandVal !== 'all') {
        searchQuery = brandVal;
        if (searchInput) searchInput.value = brandVal;
      }

      if (priceVal === 'asc') {
        currentSort = 'price-asc';
        if (sortSelect) sortSelect.value = 'price-asc';
      } else if (priceVal === 'desc') {
        currentSort = 'price-desc';
        if (sortSelect) sortSelect.value = 'price-desc';
      }

      renderCatalog();

      const catalogSection = document.getElementById('estoque');
      if (catalogSection) {
        catalogSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

function resetCatalogFilters() {
  currentCategory = 'all';
  searchQuery = '';
  currentSort = 'default';
  catalogVisibleCount = 2;
  
  const searchInput = document.getElementById('catalogSearchInput');
  if (searchInput) searchInput.value = '';
  
  const sortSelect = document.getElementById('catalogSortSelect');
  if (sortSelect) sortSelect.value = 'default';

  document.querySelectorAll('.filter-cat-btn').forEach((btn, idx) => {
    btn.classList.toggle('active', idx === 0);
  });

  renderCatalog();
}

// 9. Interactive Modal Logic
function openVehicleModal(carId) {
  const car = VEHICLES.find(v => v.id === carId);
  if (!car) return;

  activeModalCar = car;
  const modal = document.getElementById('vehicleModal');
  const mainImg = document.getElementById('modalMainImage');
  const thumbsContainer = document.getElementById('modalThumbs');
  const titleEl = document.getElementById('modalCarTitle');
  const priceEl = document.getElementById('modalCarPrice');
  const specsEl = document.getElementById('modalSpecsList');
  const whatsappBtn = document.getElementById('modalWhatsappBtn');
  const movcarBtn = document.getElementById('modalMovcarBtn');

  titleEl.textContent = car.title;
  priceEl.textContent = car.price;

  const images = car.images && car.images.length > 0 
    ? car.images 
    : ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80'];

  mainImg.src = images[0];

  // Render Thumbnails
  thumbsContainer.innerHTML = images.map((imgUrl, index) => `
    <div class="modal-thumb ${index === 0 ? 'active' : ''}" onclick="switchModalImage('${imgUrl}', this)">
      <img src="${imgUrl}" alt="Foto ${index + 1}" />
    </div>
  `).join('');

  // Specs Table
  specsEl.innerHTML = `
    <tr><th>Marca</th><td>${car.brand}</td></tr>
    <tr><th>Modelo</th><td>${car.title}</td></tr>
    <tr><th>Ano Fabricação / Modelo</th><td>${car.year}</td></tr>
    <tr><th>Quilometragem</th><td>${car.km}</td></tr>
    <tr><th>Câmbio</th><td>${car.cambio}</td></tr>
    <tr><th>Combustível</th><td>${car.combustivel}</td></tr>
    <tr><th>Cor</th><td>${car.color}</td></tr>
    <tr><th>Categoria</th><td>${car.category_label}</td></tr>
    <tr><th>Laudo Cautelar</th><td><span style="color:#10b981; font-weight:700;">✓ 100% Aprovado</span></td></tr>
    <tr><th>Garantia</th><td>90 dias Brook Motors (Motor e Câmbio)</td></tr>
  `;

  // WhatsApp Action
  const msg = encodeURIComponent(`Olá Brook Motors! Gostaria de receber mais informações e detalhes da ${car.title} (${car.year}) que vi no site.`);
  whatsappBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;

  // Movcar External Link
  if (movcarBtn) {
    movcarBtn.href = car.movcar_url;
  }

  // Open modal
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeVehicleModal() {
  const modal = document.getElementById('vehicleModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function switchModalImage(imgUrl, thumbEl) {
  const mainImg = document.getElementById('modalMainImage');
  if (mainImg) {
    mainImg.style.opacity = '0.3';
    setTimeout(() => {
      mainImg.src = imgUrl;
      mainImg.style.opacity = '1';
    }, 150);
  }

  document.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('active'));
  if (thumbEl) thumbEl.classList.add('active');
}

// 10. Trade-in & Financing Calculator
function initTradeInAndFinancing() {
  if (!document.getElementById('financingCarPrice') && !document.getElementById('tradeInForm')) {
    return;
  }
  const entryRange = document.getElementById('financingEntryRange');
  const entryValDisplay = document.getElementById('financingEntryVal');
  const carPriceInput = document.getElementById('financingCarPrice');
  const sim36 = document.getElementById('calc36x');
  const sim48 = document.getElementById('calc48x');
  const sim60 = document.getElementById('calc60x');
  const financeWhatsappBtn = document.getElementById('financeWhatsappBtn');

  function updateFinancing() {
    if (!carPriceInput || !entryRange) return;
    const price = parseFloat(carPriceInput.value) || 120000;
    const entryPercent = parseInt(entryRange.value) || 30;
    const entryVal = price * (entryPercent / 100);

    if (entryValDisplay) {
      entryValDisplay.textContent = `R$ ${Math.round(entryVal).toLocaleString('pt-BR')} (${entryPercent}%)`;
    }

    const balance = price - entryVal;
    const r = 0.0159;
    const p36 = balance * (r * Math.pow(1 + r, 36)) / (Math.pow(1 + r, 36) - 1);
    const p48 = balance * (r * Math.pow(1 + r, 48)) / (Math.pow(1 + r, 48) - 1);
    const p60 = balance * (r * Math.pow(1 + r, 60)) / (Math.pow(1 + r, 60) - 1);

    if (sim36) sim36.textContent = `R$ ${Math.round(p36).toLocaleString('pt-BR')}`;
    if (sim48) sim48.textContent = `R$ ${Math.round(p48).toLocaleString('pt-BR')}`;
    if (sim60) sim60.textContent = `R$ ${Math.round(p60).toLocaleString('pt-BR')}`;

    if (financeWhatsappBtn) {
      const msg = encodeURIComponent(`Olá! Fiz uma simulação de financiamento no site da Brook Motors:
- Valor estimado: R$ ${price.toLocaleString('pt-BR')}
- Entrada: R$ ${Math.round(entryVal).toLocaleString('pt-BR')} (${entryPercent}%)
- Parcela estimada em 48x: R$ ${Math.round(p48).toLocaleString('pt-BR')}
Gostaria de verificar a aprovação com o meu CPF.`);
      financeWhatsappBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
    }
  }

  if (entryRange) {
    entryRange.addEventListener('input', updateFinancing);
  }
  if (carPriceInput) {
    carPriceInput.addEventListener('input', updateFinancing);
    updateFinancing();
  }

  const tradeForm = document.getElementById('tradeInForm');
  if (tradeForm) {
    tradeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const modelo = document.getElementById('tradeModelo').value;
      const ano = document.getElementById('tradeAno').value;
      const km = document.getElementById('tradeKm').value;
      const interesse = document.getElementById('tradeInteresse').value;

      const text = encodeURIComponent(
        `Olá Brook Motors! Gostaria de uma avaliação para troca:
` +
        `🚗 Meu Carro: ${modelo}
` +
        `📅 Ano: ${ano}
` +
        `⚡ Quilometragem: ${km} km
` +
        `🎯 Veículo de Interesse: ${interesse || 'Ainda decidindo'}
` +
        `Poderiam me passar uma estimativa de avaliação?`
      );

      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
    });
  }
}
