// Page vitrine : palettes d'exemple générées en direct avec palette.js

// Remplit un conteneur avec des bandes de couleur
function fillStrip(container, colors) {
  if (container.children.length !== colors.length) {
    container.innerHTML = colors.map(() => '<span></span>').join('');
  }
  colors.forEach((color, i) => {
    container.children[i].style.background = hslToHex(color);
  });
}

// Palette du hero : change toute seule et passe d'un mode à l'autre
const heroPalette = document.getElementById('hero-palette');
const heroMode = document.getElementById('hero-mode');
const modeKeys = Object.keys(MODES);
let heroIndex = 0;

function updateHero() {
  const key = modeKeys[heroIndex % modeKeys.length];
  fillStrip(heroPalette, sortByHue(buildPalette(key)));
  heroMode.textContent = MODES[key].label;
  heroIndex++;
}

let heroTimer = setInterval(updateHero, 3000);
heroPalette.addEventListener('click', () => {
  clearInterval(heroTimer);
  updateHero();
  heroTimer = setInterval(updateHero, 3000);
});
updateHero();

// Cartes des modes, chacune avec un aperçu et un lien vers le générateur
const cardsEl = document.getElementById('mode-cards');

Object.entries(MODES).forEach(([key, { label, description }]) => {
  const card = document.createElement('a');
  card.className = 'mode-card';
  card.href = 'generator.html?mode=' + key;
  card.innerHTML = `
    <div class="mode-card-strip"></div>
    <h3>${label}</h3>
    <p>${description}</p>
    <span class="mode-card-link">Essayer →</span>
  `;
  fillStrip(card.querySelector('.mode-card-strip'), sortByHue(buildPalette(key)));
  cardsEl.appendChild(card);
});

// Bande de couleurs au-dessus du call to action final
fillStrip(document.getElementById('cta-band'), sortByHue(buildPalette('analogous')));

// ---------- Couleur du jour ----------

const daily = colorOfTheDay();
const dailyHex = hslToHex(daily);
const dailyEl = document.getElementById('daily');

dailyEl.style.setProperty('--daily', dailyHex);
dailyEl.style.setProperty('--daily-text', textColorFor(daily));
document.getElementById('daily-hex').textContent = dailyHex;
document.getElementById('daily-name').textContent = daily.name;
document.getElementById('daily-desc').textContent = describeColor(daily);
document.getElementById('daily-hsl').textContent =
  `${dailyHex} · hsl(${daily.h}, ${daily.s}%, ${daily.l}%)`;
document.getElementById('daily-date').textContent =
  new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

// Cinq nuances, du plus foncé au plus clair
document.getElementById('daily-shades').innerHTML = [20, 35, daily.l, 70, 85]
  .map(l => `<span style="background: ${hslToHex({ ...daily, l })}"></span>`)
  .join('');

// Le générateur construit une palette autour de cette couleur (verrouillée)
document.getElementById('daily-link').href = `generator.html?mode=analogous&base=${dailyHex.slice(1)}`;

const dailyCopy = document.getElementById('daily-copy');
dailyCopy.addEventListener('click', () => {
  navigator.clipboard.writeText(dailyHex).then(() => {
    dailyCopy.textContent = 'Copié ✓';
    setTimeout(() => (dailyCopy.textContent = 'Copier le code'), 1500);
  });
});

// ---------- Titre final : chaque lettre se colore au survol ----------

// On découpe le titre en lettres, regroupées par mot pour que la ligne
// ne se coupe jamais au milieu d'un mot.
const ctaTitle = document.getElementById('cta-title');
ctaTitle.setAttribute('aria-label', ctaTitle.textContent);
ctaTitle.innerHTML = ctaTitle.textContent
  .split(' ')
  .map(word => `<span class="word" aria-hidden="true">${
    [...word].map(ch => `<span class="letter">${ch}</span>`).join('')
  }</span>`)
  .join(' ');

ctaTitle.addEventListener('mouseover', e => {
  const letter = e.target.closest('.letter');
  if (!letter) return;
  // Couleur vive, assez foncée pour rester lisible sur le fond clair
  letter.style.setProperty('--c', `hsl(${random(0, 359)}, 80%, 52%)`);
  letter.classList.remove('is-lit');
  void letter.offsetWidth; // relance l'animation même si la lettre était déjà allumée
  letter.classList.add('is-lit');
});
