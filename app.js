// =====================
// TABLA
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
let ultimoTotal = 0;
let stockPorIsotanque = JSON.parse(localStorage.getItem("stockPorIsotanque")) || [0, 0, 0, 0];
let historial = JSON.parse(localStorage.getItem("historialDescargas")) || [];
let cargaTotalInicial = Number(localStorage.getItem("cargaTotalInicial")) || 0;

// =====================
// CAMPAÑAS
// =====================
let campaigns = JSON.parse(localStorage.getItem("campaigns")) || [];

function saveCampaigns() {
  localStorage.setItem("campaigns", JSON.stringify(campaigns));
}

function getActiveCampaign() {
  return campaigns.find(c => c.endTimestamp === null) || null;
}

function startCampaign() {
  if (getActiveCampaign()) {
    alert("Ya existe una campaña activa");
    return;
  }

  const initialStocks = {};
  stockPorIsotanque.forEach((s, i) => {
    initialStocks[i + 1] = s;
  });

  const campaign = {
    id: "camp_" + Date.now(),
    startTimestamp: new Date().toISOString(),
    endTimestamp: null,
    initialStocks
  };

  campaigns.push(campaign);
  saveCampaigns();
  alert("Campaña iniciada");
}

function cerrarCampana() {
  const active = getActiveCampaign();
  if (!active) {
    alert("No hay campaña activa");
    return;
  }

  active.endTimestamp = new Date().toISOString();
  saveCampaigns();
  alert("Campaña cerrada");
}

// =====================
// INTERPOLAR
// =====================
function interpolar(mm) {
  if (mm === "" || isNaN(mm)) return null;
  mm = Number(mm);
  if (mm < tabla[0].mm || mm > tabla[tabla.length - 1].mm) return "fuera";

  for (let i = 0; i < tabla.length - 1; i++) {
    const a = tabla[i];
    const b = tabla[i + 1];
    if (mm >= a.mm && mm <= b.mm) {
      const r = (mm - a.mm) / (b.mm - a.mm);
      return a.m3 + r * (b.m3 - a.m3);
    }
  }
}

function totalBordo() {
  return stockPorIsotanque.reduce((acc, n) => acc + n, 0);
}

function isotanqueActualIndex() {
  return Number(document.getElementById("isotanqueSelect").value) - 1;
}

function limpiarCalculadora() {
  ultimoTotal = 0;
  document.getElementById("nivelA").value = "";
  document.getElementById("nivelB").value = "";
  document.getElementById("m3A").textContent = "—";
  document.getElementById("m3B").textContent = "—";
  document.getElementById("resultado").textContent = "Total descargado: —";
}

function persistirStock() {
  localStorage.setItem("stockPorIsotanque", JSON.stringify(stockPorIsotanque));
}

// =====================
// REGISTRAR DESCARGA
// =====================
function registrarDescarga(volumen, tipo) {

  const activeCampaign = getActiveCampaign();
  if (!activeCampaign) {
    alert("Debes iniciar campaña primero");
    return;
  }

  const centro = document.getElementById("centro").value.trim();
  if (!centro) {
    alert("Debes ingresar un centro.");
    return;
  }

  const idx = isotanqueActualIndex();
  const isotanqueN = idx + 1;
  const stockActual = stockPorIsotanque[idx] || 0;

  if (volumen <= 0) return;

  let volumenFinal = volumen;
  if (volumenFinal > stockActual) {
    if (!confirm("La descarga supera stock. ¿Cerrar isotanque?")) return;
    volumenFinal = stockActual;
  }

  stockPorIsotanque[idx] = Math.max(0, stockActual - volumenFinal);
  persistirStock();

  const registro = {
    campaignId: activeCampaign.id,
    centro,
    isotanque: isotanqueN,
    tipo,
    volumen: volumenFinal,
    fecha: new Date().toISOString().split("T")[0]
  };

  historial.push(registro);
  localStorage.setItem("historialDescargas", JSON.stringify(historial));

  document.getElementById("centro").value = "";
  limpiarCalculadora();
}

function registrarPorTramo() {
  registrarDescarga(ultimoTotal, "tramo");
}

function descargarIsotanqueCompleto() {
  const idx = isotanqueActualIndex();
  const stockActual = stockPorIsotanque[idx] || 0;
  if (stockActual <= 0) return;
  if (!confirm("Descarga completa?")) return;
  registrarDescarga(stockActual, "completa");
}
