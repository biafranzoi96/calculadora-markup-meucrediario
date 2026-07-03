const custoInput      = document.getElementById('custo');
const markupInput     = document.getElementById('markup');
const btnAdicionar    = document.getElementById('btn-adicionar');
const custosExtras    = document.getElementById('custos-extras');
const resultado       = document.getElementById('resultado');
const avisoinvalido   = document.getElementById('aviso-invalido');
const precoValorEl    = document.getElementById('preco-valor');
const lucroValorEl    = document.getElementById('lucro-valor');
const margemVendaEl   = document.getElementById('margem-venda');
const markupCustoEl   = document.getElementById('markup-custo');
const breakdownEl     = document.getElementById('breakdown');
const barraCustosEl   = document.getElementById('barra-custos');
const barraLucroEl    = document.getElementById('barra-lucro');

function brl(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function pct(valor) {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
}

function applyMoneyMask(input) {
  const digits = input.value.replace(/\D/g, '');
  if (!digits) { input.value = ''; return; }
  const cents = parseInt(digits, 10);
  if (cents === 0) { input.value = ''; return; }
  input.value = (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function parseMoney(input) {
  return parseFloat(input.value.replace(/\./g, '').replace(',', '.')) || 0;
}

function getExtras() {
  const rows = custosExtras.querySelectorAll('.custo-extra-row');
  const extras = [];
  rows.forEach(row => {
    const nome  = row.querySelector('.custo-extra-nome').value.trim() || 'Custo adicional';
    const valor = parseMoney(row.querySelector('.custo-extra-valor'));
    if (valor > 0) extras.push({ nome, valor });
  });
  return extras;
}

function calcular() {
  const custo     = parseMoney(custoInput);
  const markupPct = parseFloat(markupInput.value) || 0;
  const extras    = getExtras();

  const custoTotal = custo + extras.reduce((s, e) => s + e.valor, 0);

  // Esconde tudo inicialmente
  resultado.hidden      = true;
  avisoinvalido.hidden  = true;

  if (custo <= 0 || markupPct <= 0) return;

  if (markupPct >= 100) {
    avisoinvalido.hidden = false;
    return;
  }

  const precoVenda = custoTotal / (1 - markupPct / 100);
  const lucro      = precoVenda - custoTotal;
  const pctCustos  = (custoTotal / precoVenda) * 100;
  const pctLucro   = (lucro / precoVenda) * 100;
  const markupSCusto = custoTotal > 0 ? (lucro / custoTotal) * 100 : 0;

  // Barra proporcional
  barraCustosEl.style.width = pctCustos.toFixed(1) + '%';
  barraLucroEl.style.width  = pctLucro.toFixed(1) + '%';

  // Breakdown
  breakdownEl.innerHTML = '';

  function addItem(nome, valor, total, cls) {
    const item = document.createElement('div');
    item.className = 'breakdown-item' + (cls ? ' ' + cls : '');
    const participacao = (valor / precoVenda) * 100;
    item.innerHTML = `
      <span class="breakdown-item-nome">${nome}</span>
      <span class="breakdown-item-valor">
        ${brl(valor)}<span class="breakdown-pct">${pct(participacao)}</span>
      </span>`;
    breakdownEl.appendChild(item);
  }

  // Custo do produto
  if (custo > 0) addItem('Custo do produto', custo, precoVenda);

  // Custos extras individuais
  extras.forEach(e => addItem(e.nome, e.valor, precoVenda));

  // Separador + total custos (só mostra se houver mais de uma linha de custo)
  if (extras.length > 0) {
    addItem('Total de custos', custoTotal, precoVenda, 'total-custos');
  }

  // Lucro
  addItem('Lucro', lucro, precoVenda, 'lucro');

  // Métricas
  precoValorEl.textContent  = brl(precoVenda);
  lucroValorEl.textContent  = brl(lucro);
  margemVendaEl.textContent = pct(pctLucro);
  markupCustoEl.textContent = pct(markupSCusto);

  resultado.hidden = false;
}

function adicionarCustoExtra() {
  const row = document.createElement('div');
  row.className = 'custo-extra-row';
  row.innerHTML = `
    <input type="text" class="custo-extra-nome" placeholder="Ex: Frete">
    <div class="custo-extra-valor-wrap">
      <span>R$</span>
      <input type="text" class="custo-extra-valor" placeholder="0,00" inputmode="decimal">
    </div>
    <button type="button" class="btn-remover" title="Remover">×</button>`;

  const extraValorInput = row.querySelector('.custo-extra-valor');
  row.querySelector('.btn-remover').addEventListener('click', () => {
    row.remove();
    calcular();
  });
  row.querySelector('.custo-extra-nome').addEventListener('input', calcular);
  extraValorInput.addEventListener('input', () => {
    applyMoneyMask(extraValorInput);
    calcular();
  });

  custosExtras.appendChild(row);
  row.querySelector('.custo-extra-nome').focus();
}

function atualizarSugestaoAtiva() {
  const val = markupInput.value;
  document.querySelectorAll('.sugestao').forEach(btn => {
    btn.classList.toggle('ativo', btn.dataset.valor === val);
  });
}

document.querySelectorAll('.sugestao').forEach(btn => {
  btn.addEventListener('click', () => {
    markupInput.value = btn.dataset.valor;
    atualizarSugestaoAtiva();
    calcular();
  });
});

btnAdicionar.addEventListener('click', adicionarCustoExtra);
custoInput.addEventListener('input', () => {
  applyMoneyMask(custoInput);
  calcular();
});
markupInput.addEventListener('input', () => {
  atualizarSugestaoAtiva();
  calcular();
});
