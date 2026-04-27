/* =========================
   Mama Chikamso — script.js
   Product rendering, cart (localStorage), modals, toasts
   ========================= */

/* Sample products (foodstuff grid) */
const PRODUCTS = [
  { id:'rice-50kg', title:'Local Rice (1 painter)', price:4000, img:'rice.png' },
  { id:'beans-25kg', title:'Brown Beans (1 painter)', price:2200, img:'beans.png' },
  { id:'garri-25kg', title:'Ijebu Garri (25 1 painter)', price:1500, img:'garri.png' },
  { id:'palm-25l', title:'Fresh Palm Oil (1 bottle)', price:2000, img:'red.oil.png' },
  { id:'tomatoes', title:' Tomatoes (basket)', price:1200, img:'tomato.png' },
  { id:'spicepack', title:'Ogbono', price:2200, img:'ogbono.png' }
];

/* categories */
const CATS = [
  { id:'fruits', name:'Fruits & Vegetables', img:'file:///storage/emulated/0/Android/data/com.teejay.trebedit/files/TrebEdit user files/Sample project - Acme/img/Screenshot_20251027-112551.png' },
  { id:'packaged', name:'Packaged Foods', img:'file:///storage/emulated/0/Android/data/com.teejay.trebedit/files/TrebEdit user files/Sample project - Acme/img/Screenshot_20251027-112418.png' },
  { id:'groceries', name:'Groceries & Staples', img:'file:///storage/emulated/0/Android/data/com.teejay.trebedit/files/TrebEdit user files/Sample project - Acme/img/Screenshot_20251026-215639.png' },
  { id:'organic', name:'Organic & Green', img:'file:///storage/emulated/0/Android/data/com.teejay.trebedit/files/TrebEdit user files/Sample project - Acme/img/Screenshot_20251027-112500.png' }
];

/* Helpers */
const $ = s=>document.querySelector(s);
const $$ = s=>Array.from(document.querySelectorAll(s));
const fmt = n => '₦' + Number(n).toLocaleString();

/* Preloader */
window.addEventListener('load', () => {
  const pre = document.getElementById('preloader');
  if(pre) setTimeout(()=> pre.classList.add('fade-out'), 700);
});

/* Render categories */
function renderCategories(){
  const grid = document.getElementById('catsGrid');
  if(!grid) return;
  grid.innerHTML = '';
  CATS.forEach(c=>{
    const div = document.createElement('div'); div.className='cat';
    div.innerHTML = `<img src="${c.img}" alt="${c.name}"><div style="font-weight:700">${c.name}</div>`;
    grid.appendChild(div);
  });
}

/* Render products */
function renderProducts(){
  const pg = document.getElementById('productGrid');
  if(!pg) return;
  pg.innerHTML = '';
  PRODUCTS.forEach((p, idx)=>{
    const el = document.createElement('div'); el.className='product-card';
    el.innerHTML = `
      <img src="${p.img}" alt="${p.title}">
      <div class="overlay"><button class="viewDetailsBtn">View Details</button></div>
      <h3>${p.title}</h3>
      <div class="price">${fmt(p.price)}</div>
      <div class="card-foot">
        <div class="small">In stock</div>
        <button class="addToCartBtn">Add</button>
      </div>
    `;
    pg.appendChild(el);
    setTimeout(()=> el.classList.add('show'), 100 * idx);
  });
  attachProductEvents();
}

/* CART (localStorage key mc_cart) */
let cart = JSON.parse(localStorage.getItem('mc_cart') || '[]');
function saveCart(){ localStorage.setItem('mc_cart', JSON.stringify(cart)); updateCartBadge(); renderCartPopup(); }
function cartCount(){ return cart.reduce((s,i)=> s + (i.qty||0), 0); }
function updateCartBadge(){ $$('#cart-count').forEach(el=>el.textContent = cartCount()); }

/* Add to cart */
function addToCart(name, price, img){
  const found = cart.find(i=>i.name===name);
  if(found) found.qty += 1;
  else cart.push({ name, price, img, qty:1 });
  saveCart();
  showToast(`✅ ${name} added to cart`, 'success');
}

/* attach product buttons */
function attachProductEvents(){
  $$('.addToCartBtn').forEach(btn=>{
    btn.onclick = e => {
      const card = e.target.closest('.product-card');
      const name = card.querySelector('h3').textContent;
      const price = Number(card.querySelector('.price').textContent.replace(/[^0-9]/g,'')) || 0;
      const img = card.querySelector('img').src;
      addToCart(name, price, img);
    };
  });

  $$('.viewDetailsBtn').forEach(btn=>{
    btn.onclick = e => {
      const card = e.target.closest('.product-card');
      const img = card.querySelector('img').src;
      const title = card.querySelector('h3').textContent;
      const price = card.querySelector('.price').textContent;
      openProductModal({ img, title, price });
    };
  });
}

/* CART POPUP */
function createCartPopupIfMissing(){
  let popup = document.getElementById('cart-popup');
  if(!popup){
    popup = document.createElement('div');
    popup.id='cart-popup'; popup.className='cart-popup';
    popup.innerHTML = `<h3>Your Cart</h3><div class="cart-items-list" id="cartItemsList"></div>
      <div class="cart-footer"><p>Total: ₦<span id="cart-total-popup">0</span></p>
      <button id="checkoutBtnPopup" class="btn btn-primary">Checkout</button></div>`;
    document.body.appendChild(popup);
    document.getElementById('checkoutBtnPopup').addEventListener('click', ()=> {
      document.getElementById('cart-popup').classList.remove('active');
      triggerCheckout();
    });
  }
}
createCartPopupIfMissing();

function renderCartPopup(){
  const list = document.getElementById('cartItemsList');
  const totalEl = document.getElementById('cart-total-popup');
  if(!list) return;
  list.innerHTML = '';
  let total = 0;
  cart.forEach((it, idx) => {
    total += it.price * it.qty;
    const row = document.createElement('div'); row.className='cart-item';
    row.innerHTML = `<div style="display:flex;gap:10px;align-items:center">
      <img src="${it.img}" style="width:56px;height:56px;border-radius:8px;object-fit:cover">
      <div style="min-width:120px"><div style="font-weight:700">${it.name}</div><div class="small">₦${(it.price*it.qty).toLocaleString()}</div></div>
    </div>
    <div style="display:flex;gap:8px;align-items:center">
      <button class="qty-btn" data-idx="${idx}" data-op="-">-</button>
      <div class="small">${it.qty}</div>
      <button class="qty-btn" data-idx="${idx}" data-op="+">+</button>
    </div>`;
    list.appendChild(row);
  });
  totalEl.textContent = total.toLocaleString();
  // qty handlers
  list.querySelectorAll('.qty-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> {
      const i = Number(btn.dataset.idx); const op = btn.dataset.op;
      changeQty(i, op==='+'?1:-1);
      renderCartPopup();
    });
  });
}

/* change qty */
function changeQty(idx, amount){
  if(!cart[idx]) return;
  cart[idx].qty += amount;
  if(cart[idx].qty <= 0) cart.splice(idx,1);
  saveCart();
}

/* checkout logic */
function triggerCheckout(){
  const logged = localStorage.getItem('mc_user_logged') === '1';
  if(logged){
    window.location.href = 'order-success.html';
  } else {
    openAuthModal();
  }
}

/* auth modal */
function openAuthModal(){
  let modal = document.getElementById('authModal');
  if(!modal){
    modal = document.createElement('div'); modal.id='authModal'; modal.className='modal';
    modal.innerHTML = `<div class="modal-content"><span class="closeModal">&times;</span>
      <h3>Login / Register</h3>
      <input id="authPhone" placeholder="Phone number (e.g. 09031234567)" type="tel" style="width:100%;padding:10px;margin-top:10px;border-radius:8px;border:1px solid #e6edf3">
      <input id="authPass" placeholder="Password / PIN" type="password" style="width:100%;padding:10px;margin-top:10px;border-radius:8px;border:1px solid #e6edf3">
      <button id="authSubmit" class="btn btn-primary" style="width:100%;margin-top:12px">Continue</button></div>`;
    document.body.appendChild(modal);
    modal.querySelector('.closeModal').addEventListener('click', ()=> { modal.classList.remove('show'); setTimeout(()=> modal.style.display='none',350) });
  }
  modal.style.display='flex'; setTimeout(()=> modal.classList.add('show'),10);
  document.getElementById('authSubmit').onclick = ()=>{
    const phone = document.getElementById('authPhone').value.replace(/[^\d]/g,'');
    if(!phone || phone.length < 9){ showToast('Enter valid phone', 'error'); return; }
    localStorage.setItem('mc_user_logged','1'); showToast('Logged in ✔️','success');
    modal.classList.remove('show'); setTimeout(()=> modal.style.display='none',350);
    setTimeout(()=> window.location.href='order-success.html', 600);
  };
}

/* product modal */
function openProductModal({ img, title, price }){
  let modal = document.getElementById('productModal');
  if(!modal){
    modal = document.createElement('div'); modal.id='productModal'; modal.className='modal';
    modal.innerHTML = `<div class="modal-content"><span class="closeModal">&times;</span>
      <img id="modalImage" src="${img}" style="width:100%;height:220px;object-fit:cover;border-radius:10px">
      <h2 id="modalTitle">${title}</h2>
      <p id="modalPrice">${price}</p>
      <p id="modalDesc" class="small">Enjoy fresh, locally sourced ${title} from Mama Chikamso.</p>
      <button id="modalAddBtn" class="btn btn-primary" style="width:100%;margin-top:12px">Add to Cart</button>
    </div>`;
    document.body.appendChild(modal);
  } else {
    modal.querySelector('#modalImage').src = img;
    modal.querySelector('#modalTitle').textContent = title;
    modal.querySelector('#modalPrice').textContent = price;
  }
  modal.style.display='flex'; setTimeout(()=> modal.classList.add('show'),10);
  modal.querySelector('.closeModal').onclick = ()=> { modal.classList.remove('show'); setTimeout(()=> modal.style.display='none',350) };
  modal.onclick = (e)=> { if(e.target === modal) { modal.classList.remove('show'); setTimeout(()=> modal.style.display='none',350) }};
  document.getElementById('modalAddBtn').onclick = ()=>{
    const name = modal.querySelector('#modalTitle').textContent;
    const p = modal.querySelector('#modalPrice').textContent.replace(/[^0-9]/g,'') || 0;
    const imgSrc = modal.querySelector('#modalImage').src;
    addToCart(name, Number(p), imgSrc);
    modal.classList.remove('show'); setTimeout(()=> modal.style.display='none',350);
  };
}

/* toast */
function showToast(message='Saved', type='success', duration=2500){
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  setTimeout(()=> toast.classList.add('show'),10);
  setTimeout(()=> toast.classList.remove('show'), duration);
}

/* success/error popup */
function showSuccessPopup(){ const s=document.getElementById('success-popup'); if(!s) return; s.classList.add('active'); setTimeout(()=> s.classList.remove('active'),2500); }
function showErrorPopup(){ const e=document.getElementById('error-popup'); if(!e) return; e.classList.add('active'); setTimeout(()=> e.classList.remove('active'),2500); }

/* sample hero sample add */
function addSample(){ addToCart('Spice Manna Bright Tangy', 1200, 'file:///storage/emulated/0/Android/data/com.teejay.trebedit/files/TrebEdit user files/Sample project - Acme/img/showcase.jpg'); }

/* attach floating cart button from header */
(function attachFloatingCart(){
  const floating = document.querySelector('.cart-floating');
  if(!floating){
    const div = document.createElement('div'); div.className='cart-floating'; div.innerHTML = `🛒 <span id="cart-count">${cartCount()}</span>`;
    div.onclick = ()=> document.getElementById('cart-popup').classList.toggle('active');
    document.body.appendChild(div);
  } else floating.onclick = ()=> document.getElementById('cart-popup').classList.toggle('active');
})();

/* helper */
function cartCount(){ return cart.reduce((s,i)=> s + (i.qty||0), 0) }
updateCartBadge = ()=> { $$('#cart-count').forEach(el=>el.textContent = cartCount()); };

/* init on DOM ready */
document.addEventListener('DOMContentLoaded', ()=> {
  renderCategories();
  renderProducts();
  renderCartPopup();
  updateCartBadge();

  // header Cart button toggles popup
  document.getElementById('cartBtn')?.addEventListener('click', ()=> document.getElementById('cart-popup').classList.toggle('active'));

  // hero order now scroll
  document.getElementById('orderNowBtn')?.addEventListener('click', ()=> document.getElementById('productGrid')?.scrollIntoView({behavior:'smooth'}));

  // react to external storage changes
  window.addEventListener('storage', ()=> { cart = JSON.parse(localStorage.getItem('mc_cart')||'[]'); renderCartPopup(); updateCartBadge(); });
});

/* expose for debug */
window.MamaChikamso = { addToCart, openProductModal, triggerCheckout, showSuccessPopup, showErrorPopup, cart };
