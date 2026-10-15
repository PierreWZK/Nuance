// Page du générateur. La logique des couleurs est dans palette.js.

let colors = [];
let mode = 'random';

const paletteEl = document.getElementById('palette');
const modesEl = document.getElementById('modes');
const toastEl = document.getElementById('toast');
const addBtn = document.getElementById('add');

// ---------- Modes ----------

function renderModes() {
  modesEl.innerHTML = '';

  Object.entries(MODES).forEach(([key, { label }]) => {
    const btn = document.createElement('button');
    btn.className = 'mode' + (key === mode ? ' is-active' : '');
    btn.textContent = label;
    btn.addEventListener('click', () => {
      mode = key;
      renderModes();
      generate();
    });
    modesEl.appendChild(btn);
  });

  // Le mode actif reste toujours visible
  modesEl.querySelector('.is-active').scrollIntoView({ block: 'nearest', inline: 'nearest' });
  updateModesFade();
}

// ---------- Défilement des modes ----------

// Indique s'il reste des modes cachés à gauche ou à droite (pour le fondu)
function updateModesFade() {
  const max = modesEl.scrollWidth - modesEl.clientWidth;
  modesEl.classList.toggle('can-left', modesEl.scrollLeft > 1);
  modesEl.classList.toggle('can-right', modesEl.scrollLeft < max - 1);
}

modesEl.addEventListener('scroll', updateModesFade);
window.addEventListener('resize', updateModesFade);

// La molette verticale de la souris fait défiler les modes horizontalement
modesEl.addEventListener('wheel', e => {
  if (modesEl.scrollWidth <= modesEl.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
  e.preventDefault();
  modesEl.scrollLeft += e.deltaY;
}, { passive: false });

// Glisser à la souris pour faire défiler (au doigt, c'est déjà natif).
// Au-delà de 5 px, c'est un défilement : le clic sur le mode est annulé.
let modesDragged = false;

modesEl.addEventListener('pointerdown', e => {
  modesDragged = false;
  if (e.pointerType !== 'mouse' || e.button !== 0) return;
  if (modesEl.scrollWidth <= modesEl.clientWidth) return;

  const startX = e.clientX;
  const startScroll = modesEl.scrollLeft;

  function onMove(ev) {
    const dx = ev.clientX - startX;
    if (!modesDragged && Math.abs(dx) < 5) return;
    modesDragged = true;
    modesEl.classList.add('is-dragging');
    modesEl.scrollLeft = startScroll - dx;
  }

  function onUp() {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    modesEl.classList.remove('is-dragging');
  }

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
});

// Bloque le clic qui suit un glisser (phase de capture : avant le bouton du mode)
modesEl.addEventListener('click', e => {
  if (modesDragged) {
    e.stopPropagation();
    e.preventDefault();
    modesDragged = false;
  }
}, true);

// ---------- Actions sur la palette ----------

function generate() {
  // On garde les couleurs verrouillées et on complète avec de nouvelles
  const count = colors.length >= MIN_COLORS ? colors.length : COUNT;
  const kept = colors.filter(c => c.locked);
  // L'harmonie se construit autour de la première couleur verrouillée, s'il y en a une
  const baseHue = kept.length ? Math.round(kept[0].h) : undefined;
  const fresh = buildPalette(mode, count, baseHue).slice(0, count - kept.length);
  colors = sortByHue([...kept, ...fresh]);
  render();
}

function addColor() {
  if (colors.length >= MAX_COLORS) return;
  // Une nouvelle couleur dans le mode actuel, rangée à côté de ses voisines
  const [color] = buildPalette(mode, 1);
  colors = sortByHue([...colors, color]);
  render();
}

function removeColor(color) {
  if (colors.length <= MIN_COLORS) return;
  colors = colors.filter(c => c !== color);
  render();
}

// Change la teinte d'une couleur (depuis le sélecteur de couleur)
function setColorValue(color, hex) {
  const hsl = hexToHsl(hex);
  if (!hsl) return;
  Object.assign(color, hsl);
  if (!color.customName) color.name = nameFor(color);
}

// ---------- Affichage ----------

function render() {
  paletteEl.innerHTML = '';
  colors.forEach(color => paletteEl.appendChild(createSwatch(color)));

  addBtn.disabled = colors.length >= MAX_COLORS;
  updateUrl();
}

function createSwatch(color) {
  const swatch = document.createElement('div');
  swatch.className = 'swatch';
  swatch.innerHTML = `
    <div class="tools">
      <button class="tool" data-action="lock"></button>
      <label class="tool tool-picker" title="Modifier la couleur">✎<input type="color"></label>
      <button class="tool" data-action="remove" title="Supprimer">✕</button>
    </div>
    <div class="swatch-info">
      <input class="swatch-name" type="text" maxlength="30" title="Renommer la couleur">
      <span class="swatch-hex"></span>
      <span class="swatch-hsl"></span>
    </div>
  `;

  const lockBtn = swatch.querySelector('[data-action="lock"]');
  const removeBtn = swatch.querySelector('[data-action="remove"]');
  const picker = swatch.querySelector('input[type="color"]');
  const nameInput = swatch.querySelector('.swatch-name');

  // Met à jour l'affichage sans recréer l'élément
  // (utile pendant qu'on fait glisser le sélecteur de couleur)
  function paint() {
    const hex = hslToHex(color);
    swatch.style.background = hex;
    swatch.style.color = textColorFor(color);
    swatch.querySelector('.swatch-hex').textContent = hex;
    swatch.querySelector('.swatch-hsl').textContent = `hsl(${Math.round(color.h)}, ${Math.round(color.s)}%, ${Math.round(color.l)}%)`;
    nameInput.value = color.name;
    picker.value = hex.toLowerCase();
  }
  paint();

  lockBtn.textContent = color.locked ? '🔒' : '🔓';
  lockBtn.title = color.locked ? 'Déverrouiller' : 'Verrouiller';
  if (color.locked) lockBtn.classList.add('is-on');
  removeBtn.disabled = colors.length <= MIN_COLORS;

  // Les clics sur les outils et le nom ne doivent pas copier la couleur
  swatch.querySelector('.tools').addEventListener('click', e => e.stopPropagation());
  nameInput.addEventListener('click', e => e.stopPropagation());

  lockBtn.addEventListener('click', () => {
    color.locked = !color.locked;
    render();
  });

  removeBtn.addEventListener('click', () => removeColor(color));

  picker.addEventListener('input', () => {
    setColorValue(color, picker.value);
    paint();
  });
  picker.addEventListener('change', () => {
    color.locked = true; // une couleur choisie à la main est gardée
    render();
  });

  nameInput.addEventListener('change', () => {
    const name = nameInput.value.trim();
    color.customName = name !== '';
    color.name = name || nameFor(color);
    render();
  });
  nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') nameInput.blur();
  });

  swatch.addEventListener('click', () => {
    if (dragJustEnded) return; // fin d'un glisser-déposer, pas une copie
    const hex = hslToHex(color);
    copy(hex, `${color.name} ${hex}`);
  });

  swatch.colorRef = color;
  enableDrag(swatch);

  return swatch;
}

// ---------- Glisser-déposer ----------

// Fonctionne à la souris et au doigt (Pointer Events).
// Un clic sans mouvement copie la couleur ; au-delà de 6 px, on déplace.
let dragJustEnded = false;

function enableDrag(swatch) {
  swatch.addEventListener('pointerdown', e => {
    // Pas de glisser depuis les boutons ou le champ du nom
    if (e.button !== 0 || e.target.closest('.tools, .swatch-name')) return;

    const horizontal = getComputedStyle(paletteEl).flexDirection === 'row';
    const axis = ev => (horizontal ? ev.clientX : ev.clientY);
    const offsetOf = el => (horizontal ? el.offsetLeft : el.offsetTop);

    const start = axis(e);
    const grab = start - offsetOf(swatch); // où on a attrapé la couleur
    let dragging = false;

    function onMove(ev) {
      const pos = axis(ev);

      if (!dragging) {
        if (Math.abs(pos - start) < 6) return;
        dragging = true;
        paletteEl.classList.add('is-sorting');
        swatch.classList.add('is-dragging');
      }

      // Position du pointeur à l'intérieur de la palette
      const inside = pos - (horizontal ? paletteEl.getBoundingClientRect().left : paletteEl.getBoundingClientRect().top);

      // On place la couleur devant la première voisine dont le centre est après le pointeur
      const others = [...paletteEl.children].filter(el => el !== swatch);
      const next = others.find(el => {
        const size = horizontal ? el.offsetWidth : el.offsetHeight;
        return offsetOf(el) + size / 2 > inside;
      });
      if (next !== swatch.nextElementSibling) {
        paletteEl.insertBefore(swatch, next || null);
      }

      // La couleur suit le pointeur depuis sa nouvelle place
      const shift = inside - grab - offsetOf(swatch);
      swatch.style.transform = horizontal ? `translateX(${shift}px)` : `translateY(${shift}px)`;
    }

    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (!dragging) return;

      swatch.style.transform = '';
      paletteEl.classList.remove('is-sorting');
      swatch.classList.remove('is-dragging');

      // Le nouvel ordre est celui des éléments à l'écran
      colors = [...paletteEl.children].map(el => el.colorRef);
      dragJustEnded = true;
      setTimeout(() => (dragJustEnded = false), 0);
      render();
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  });
}

// ---------- Copie et messages ----------

let toastTimer;
function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 1800);
}

function copy(text, label) {
  navigator.clipboard.writeText(text)
    .then(() => showToast('Copié : ' + label))
    .catch(() => showToast('Impossible de copier'));
}

// ---------- Exports ----------

// Variables CSS nommées d'après les couleurs : --bleu-nuit, --corail…
// Si deux couleurs ont le même nom, on ajoute un numéro : --corail, --corail-2
function exportCss() {
  const used = {};
  const lines = colors.map(color => {
    const slug = slugify(color.name);
    used[slug] = (used[slug] || 0) + 1;
    const varName = used[slug] > 1 ? `${slug}-${used[slug]}` : slug;
    return `  --${varName}: ${hslToHex(color)};`;
  });

  copy(':root {\n' + lines.join('\n') + '\n}', 'variables CSS');
}

// Dessine la palette dans un canvas et la télécharge en PNG
function exportImage() {
  const colWidth = 240;
  const height = 600;
  const canvas = document.createElement('canvas');
  canvas.width = colWidth * colors.length;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  colors.forEach((color, i) => {
    const x = i * colWidth;
    const hex = hslToHex(color);

    ctx.fillStyle = hex;
    ctx.fillRect(x, 0, colWidth, height);

    ctx.fillStyle = textColorFor(color);
    ctx.textAlign = 'center';
    ctx.font = '600 22px Inter, sans-serif';
    ctx.fillText(color.name, x + colWidth / 2, height - 80, colWidth - 20);
    ctx.font = '800 30px "Bricolage Grotesque", sans-serif';
    ctx.fillText(hex, x + colWidth / 2, height - 42);
  });

  const link = document.createElement('a');
  link.download = 'palette.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('Image téléchargée');
}

// ---------- Partage par lien ----------

// La palette est enregistrée dans l'URL :
// generator.html?colors=3A7BD5-FFB300&names=,Mon%20jaune
// (un nom vide = nom automatique)
function shareQuery() {
  const params = new URLSearchParams();
  params.set('mode', mode);
  params.set('colors', colors.map(c => hslToHex(c).slice(1)).join('-'));

  if (colors.some(c => c.customName)) {
    params.set('names', colors.map(c => (c.customName ? c.name : '')).join(','));
  }

  return '?' + params.toString().replace(/%2C/g, ',');
}

function updateUrl() {
  // Garde l'URL à jour : recharger la page conserve la palette.
  // Certains navigateurs refusent en ouvrant le fichier en local (file://).
  try {
    history.replaceState(null, '', shareQuery());
  } catch (e) {}
}

function loadFromUrl() {
  const params = new URLSearchParams(location.search);

  if (MODES[params.get('mode')]) mode = params.get('mode');

  const hexes = (params.get('colors') || '').split('-').filter(Boolean);
  const names = (params.get('names') || '').split(',');

  const loaded = hexes
    .map(hex => hexToHsl(hex))
    .filter(Boolean)
    .slice(0, MAX_COLORS)
    .map((hsl, i) => {
      const color = makeColor(hsl);
      if (names[i]) {
        color.name = names[i].slice(0, 30);
        color.customName = true;
      }
      return color;
    });

  // Une palette partagée garde l'ordre choisi par son auteur
  if (loaded.length >= MIN_COLORS) {
    colors = loaded;
    return;
  }

  // Palette construite autour d'une couleur (ex. la couleur du jour) : generator.html?base=3A7BD5
  const base = hexToHsl(params.get('base') || '');
  if (base) {
    const color = makeColor(base);
    color.locked = true;
    colors = [color];
  }
}

function share() {
  copy(location.href.split('?')[0] + shareQuery(), 'lien de la palette');
}

// ---------- Événements ----------

document.getElementById('generate').addEventListener('click', generate);
document.getElementById('export').addEventListener('click', exportCss);
document.getElementById('image').addEventListener('click', exportImage);
document.getElementById('share').addEventListener('click', share);
addBtn.addEventListener('click', addColor);

// Menu « Outils » (affiché quand la barre est trop étroite)
const menuEl = document.getElementById('menu');
const menuToggle = document.getElementById('menu-toggle');

function setMenu(open) {
  menuEl.classList.toggle('is-open', open);
  menuToggle.setAttribute('aria-expanded', open);
}

menuToggle.addEventListener('click', () => setMenu(!menuEl.classList.contains('is-open')));

// Fermeture : clic en dehors, touche Échap, ou après une action (sauf « Ajouter »,
// qu'on peut vouloir cliquer plusieurs fois)
document.addEventListener('click', e => {
  if (!menuEl.contains(e.target)) setMenu(false);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') setMenu(false);
});
document.getElementById('toolbar').addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (btn && btn !== addBtn) setMenu(false);
});

document.addEventListener('keydown', e => {
  // Pas de génération quand on tape un nom de couleur
  if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
    e.preventDefault();
    generate();
  }
});

loadFromUrl();
renderModes();
if (colors.length >= MIN_COLORS) render();
else generate();
