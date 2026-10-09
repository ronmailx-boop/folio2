// מייצר את איורי ה-SVG של אתר הדמו (מקוריים, בלי חומר של צד שלישי).
// שימוש: node scripts/gen-demo-svg.mjs public/demo
import { writeFileSync } from 'node:fs';
const out = process.argv[2];
const W = 800, H = 600;
const pal = [
  ['#7367f0', '#c4b5fd'], ['#7c4ddb', '#f0abfc'], ['#4f46e5', '#a78bfa'],
  ['#5b21b6', '#f9a8d4'], ['#6d28d9', '#67e8f9'], ['#312e81', '#a5b4fc'],
  ['#9333ea', '#fde68a'], ['#4338ca', '#f5d0fe'], ['#7367f0', '#fbcfe8'],
];
function grad(id, a, b, x2 = 1, y2 = 1) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
}
const scenes = [
  // 1 sunset over hills
  ([a, b]) => `<defs>${grad('g', a, b, 0, 1)}${grad('h', '#1e1b4b', a, 0, 1)}</defs><rect width="800" height="600" fill="url(#g)"/><circle cx="560" cy="250" r="90" fill="#fff" opacity=".75"/><path d="M0 420 Q200 320 400 400 T800 380 V600 H0Z" fill="url(#h)" opacity=".85"/><path d="M0 500 Q250 420 520 490 T800 470 V600 H0Z" fill="#1e1b4b" opacity=".9"/>`,
  // 2 portrait silhouette abstract
  ([a, b]) => `<defs>${grad('g', b, a)}</defs><rect width="800" height="600" fill="url(#g)"/><circle cx="400" cy="230" r="95" fill="#fff" opacity=".9"/><path d="M220 600 Q230 380 400 360 Q570 380 580 600Z" fill="#fff" opacity=".9"/><circle cx="130" cy="110" r="60" fill="#fff" opacity=".18"/><circle cx="690" cy="480" r="110" fill="#fff" opacity=".12"/>`,
  // 3 product bottle
  ([a, b]) => `<defs>${grad('g', '#f5f3ff', b)}${grad('p', a, '#1e1b4b', 1, 0)}</defs><rect width="800" height="600" fill="url(#g)"/><ellipse cx="400" cy="520" rx="170" ry="24" fill="#1e1b4b" opacity=".18"/><rect x="335" y="200" width="130" height="320" rx="38" fill="url(#p)"/><rect x="370" y="140" width="60" height="70" rx="12" fill="#1e1b4b"/><rect x="355" y="300" width="90" height="90" rx="14" fill="#fff" opacity=".85"/>`,
  // 4 logo-like geometric
  ([a, b]) => `<defs>${grad('g', a, b)}</defs><rect width="800" height="600" fill="#faf9ff"/><g transform="translate(400 300)"><circle r="170" fill="url(#g)"/><path d="M-90 60 L0 -110 L90 60Z" fill="#fff"/><circle r="40" cy="20" fill="url(#g)"/></g>`,
  // 5 waves
  ([a, b]) => `<defs>${grad('g', a, b, 1, 0)}</defs><rect width="800" height="600" fill="#1e1b4b"/>${[0, 1, 2, 3, 4].map((i) => `<path d="M0 ${200 + i * 70} C200 ${120 + i * 70} 400 ${300 + i * 70} 800 ${180 + i * 70}" stroke="url(#g)" stroke-width="${26 - i * 4}" fill="none" opacity="${1 - i * 0.15}"/>`).join('')}`,
  // 6 camera
  ([a, b]) => `<defs>${grad('g', a, b)}</defs><rect width="800" height="600" fill="url(#g)"/><rect x="210" y="200" width="380" height="250" rx="40" fill="#1e1b4b"/><rect x="270" y="165" width="110" height="50" rx="14" fill="#1e1b4b"/><circle cx="400" cy="325" r="90" fill="#fff"/><circle cx="400" cy="325" r="60" fill="${a}"/><circle cx="380" cy="305" r="16" fill="#fff" opacity=".8"/>`,
  // 7 bokeh / event lights
  ([a, b]) => `<defs>${grad('g', '#1e1b4b', a)}</defs><rect width="800" height="600" fill="url(#g)"/>${Array.from({ length: 22 }, (_, i) => `<circle cx="${(i * 137) % 800}" cy="${(i * 89) % 600}" r="${18 + ((i * 7) % 40)}" fill="${i % 2 ? b : '#fff'}" opacity="${0.12 + ((i * 3) % 5) / 12}"/>`).join('')}`,
  // 8 architecture blocks
  ([a, b]) => `<defs>${grad('g', b, '#fff', 0, 1)}</defs><rect width="800" height="600" fill="url(#g)"/><rect x="140" y="220" width="140" height="380" fill="${a}"/><rect x="300" y="120" width="180" height="480" fill="#1e1b4b"/><rect x="500" y="260" width="160" height="340" fill="${a}" opacity=".7"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="330" y="${160 + i * 70}" width="120" height="30" fill="#fff" opacity=".25"/>`).join('')}`,
  // 9 flowers / organic
  ([a, b]) => `<defs>${grad('g', '#fff', b)}</defs><rect width="800" height="600" fill="url(#g)"/>${[[260, 300], [420, 240], [560, 340]].map(([x, y], j) => `<g transform="translate(${x} ${y})">${[0, 60, 120, 180, 240, 300].map((r) => `<ellipse rx="34" ry="80" cy="-70" fill="${j % 2 ? a : '#7c4ddb'}" opacity=".75" transform="rotate(${r})"/>`).join('')}<circle r="30" fill="#fde68a"/></g>`).join('')}`,
];
scenes.forEach((s, i) => {
  writeFileSync(`${out}/gallery-${i + 1}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${s(pal[i])}</svg>\n`);
});
// about image
writeFileSync(`${out}/about.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600"><defs>${grad('g', '#7c4ddb', '#7367f0')}${grad('l', '#c4b5fd', '#f5f3ff', 0, 1)}</defs><rect width="800" height="600" fill="url(#l)"/><rect x="120" y="110" width="330" height="380" rx="28" fill="url(#g)"/><rect x="350" y="170" width="330" height="320" rx="28" fill="#1e1b4b" opacity=".9"/><circle cx="515" cy="310" r="80" fill="#fff"/><circle cx="515" cy="310" r="50" fill="#7367f0"/><circle cx="210" cy="190" r="30" fill="#fff" opacity=".6"/></svg>\n`);
