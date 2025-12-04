// ———————————————
// script.js (yenilənmiş)
// ———————————————

// Səs fayllarının yolları — öz strukturuna görə düzəlt
const PATH_DING = "sounds/ding.mp3";    // Ofisiant -> Mətbəx səsi (müştəri göndərdikdə)
const PATH_DINQ = "sounds/dinq.mp3";    // Mətbəx -> Ofisiant səsi (mətbəx qəbul edəndə)

// Helper: localStorage-dan sifarişlər
function getOrders(){
  return JSON.parse(localStorage.getItem("orders")) || [];
}
function saveOrders(list){
  localStorage.setItem("orders", JSON.stringify(list));
}


// 1) Göndər
function sendOrder(){
  const masa = (document.getElementById("masa") || {}).value?.trim() || "";
  const mehsul = (document.getElementById("mehsul") || {}).value?.trim() || "";
  const qeyd = (document.getElementById("qeyd") || {}).value?.trim() || "-";

  if(!masa || !mehsul){
    alert("Masa və məhsul boş ola bilməz!");
    return;
  }

  const order = {
    id: Date.now(),
    masa, mehsul, qeyd,
    time: new Date().toLocaleTimeString(),
    status: "new"
  };

  const all = getOrders();
  all.push(order);
  saveOrders(all);

  // dərhal mətbəxdə səs çalınsın — amma autoplay problemləri ola bilər
  try {
    const a = new Audio(PATH_DING);
    a.play().catch(err => {
      // əksər hallarda buraya gələcək: autoplay məhdudiyyəti.
      // Amma səs serverdə olduğu təsdiq üçün konsola yaz:
      console.warn("Ding play rejected:", err);
    });
  } catch(e){
    console.warn("Ding audio error:", e);
  }

  // play etdikdən sonra ofisiant xəbərdar olsun (UI üçün)
  alert("Sifariş göndərildi ✔");
}



// 2) Mətbəx — yüklə və göstər (new status)
function loadKitchen(){
  const listEl = document.getElementById("kitchenList");
  if(!listEl) return;
  const all = getOrders();
  listEl.innerHTML = "";

  all.forEach(o => {
    if(o.status === "new"){
      const li = document.createElement("li");
      const left = document.createElement("div");
      left.innerHTML = `<div><strong>Masa ${o.masa}</strong></div>
                        <div class="meta">${o.mehsul} — ${o.qeyd}</div>
                        <div class="meta">${o.time}</div>`;
      const right = document.createElement("div");

      const acceptBtn = document.createElement("button");
      acceptBtn.textContent = "Qəbul Et";
      acceptBtn.onclick = () => acceptOrder(o.id);

      right.appendChild(acceptBtn);
      li.appendChild(left);
      li.appendChild(right);

      listEl.appendChild(li);
    }
  });
}


// 3) Mətbəx — qəbul et (silmir, status dəyişir)
function acceptOrder(id){
  const all = getOrders();
  let changed = false;
  const newList = all.map(o => {
    if(o.id === id && o.status === "new"){
      o.status = "accepted";
      changed = true;
    }
    return o;
  });

  if(!changed) return; // artıq qəbul edilibsə çıx

  saveOrders(newList);

  // Mətbəxdə qəbul edildiyi an öz səsi (optional)
  try {
    const a = new Audio(PATH_DINQ); // öz mətbəx səsini də burada istəyə görə çal
    a.play().catch(err => console.warn("kitchen dinq rejected:", err));
  } catch(e){ console.warn(e); }

  // UI yenilə
  loadKitchen();
}


// 4) Mətbəx üçün yeni sifarişlərə qulaq as (daxili polling)
// Bu funksiya kitchen.html-də onload ilə işə düşsün: listenNewOrders();
function listenNewOrders(interval = 1500){
  let lastNewCount = getOrders().filter(o=>o.status==="new").length;

  setInterval(() => {
    const all = getOrders();
    const currentNew = all.filter(o=>o.status==="new").length;
    if(currentNew > lastNewCount){
      // yeni sifariş gəldi — səs çal
      try {
        const a = new Audio(PATH_DING);
        a.play().catch(e => console.warn("listenNewOrders play rejected", e));
      } catch(e){}
    }
    lastNewCount = currentNew;
    loadKitchen();
  }, interval);
}


// 5) Ofisiant — qəbul olunan sifariş üçün bildiriş (listenAccepted)
function listenAccepted(interval = 1500){
  setInterval(() => {
    const all = getOrders();
    all.forEach(o => {
      if(o.status === "accepted"){
        // ofisiant səsi
        try {
          const a = new Audio(PATH_DINQ);
          a.play().catch(e => console.warn("listenAccepted play rejected", e));
        } catch(e){}

        // statusu "notified" edək ki təkrar bildiriş gəlməsin
        o.status = "notified";
      }
    });
    saveOrders(all);
  }, interval);
}


// 6) Admin — giriş
function adminLogin(){
  const code = (document.getElementById("adminCode") || {}).value || "";
  if(code === "1986"){
    document.getElementById("panel").style.display = "block";
    loadAdminOrders();
    loadCerime();
  } else alert("Kod səhvdir!");
}


// 7) Admin sifarişləri göstər (həm new, həm accepted, həm notified)
function loadAdminOrders(){
  const list = document.getElementById("adminList");
  if(!list) return;
  const all = getOrders();
  list.innerHTML = "";

  all.forEach(o => {
    const li = document.createElement("li");
    li.innerHTML = `<div>
                      <strong>Masa ${o.masa}</strong>
                      <div class="meta">${o.mehsul} — ${o.qeyd}</div>
                      <div class="meta">${o.time} — <span class="status">${o.status}</span></div>
                    </div>`;

    const btn = document.createElement("button");
    btn.textContent = "Sil";
    btn.onclick = () => {
      deleteOrder(o.id);
    };

    li.appendChild(btn);
    list.appendChild(li);
  });
}


// 8) Admin — sil
function deleteOrder(id){
  const all = getOrders().filter(o=>o.id !== id);
  saveOrders(all);
  loadAdminOrders();
}


// 9.. Cerime (admin) — eyni kimi saxla
function addCerime(){
  const amount = (document.getElementById("cerimeAmount") || {}).value || "";
  if(!amount){ alert("Məbləğ daxil et!"); return; }
  const c = JSON.parse(localStorage.getItem("cerime")) || [];
  c.push({ id: Date.now(), amount });
  localStorage.setItem("cerime", JSON.stringify(c));
  loadCerime();
}
function loadCerime(){
  const el = document.getElementById("cerimeList");
  if(!el) return;
  const c = JSON.parse(localStorage.getItem("cerime")) || [];
  el.innerHTML = "";
  c.forEach((item,i) => {
    const li = document.createElement("li");
    li.textContent = `${item.amount} AZN`;
    const b = document.createElement("button");
    b.textContent = "Sil"; b.onclick = ()=> { c.splice(i,1); localStorage.setItem("cerime", JSON.stringify(c)); loadCerime(); };
    li.appendChild(b);
    el.appendChild(li);
  });
}
