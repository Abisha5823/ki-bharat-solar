// Main JavaScript for Solar Company Website

// API URL
const MAIN_API_URL ='ki-bharat-solar-gqxb.vercel.app';// 🔴 CHANGE THIS to your actual backend URL

console.log('🌐 Main using API URL:', MAIN_API_URL);

// Load company data
async function loadCompanyData() {
    try {
        const response = await fetch('/data/company.json');
        const data = await response.json();
        
        // Update contact information
        document.getElementById('contact-phone') && (document.getElementById('contact-phone').textContent = data.phone);
        document.getElementById('contact-whatsapp') && (document.getElementById('contact-whatsapp').textContent = data.whatsapp);
        document.getElementById('contact-email') && (document.getElementById('contact-email').textContent = data.email);
        document.getElementById('contact-address') && (document.getElementById('contact-address').textContent = data.address);
        document.getElementById('contact-hours') && (document.getElementById('contact-hours').textContent = data.working_hours);
        
        return data;
    } catch (error) {
        console.error('Error loading company data:', error);
    }
}

// Load products
async function loadProducts() {
    try {
        const response = await fetch('/data/products.json');
        const products = await response.json();
        
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            productsGrid.innerHTML = '';
            products.forEach(product => {
                const productCard = createProductCard(product);
                productsGrid.appendChild(productCard);
            });
        }
        
        return products;
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Create product card with image
// Create product card with image - FIXED VERSION
function createProductCard(product) {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.setAttribute('data-category', product.category);
    
    // Use the path directly from JSON (should be without leading slash)
    const imageUrl = product.image || 'https://via.placeholder.com/300x200?text=Solar+Product';
    const badge = product.badge ? `<span class="product-badge">${product.badge}</span>` : '';
    
    div.innerHTML = `
        <div class="product-image-container">
            <img src="${imageUrl}" alt="${product.name}" class="product-image" 
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=No+Image'">
            ${badge}
        </div>
        <div class="product-info">
            <h3>${product.name}</h3>
            <div class="product-price">${product.price}</div>
            <div class="product-warranty"><i class="fas fa-shield-alt"></i> Warranty: ${product.warranty}</div>
            <p>${product.description}</p>
            <div class="product-features">
                ${product.features ? product.features.map(f => `<span class="feature-tag">${f}</span>`).join('') : ''}
            </div>
            <button class="btn-primary" onclick="inquireProduct('${product.name}')">
                <i class="fas fa-shopping-cart"></i> Inquire Now
            </button>
        </div>
    `;
    
    return div;
}

// Load pricing data
async function loadPricing() {
    try {
        const response = await fetch('/data/pricing.json');
        const pricing = await response.json();
        
        // Solar systems pricing
        const solarBody = document.getElementById('pricing-table-body');
        if (solarBody) {
            solarBody.innerHTML = '';
            pricing.solar_systems.forEach(item => {
                solarBody.innerHTML += `
                    <tr>
                        <td>${item.bill_range}</td>
                        <td>${item.system_size}</td>
                        <td>${item.cost_range}</td>
                        <td>${item.space_required}</td>
                    </tr>
                `;
            });
        }
        
        // Pump pricing
        const pumpBody = document.getElementById('pump-pricing-body');
        if (pumpBody) {
            pumpBody.innerHTML = '';
            pricing.solar_pumps.forEach(item => {
                pumpBody.innerHTML += `
                    <tr>
                        <td>${item.hp}</td>
                        <td>${item.price}</td>
                        <td>${item.panels}</td>
                        <td>${item.suitable_land}</td>
                        <td>${item.water_output}</td>
                    </tr>
                `;
            });
        }
        
        // Inverter pricing
        const inverterBody = document.getElementById('inverter-pricing-body');
        if (inverterBody) {
            inverterBody.innerHTML = '';
            pricing.inverters.forEach(item => {
                inverterBody.innerHTML += `
                    <tr>
                        <td>${item.capacity}</td>
                        <td>${item.price}</td>
                        <td>${item.battery_support}</td>
                        <td>${item.suitable_for}</td>
                    </tr>
                `;
            });
        }
        
        return pricing;
    } catch (error) {
        console.error('Error loading pricing:', error);
    }
}

// Load gallery with images
// Load gallery with images - FIXED VERSION
function loadGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;
    
    const galleryItems = [
        { 
            type: 'Solar Installation', 
            location: 'Residential - Thoothukudi',
            image: 'images/gallery/installation1.jpg',  // No leading slash
            date: 'Jan 2024'
        },
        { 
            type: 'Solar Pump Installation', 
            location: 'Farm - Tirunelveli',
            image: 'images/gallery/pump_installation.jpg',
            date: 'Feb 2024'
        },
        { 
            type: 'Commercial Project', 
            location: 'Shopping Complex - Madurai',
            image: 'images/gallery/commercial_project.jpg',
            date: 'Mar 2024'
        },
        { 
            type: 'Hybrid System', 
            location: 'Villa - Kanyakumari',
            image: 'images/gallery/installation2.jpg',
            date: 'Dec 2023'
        },
        { 
            type: 'Solar Panel Array', 
            location: 'Factory - Tuticorin',
            image: 'images/gallery/solar_farm.jpg',
            date: 'Jan 2024'
        },
        { 
            type: 'Inverter Setup', 
            location: 'Office - Thoothukudi',
            image: 'images/gallery/inverter_setup.jpg',
            date: 'Feb 2024'
        }
    ];
    
    galleryGrid.innerHTML = '';
    galleryItems.forEach((item) => {
        galleryGrid.innerHTML += `
            <div class="gallery-item" onclick="openGalleryModal('${item.image}', '${item.type}', '${item.location}', '${item.date}')">
                <img src="${item.image}" alt="${item.type}" 
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/400x300?text=No+Image'">
                <div class="gallery-overlay">
                    <h4>${item.type}</h4>
                    <p>${item.location}</p>
                    <small>${item.date}</small>
                </div>
            </div>
        `;
    });
}
// Gallery modal
function openGalleryModal(imageSrc, title, location, date) {
    let modal = document.getElementById('galleryModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'galleryModal';
        modal.className = 'gallery-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal" onclick="closeGalleryModal()">&times;</span>
                <img id="modalImage" src="" alt="">
                <div id="modalCaption" class="modal-caption"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    document.getElementById('modalImage').src = imageSrc;
    document.getElementById('modalCaption').innerHTML = `<h3>${title}</h3><p>${location}</p><small>${date}</small>`;
    modal.style.display = 'block';
}

function closeGalleryModal() {
    const modal = document.getElementById('galleryModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Filter products by category
function filterProducts(category) {
    const products = document.querySelectorAll('.product-card');
    products.forEach(product => {
        if (category === 'all' || product.getAttribute('data-category') === category) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
    
    const buttons = document.querySelectorAll('[onclick^="filterProducts"]');
    buttons.forEach(btn => {
        if (btn.textContent.includes(category) || (category === 'all' && btn.textContent.includes('All'))) {
            btn.className = 'btn-primary';
        } else {
            btn.className = 'btn-secondary';
        }
    });
}

// Inquire about product
function inquireProduct(productName) {
    const chatbotBox = document.getElementById('chatbotBox');
    if (chatbotBox) {
        chatbotBox.classList.add('open');
        setTimeout(() => {
            if (window.chatbot) {
                window.chatbot.addMessage(`I'm interested in ${productName}`, 'user');
                window.chatbot.processInput(`I'm interested in ${productName}`);
            }
        }, 500);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCompanyData();
    loadProducts();
    loadPricing();
    loadGallery();
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('galleryModal');
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
});