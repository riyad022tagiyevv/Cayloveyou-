// ===== FIREBASE CONFIG =====
const firebaseConfig = {
    apiKey: "SƏNİN_API_KEY",
    authDomain: "SƏNİN_authDomain",
    databaseURL: "SƏNİN_databaseURL",
    projectId: "SƏNİN_projectId",
    storageBucket: "SƏNİN_storageBucket",
    messagingSenderId: "SƏNİN_messagingSenderId",
    appId: "SƏNİN_appId"
};

// Firebase-i başladırıq
firebase.initializeApp(firebaseConfig);
const db = firebase.database();


// ===== Sifariş göndərmək =====
function sendOrder() {
    const table = document.getElementById("table").value;
    const meal = document.getElementById("meal").value;
    const note = document.getElementById("note").value;

    if (!table || !meal) {
        alert("Masa və Məhsul boş ola bilməz!");
        return;
    }

    db.ref("orders").push({
        table,
        meal,
        note,
        time: new Date().toLocaleTimeString()
    });

    alert("Sifariş göndərildi!");
    document.getElementById("table").value = "";
    document.getElementById("meal").value = "";
    document.getElementById("note").value = "";
}


// ===== Mətbəx Panelində sifarişləri göstərmək =====
function loadKitchen() {
    const box = document.getElementById("ordersBox");

    db.ref("orders").on("value", snapshot => {
        box.innerHTML = "";
        snapshot.forEach(child => {
            const o = child.val();

            box.innerHTML += `
                <div style="padding:10px; margin:10px; border:1px solid #ccc; border-radius:6px;">
                    <b>Masa:</b> ${o.table} <br>
                    <b>Məhsul:</b> ${o.meal} <br>
                    <b>Qeyd:</b> ${o.note} <br>
                    <i>${o.time}</i>
                </div>
            `;
        });
    });
}
