const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");
const TOKEN_KEY = "motorsGuAdminToken";

const $=s=>document.querySelector(s);
let cars=[];

function getToken(){ return sessionStorage.getItem(TOKEN_KEY); }
function setToken(t){ sessionStorage.setItem(TOKEN_KEY, t); }
function clearToken(){ sessionStorage.removeItem(TOKEN_KEY); }

function authHeaders(){
  const token=getToken();
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

function imageUrl(img){
  return img ? (img.startsWith("http") ? img : `${BACKEND_ORIGIN}${img}`) : "";
}

function showAdmin(){
  $("#loginView").hidden=true; $("#adminView").hidden=false;
  loadCars();
}

// Se já existe um token salvo, tenta usar o painel direto (o backend valida
// o token de verdade em toda chamada, então um token falso/expirado é
// rejeitado nas requisições e o usuário é levado de volta ao login).
if(getToken()) showAdmin();

$("#loginForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const username=$("#username").value;
  const password=$("#password").value;
  $("#loginError").textContent="";
  try{
    const res=await fetch(`${API_BASE_URL}/auth/login`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({username,password})
    });
    const data=await res.json();
    if(!res.ok){
      $("#loginError").textContent=data.error||"Não foi possível entrar.";
      return;
    }
    setToken(data.token);
    showAdmin();
  }catch(err){
    console.error(err);
    $("#loginError").textContent="Não foi possível conectar ao servidor.";
  }
});

$("#logout").onclick=()=>{ clearToken(); location.reload(); };

function handleAuthFailure(){
  clearToken();
  $("#adminView").hidden=true;
  $("#loginView").hidden=false;
  $("#loginError").textContent="Sua sessão expirou. Faça login novamente.";
}

async function loadCars(){
  try{
    const res=await fetch(`${API_BASE_URL}/vehicles`);
    if(!res.ok) throw new Error("Falha ao carregar veículos.");
    cars=await res.json();
    render();
  }catch(err){
    console.error(err);
    $("#adminList").innerHTML=`<div class="empty-list">Não foi possível carregar o estoque.</div>`;
  }
}

function updateRemoveOptions(){
  const select=$("#removeCarSelect");
  const current=select.value;
  select.innerHTML='<option value="">Selecione um carro...</option>'+cars.map(c=>`<option value="${c.id}">${c.model} — ${c.year} — ${Number(c.price).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</option>`).join("");
  if(cars.some(c=>String(c.id)===String(current))) select.value=current;
}

function render(){
  const term=$("#searchAdmin").value.toLowerCase().trim();
  const list=cars.filter(c=>c.model.toLowerCase().includes(term));
  $("#totalCars").textContent=cars.length;
  $("#usedCars").textContent=cars.filter(c=>c.condition==="Seminovo").length;
  $("#newCars").textContent=cars.filter(c=>c.condition==="Novo").length;
  
  $("#adminList").innerHTML=list.length ? list.map(c=>`
    <div class="vehicle-row">
      <div class="thumb">${c.image ? `<img src="${imageUrl(c.image)}" alt="">` : "CARRO"}</div>
      <div>
        <h3>${c.model}</h3>
        <p>${c.year} • ${c.color} • ${Number(c.km).toLocaleString("pt-BR")} km • ${c.condition} • ${Number(c.price).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</p>
      </div>
      <div class="row-actions">
        <button type="button" onclick="editCar('${c.id}')">Editar</button>
        <button type="button" class="danger" onclick="deleteCar('${c.id}')">🗑 Remover</button>
      </div>
    </div>`).join("") : `<div class="empty-list">Nenhum veículo cadastrado.</div>`;
    
  updateRemoveOptions();
}
$("#searchAdmin").addEventListener("input",render);

$("#removeSelectedCar").addEventListener("click",()=>{
  const id=$("#removeCarSelect").value;
  if(!id){ alert("Selecione um carro para remover."); return; }
  deleteCar(Number(id));
});

function openModal(car=null){
  $("#modal").hidden=false;
  $("#modalTitle").textContent=car?"Editar veículo":"Novo veículo";
  $("#carId").value=car?.id||"";
  $("#fModel").value=car?.model||"";
  $("#fYear").value=car?.year||"";
  $("#fColor").value=car?.color||"";
  $("#fPrice").value=car?.price||"";
  $("#fKm").value=car?.km??"";
  $("#fCondition").value=car?.condition||"Seminovo";
  $("#fImage").value="";
  $("#preview").innerHTML=car?.image?`<img src="${imageUrl(car.image)}" alt="Prévia">`:"";
  $("#formError").textContent="";
}
function closeModal(){$("#modal").hidden=true}
$("#newCar").onclick=()=>openModal();
$("#closeModal").onclick=closeModal;
$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});

let toastTimer=null;
function showToast(){
  const toast=$("#toast");
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.remove("show"),3500);
}

$("#fImage").addEventListener("change",()=>{
  const file=$("#fImage").files[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>$("#preview").innerHTML=`<img src="${reader.result}" alt="Prévia">`;
  reader.readAsDataURL(file);
});

$("#carForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const id=$("#carId").value;
  const isNewCar=!id;
  $("#formError").textContent="";

  const formData=new FormData();
  formData.append("model",$("#fModel").value.trim());
  formData.append("year",$("#fYear").value);
  formData.append("color",$("#fColor").value.trim());
  formData.append("price",$("#fPrice").value);
  formData.append("km",$("#fKm").value);
  formData.append("condition",$("#fCondition").value);
  const file=$("#fImage").files[0];
  if(file) formData.append("image",file);

  const url = isNewCar ? `${API_BASE_URL}/vehicles` : `${API_BASE_URL}/vehicles/${id}`;
  const method = isNewCar ? "POST" : "PUT";

  try{
    const res=await fetch(url,{ method, headers: authHeaders(), body: formData });
    if(res.status===401){ handleAuthFailure(); return; }
    const data=await res.json();
    if(!res.ok){ $("#formError").textContent=data.error||"Não foi possível salvar o veículo."; return; }

    closeModal();
    await loadCars();
    if(isNewCar) showToast();
  }catch(err){
    console.error(err);
    $("#formError").textContent="Não foi possível conectar ao servidor.";
  }
});

window.editCar = id => openModal(cars.find(c => String(c.id) === String(id)));

window.deleteCar = async id => {
  const car = cars.find(c => String(c.id) === String(id));
  if(!car || !confirm(`Excluir ${car.model}?`)) return;
  try{
    const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, { method:"DELETE", headers: authHeaders() });
    if(res.status === 401){ handleAuthFailure(); return; }
    if(!res.ok && res.status !== 204){ alert("Não foi possível excluir o veículo."); return; }
    await loadCars();
  }catch(err){
    console.error(err);
    alert("Não foi possível conectar ao servidor.");
  }
};
