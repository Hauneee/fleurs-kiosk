// High-fidelity handcrafted SVG illustrations for "Fleurs by Blossoms Craft"
// Optimized for touchscreen kiosk resolution with crisp vector rendering

const createSvgDataUrl = (svgString) => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
};

export const FLOWER_IMAGES = {
  // Bouquets
  'blue-bouquet': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
      <defs>
        <radialGradient id="blueGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#bfdbfe" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#1e3a8a" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="kraftWrap" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e8f0fe"/>
          <stop offset="50%" stop-color="#bfdbfe"/>
          <stop offset="100%" stop-color="#93c5fd"/>
        </linearGradient>
        <linearGradient id="bluePetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#60a5fa"/>
          <stop offset="50%" stop-color="#2563eb"/>
          <stop offset="100%" stop-color="#1d4ed8"/>
        </linearGradient>
        <linearGradient id="lightBluePetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="40%" stop-color="#bfdbfe"/>
          <stop offset="100%" stop-color="#60a5fa"/>
        </linearGradient>
        <linearGradient id="stemGreen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#86efac"/>
          <stop offset="100%" stop-color="#15803d"/>
        </linearGradient>
        <linearGradient id="ribbonBlue" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#1e40af"/>
          <stop offset="50%" stop-color="#3b82f6"/>
          <stop offset="100%" stop-color="#1d4ed8"/>
        </linearGradient>
      </defs>

      <!-- Soft glow backdrop -->
      <circle cx="200" cy="180" r="160" fill="url(#blueGlow)"/>

      <!-- Bouquet Paper Wrapping Outer -->
      <path d="M120 220 L200 370 L280 220 C320 180 340 130 310 110 C280 90 260 140 200 150 C140 140 120 90 90 110 C60 130 80 180 120 220 Z" fill="url(#kraftWrap)" stroke="#3b82f6" stroke-width="3" stroke-dasharray="6,4"/>

      <!-- Green Foliage -->
      <path d="M140 160 C110 130 115 90 145 95 C175 100 165 140 140 160 Z" fill="url(#stemGreen)" opacity="0.9"/>
      <path d="M260 160 C290 130 285 90 255 95 C225 100 235 140 260 160 Z" fill="url(#stemGreen)" opacity="0.9"/>
      <path d="M200 130 C190 70 210 70 200 130 Z" stroke="#16a34a" stroke-width="6" stroke-linecap="round"/>

      <!-- Bouquet Flowers Cluster -->
      <!-- Center Main Blue Rose -->
      <g transform="translate(200, 160)">
        <circle cx="0" cy="0" r="38" fill="url(#bluePetal)"/>
        <path d="M-25 -10 C-10 -35 10 -35 25 -10 C35 15 15 35 -10 32 C-30 30 -35 5 -25 -10 Z" fill="#1e40af" opacity="0.5"/>
        <path d="M-15 -5 C-5 -22 10 -20 18 -5 C22 10 10 22 -5 20 C-18 18 -20 5 -15 -5 Z" fill="url(#lightBluePetal)"/>
        <path d="M-6 -2 C0 -12 6 -10 10 -2 C12 6 6 12 -2 10 C-8 9 -8 2 -6 -2 Z" fill="#ffffff"/>
      </g>

      <!-- Left Blue Bloom -->
      <g transform="translate(145, 140) scale(0.85)">
        <circle cx="0" cy="0" r="34" fill="url(#lightBluePetal)"/>
        <path d="M-18 -8 C-8 -26 8 -25 18 -8 C25 8 12 25 -8 22 Z" fill="url(#bluePetal)" opacity="0.7"/>
        <circle cx="0" cy="0" r="10" fill="#ffffff"/>
      </g>

      <!-- Right Blue Bloom -->
      <g transform="translate(255, 145) scale(0.85)">
        <circle cx="0" cy="0" r="34" fill="url(#bluePetal)"/>
        <path d="M-16 -8 C-6 -24 8 -22 16 -8 C22 8 10 22 -6 20 Z" fill="url(#lightBluePetal)"/>
        <circle cx="0" cy="0" r="10" fill="#ffffff"/>
      </g>

      <!-- Accent Baby Breath Florals -->
      <circle cx="160" cy="100" r="7" fill="#ffffff" stroke="#93c5fd" stroke-width="2"/>
      <circle cx="240" cy="105" r="8" fill="#ffffff" stroke="#93c5fd" stroke-width="2"/>
      <circle cx="195" cy="95" r="9" fill="#ffffff" stroke="#93c5fd" stroke-width="2"/>
      <circle cx="120" cy="180" r="7" fill="#ffffff" stroke="#93c5fd" stroke-width="2"/>
      <circle cx="280" cy="185" r="7" fill="#ffffff" stroke="#93c5fd" stroke-width="2"/>

      <!-- Bouquet Folding Overlay -->
      <path d="M140 225 L200 370 L170 235 Z" fill="#93c5fd" opacity="0.6"/>
      <path d="M260 225 L200 370 L230 235 Z" fill="#60a5fa" opacity="0.4"/>

      <!-- Big Satin Ribbon & Bow -->
      <g transform="translate(200, 275)">
        <!-- Bow Tails -->
        <path d="M-10 10 Q -30 60 -50 90 Q -25 70 -5 20 Z" fill="url(#ribbonBlue)"/>
        <path d="M10 10 Q 30 60 50 90 Q 25 70 5 20 Z" fill="url(#ribbonBlue)"/>
        <!-- Bow Loops -->
        <ellipse cx="-32" cy="-6" rx="30" ry="18" transform="rotate(-20 -32 -6)" fill="url(#ribbonBlue)" stroke="#93c5fd" stroke-width="2"/>
        <ellipse cx="32" cy="-6" rx="30" ry="18" transform="rotate(20 32 -6)" fill="url(#ribbonBlue)" stroke="#93c5fd" stroke-width="2"/>
        <!-- Bow Center Knot -->
        <circle cx="0" cy="0" r="12" fill="#1e3a8a" stroke="#bfdbfe" stroke-width="2.5"/>
      </g>
    </svg>
  `),

  'red-bouquet': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
      <defs>
        <radialGradient id="redGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#fecdd3" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#881337" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="kraftWrapRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff1f2"/>
          <stop offset="50%" stop-color="#fecdd3"/>
          <stop offset="100%" stop-color="#fda4af"/>
        </linearGradient>
        <linearGradient id="velvetRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f43f5e"/>
          <stop offset="50%" stop-color="#e11d48"/>
          <stop offset="100%" stop-color="#9f1239"/>
        </linearGradient>
        <linearGradient id="deepRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fda4af"/>
          <stop offset="60%" stop-color="#be123c"/>
          <stop offset="100%" stop-color="#4c0519"/>
        </linearGradient>
        <linearGradient id="ribbonRed" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#be123c"/>
          <stop offset="50%" stop-color="#e11d48"/>
          <stop offset="100%" stop-color="#881337"/>
        </linearGradient>
      </defs>

      <circle cx="200" cy="180" r="160" fill="url(#redGlow)"/>

      <!-- Bouquet Wrap -->
      <path d="M120 220 L200 370 L280 220 C320 180 340 130 310 110 C280 90 260 140 200 150 C140 140 120 90 90 110 C60 130 80 180 120 220 Z" fill="url(#kraftWrapRed)" stroke="#e11d48" stroke-width="3" stroke-dasharray="6,4"/>

      <!-- Greenery -->
      <path d="M135 150 C100 110 110 70 140 85 C165 95 155 135 135 150 Z" fill="#15803d"/>
      <path d="M265 150 C300 110 290 70 260 85 C235 95 245 135 265 150 Z" fill="#15803d"/>

      <!-- Center Crimson Rose -->
      <g transform="translate(200, 160)">
        <circle cx="0" cy="0" r="38" fill="url(#deepRed)"/>
        <path d="M-25 -10 C-10 -35 10 -35 25 -10 C35 15 15 35 -10 32 C-30 30 -35 5 -25 -10 Z" fill="#881337" opacity="0.6"/>
        <path d="M-15 -5 C-5 -22 10 -20 18 -5 C22 10 10 22 -5 20 C-18 18 -20 5 -15 -5 Z" fill="url(#velvetRed)"/>
        <path d="M-6 -2 C0 -10 6 -9 8 -2 C10 5 4 10 -2 8 C-7 7 -7 2 -6 -2 Z" fill="#fff1f2"/>
      </g>

      <!-- Side Roses -->
      <g transform="translate(145, 140) scale(0.85)">
        <circle cx="0" cy="0" r="34" fill="url(#velvetRed)"/>
        <path d="M-16 -8 C-6 -24 8 -22 16 -8 C22 8 10 22 -6 20 Z" fill="url(#deepRed)"/>
        <circle cx="0" cy="0" r="8" fill="#ffe4e6"/>
      </g>
      <g transform="translate(255, 145) scale(0.85)">
        <circle cx="0" cy="0" r="34" fill="url(#velvetRed)"/>
        <path d="M-16 -8 C-6 -24 8 -22 16 -8 C22 8 10 22 -6 20 Z" fill="url(#deepRed)"/>
        <circle cx="0" cy="0" r="8" fill="#ffe4e6"/>
      </g>

      <!-- Gypsophila / Baby's breath -->
      <circle cx="165" cy="100" r="6" fill="#ffffff" stroke="#fda4af" stroke-width="2"/>
      <circle cx="235" cy="105" r="7" fill="#ffffff" stroke="#fda4af" stroke-width="2"/>
      <circle cx="200" cy="95" r="8" fill="#ffffff" stroke="#fda4af" stroke-width="2"/>

      <!-- Big Red Satin Ribbon -->
      <g transform="translate(200, 275)">
        <path d="M-10 10 Q -30 60 -50 90 Q -25 70 -5 20 Z" fill="url(#ribbonRed)"/>
        <path d="M10 10 Q 30 60 50 90 Q 25 70 5 20 Z" fill="url(#ribbonRed)"/>
        <ellipse cx="-32" cy="-6" rx="30" ry="18" transform="rotate(-20 -32 -6)" fill="url(#ribbonRed)" stroke="#fecdd3" stroke-width="2"/>
        <ellipse cx="32" cy="-6" rx="30" ry="18" transform="rotate(20 32 -6)" fill="url(#ribbonRed)" stroke="#fecdd3" stroke-width="2"/>
        <circle cx="0" cy="0" r="12" fill="#881337" stroke="#fecdd3" stroke-width="2.5"/>
      </g>
    </svg>
  `),

  'tulip-bouquet': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
      <defs>
        <radialGradient id="tulipGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#fed7aa" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#ea580c" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="kraftWrapTulip" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff7ed"/>
          <stop offset="50%" stop-color="#ffedd5"/>
          <stop offset="100%" stop-color="#fed7aa"/>
        </linearGradient>
        <linearGradient id="pinkTulip" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f472b6"/>
          <stop offset="100%" stop-color="#db2777"/>
        </linearGradient>
        <linearGradient id="yellowTulip" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fde047"/>
          <stop offset="100%" stop-color="#eab308"/>
        </linearGradient>
        <linearGradient id="coralTulip" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fb923c"/>
          <stop offset="100%" stop-color="#ea580c"/>
        </linearGradient>
      </defs>

      <circle cx="200" cy="180" r="160" fill="url(#tulipGlow)"/>

      <!-- Bouquet Wrap -->
      <path d="M120 220 L200 370 L280 220 C320 180 340 130 310 110 C280 90 260 140 200 150 C140 140 120 90 90 110 C60 130 80 180 120 220 Z" fill="url(#kraftWrapTulip)" stroke="#f97316" stroke-width="3" stroke-dasharray="6,4"/>

      <!-- Tulip Stems & Long Leaves -->
      <path d="M150 170 C130 110 135 70 140 50 C145 70 170 120 160 180 Z" fill="#22c55e" opacity="0.85"/>
      <path d="M250 170 C270 110 265 70 260 50 C255 70 230 120 240 180 Z" fill="#22c55e" opacity="0.85"/>

      <!-- Center Tulip Cup (Coral) -->
      <g transform="translate(200, 140)">
        <path d="M-22 15 C-28 -20 -15 -45 0 -45 C15 -45 28 -20 22 15 C15 35 -15 35 -22 15 Z" fill="url(#coralTulip)"/>
        <path d="M0 -45 C-12 -20 -10 15 0 25 C10 15 12 -20 0 -45 Z" fill="#ffedd5" opacity="0.3"/>
      </g>

      <!-- Left Tulip Cup (Pink) -->
      <g transform="translate(150, 130) rotate(-15)">
        <path d="M-20 15 C-26 -18 -12 -40 0 -40 C12 -40 26 -18 20 15 C14 30 -14 30 -20 15 Z" fill="url(#pinkTulip)"/>
      </g>

      <!-- Right Tulip Cup (Yellow) -->
      <g transform="translate(250, 135) rotate(15)">
        <path d="M-20 15 C-26 -18 -12 -40 0 -40 C12 -40 26 -18 20 15 C14 30 -14 30 -20 15 Z" fill="url(#yellowTulip)"/>
      </g>

      <!-- Ribbon Bow -->
      <g transform="translate(200, 275)">
        <path d="M-10 10 Q -30 60 -50 90 Q -25 70 -5 20 Z" fill="#ea580c"/>
        <path d="M10 10 Q 30 60 50 90 Q 25 70 5 20 Z" fill="#ea580c"/>
        <ellipse cx="-32" cy="-6" rx="30" ry="18" transform="rotate(-20 -32 -6)" fill="#f97316" stroke="#ffedd5" stroke-width="2"/>
        <ellipse cx="32" cy="-6" rx="30" ry="18" transform="rotate(20 32 -6)" fill="#f97316" stroke="#ffedd5" stroke-width="2"/>
        <circle cx="0" cy="0" r="12" fill="#c2410c" stroke="#ffedd5" stroke-width="2.5"/>
      </g>
    </svg>
  `),

  'purple-bouquet': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
      <defs>
        <radialGradient id="purpleGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#e9d5ff" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#581c87" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="kraftWrapPurple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#faf5ff"/>
          <stop offset="50%" stop-color="#f3e8ff"/>
          <stop offset="100%" stop-color="#e9d5ff"/>
        </linearGradient>
        <linearGradient id="lilacPetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#c084fc"/>
          <stop offset="50%" stop-color="#9333ea"/>
          <stop offset="100%" stop-color="#6b21a8"/>
        </linearGradient>
        <linearGradient id="softLavender" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="50%" stop-color="#e9d5ff"/>
          <stop offset="100%" stop-color="#a855f7"/>
        </linearGradient>
        <linearGradient id="ribbonPurple" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#6b21a8"/>
          <stop offset="50%" stop-color="#9333ea"/>
          <stop offset="100%" stop-color="#581c87"/>
        </linearGradient>
      </defs>

      <circle cx="200" cy="180" r="160" fill="url(#purpleGlow)"/>

      <!-- Bouquet Wrap -->
      <path d="M120 220 L200 370 L280 220 C320 180 340 130 310 110 C280 90 260 140 200 150 C140 140 120 90 90 110 C60 130 80 180 120 220 Z" fill="url(#kraftWrapPurple)" stroke="#9333ea" stroke-width="3" stroke-dasharray="6,4"/>

      <!-- Foliage & Lavender spikes -->
      <path d="M170 80 L180 140 M190 70 L195 140 M210 70 L205 140 M230 80 L220 140" stroke="#7e22ce" stroke-width="4" stroke-linecap="round"/>
      <circle cx="170" cy="80" r="4" fill="#a855f7"/>
      <circle cx="173" cy="90" r="5" fill="#c084fc"/>
      <circle cx="190" cy="70" r="5" fill="#a855f7"/>
      <circle cx="210" cy="70" r="5" fill="#a855f7"/>
      <circle cx="230" cy="80" r="4" fill="#c084fc"/>

      <!-- Center Deep Violet Rose -->
      <g transform="translate(200, 160)">
        <circle cx="0" cy="0" r="38" fill="url(#lilacPetal)"/>
        <path d="M-22 -10 C-10 -30 10 -30 22 -10 C30 12 12 30 -10 28 Z" fill="#581c87" opacity="0.6"/>
        <path d="M-12 -4 C-4 -18 8 -16 14 -4 C18 8 8 18 -4 16 Z" fill="url(#softLavender)"/>
      </g>

      <!-- Side Lilac Blooms -->
      <g transform="translate(145, 145) scale(0.85)">
        <circle cx="0" cy="0" r="34" fill="url(#softLavender)"/>
        <path d="M-16 -8 C-6 -22 6 -20 16 -8 Z" fill="url(#lilacPetal)"/>
      </g>
      <g transform="translate(255, 150) scale(0.85)">
        <circle cx="0" cy="0" r="34" fill="url(#lilacPetal)"/>
        <path d="M-16 -8 C-6 -22 6 -20 16 -8 Z" fill="url(#softLavender)"/>
      </g>

      <!-- Ribbon Bow -->
      <g transform="translate(200, 275)">
        <path d="M-10 10 Q -30 60 -50 90 Q -25 70 -5 20 Z" fill="url(#ribbonPurple)"/>
        <path d="M10 10 Q 30 60 50 90 Q 25 70 5 20 Z" fill="url(#ribbonPurple)"/>
        <ellipse cx="-32" cy="-6" rx="30" ry="18" transform="rotate(-20 -32 -6)" fill="url(#ribbonPurple)" stroke="#e9d5ff" stroke-width="2"/>
        <ellipse cx="32" cy="-6" rx="30" ry="18" transform="rotate(20 32 -6)" fill="url(#ribbonPurple)" stroke="#e9d5ff" stroke-width="2"/>
        <circle cx="0" cy="0" r="12" fill="#581c87" stroke="#f3e8ff" stroke-width="2.5"/>
      </g>
    </svg>
  `),

  'brown-bouquet': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
      <defs>
        <radialGradient id="brownGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#fef3c7" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#78350f" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="kraftWarm" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef9c3"/>
          <stop offset="50%" stop-color="#fef08a"/>
          <stop offset="100%" stop-color="#eab308"/>
        </linearGradient>
        <linearGradient id="coffeePetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#d97706"/>
          <stop offset="50%" stop-color="#92400e"/>
          <stop offset="100%" stop-color="#451a03"/>
        </linearGradient>
        <linearGradient id="creamPetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="50%" stop-color="#fef3c7"/>
          <stop offset="100%" stop-color="#d97706"/>
        </linearGradient>
        <linearGradient id="ribbonBrown" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#78350f"/>
          <stop offset="50%" stop-color="#b45309"/>
          <stop offset="100%" stop-color="#451a03"/>
        </linearGradient>
      </defs>

      <circle cx="200" cy="180" r="160" fill="url(#brownGlow)"/>

      <!-- Bouquet Wrap -->
      <path d="M120 220 L200 370 L280 220 C320 180 340 130 310 110 C280 90 260 140 200 150 C140 140 120 90 90 110 C60 130 80 180 120 220 Z" fill="url(#kraftWarm)" stroke="#b45309" stroke-width="3" stroke-dasharray="6,4"/>

      <!-- Dried Wheat & Pampas accents -->
      <path d="M160 130 L130 70 M240 130 L270 70 M200 120 L200 60" stroke="#d97706" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="130" cy="70" rx="8" ry="16" transform="rotate(-25 130 70)" fill="#fef08a"/>
      <ellipse cx="270" cy="70" rx="8" ry="16" transform="rotate(25 270 70)" fill="#fef08a"/>
      <ellipse cx="200" cy="60" rx="8" ry="18" fill="#fde047"/>

      <!-- Center Warm Terracotta/Brown Rose -->
      <g transform="translate(200, 160)">
        <circle cx="0" cy="0" r="38" fill="url(#coffeePetal)"/>
        <path d="M-22 -10 C-10 -30 10 -30 22 -10 C30 12 12 30 -10 28 Z" fill="#451a03" opacity="0.6"/>
        <path d="M-12 -4 C-4 -18 8 -16 14 -4 C18 8 8 18 -4 16 Z" fill="url(#creamPetal)"/>
      </g>

      <!-- Side Blooms -->
      <g transform="translate(145, 150) scale(0.85)">
        <circle cx="0" cy="0" r="34" fill="url(#creamPetal)"/>
        <circle cx="0" cy="0" r="12" fill="#78350f"/>
      </g>
      <g transform="translate(255, 150) scale(0.85)">
        <circle cx="0" cy="0" r="34" fill="url(#coffeePetal)"/>
        <circle cx="0" cy="0" r="10" fill="#fef3c7"/>
      </g>

      <!-- Ribbon Bow -->
      <g transform="translate(200, 275)">
        <path d="M-10 10 Q -30 60 -50 90 Q -25 70 -5 20 Z" fill="url(#ribbonBrown)"/>
        <path d="M10 10 Q 30 60 50 90 Q 25 70 5 20 Z" fill="url(#ribbonBrown)"/>
        <ellipse cx="-32" cy="-6" rx="30" ry="18" transform="rotate(-20 -32 -6)" fill="url(#ribbonBrown)" stroke="#fef3c7" stroke-width="2"/>
        <ellipse cx="32" cy="-6" rx="30" ry="18" transform="rotate(20 32 -6)" fill="url(#ribbonBrown)" stroke="#fef3c7" stroke-width="2"/>
        <circle cx="0" cy="0" r="12" fill="#451a03" stroke="#fef3c7" stroke-width="2.5"/>
      </g>
    </svg>
  `),

  // Solo Flowers
  'rose': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
      <defs>
        <radialGradient id="soloRoseGrad" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stop-color="#fb7185"/>
          <stop offset="60%" stop-color="#e11d48"/>
          <stop offset="100%" stop-color="#9f1239"/>
        </radialGradient>
      </defs>
      <!-- Stem -->
      <path d="M150 170 Q145 230 150 270" stroke="#16a34a" stroke-width="6" stroke-linecap="round" fill="none"/>
      <!-- Leaves -->
      <path d="M148 210 Q120 200 110 220 Q130 230 148 215" fill="#15803d"/>
      <path d="M152 230 Q180 220 190 240 Q170 250 152 235" fill="#15803d"/>
      <!-- Rose Head -->
      <circle cx="150" cy="120" r="50" fill="url(#soloRoseGrad)"/>
      <path d="M130 105 C140 85 160 85 170 105 C180 125 165 140 145 138 Z" fill="#881337" opacity="0.6"/>
      <path d="M138 112 C145 98 155 98 162 112 C168 126 156 136 144 134 Z" fill="#fda4af"/>
      <circle cx="150" cy="120" r="8" fill="#fff1f2"/>
    </svg>
  `),

  'sunflower': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
      <!-- Stem -->
      <path d="M150 180 Q155 240 150 280" stroke="#16a34a" stroke-width="7" stroke-linecap="round" fill="none"/>
      <!-- Big Leaf -->
      <path d="M152 220 Q190 210 205 235 Q180 255 152 230" fill="#15803d"/>
      <!-- Golden Petals -->
      <g transform="translate(150, 130)">
        ${Array.from({ length: 14 }).map((_, i) => `
          <ellipse cx="0" cy="-55" rx="14" ry="32" transform="rotate(${i * (360 / 14)})" fill="#eab308" stroke="#ca8a04" stroke-width="1.5"/>
        `).join('')}
        ${Array.from({ length: 14 }).map((_, i) => `
          <ellipse cx="0" cy="-45" rx="10" ry="24" transform="rotate(${i * (360 / 14) + 12.8}) fill="#facc15"/>
        `).join('')}
        <!-- Core Center Disk -->
        <circle cx="0" cy="0" r="34" fill="#713f12" stroke="#451a03" stroke-width="3"/>
        <circle cx="0" cy="0" r="28" fill="#854d0e"/>
        <circle cx="0" cy="0" r="18" fill="#542e0c"/>
      </g>
    </svg>
  `),

  'tulip': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
      <!-- Stem -->
      <path d="M150 170 Q145 230 150 280" stroke="#16a34a" stroke-width="6" stroke-linecap="round" fill="none"/>
      <!-- Tall Elegant Leaf -->
      <path d="M150 240 C110 210 110 160 120 120 C130 170 145 210 150 240 Z" fill="#22c55e"/>
      <!-- Tulip Cup -->
      <g transform="translate(150, 120)">
        <path d="M-30 20 C-40 -25 -20 -60 0 -60 C20 -60 40 -25 30 20 C20 45 -20 45 -30 20 Z" fill="#ec4899"/>
        <path d="M0 -60 C-18 -25 -15 20 0 32 C15 20 18 -25 0 -60 Z" fill="#f472b6"/>
        <path d="M-2 -55 C-8 -25 -6 15 0 25 C6 15 8 -25 2 -55 Z" fill="#fbcfe8"/>
      </g>
    </svg>
  `),

  'lily': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
      <!-- Stem -->
      <path d="M150 170 Q155 230 150 280" stroke="#16a34a" stroke-width="6" stroke-linecap="round" fill="none"/>
      <!-- Lily Star Petals -->
      <g transform="translate(150, 120)">
        ${Array.from({ length: 6 }).map((_, i) => `
          <path d="M0 0 C-16 -30 -14 -65 0 -80 C14 -65 16 -30 0 0 Z" transform="rotate(${i * 60})" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
        `).join('')}
        <!-- Inner blush -->
        ${Array.from({ length: 6 }).map((_, i) => `
          <path d="M0 0 C-6 -20 -4 -45 0 -55 C4 -45 6 -20 0 0 Z" transform="rotate(${i * 60})" fill="#fce7f3" opacity="0.6"/>
        `).join('')}
        <!-- Stamen Pistil -->
        <circle cx="0" cy="0" r="10" fill="#fef08a"/>
        <circle cx="-10" cy="-10" r="3" fill="#ca8a04"/>
        <circle cx="10" cy="-10" r="3" fill="#ca8a04"/>
        <circle cx="0" cy="12" r="3" fill="#ca8a04"/>
      </g>
    </svg>
  `),

  'daisy': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
      <!-- Stem -->
      <path d="M150 170 Q145 230 150 280" stroke="#16a34a" stroke-width="6" stroke-linecap="round" fill="none"/>
      <!-- Delicate Leaf -->
      <path d="M148 220 Q120 210 115 230 Q135 240 148 225" fill="#15803d"/>
      <!-- White Petals -->
      <g transform="translate(150, 125)">
        ${Array.from({ length: 16 }).map((_, i) => `
          <ellipse cx="0" cy="-50" rx="8" ry="24" transform="rotate(${i * (360 / 16)})" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
        `).join('')}
        <!-- Golden Center -->
        <circle cx="0" cy="0" r="26" fill="#eab308" stroke="#ca8a04" stroke-width="2"/>
        <circle cx="0" cy="0" r="20" fill="#facc15"/>
      </g>
    </svg>
  `),

  'carnation': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
      <!-- Stem -->
      <path d="M150 180 Q152 230 150 280" stroke="#16a34a" stroke-width="6" stroke-linecap="round" fill="none"/>
      <!-- Ruffled Carnation Head -->
      <g transform="translate(150, 125)">
        <circle cx="0" cy="10" r="48" fill="#fda4af"/>
        <circle cx="0" cy="0" r="42" fill="#f43f5e"/>
        <circle cx="0" cy="-10" r="34" fill="#fb7185"/>
        <circle cx="0" cy="-15" r="24" fill="#ffffff"/>
        <!-- Ruffle edges -->
        <path d="M-40 0 Q-20 -30 0 -20 Q20 -30 40 0 Q20 30 0 20 Q-20 30 -40 0 Z" fill="#e11d48" opacity="0.4"/>
      </g>
    </svg>
  `),

  // Triple Flowers
  'triple-rose': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 340">
      <!-- 3 Stems Bound with Bow -->
      <path d="M170 190 L170 300" stroke="#15803d" stroke-width="6"/>
      <path d="M125 180 L170 300" stroke="#15803d" stroke-width="6"/>
      <path d="M215 180 L170 300" stroke="#15803d" stroke-width="6"/>
      <!-- Left Rose -->
      <g transform="translate(120, 140) scale(0.75)">
        <circle cx="0" cy="0" r="45" fill="#f43f5e"/>
        <circle cx="0" cy="0" r="28" fill="#e11d48"/>
        <circle cx="0" cy="0" r="10" fill="#ffe4e6"/>
      </g>
      <!-- Right Rose -->
      <g transform="translate(220, 140) scale(0.75)">
        <circle cx="0" cy="0" r="45" fill="#f43f5e"/>
        <circle cx="0" cy="0" r="28" fill="#e11d48"/>
        <circle cx="0" cy="0" r="10" fill="#ffe4e6"/>
      </g>
      <!-- Center High Rose -->
      <g transform="translate(170, 95) scale(0.85)">
        <circle cx="0" cy="0" r="48" fill="#e11d48"/>
        <circle cx="0" cy="0" r="30" fill="#be123c"/>
        <circle cx="0" cy="0" r="12" fill="#fff1f2"/>
      </g>
      <!-- Small Bow tying the 3 stems -->
      <g transform="translate(170, 240)">
        <ellipse cx="-16" cy="0" rx="15" ry="9" fill="#3b82f6"/>
        <ellipse cx="16" cy="0" rx="15" ry="9" fill="#3b82f6"/>
        <circle cx="0" cy="0" r="6" fill="#1d4ed8"/>
      </g>
    </svg>
  `),

  'triple-sunflower': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 340">
      <path d="M170 190 L170 300 M120 180 L170 300 M220 180 L170 300" stroke="#15803d" stroke-width="6"/>
      <!-- Left Sunflower -->
      <g transform="translate(115, 140) scale(0.55)">
        ${Array.from({ length: 12 }).map((_, i) => `<ellipse cx="0" cy="-45" rx="12" ry="25" transform="rotate(${i * 30})" fill="#eab308"/>`).join('')}
        <circle cx="0" cy="0" r="26" fill="#713f12"/>
      </g>
      <!-- Right Sunflower -->
      <g transform="translate(225, 140) scale(0.55)">
        ${Array.from({ length: 12 }).map((_, i) => `<ellipse cx="0" cy="-45" rx="12" ry="25" transform="rotate(${i * 30})" fill="#eab308"/>`).join('')}
        <circle cx="0" cy="0" r="26" fill="#713f12"/>
      </g>
      <!-- Center Sunflower -->
      <g transform="translate(170, 95) scale(0.68)">
        ${Array.from({ length: 14 }).map((_, i) => `<ellipse cx="0" cy="-50" rx="14" ry="28" transform="rotate(${i * (360/14)})" fill="#facc15"/>`).join('')}
        <circle cx="0" cy="0" r="30" fill="#542e0c"/>
      </g>
      <!-- Bow -->
      <g transform="translate(170, 240)">
        <ellipse cx="-16" cy="0" rx="15" ry="9" fill="#2563eb"/>
        <ellipse cx="16" cy="0" rx="15" ry="9" fill="#2563eb"/>
        <circle cx="0" cy="0" r="6" fill="#1e3a8a"/>
      </g>
    </svg>
  `),

  'triple-tulip-lily': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 340">
      <path d="M170 190 L170 300 M120 180 L170 300 M220 180 L170 300" stroke="#15803d" stroke-width="6"/>
      <!-- Left Tulip (Pink) -->
      <g transform="translate(115, 135) scale(0.65) rotate(-15)">
        <path d="M-25 15 C-35 -20 -15 -50 0 -50 C15 -50 35 -20 25 15 Z" fill="#ec4899"/>
      </g>
      <!-- Right Tulip (Orange) -->
      <g transform="translate(225, 135) scale(0.65) rotate(15)">
        <path d="M-25 15 C-35 -20 -15 -50 0 -50 C15 -50 35 -20 25 15 Z" fill="#f97316"/>
      </g>
      <!-- Center Lily (Pure White) -->
      <g transform="translate(170, 95) scale(0.65)">
        ${Array.from({ length: 6 }).map((_, i) => `
          <path d="M0 0 C-14 -25 -12 -55 0 -68 C12 -55 14 -25 0 0 Z" transform="rotate(${i * 60})" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
        `).join('')}
        <circle cx="0" cy="0" r="8" fill="#fde047"/>
      </g>
      <!-- Bow -->
      <g transform="translate(170, 240)">
        <ellipse cx="-16" cy="0" rx="15" ry="9" fill="#3b82f6"/>
        <ellipse cx="16" cy="0" rx="15" ry="9" fill="#3b82f6"/>
        <circle cx="0" cy="0" r="6" fill="#1e3a8a"/>
      </g>
    </svg>
  `)
};

// SVG Craft Icons (Bow, Butterfly, Botanical sprig)
export const CRAFT_ICONS = {
  bow: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60" width="100%" height="100%">
      <path d="M45 35 Q 25 55 10 58 Q 20 40 40 32 Z" fill="#3b82f6"/>
      <path d="M55 35 Q 75 55 90 58 Q 80 40 60 32 Z" fill="#3b82f6"/>
      <ellipse cx="30" cy="24" rx="24" ry="14" transform="rotate(-18 30 24)" fill="#60a5fa" stroke="#bfdbfe" stroke-width="2"/>
      <ellipse cx="70" cy="24" rx="24" ry="14" transform="rotate(18 70 24)" fill="#60a5fa" stroke="#bfdbfe" stroke-width="2"/>
      <circle cx="50" cy="26" r="10" fill="#1d4ed8" stroke="#bfdbfe" stroke-width="2"/>
    </svg>
  `.trim())}`,

  butterfly: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" width="100%" height="100%">
      <!-- Wings Left -->
      <path d="M48 42 C20 10 5 25 15 50 C25 68 45 52 48 44 Z" fill="#93c5fd" stroke="#60a5fa" stroke-width="2"/>
      <path d="M48 46 C30 50 20 68 35 75 C45 78 48 60 48 46 Z" fill="#bfdbfe" stroke="#60a5fa" stroke-width="2"/>
      <!-- Wings Right -->
      <path d="M52 42 C80 10 95 25 85 50 C75 68 55 52 52 44 Z" fill="#93c5fd" stroke="#60a5fa" stroke-width="2"/>
      <path d="M52 46 C70 50 80 68 65 75 C55 78 52 60 52 46 Z" fill="#bfdbfe" stroke="#60a5fa" stroke-width="2"/>
      <!-- Body & Antenna -->
      <ellipse cx="50" cy="45" rx="3.5" ry="18" fill="#1e3a8a"/>
      <path d="M49 30 Q 42 18 35 15 M51 30 Q 58 18 65 15" stroke="#1e3a8a" stroke-width="2" stroke-linecap="round" fill="none"/>
    </svg>
  `.trim())}`
};
