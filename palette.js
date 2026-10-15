// Logique des palettes, partagée entre la page vitrine et le générateur.
// Chaque couleur est stockée en HSL :
// { h: 0-360, s: 0-100, l: 0-100, name: string, customName: bool, locked: bool }

const COUNT = 5;
const MIN_COLORS = 2;
const MAX_COLORS = 10;

const MODES = {
  random: { label: 'Aléatoire', description: 'Cinq couleurs tirées au hasard. Idéal pour se laisser surprendre.' },
  analogous: { label: 'Analogue', description: 'Des teintes voisines sur la roue. Doux et naturel.' },
  complementary: { label: 'Complémentaire', description: 'Deux teintes opposées. Un contraste qui attire l\'œil.' },
  triadic: { label: 'Triadique', description: 'Trois teintes réparties à 120°. Vif et équilibré.' },
  monochrome: { label: 'Monochrome', description: 'Une seule teinte, du plus foncé au plus clair.' },
};

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Conversion HSL vers code hexadécimal (#RRGGBB)
function hslToHex({ h, s, l }) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return ('#' + toHex(f(0)) + toHex(f(8)) + toHex(f(4))).toUpperCase();
}

// Conversion code hexadécimal (#RRGGBB) vers HSL. Renvoie null si le code est invalide.
function hexToHsl(hex) {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;

  const int = parseInt(match[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }

  // Pas d'arrondi ici : sinon la reconversion en hexadécimal décalerait la couleur
  return { h: (h + 360) % 360, s: s * 100, l: l * 100 };
}

// Texte noir sur les couleurs claires, blanc sur les foncées
function textColorFor(color) {
  return color.l > 55 ? '#17161a' : '#ffffff';
}

// ---------- Noms des couleurs ----------

// Couleurs de référence : on donne à chaque couleur le nom de la plus proche
const COLOR_NAMES = [
  ['Noir', '#111111'], ['Anthracite', '#33363b'], ['Ardoise', '#5a6470'], ['Gris', '#8a8a8a'],
  ['Gris perle', '#c8c8c8'], ['Blanc', '#f8f8f8'], ['Ivoire', '#fffbe6'], ['Crème', '#f5ecd2'],
  ['Beige', '#dccbaa'], ['Sable', '#c9ad7f'], ['Caramel', '#b5752f'], ['Brun', '#7a4b28'],
  ['Chocolat', '#4a2a17'], ['Rouille', '#a8461f'], ['Terracotta', '#d06a4b'], ['Pêche', '#ffbe98'],
  ['Abricot', '#f6a04d'], ['Orange', '#ff7f11'], ['Ambre', '#ffb300'], ['Or', '#d4a72c'],
  ['Moutarde', '#c9a227'], ['Jaune', '#ffe11a'], ['Citron vert', '#c6e33b'], ['Olive', '#7d7f2a'],
  ['Kaki', '#8f8a5c'], ['Vert pomme', '#7ccf3a'], ['Vert', '#2fa84f'], ['Vert sapin', '#1e4d34'],
  ['Émeraude', '#1aa074'], ['Menthe', '#9fe2bf'], ['Vert d\'eau', '#b8e6d6'], ['Sarcelle', '#137a7f'],
  ['Turquoise', '#30c9c4'], ['Cyan', '#28d7f0'], ['Bleu ciel', '#8ecdf2'], ['Azur', '#2e8ff0'],
  ['Bleu roi', '#2346c7'], ['Marine', '#1c2c5c'], ['Bleu nuit', '#121a3a'], ['Indigo', '#4b2bb0'],
  ['Lavande', '#b9a7ea'], ['Violet', '#8034c2'], ['Prune', '#5c2350'], ['Fuchsia', '#e0309a'],
  ['Rose', '#f490b8'], ['Rose pâle', '#f9d2df'], ['Framboise', '#c72a5b'], ['Saumon', '#f88c78'],
  ['Corail', '#ff6150'], ['Rouge', '#dd2a2a'], ['Bordeaux', '#6e1828'],
].map(([name, hex]) => ({ name, rgb: hexToRgb(hex) }));

function hexToRgb(hex) {
  const int = parseInt(hex.slice(1), 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function nameFor(color) {
  const [r, g, b] = hexToRgb(hslToHex(color));
  let best = COLOR_NAMES[0];
  let bestDist = Infinity;

  for (const ref of COLOR_NAMES) {
    // Distance pondérée : l'œil est plus sensible au vert qu'au bleu
    const dist = 2 * (r - ref.rgb[0]) ** 2 + 4 * (g - ref.rgb[1]) ** 2 + 3 * (b - ref.rgb[2]) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = ref;
    }
  }

  return best.name;
}

// Crée une couleur complète (avec son nom automatique) à partir de h, s, l
function makeColor({ h, s, l }) {
  const color = { h, s, l, customName: false, locked: false };
  color.name = nameFor(color);
  return color;
}

// "Bleu nuit" -> "bleu-nuit", pour les variables CSS
function slugify(text) {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // enlève les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'couleur';
}

// ---------- Génération ----------

// Génère `count` couleurs selon le mode choisi.
// `baseHue` (optionnel) : teinte autour de laquelle construire l'harmonie.
function buildPalette(mode, count = COUNT, baseHue = random(0, 359)) {
  const base = baseHue;
  const result = [];
  const step = count > 1 ? 1 / (count - 1) : 0; // de 0 à 1 sur la palette

  for (let i = 0; i < count; i++) {
    let h, s, l;

    switch (mode) {
      case 'analogous':
        h = base + (i - (count - 1) / 2) * 25;
        s = random(50, 80);
        l = random(35, 70);
        break;
      case 'complementary':
        h = i % 2 === 0 ? base : base + 180;
        s = random(50, 80);
        l = Math.round(25 + i * step * 50);
        break;
      case 'triadic':
        h = base + (i % 3) * 120;
        s = random(50, 80);
        l = random(35, 70);
        break;
      case 'monochrome':
        h = base;
        s = random(40, 70);
        l = Math.round(15 + i * step * 70);
        break;
      default: // random
        h = random(0, 359);
        s = random(40, 90);
        l = random(25, 80);
    }

    result.push(makeColor({ h: (h + 360) % 360, s, l }));
  }

  return result;
}

// Trie les couleurs par teinte pour que les couleurs proches soient côte à côte.
// La teinte est un cercle (0° et 359° sont deux rouges) : on commence donc la
// palette juste après le plus grand "trou" entre deux teintes, pour ne jamais
// couper un groupe de couleurs proches en deux.
function sortByHue(list) {
  const sorted = [...list].sort((a, b) => a.h - b.h || a.l - b.l);

  let start = 0;
  let maxGap = -1;
  for (let i = 0; i < sorted.length; i++) {
    const prev = sorted[(i - 1 + sorted.length) % sorted.length];
    const gap = (sorted[i].h - prev.h + 360) % 360 || (i === 0 ? 360 : 0);
    if (gap > maxGap) {
      maxGap = gap;
      start = i;
    }
  }

  return [...sorted.slice(start), ...sorted.slice(0, start)];
}

// ---------- Couleur du jour ----------

// La couleur est calculée à partir de la date (AAAA-MM-JJ) : elle reste la même
// toute la journée, pour tout le monde, sans rien enregistrer. Elle change à minuit.
function colorOfTheDay(date = new Date()) {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

  // Petit générateur pseudo-aléatoire initialisé avec la date (mulberry32)
  let seed = [...key].reduce((acc, ch) => Math.imul(acc ^ ch.charCodeAt(0), 2654435761), 1779033703);
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return makeColor({
    h: Math.floor(rand() * 360),
    s: 55 + Math.floor(rand() * 26), // 55 à 80 % : ni terne, ni criard
    l: 45 + Math.floor(rand() * 16), // 45 à 60 %
  });
}

// Description courte d'une couleur, construite à partir de sa teinte,
// de sa saturation et de sa luminosité.
const HUE_FAMILIES = [
  { max: 15, mood: 'la passion et l\'énergie', use: 'des boutons d\'appel à l\'action ou des alertes' },
  { max: 45, mood: 'la chaleur et l\'enthousiasme', use: 'des marques conviviales ou des promotions' },
  { max: 70, mood: 'l\'optimisme et la lumière', use: 'des mises en avant et des badges' },
  { max: 160, mood: 'la nature et l\'équilibre', use: 'des messages de succès ou des marques écoresponsables' },
  { max: 200, mood: 'la fraîcheur et la clarté', use: 'des interfaces tech ou des sites de bien-être' },
  { max: 250, mood: 'la confiance et le calme', use: 'des sites professionnels, des liens ou des fonds sombres' },
  { max: 290, mood: 'la créativité et le mystère', use: 'des marques créatives ou des dégradés' },
  { max: 345, mood: 'l\'audace et la fantaisie', use: 'des accents ludiques ou des marques de mode' },
  { max: 360, mood: 'la passion et l\'énergie', use: 'des boutons d\'appel à l\'action ou des alertes' },
];

function describeColor(color) {
  const family = HUE_FAMILIES.find(f => color.h < f.max) || HUE_FAMILIES[0];

  const temperature = color.h < 70 || color.h >= 330 ? 'chaude' : color.h >= 160 && color.h < 290 ? 'froide' : 'tempérée';
  const intensity = color.s >= 70 ? 'vive' : 'nuancée';
  const light = color.l >= 55 ? 'lumineuse' : color.l < 45 ? 'profonde' : 'franche';

  const complement = makeColor({ ...color, h: (color.h + 180) % 360 });

  return `Une teinte ${temperature}, ${intensity} et ${light}, qui évoque ${family.mood}. `
    + `Parfaite pour ${family.use}. `
    + `Elle s'accorde bien avec sa complémentaire, un ${complement.name.toLowerCase()} (${hslToHex(complement)}).`;
}
