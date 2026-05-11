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

    // Modal elements (unchanged)
    const modal = document.getElementById('quick-view-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const modalImg = document.getElementById('modal-main-img');
    const thumbnailContainer = document.getElementById('modal-thumbnails');
    const modalTitle = document.getElementById('modal-title');
    const modalUnitPrice = document.getElementById('modal-unit-price');
    const modalCategoryLabel = document.getElementById('modal-category-label');
    const modalDescText = document.getElementById('modal-desc-text');
    const qtyInput = document.getElementById('modal-qty');
    const calcBaseTotal = document.getElementById('calc-base-total');
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
    // 3. Fetch data and initialise
    // ---------------------------------------------------------------------
    fetch('./data/cards.json')
        .then(res => res.json())
        .then(data => {
            allProducts = data.map(p => ({
                ...p,
                images: (p.images && p.images.length > 0) ? p.images : ['assets/cards/placeholder.jpg'],
                featured: p.featured || false,
                minOrder: p.minOrder || 100,
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
    // 4. Pricing helper – currently used only for the portfolio card
    // ---------------------------------------------------------------------
    function calculateTotalForQuantity(n, unitPrice) {
        let total;
        if (n >= 100 && n <= 199) {
            total = n * unitPrice + 600;
        } else if (n >= 200 && n <= 499) {
            total = n * unitPrice;
        } else if (n >= 500 && n <= 999) {
            total = n * unitPrice * 0.95;
        } else if (n >= 1000) {
            total = n * unitPrice * 0.90;
        } else {
            total = n * unitPrice + 600;
        }
        return Math.round(total);
    }

    // ---------------------------------------------------------------------
    // 5. Build category cards (Collections section)
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
    // 6. Dynamic filter buttons
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
    // 7. Apply filter & show first batch
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
    // 8. Portfolio card – ONLY the 100‑card total (+600), no ID, no unit price
    // ---------------------------------------------------------------------
    function createCardHTML(product) {
        const productJson = encodeURIComponent(JSON.stringify(product));
        const featuredBadge = product.featured ? '<span class="featured-badge">Featured</span>' : '';

        // **Always calculate for exactly 100 cards, including ₹600 surcharge**
        const totalFor100 = 100 * product.price + 600;
        const priceLabel = `Rs. ${totalFor100.toLocaleString()} for 100 cards`;

        return `
            <div class="product-card">
                <div class="product-img-wrapper">
                    ${featuredBadge}
                    <img src="${product.images[0]}" alt="${product.id}" loading="lazy">
                    <div class="quick-view-overlay">
                        <button class="quick-view-btn" data-product="${productJson}">Quick View</button>
                    </div>
                </div>
                <p class="product-starting-price">${priceLabel}</p>
            </div>
        `;
    }

    // ---------------------------------------------------------------------
    // 9. Show more items
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
    // 10. Quick View event delegation (unchanged)
    // ---------------------------------------------------------------------
    productContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.quick-view-btn');
        if (!btn) return;
        const product = JSON.parse(decodeURIComponent(btn.getAttribute('data-product')));
        openProductModal(product);
    });

    showMoreBtn.addEventListener('click', showMoreItems);

    // ---------------------------------------------------------------------
    // 11. Modal logic (untouched – still shows per‑card price)
    // ---------------------------------------------------------------------
    let currentUnitPrice = 0;
    let currentProductName = "";
    let currentProductCategory = "";

    function openProductModal(product) {
        currentProductName = product.id;
        currentProductCategory = product.category;
        modalTitle.textContent = product.name || product.id;
        modalCategoryLabel.textContent = `Allure ${product.category} Collection`;
        modalUnitPrice.textContent = `Rs. ${product.price} / card`;   // intentionally kept

        modalDescText.textContent = product.description || DEFAULT_DESCRIPTION;

        modalImg.src = product.images[0];
        modalImg.alt = product.name || product.id;

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

        currentUnitPrice = product.price;
        qtyInput.value = 100;
        calculateTotal();

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // ---------------------------------------------------------------------
    // 12. Discount calculator (unchanged)
    // ---------------------------------------------------------------------
    function calculateTotal() {
        let qty = parseInt(qtyInput.value);
        if (isNaN(qty) || qty < 100) qty = 100;

        const baseTotal = qty * currentUnitPrice;

        let discountPercent = 0;
        if (qty >= 600) discountPercent = 25;
        else if (qty >= 500) discountPercent = 20;
        else if (qty >= 400) discountPercent = 15;
        else if (qty >= 300) discountPercent = 10;
        else if (qty >= 200) discountPercent = 5;

        const discountAmount = Math.round(baseTotal * (discountPercent / 100));
        const finalTotal = baseTotal - discountAmount;

        calcBaseTotal.textContent = `Rs. ${baseTotal.toLocaleString()}`;
        calcDiscountPct.textContent = discountPercent;
        calcDiscountAmt.textContent = discountAmount.toLocaleString();
        calcFinalTotal.textContent = `Rs. ${finalTotal.toLocaleString()}`;

        const message = `Hello Impressions! I would like to inquire about an Allure card design.\n\n` +
                        `*Design:* ${currentProductName} (${currentProductCategory} Collection)\n` +
                        `*Quantity:* ${qty}\n` +
                        `*Unit Price:* Rs. ${currentUnitPrice}\n` +
                        `*Estimated Total:* Rs. ${finalTotal.toLocaleString()} (Includes ${discountPercent}% volume discount)\n\n` +
                        `Please let me know how to proceed.`;
        whatsappBtn.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    }

    qtyInput.addEventListener('input', calculateTotal);
    qtyInput.addEventListener('change', () => {
        if (parseInt(qtyInput.value) < 100) {
            qtyInput.value = 100;
            calculateTotal();
        }
    });

    // ---------------------------------------------------------------------
    // 13. Close modal
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
    // 14. Footer year
    // ---------------------------------------------------------------------
    document.getElementById('currentYear').textContent = new Date().getFullYear();

});
