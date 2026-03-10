// Main JavaScript for Solar Company Website

// API URL
const MAIN_API_URL = 'https://ki-bharat-solar-gqxb.vercel.app'; // ✅ fixed (added https)

console.log('🌐 Main using API URL:', MAIN_API_URL);


// Load company data
async function loadCompanyData() {
    try {
        const response = await fetch('/data/company.json');
        const data = await response.json();
        
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


// Create product card
function createProductCard(product) {

    const div = document.createElement('div');
    div.className = 'product-card';
    div.setAttribute('data-category', product.category);
    
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


// Load pricing
async function loadPricing() {

    try {

        const response = await fetch('/data/pricing.json');
        const pricing = await response.json();

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


// Load gallery
function loadGallery() {

    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;

    const galleryItems = [

        {type:'Solar Installation',location:'Residential - Thoothukudi',image:'images/gallery/installation1.jpg',date:'Jan 2024'},
        {type:'Solar Pump Installation',location:'Farm - Tirunelveli',image:'images/gallery/pump_installation.jpg',date:'Feb 2024'},
        {type:'Commercial Project',location:'Shopping Complex - Madurai',image:'images/gallery/commercial_project.jpg',date:'Mar 2024'},
        {type:'Hybrid System',location:'Villa - Kanyakumari',image:'images/gallery/installation2.jpg',date:'Dec 2023'},
        {type:'Solar Panel Array',location:'Factory - Tuticorin',image:'images/gallery/solar_farm.jpg',date:'Jan 2024'},
        {type:'Inverter Setup',location:'Office - Thoothukudi',image:'images/gallery/inverter_setup.jpg',date:'Feb 2024'}

    ];

    galleryGrid.innerHTML='';

    galleryItems.forEach((item)=>{

        galleryGrid.innerHTML+=`

        <div class="gallery-item" onclick="openGalleryModal('${item.image}','${item.type}','${item.location}','${item.date}')">

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
function openGalleryModal(imageSrc,title,location,date){

let modal=document.getElementById('galleryModal');

if(!modal){

modal=document.createElement('div');
modal.id='galleryModal';
modal.className='gallery-modal';

modal.innerHTML=`

<div class="modal-content">

<span class="close-modal" onclick="closeGalleryModal()">&times;</span>

<img id="modalImage" src="">

<div id="modalCaption" class="modal-caption"></div>

</div>

`;

document.body.appendChild(modal);

}

document.getElementById('modalImage').src=imageSrc;

document.getElementById('modalCaption').innerHTML=`<h3>${title}</h3><p>${location}</p><small>${date}</small>`;

modal.style.display='block';

}

function closeGalleryModal(){

const modal=document.getElementById('galleryModal');

if(modal){

modal.style.display='none';

}

}


// Filter products
function filterProducts(category){

const products=document.querySelectorAll('.product-card');

products.forEach(product=>{

if(category==='all'||product.getAttribute('data-category')===category){

product.style.display='block';

}else{

product.style.display='none';

}

});

}


// Product inquiry
function inquireProduct(productName){

const chatbotBox=document.getElementById('chatbotBox');

if(chatbotBox){

chatbotBox.classList.add('open');

}

}


// ----------------------------
// ✅ FIX 1: CONSULTATION FORM
// ----------------------------

async function submitConsultationForm(){

const name=document.getElementById("name").value;
const phone=document.getElementById("phone").value;
const location=document.getElementById("location").value;

try{

const response=await fetch(MAIN_API_URL+"/api/lead",{

method:"POST",
headers:{"Content-Type":"application/json"},

body:JSON.stringify({name,phone,location})

});

alert("Consultation request submitted successfully!");

}catch(error){

console.error(error);
alert("Error submitting form");

}

}


// ----------------------------
// ✅ FIX 2: TAB SWITCH
// ----------------------------

function switchTab(tab){

const consultation=document.getElementById("consultation-tab");
const booking=document.getElementById("booking-tab");

if(tab==="consultation"){

consultation.style.display="block";
booking.style.display="none";

}else{

consultation.style.display="none";
booking.style.display="block";

}

}


// Initialize
document.addEventListener('DOMContentLoaded',function(){

loadCompanyData();
loadProducts();
loadPricing();
loadGallery();

});
