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
    const DEFAULT_MIN_ORDER = 100; // Default minimum order if not specified
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
    const qtyInput = document.getElementById('modal-qty');
    const calcBaseTotal = document.getElementById('calc-base-total');
    const discountRow = document.getElementById('discount-row');
    const discountLabel = document.getElementById('discount-label');
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
    // 3. Fetch data and initialize everything
    // ---------------------------------------------------------------------
    fetch('./data/cards.json')
        .then(res => res.json())
        .then(data => {
            allProducts = data.map(p => ({
                ...p,
                images: (p.images && p.images.length > 0) ? p.images : ['assets/cards/placeholder.jpg'],
                featured: p.featured || false,
                description: p.description || DEFAULT_DESCRIPTION,
                minOrder: p.minOrder || DEFAULT_MIN_ORDER // Use card-specific min order or default 100
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
    // 4. Build dynamic category cards
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
    // 6. Apply filter & sorting
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
    // 7. Create card HTML - HIDE product ID, SHOW price based on min order
    // ---------------------------------------------------------------------
    function createCardHTML(product) {
        const productJson = encodeURIComponent(JSON.stringify(product));
        const featuredBadge = product.featured ? '<span class="featured-badge">Featured</span>' : '';
        
        // Calculate price based on card's minimum order quantity
        const displayQuantity = product.minOrder || DEFAULT_MIN_ORDER;
        const priceForMinOrder = calculatePriceForQuantity(displayQuantity, product.price, product.minOrder);
        
        return `
            <div class="product-card">
                <div class="product-img-wrapper">
                    ${featuredBadge}
                    <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
                    <div class="quick-view-overlay">
                        <button class="quick-view-btn" data-product="${productJson}">Quick View</button>
                    </div>
                </div>
                <h4 class="product-name">${product.name}</h4>
                <p class="product-price">From Rs. ${priceForMinOrder.toLocaleString()} for ${displayQuantity} cards</p>
            </div>
        `;
    }

    // ---------------------------------------------------------------------
    // 8. Price calculation function based on your rules
    // ---------------------------------------------------------------------
    function calculatePriceForQuantity(quantity, unitPrice, minOrder) {
        const actualMinOrder = minOrder || DEFAULT_MIN_ORDER;
        
        if (quantity < actualMinOrder) {
            return null; // Below minimum order - shouldn't happen on card display
        }
        
        let totalPrice;
        
        if (quantity >= 100 && quantity < 200) {
            // n * price + 600
            totalPrice = (quantity * unitPrice) + 600;
        } else if (quantity >= 200 && quantity < 500) {
            // n * price (no discount, no fee)
            totalPrice = quantity * unitPrice;
        } else if (quantity >= 500 && quantity < 1000) {
            // 5% discount
            totalPrice = quantity * unitPrice * 0.95;
        } else if (quantity >= 1000) {
            // 10% discount
            totalPrice = quantity * unitPrice * 0.90;
        }
        
        return Math.round(totalPrice);
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
    // 10. Quick View event delegation
    // ---------------------------------------------------------------------
    productContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.quick-view-btn');
        if (!btn) return;
        const product = JSON.parse(decodeURIComponent(btn.getAttribute('data-product')));
        openProductModal(product);
    });

    showMoreBtn.addEventListener('click', showMoreItems);

    // ---------------------------------------------------------------------
    // 11. Modal logic
    // ---------------------------------------------------------------------
    let currentUnitPrice = 0;
    let currentProductName = "";
    let currentProductCategory = "";
    let currentProductId = "";
    let currentMinOrder = DEFAULT_MIN_ORDER;

    function openProductModal(product) {
        currentProductName = product.name || product.id;
        currentProductId = product.id;
        currentProductCategory = product.category;
        currentMinOrder = product.minOrder || DEFAULT_MIN_ORDER;
        
        // Show product ID in modal (as specified - don't change quick view)
        modalTitle.textContent = product.id;
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

        currentUnitPrice = product.price;
        
        // Set quantity input with dynamic min order
        qtyInput.min = currentMinOrder;
        qtyInput.value = currentMinOrder;
        
        // Update the label to show the correct minimum
        const minOrderLabel = document.querySelector('.input-group label[for="modal-qty"]');
        if (minOrderLabel) {
            minOrderLabel.textContent = `Number of Cards (Min ${currentMinOrder}):`;
        }
        
        calculateTotal();

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // ---------------------------------------------------------------------
    // 12. Discount calculator with your specific rules
    // ---------------------------------------------------------------------
    function calculateTotal() {
        let qty = parseInt(qtyInput.value);
        
        if (isNaN(qty) || qty < currentMinOrder) {
            qty = currentMinOrder;
            qtyInput.value = currentMinOrder;
        }

        let baseTotal = qty * currentUnitPrice;
        let processingFee = 0;
        let discountPercent = 0;
        let discountAmount = 0;
        let showDiscountRow = true;
        let rowLabel = '';

        // Your pricing rules
        if (qty < currentMinOrder) {
            // Below minimum order - show error state
            showDiscountRow = true;
            rowLabel = 'Below Minimum Order';
            discountAmount = 0;
            finalTotal = 0;
        } else if (qty >= 100 && qty < 200) {
            // n * price + 600
            processingFee = 600;
            rowLabel = 'Processing Fee:';
        } else if (qty >= 200 && qty < 500) {
            // n * price (no discount, no fee)
            showDiscountRow = false;
        } else if (qty >= 500 && qty < 1000) {
            // 5% discount
            discountPercent = 5;
            discountAmount = Math.round(baseTotal * 0.05);
            rowLabel = `Volume Discount (${discountPercent}%):`;
        } else if (qty >= 1000) {
            // 10% discount
            discountPercent = 10;
            discountAmount = Math.round(baseTotal * 0.10);
            rowLabel = `Volume Discount (${discountPercent}%):`;
        }

        const finalTotal = baseTotal + processingFee - discountAmount;

        // Update UI
        calcBaseTotal.textContent = `Rs. ${baseTotal.toLocaleString()}`;
        
        if (showDiscountRow) {
            discountRow.style.display = 'flex';
            if (processingFee > 0) {
                discountLabel.textContent = 'Processing Fee:';
                calcDiscountPct.textContent = '';
                calcDiscountAmt.textContent = `+ Rs. ${processingFee.toLocaleString()}`;
            } else if (discountPercent > 0) {
                discountLabel.textContent = `Volume Discount (${discountPercent}%):`;
                calcDiscountPct.textContent = '';
                calcDiscountAmt.textContent = `- Rs. ${discountAmount.toLocaleString()}`;
            } else {
                discountLabel.textContent = rowLabel;
                calcDiscountPct.textContent = '';
                calcDiscountAmt.textContent = 'Contact for quote';
            }
        } else {
            discountRow.style.display = 'none';
        }
        
        calcFinalTotal.textContent = qty < currentMinOrder ? 'Below Minimum Order' : `Rs. ${finalTotal.toLocaleString()}`;

        // Update WhatsApp message
        if (qty >= currentMinOrder) {
            let messageDetails = '';
            if (processingFee > 0) {
                messageDetails = `*Quantity:* ${qty}\n` +
                               `*Unit Price:* Rs. ${currentUnitPrice}\n` +
                               `*Processing Fee:* Rs. ${processingFee}\n` +
                               `*Estimated Total:* Rs. ${finalTotal.toLocaleString()}\n\n`;
            } else if (discountPercent > 0) {
                messageDetails = `*Quantity:* ${qty}\n` +
                               `*Unit Price:* Rs. ${currentUnitPrice}\n` +
                               `*Volume Discount:* ${discountPercent}%\n` +
                               `*Estimated Total:* Rs. ${finalTotal.toLocaleString()}\n\n`;
            } else {
                messageDetails = `*Quantity:* ${qty}\n` +
                               `*Unit Price:* Rs. ${currentUnitPrice}\n` +
                               `*Estimated Total:* Rs. ${finalTotal.toLocaleString()}\n\n`;
            }

            const message = `Hello Impressions! I would like to inquire about an Allure card design.\n\n` +
                            `*Design:* ${currentProductId} (${currentProductCategory} Collection)\n` +
                            messageDetails +
                            `Please let me know how to proceed.`;
            whatsappBtn.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        }
    }

    qtyInput.addEventListener('input', calculateTotal);
    qtyInput.addEventListener('change', () => {
        if (parseInt(qtyInput.value) < currentMinOrder) {
            qtyInput.value = currentMinOrder;
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
