document.addEventListener("DOMContentLoaded", () => {

    // 1. Preloader
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.style.opacity = '0';
            preloader.style.visibility = 'hidden';
        }, 800);
    });

    // 2. Constants
    const whatsappNumber = "919526577999";
    const DEFAULT_DESCRIPTION = "Experience the timeless elegance of this design. Crafted on premium materials with exquisite detailing.";
    const ITEMS_PER_PAGE = 12;

    // DOM elements
    const productContainer = document.getElementById('product-container');
    const showMoreBtn = document.getElementById('show-more-btn');
    const filterContainer = document.getElementById('filter-container');
    const categoryGrid = document.getElementById('category-grid');

    // Modal elements
    const modal = document.getElementById('quick-view-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const modalImg = document.getElementById('modal-main-img');
    const thumbnailContainer = document.getElementById('modal-thumbnails');
    const modalTitle = document.getElementById('modal-title');
    const modalUnitPrice = document.getElementById('modal-unit-price');
    const modalCategoryLabel = document.getElementById('modal-category-label');
    const modalDescText = document.getElementById('modal-desc-text');

    // NEW: select dropdown
    const qtySelect = document.getElementById('modal-qty-select');
    const calcCardCost = document.getElementById('calc-card-cost');
    const printingRow = document.getElementById('printing-row');
    const discountRow = document.getElementById('discount-row');
    const calcDiscountPct = document.getElementById('calc-discount-pct');
    const calcDiscountAmt = document.getElementById('calc-discount-amt');
    const calcFinalTotal = document.getElementById('calc-final-total');
    const whatsappBtn = document.getElementById('modal-whatsapp-btn');

    // State
    let allProducts = [];
    let filteredProducts = [];
    let visibleCount = 0;
    let currentFilter = 'All';

    // ---------------------------------------------------------------------
    // 3. Fetch data and initialize
    // ---------------------------------------------------------------------
    fetch('./data/cards.json')
        .then(res => res.json())
        .then(data => {
            allProducts = data.map(p => ({
                ...p,
                images: (p.images && p.images.length > 0) ? p.images : ['assets/cards/placeholder.jpg'],
                featured: p.featured || false,
                minOrder: p.minOrder || 100,         // for dropdown start
                description: p.description || DEFAULT_DESCRIPTION
            }));

            buildCategoryMenu();
            buildFilterButtons();
            applyFilter('All');
            updateShowMoreButton();
        })
        .catch(err => {
            console.error('Failed to load cards.json', err);
            productContainer.innerHTML = '<p class="no-products" style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-light);">Unable to load designs. Please try again later.</p>';
        });

    // ---------------------------------------------------------------------
    // 4. Build category cards
    // ---------------------------------------------------------------------
    function buildCategoryMenu() {
        const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
        categoryGrid.innerHTML = categories.map(cat => `
            <div class="category-card" data-category="${cat}">
                <h3>${cat}</h3>
                <p>${cat === 'Heritage' ? 'Rich, traditional luxury' : 
                     cat === 'Minimal' ? 'Understated elegance' :
                     cat === 'Floral' ? "Nature's romantic touch" :
                     cat === 'Modern' ? 'Contemporary & bold' :
                     'Explore our exclusive collection'}</p>
            </div>
        `).join('');

        categoryGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.category-card');
            if (!card) return;
            const cat = card.dataset.category;
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.filter === cat) btn.classList.add('active');
            });
            applyFilter(cat);
            document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // ---------------------------------------------------------------------
    // 5. Dynamic filter buttons
    // ---------------------------------------------------------------------
    function buildFilterButtons() {
        const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
        filterContainer.querySelectorAll('.filter-btn:not([data-filter="All"])').forEach(btn => btn.remove());

        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.dataset.filter = cat;
            btn.textContent = cat;
            filterContainer.appendChild(btn);
        });

        filterContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-btn');
            if (!btn) return;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilter(btn.dataset.filter);
        });
    }

    // ---------------------------------------------------------------------
    // 6. Apply filter & render first batch
    // ---------------------------------------------------------------------
    function applyFilter(filterCat) {
        currentFilter = filterCat;
        filteredProducts = filterCat === 'All'
            ? [...allProducts]
            : allProducts.filter(p => p.category === filterCat);

        filteredProducts.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

        visibleCount = Math.min(ITEMS_PER_PAGE, filteredProducts.length);
        productContainer.innerHTML = '';

        if (filteredProducts.length === 0) {
            productContainer.innerHTML = '<p class="no-products" style="grid-column:1/-1; text-align:center; color:var(--text-light); padding:40px;">No designs found in this collection.</p>';
        } else {
            const initialItems = filteredProducts.slice(0, visibleCount);
            productContainer.innerHTML = initialItems.map(product => createCardHTML(product)).join('');
        }

        updateShowMoreButton();
    }

    // ---------------------------------------------------------------------
    // 7. Create card HTML (unchanged – will still show ID and per‑card price)
    // ---------------------------------------------------------------------
    function createCardHTML(product) {
        const productJson = encodeURIComponent(JSON.stringify(product));
        const featuredBadge = product.featured ? '<span class="featured-badge">Featured</span>' : '';
        return `
            <div class="product-card">
                <div class="product-img-wrapper">
                    ${featuredBadge}
                    <img src="${product.images[0]}" alt="${product.id}" loading="lazy">
                    <div class="quick-view-overlay">
                        <button class="quick-view-btn" data-product="${productJson}">Quick View</button>
                    </div>
                </div>
                <h4 class="product-id">${product.id}</h4>
                <p class="product-price">Rs. ${product.price} / card</p>
            </div>
        `;
    }

    // ---------------------------------------------------------------------
    // 8. Show more items
    // ---------------------------------------------------------------------
    function showMoreItems() {
        const nextCount = Math.min(visibleCount + ITEMS_PER_PAGE, filteredProducts.length);
        const newItems = filteredProducts.slice(visibleCount, nextCount);
        if (newItems.length > 0) {
            const cardsHTML = newItems.map(product => createCardHTML(product)).join('');
            productContainer.insertAdjacentHTML('beforeend', cardsHTML);
        }
        visibleCount = nextCount;
        updateShowMoreButton();
    }

    function updateShowMoreButton() {
        showMoreBtn.style.display = (visibleCount < filteredProducts.length) ? 'inline-block' : 'none';
    }

    // ---------------------------------------------------------------------
    // 9. Quick View event delegation
    // ---------------------------------------------------------------------
    productContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.quick-view-btn');
        if (!btn) return;
        const product = JSON.parse(decodeURIComponent(btn.getAttribute('data-product')));
        openProductModal(product);
    });

    showMoreBtn.addEventListener('click', showMoreItems);

    // ---------------------------------------------------------------------
    // 10. MODAL LOGIC (REWRITTEN – dropdown, transparent pricing)
    // ---------------------------------------------------------------------
    let currentUnitPrice = 0;
    let currentProductName = "";
    let currentProductCategory = "";
    let currentMinOrder = 100;

    function openProductModal(product) {
        currentProductName = product.id;
        currentProductCategory = product.category;
        currentUnitPrice = product.price;
        currentMinOrder = product.minOrder || 100;

        modalTitle.textContent = product.name || product.id;
        modalCategoryLabel.textContent = `Allure ${product.category} Collection`;
        modalUnitPrice.textContent = `Rs. ${product.price} / card`;

        modalDescText.textContent = product.description || DEFAULT_DESCRIPTION;

        // Main image
        modalImg.src = product.images[0];
        modalImg.alt = product.name || product.id;

        // Thumbnails
        thumbnailContainer.innerHTML = '';
        if (product.images.length > 1) {
            product.images.forEach((imgSrc, index) => {
                const thumbDiv = document.createElement('div');
                thumbDiv.className = `thumb ${index === 0 ? 'active' : ''}`;
                thumbDiv.innerHTML = `<img src="${imgSrc}" alt="Thumbnail ${index + 1}">`;

                thumbDiv.addEventListener('click', () => {
                    modalImg.style.opacity = '0.5';
                    setTimeout(() => {
                        modalImg.src = imgSrc;
                        modalImg.style.opacity = '1';
                    }, 150);
                    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
                    thumbDiv.classList.add('active');
                });

                thumbnailContainer.appendChild(thumbDiv);
            });
        }

        // Populate dropdown from minOrder to 1500 in steps of 50
        populateQtyDropdown(currentMinOrder);

        // Bind change event and calculate
        qtySelect.removeEventListener('change', calculateTotal);
        qtySelect.addEventListener('change', calculateTotal);
        calculateTotal();

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function populateQtyDropdown(minOrder) {
        qtySelect.innerHTML = '';
        for (let qty = minOrder; qty <= 1500; qty += 50) {
            const option = document.createElement('option');
            option.value = qty;
            option.textContent = qty.toLocaleString() + ' cards';
            if (qty === minOrder) option.selected = true;
            qtySelect.appendChild(option);
        }
    }

    function calculateTotal() {
        const qty = parseInt(qtySelect.value, 10);

        // 1. Card cost (raw)
        const cardCost = qty * currentUnitPrice;

        // 2. Determine printing charge
        const printingCharge = qty < 200 ? 600 : 0;

        // 3. Determine discount factor
        let factor = 1.0;
        let discountPercent = 0;
        if (qty >= 1000) {
            factor = 0.90;
            discountPercent = 10;
        } else if (qty >= 500) {
            factor = 0.95;
            discountPercent = 5;
        }
        // (200-499: no discount, no printing charge – factor stays 1.0)

        // 4. Discount amount (savings)
        const discountAmount = Math.round(cardCost * (1 - factor));

        // 5. Final total
        const finalTotal = Math.round(cardCost * factor) + printingCharge;

        // Update DOM
        calcCardCost.textContent = `Rs. ${cardCost.toLocaleString()}`;

        // Printing row
        if (printingCharge > 0) {
            printingRow.style.display = 'flex';
        } else {
            printingRow.style.display = 'none';
        }

        // Discount row
        if (discountPercent > 0) {
            discountRow.style.display = 'flex';
            calcDiscountPct.textContent = discountPercent;
            calcDiscountAmt.textContent = discountAmount.toLocaleString();
        } else {
            discountRow.style.display = 'none';
        }

        calcFinalTotal.textContent = `Rs. ${finalTotal.toLocaleString()}`;

        // WhatsApp message (no unit price)
        const message = `Hello Impressions! I would like to inquire about an Allure card design.\n\n` +
                        `*Design:* ${currentProductName} (${currentProductCategory} Collection)\n` +
                        `*Quantity:* ${qty}\n` +
                        `*Estimated Total:* Rs. ${finalTotal.toLocaleString()}\n\n` +
                        `Please let me know how to proceed.`;
        whatsappBtn.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    }

    // ---------------------------------------------------------------------
    // 11. Close modal
    // ---------------------------------------------------------------------
    closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // ---------------------------------------------------------------------
    // 12. Footer year
    // ---------------------------------------------------------------------
    document.getElementById('currentYear').textContent = new Date().getFullYear();

});
