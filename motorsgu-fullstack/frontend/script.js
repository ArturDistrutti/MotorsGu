const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

const SETTINGS = {
  whatsapp: "5511982776920", // Troque pelo WhatsApp da loja.
  instagram: "https://www.instagram.com/@motorsgu/" // Troque pelo Instagram da loja.
};

let cars = [];

const grid = document.querySelector("#carsGrid");
const empty = document.querySelector("#emptyState");
const count = document.querySelector("#resultsCount");
const model = document.querySelector("#model");
const year = document.querySelector("#year");
const color = document.querySelector("#color");
const condition = document.querySelector("#condition");
const maxPrice = document.querySelector("#maxPrice");

const money = v => Number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0});
const kmText = v => Number(v) === 0 ? "0 km" : `${Number(v).toLocaleString("pt-BR")} km`;
const imageUrl = img => img ? (img.startsWith("http") ? img : `${BACKEND_ORIGIN}${img}`) : "";

async function fetchCars(){
  try{
    const res = await fetch(`${API_BASE_URL}/vehicles`);
    if(!res.ok) throw new Error("Falha ao carregar veículos.");
    cars = await res.json();
  }catch(err){
    console.error(err);
    grid.innerHTML = `<p style="color:#c73535">Não foi possível carregar o estoque agora. Tente novamente em instantes.</p>`;
    cars = [];
  }
}

function setupOptions(){
  year.querySelectorAll("option:not(:first-child)").forEach(o=>o.remove());
  color.querySelectorAll("option:not(:first-child)").forEach(o=>o.remove());
  [...new Set(cars.map(c=>c.year))].sort((a,b)=>b-a).forEach(y=>{
    const o=document.createElement("option"); o.value=y; o.textContent=y; year.appendChild(o);
  });
  [...new Set(cars.map(c=>c.color))].sort().forEach(c=>{
    const o=document.createElement("option"); o.value=c; o.textContent=c; color.appendChild(o);
  });
}
function card(c){
  const msg=encodeURIComponent(`Olá, Motors Gu! Tenho interesse no ${c.model} ${c.year}. Gostaria de mais informações.`);
  const image = c.image ? `<img src="${imageUrl(c.image)}" alt="${c.model}" loading="lazy">` : `<span>${c.model.split(" ").slice(0,2).join(" ").toUpperCase()}</span>`;
  return `<article class="car-card">
    <div class="car-photo"><span class="condition">${c.condition}</span>${image}</div>
    <div class="car-body">
      <div class="car-title"><h3>${c.model}</h3><span class="car-year">${c.year}</span></div>
      <div class="car-meta"><span>${c.color}</span><span>${kmText(c.km)}</span><span>${c.condition}</span></div>
      <div class="price">${money(c.price)}</div>
      <a class="btn btn-dark car-btn" target="_blank" rel="noopener" href="https://wa.me/${SETTINGS.whatsapp}?text=${msg}">Tenho interesse →</a>
    </div>
  </article>`;
}
function render(){
  const term=model.value.trim().toLowerCase();
  const filtered=cars.filter(c=>
    (!term || c.model.toLowerCase().includes(term)) &&
    (!year.value || String(c.year)===year.value) &&
    (!color.value || c.color===color.value) &&
    (!condition.value || c.condition===condition.value) &&
    (!maxPrice.value || Number(c.price)<=Number(maxPrice.value))
  );
  grid.innerHTML=filtered.map(card).join("");
  empty.hidden=filtered.length!==0;
  count.textContent=`${filtered.length} veículo${filtered.length===1?"":"s"}`;
}
[model,year,color,condition,maxPrice].forEach(el=>el.addEventListener("input",render));
document.querySelector("#clearFilters").addEventListener("click",()=>{
  model.value=year.value=color.value=condition.value=maxPrice.value="";
  render();
});
document.querySelector("#whatsappBtn").href=`https://wa.me/${SETTINGS.whatsapp}?text=${encodeURIComponent("Olá, Motors Gu! Gostaria de conhecer os veículos disponíveis.")}`;
document.querySelector("#instagramBtn").href=SETTINGS.instagram;
document.querySelector("#yearNow").textContent=new Date().getFullYear();

(async function init(){
  await fetchCars();
  setupOptions();
  render();
})();

document.querySelector("#menuBtn").addEventListener("click",()=>{
  const nav=document.querySelector("nav");
  nav.style.display=nav.style.display==="flex"?"none":"flex";
  nav.style.position="absolute"; nav.style.top="76px"; nav.style.left="0"; nav.style.right="0";
  nav.style.padding="20px"; nav.style.background="#fff"; nav.style.flexDirection="column";
});
