// =====================
// TABLA DE CONVERSIÓN
// =====================
const tabla = [
  { mm: 0, m3: 0 }, { mm: 2, m3: 4.2 }, { mm: 50, m3: 75.6 },
  { mm: 100, m3: 213.36 }, { mm: 200, m3: 608.16 }, { mm: 300, m3: 1119.72 },
  { mm: 400, m3: 1720.32 }, { mm: 500, m3: 2394.84 }, { mm: 600, m3: 3129 },
  { mm: 700, m3: 3913.56 }, { mm: 800, m3: 4739.28 }, { mm: 880, m3: 5423.04 },
  { mm: 900, m3: 5596.92 }, { mm: 1000, m3: 6479.76 }, { mm: 1060, m3: 7019.04 },
  { mm: 1100, m3: 7381.08 }, { mm: 1200, m3: 8293.32 }, { mm: 1300, m3: 9209.76 },
  { mm: 1400, m3: 10124.52 }, { mm: 1500, m3: 11030.88 }, { mm: 1600, m3: 11922.12 },
  { mm: 1700, m3: 12790.68 }, { mm: 1800, m3: 13629 }, { mm: 1900, m3: 14430.36 },
  { mm: 2000, m3: 15185.52 }, { mm: 2100, m3: 15884.4 }, { mm: 2200, m3: 16515.24 },
  { mm: 2300, m3: 17063.76 }, { mm: 2360, m3: 17334.32 }, { mm: 2400, m3: 17508.12 },
  { mm: 2410, m3: 17556 }
];

// =====================
// ESTADO
// =====================
let stockPorIsotanque = JSON.parse(localStorage.getItem("stockPorIsotanque")) ?? [0,0,0,0];
let cargaInicial = JSON.parse(localStorage.getItem("cargaInicial")) ?? [0,0,0,0];
let historial = JSON.parse(localStorage.getItem("historialDescargas")) ?? [];
let ultimoTotal = 0;
let campanaBloqueada = cargaInicial.some(v => v > 0);

// =====================
// UTILIDADES
// =====================
function guardarStock(){
  localStorage.setItem("stockPorIsotanque", JSON.stringify(stockPorIsotanque));
}

function guardarCargaInicial(){
  localStorage.setItem("cargaInicial", JSON.stringify(cargaInicial));
}

function guardarHistorial(){
  localStorage.setItem("historialDescargas", JSON.stringify(historial));
}

function totalBordo(){
  return stockPorIsotanque.reduce((a,b)=>a+b,0);
}

function isotanqueActualIndex(){
  return Number(document.getElementById("isotanqueSelect").value) - 1;
}

// =====================
// CAMPAÑA
// =====================
function iniciarCampana(){

  if(campanaBloqueada) return;

  const v1 = Number(document.getElementById("saldoIso1").value) || 0;
  const v2 = Number(document.getElementById("saldoIso2").value) || 0;
  const v3 = Number(document.getElementById("saldoIso3").value) || 0;
  const v4 = Number(document.getElementById("saldoIso4").value) || 0;

  cargaInicial = [v1,v2,v3,v4];
  stockPorIsotanque = [...cargaInicial];

  guardarCargaInicial();
  guardarStock();

  bloquearInputsCampana();
  actualizarStockUI();
}

function bloquearInputsCampana(){
  ["saldoIso1","saldoIso2","saldoIso3","saldoIso4"].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.readOnly=true;
  });
  campanaBloqueada=true;
}

// =====================
// UI
// =====================
function actualizarColorIsotanque(valor){

  const el=document.getElementById("stockIsotanque");
  if(!el) return;

  el.classList.remove("iso-normal","iso-warning","iso-critical");

  if(valor >= 4000) el.classList.add("iso-normal");
  else if(valor >= 3000) el.classList.add("iso-warning");
  else el.classList.add("iso-critical");
}

function actualizarStockUI(){

  const idx = isotanqueActualIndex();
  const stockActual = stockPorIsotanque[idx];

  document.getElementById("stockIsotanque").textContent =
    stockActual.toLocaleString("es-CL",{minimumFractionDigits:2}) + " m³";

  document.getElementById("saldoRestante").textContent =
    totalBordo().toLocaleString("es-CL",{minimumFractionDigits:2}) + " m³";

  actualizarColorIsotanque(stockActual);
}

// =====================
// INTERPOLACIÓN
// =====================
function interpolar(mm){

  if(mm==="" || isNaN(mm)) return null;

  mm = Number(mm);

  if(mm < tabla[0].mm || mm > tabla[tabla.length-1].mm) return null;

  for(let i=0;i<tabla.length-1;i++){

    const a = tabla[i];
    const b = tabla[i+1];

    if(mm >= a.mm && mm <= b.mm){

      const r = (mm-a.mm)/(b.mm-a.mm);

      return a.m3 + r*(b.m3-a.m3);
    }
  }

  return null;
}

// =====================
// CALCULO DESCARGA
// =====================
function actualizar(){

  const A = interpolar(document.getElementById("nivelA").value);
  const B = interpolar(document.getElementById("nivelB").value);

  document.getElementById("m3A").textContent = A ? A.toFixed(2)+" m³" : "—";
  document.getElementById("m3B").textContent = B ? B.toFixed(2)+" m³" : "—";

  if(A!==null && B!==null){

    ultimoTotal = Math.abs(A-B);

    document.getElementById("resultado").textContent =
      "Total descargado: " + ultimoTotal.toFixed(2) + " m³";

  }else{

    ultimoTotal = 0;

    document.getElementById("resultado").textContent =
      "Total descargado: —";
  }
}

// =====================
// HISTORIAL
// =====================
function renderHistorial(){

  const cont = document.getElementById("historial");
  if(!cont) return;

  cont.innerHTML = "";

  [...historial].reverse().forEach(r=>{

    const div = document.createElement("div");

    div.textContent =
      `${r.fecha} — ${r.centro} — Iso ${r.isotanque} — ${r.tipo} — ${r.volumen.toFixed(2)} m³`;

    cont.appendChild(div);
  });
}

// =====================
// REGISTRAR DESCARGA
// =====================
function registrarDescarga(volumen,tipo){

  if(!volumen || volumen<=0) return;

  const centro = document.getElementById("centro").value.trim();
  if(!centro) return alert("Debes ingresar un centro.");

  const idx = isotanqueActualIndex();
  const stockActual = stockPorIsotanque[idx];

  if(volumen > stockActual){
    alert("La descarga supera el stock restante del isotanque.");
    return;
  }

  stockPorIsotanque[idx] = stockActual - volumen;

  guardarStock();

  historial.push({
    fecha:new Date().toLocaleDateString("es-CL"),
    centro,
    isotanque:idx+1,
    tipo,
    volumen
  });

  guardarHistorial();

  actualizarStockUI();
  renderHistorial();
}

function registrarPorTramo(){
  registrarDescarga(ultimoTotal,"tramo");
}

function descargarRestante(){

  const idx = isotanqueActualIndex();
  const stockActual = stockPorIsotanque[idx];

  if(stockActual <= 0) return alert("Isotanque vacío.");

  registrarDescarga(stockActual,"completa");
}

// =====================
// ROLLBACK
// =====================
function rollback(){

  if(!historial.length) return alert("Nada que deshacer.");

  const ultimo = historial.pop();

  stockPorIsotanque[ultimo.isotanque-1] += ultimo.volumen;

  guardarStock();
  guardarHistorial();

  actualizarStockUI();
  renderHistorial();
}

// =====================
// NUEVA CAMPAÑA
// =====================
function nuevaCampana(){

  if(!confirm("¿Iniciar nueva campaña?")) return;

  stockPorIsotanque = [0,0,0,0];
  cargaInicial = [0,0,0,0];
  historial = [];

  localStorage.removeItem("stockPorIsotanque");
  localStorage.removeItem("cargaInicial");
  localStorage.removeItem("historialDescargas");

  ["saldoIso1","saldoIso2","saldoIso3","saldoIso4"].forEach(id=>{
    const el=document.getElementById(id);
    if(el){
      el.value="";
      el.readOnly=false;
    }
  });

  campanaBloqueada=false;

  actualizarStockUI();
  renderHistorial();
}

// =====================
// COPIAR HISTORIAL
// =====================
function copiarHistorial(){

  if(!historial.length) return alert("No hay descargas.");

  let texto="Historial descargas LOX\n\n";

  historial.forEach(r=>{
    texto+=`${r.fecha} - ${r.centro} - Iso ${r.isotanque} - ${r.volumen.toFixed(2)} m³\n`;
  });

  const textarea=document.createElement("textarea");
  textarea.value=texto;

  document.body.appendChild(textarea);
  textarea.select();

  document.execCommand("copy");

  document.body.removeChild(textarea);

  alert("Historial copiado");
}

// =====================
// INICIO
// =====================
window.addEventListener("load",()=>{

  ["saldoIso1","saldoIso2","saldoIso3","saldoIso4"].forEach((id,i)=>{
    const input=document.getElementById(id);
    if(input) input.value=cargaInicial[i]||"";
  });

  if(campanaBloqueada) bloquearInputsCampana();

  actualizarStockUI();
  renderHistorial();

  document.getElementById("nivelA").addEventListener("input",actualizar);
  document.getElementById("nivelB").addEventListener("input",actualizar);

  document.getElementById("registrar").addEventListener("click",registrarPorTramo);
  document.getElementById("descargaCompleta").addEventListener("click",descargarRestante);

  document.getElementById("rollback").addEventListener("click",rollback);
  document.getElementById("exportar").addEventListener("click",copiarHistorial);
  document.getElementById("nuevaCampana").addEventListener("click",nuevaCampana);

  document.getElementById("isotanqueSelect").addEventListener("change",function(){

    const isoTitulo=document.getElementById("isoTitulo");

    if(isoTitulo) isoTitulo.textContent="Isotanque "+this.value;

    actualizarStockUI();
  });

  ["saldoIso1","saldoIso2","saldoIso3","saldoIso4"].forEach(id=>{
    document.getElementById(id).addEventListener("change",iniciarCampana);
  });
});
