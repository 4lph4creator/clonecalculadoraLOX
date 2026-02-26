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

// Compatibilidad con versiones anteriores
if (!localStorage.getItem("stockPorIsotanque")) {
  const stockLegacy = Number(localStorage.getItem("stockBordo")) || 0;
  if (stockLegacy > 0) {
    stockPorIsotanque = [stockLegacy, 0, 0, 0];
  }
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

function sumaCargasIngresadas() {
  return (
    (Number(document.getElementById("saldoIso1").value) || 0) +
    (Number(document.getElementById("saldoIso2").value) || 0) +
    (Number(document.getElementById("saldoIso3").value) || 0) +
    (Number(document.getElementById("saldoIso4").value) || 0)
  );
}

function actualizarCargaTotalInicialUI(valor) {
  const input = document.getElementById("cargaTotalInicial");
  input.value = valor > 0 ? valor.toFixed(2) : "";
}

function actualizarStockUI() {
  const idx = isotanqueActualIndex();
  const stockActual = stockPorIsotanque[idx] || 0;
  document.getElementById("stockIsotanque").textContent =
    `Stock isotanque seleccionado: ${stockActual.toFixed(2)} m³`;
  document.getElementById("saldoRestante").textContent =
    `Stock a bordo: ${totalBordo().toFixed(2)} m³`;
}

function bloquearCargasInicialesSiCorresponde() {
  const hayStock = totalBordo() > 0;
  ["saldoIso1", "saldoIso2", "saldoIso3", "saldoIso4"].forEach(id => {
    document.getElementById(id).disabled = hayStock;
  });
  document.getElementById("cargaTotalInicial").disabled = hayStock;
}

function previsualizarCargaTotalInicial() {
  if (totalBordo() > 0) return;
  actualizarCargaTotalInicialUI(sumaCargasIngresadas());
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
// RENDER HISTORIAL
// =====================
function renderHistorial() {
  const cont = document.getElementById("historial");
  cont.innerHTML = "";

  [...historial].reverse().forEach(r => {
    const div = document.createElement("div");
    const fecha = r.fecha.split("-").reverse().join("-");
    const tipo = r.tipo === "completa" ? "completa" : "tramo";
    div.textContent = `${fecha} — ${r.centro} — Isotanque ${r.isotanque} — ${tipo} — ${r.volumen.toFixed(0)} m³`;
    cont.appendChild(div);
  });
}

// =====================
// LOAD
// =====================
window.addEventListener("load", () => {
  ["saldoIso1", "saldoIso2", "saldoIso3", "saldoIso4"].forEach((id, idx) => {
    const input = document.getElementById(id);
    const valor = stockPorIsotanque[idx] || 0;
    input.value = valor > 0 ? valor : "";
  });

  if (!cargaTotalInicial && totalBordo() > 0) {
    cargaTotalInicial = totalBordo();
    localStorage.setItem("cargaTotalInicial", cargaTotalInicial.toString());
  }

  actualizarCargaTotalInicialUI(cargaTotalInicial || sumaCargasIngresadas());
  bloquearCargasInicialesSiCorresponde();
  actualizarStockUI();
  renderHistorial();
});

// =====================
// CALCULO
// =====================
function actualizar() {
  const A = interpolar(document.getElementById("nivelA").value);
  const B = interpolar(document.getElementById("nivelB").value);

  document.getElementById("m3A").textContent =
    typeof A === "number" ? `Equivalente: ${A.toFixed(2)} m³` :
    A === "fuera" ? "Nivel fuera de tabla" : "—";

  document.getElementById("m3B").textContent =
    typeof B === "number" ? `Equivalente: ${B.toFixed(2)} m³` :
    B === "fuera" ? "Nivel fuera de tabla" : "—";

  if (typeof A === "number" && typeof B === "number") {
    ultimoTotal = Math.abs(A - B);
    document.getElementById("resultado").textContent =
      `Total descargado: ${ultimoTotal.toFixed(2)} m³`;
  } else {
    ultimoTotal = 0;
    document.getElementById("resultado").textContent = "Total descargado: —";
  }
}

function obtenerFechaLocal() {
  const hoy = new Date();
  return (
    hoy.getFullYear() + "-" +
    String(hoy.getMonth() + 1).padStart(2, "0") + "-" +
    String(hoy.getDate()).padStart(2, "0")
  );
}

function inicializarCargasSiHaceFalta() {
  if (totalBordo() > 0) return true;

  const cargas = [
    Number(document.getElementById("saldoIso1").value) || 0,
    Number(document.getElementById("saldoIso2").value) || 0,
    Number(document.getElementById("saldoIso3").value) || 0,
    Number(document.getElementById("saldoIso4").value) || 0
  ];

  const total = cargas.reduce((acc, n) => acc + n, 0);
  if (total <= 0) {
    alert("Ingresa al menos una carga inicial de isotanque.");
    return false;
  }

  stockPorIsotanque = cargas;
  cargaTotalInicial = total;
  persistirStock();
  localStorage.setItem("cargaTotalInicial", cargaTotalInicial.toString());

  actualizarCargaTotalInicialUI(cargaTotalInicial);
  bloquearCargasInicialesSiCorresponde();
  actualizarStockUI();
  return true;
}

function registrarDescarga(volumen, tipo) {
  const centro = document.getElementById("centro").value.trim();
  if (!centro) {
    alert("Debes ingresar un centro.");
    return;
  }

  if (!inicializarCargasSiHaceFalta()) return;

  const idx = isotanqueActualIndex();
  const isotanqueN = idx + 1;
  const stockActual = stockPorIsotanque[idx] || 0;

  if (volumen <= 0) return;

  let volumenFinal = volumen;
  if (volumenFinal > stockActual) {
    const confirmar = confirm(
      `La descarga (${volumenFinal.toFixed(2)} m³) supera el stock del Isotanque ${isotanqueN} (${stockActual.toFixed(2)} m³).\n\n¿Cerrar isotanque?`
    );
    if (!confirmar) return;
    volumenFinal = stockActual;
  }

  stockPorIsotanque[idx] = Math.max(0, stockActual - volumenFinal);
  persistirStock();

  const registro = {
    centro,
    isotanque: isotanqueN,
    tipo,
    volumen: volumenFinal,
    fecha: obtenerFechaLocal()
  };

  historial.push(registro);
  localStorage.setItem("historialDescargas", JSON.stringify(historial));

  renderHistorial();
  actualizarStockUI();

  document.getElementById("centro").value = "";
  limpiarCalculadora();
}

// =====================
// REGISTRAR
// =====================
function registrarPorTramo() {
  registrarDescarga(ultimoTotal, "tramo");
}

function descargarIsotanqueCompleto() {
  if (!inicializarCargasSiHaceFalta()) return;
  const idx = isotanqueActualIndex();
  const stockActual = stockPorIsotanque[idx] || 0;

  if (stockActual <= 0) {
    alert("El isotanque seleccionado ya no tiene stock.");
    return;
  }

  if (!confirm(`¿Registrar descarga completa del Isotanque ${idx + 1} por ${stockActual.toFixed(2)} m³?`)) return;

  registrarDescarga(stockActual, "completa");
}

// =====================
// NUEVA CAMPAÑA
// =====================
function nuevaCampana() {
  localStorage.removeItem("stockPorIsotanque");
  localStorage.removeItem("stockBordo");
  localStorage.removeItem("historialDescargas");
  localStorage.removeItem("cargaTotalInicial");

  stockPorIsotanque = [0, 0, 0, 0];
  historial = [];
  cargaTotalInicial = 0;

  ["saldoIso1", "saldoIso2", "saldoIso3", "saldoIso4"].forEach(id => {
    const input = document.getElementById(id);
    input.disabled = false;
    input.value = "";
  });

  const inputTotal = document.getElementById("cargaTotalInicial");
  inputTotal.disabled = false;
  inputTotal.value = "";

  actualizarStockUI();
  limpiarCalculadora();
  renderHistorial();
}

// =====================
// COPIAR HISTORIAL
// =====================
function copiarHistorial() {
  if (!historial.length) return alert("No hay descargas");

  let texto = "Historial descargas LOX\n\n";

  [...historial].reverse().forEach(r => {
    const fecha = r.fecha.split("-").reverse().join("-");
    const tipo = r.tipo === "completa" ? "completa" : "tramo";
    texto += `${fecha} - ${r.centro} - Isotanque ${r.isotanque} - ${tipo} - ${r.volumen.toFixed(0)} m3\n`;
  });

  navigator.clipboard.writeText(texto)
    .then(() => alert("Historial copiado"));
}

// =====================
// ROLLBACK
// =====================
function rollback() {
  if (!historial.length) return alert("Nada que deshacer");

  if (!confirm("¿Deshacer última descarga?")) return;

  const ultimo = historial.pop();
  const idx = (ultimo.isotanque || 1) - 1;
  stockPorIsotanque[idx] = (stockPorIsotanque[idx] || 0) + ultimo.volumen;

  persistirStock();
  localStorage.setItem("historialDescargas", JSON.stringify(historial));

  actualizarStockUI();
  renderHistorial();
}

// =====================
// EVENTOS
// =====================
document.getElementById("nivelA").addEventListener("input", actualizar);
document.getElementById("nivelB").addEventListener("input", actualizar);
document.getElementById("isotanqueSelect").addEventListener("change", actualizarStockUI);
document.getElementById("registrar").addEventListener("click", registrarPorTramo);
document.getElementById("descargaCompleta").addEventListener("click", descargarIsotanqueCompleto);
document.getElementById("nuevaCampana").addEventListener("click", nuevaCampana);
document.getElementById("exportar").addEventListener("click", copiarHistorial);
document.getElementById("rollback").addEventListener("click", rollback);

document.getElementById("saldoIso1").addEventListener("input", previsualizarCargaTotalInicial);
document.getElementById("saldoIso2").addEventListener("input", previsualizarCargaTotalInicial);
document.getElementById("saldoIso3").addEventListener("input", previsualizarCargaTotalInicial);
document.getElementById("saldoIso4").addEventListener("input", previsualizarCargaTotalInicial);
