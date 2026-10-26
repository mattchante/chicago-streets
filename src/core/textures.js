import * as T from 'three';
import { mulberry, pick } from './util.js';
import { MAXANI } from './renderer.js';

/* ============================================================ TEXTURES */
export function makeTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.anisotropy = Math.min(8, MAXANI);
  if (srgb) t.encoding = T.sRGBEncoding;
  return t;
}
export function speckle(g, w, h, r, amt, n) {
  n = n || Math.floor((w * h) / 6);
  for (let i = 0; i < n; i++) {
    const v = r();
    g.fillStyle = v < 0.5 ? `rgba(0,0,0,${amt * r()})` : `rgba(255,255,255,${amt * r()})`;
    const s = r() < 0.9 ? 1 : 2;
    g.fillRect((r() * w) | 0, (r() * h) | 0, s, s);
  }
}
export function blotch(g, w, h, r, n, col, alpha, rmin, rmax) {
  for (let i = 0; i < n; i++) {
    const x = r() * w,
      y = r() * h,
      rad = rmin + r() * (rmax - rmin);
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, col.replace('A', alpha * r()));
    gr.addColorStop(1, col.replace('A', 0));
    g.fillStyle = gr;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
}
export const TX = {};
TX.asphalt = makeTex(512, 512, (g, w, h) => {
  const r = mulberry(11);
  g.fillStyle = '#45474a';
  g.fillRect(0, 0, w, h);
  blotch(g, w, h, r, 40, 'rgba(20,20,22,A)', 0.25, 20, 90);
  blotch(g, w, h, r, 25, 'rgba(120,120,118,A)', 0.12, 10, 60);
  speckle(g, w, h, r, 0.22, 60000);
  g.strokeStyle = 'rgba(25,25,25,.35)';
  g.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    g.beginPath();
    let x = r() * w,
      y = r() * h;
    g.moveTo(x, y);
    for (let k = 0; k < 8; k++) {
      x += (r() - 0.5) * 40;
      y += (r() - 0.5) * 40;
      g.lineTo(x, y);
    }
    g.stroke();
  }
});
TX.sidewalk = makeTex(512, 512, (g, w, h) => {
  const r = mulberry(12);
  g.fillStyle = '#bdb8ae';
  g.fillRect(0, 0, w, h);
  blotch(g, w, h, r, 30, 'rgba(90,85,78,A)', 0.12, 10, 60);
  speckle(g, w, h, r, 0.12, 40000);
  g.fillStyle = 'rgba(70,64,58,.45)';
  for (let i = 0; i < 4; i++) {
    g.fillRect(i * 128, 0, 2, h);
    g.fillRect(0, i * 128, w, 2);
  }
  g.fillStyle = 'rgba(255,255,255,.18)';
  for (let i = 0; i < 4; i++) {
    g.fillRect(i * 128 + 2, 0, 1, h);
    g.fillRect(0, i * 128 + 2, w, 1);
  }
});
TX.granite = makeTex(512, 512, (g, w, h) => {
  const r = mulberry(13);
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 4; x++) {
      const t = r();
      g.fillStyle = `rgb(${(128 + t * 30) | 0},${(126 + t * 28) | 0},${(124 + t * 26) | 0})`;
      g.fillRect(x * 128, y * 64, 128, 64);
    }
  speckle(g, w, h, r, 0.35, 70000);
  g.fillStyle = 'rgba(40,40,40,.5)';
  for (let i = 0; i <= 8; i++) g.fillRect(0, i * 64, w, 2);
  for (let i = 0; i <= 4; i++) g.fillRect(i * 128, 0, 2, h);
});
TX.deck = makeTex(512, 512, (g, w, h) => {
  const r = mulberry(14);
  g.fillStyle = '#b7afa1';
  g.fillRect(0, 0, w, h);
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++) {
      g.fillStyle = `rgba(${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},0,0)`;
      const t = r() * 0.08;
      g.fillStyle = `rgba(80,70,60,${t})`;
      g.fillRect(x * 128, y * 128, 128, 128);
    }
  speckle(g, w, h, r, 0.16, 40000);
  g.fillStyle = 'rgba(60,54,46,.5)';
  for (let i = 0; i < 4; i++) {
    g.fillRect(i * 128, 0, 2, h);
    g.fillRect(0, i * 128, w, 2);
  }
});
TX.promenade = makeTex(512, 512, (g, w, h) => {
  const r = mulberry(15);
  g.fillStyle = '#a8977e';
  g.fillRect(0, 0, w, h);
  speckle(g, w, h, r, 0.35, 90000);
  blotch(g, w, h, r, 30, 'rgba(70,60,45,A)', 0.18, 10, 50);
});
TX.grass = makeTex(512, 512, (g, w, h) => {
  const r = mulberry(16);
  g.fillStyle = '#55702f';
  g.fillRect(0, 0, w, h);
  blotch(g, w, h, r, 50, 'rgba(120,130,50,A)', 0.25, 20, 80);
  blotch(g, w, h, r, 40, 'rgba(30,55,20,A)', 0.3, 20, 70);
  for (let i = 0; i < 26000; i++) {
    const x = r() * w,
      y = r() * h,
      c = r();
    g.strokeStyle =
      c < 0.4 ? 'rgba(40,70,25,.55)' : c < 0.8 ? 'rgba(110,140,55,.45)' : 'rgba(160,150,80,.35)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (r() - 0.5) * 3, y - 2 - r() * 4);
    g.stroke();
  }
});
TX.lawn = makeTex(512, 512, (g, w, h) => {
  g.drawImage(TX.grass.image, 0, 0);
  g.fillStyle = 'rgba(255,255,230,.06)';
  g.fillRect(0, 0, w, h / 2);
});
TX.garden = makeTex(512, 512, (g, w, h) => {
  const r = mulberry(17);
  g.fillStyle = '#4a3d2c';
  g.fillRect(0, 0, w, h);
  speckle(g, w, h, r, 0.3, 60000);
  blotch(g, w, h, r, 60, 'rgba(110,90,50,A)', 0.35, 6, 24);
});
TX.wood = makeTex(256, 256, (g, w, h) => {
  const r = mulberry(18);
  for (let i = 0; i < 16; i++) {
    const t = r();
    g.fillStyle = `rgb(${(120 + t * 30) | 0},${(88 + t * 20) | 0},${(60 + t * 14) | 0})`;
    g.fillRect(0, i * 16, w, 16);
    g.fillStyle = 'rgba(30,20,10,.5)';
    g.fillRect(0, i * 16, w, 1);
    g.fillRect((r() * w) | 0, i * 16, 1, 16);
  }
  speckle(g, w, h, r, 0.15, 8000);
});
TX.stone = makeTex(512, 512, (g, w, h) => {
  const r = mulberry(19);
  g.fillStyle = '#c7bda8';
  g.fillRect(0, 0, w, h);
  for (let row = 0; row < 8; row++) {
    const off = (row % 2) * 64;
    for (let x = -1; x < 4; x++) {
      const t = r();
      g.fillStyle = `rgba(${t < 0.5 ? 80 : 255},${t < 0.5 ? 70 : 250},${t < 0.5 ? 60 : 240},${0.05 + r() * 0.08})`;
      g.fillRect(x * 128 + off, row * 64, 128, 64);
    }
  }
  speckle(g, w, h, r, 0.15, 40000);
  g.fillStyle = 'rgba(70,62,52,.45)';
  for (let row = 0; row <= 8; row++) {
    g.fillRect(0, row * 64, w, 2);
    const off = (row % 2) * 64;
    for (let x = 0; x < 5; x++) g.fillRect(x * 128 + off, row * 64, 2, 64);
  }
});
TX.roof = makeTex(256, 256, (g, w, h) => {
  const r = mulberry(20);
  g.fillStyle = '#6d6c69';
  g.fillRect(0, 0, w, h);
  speckle(g, w, h, r, 0.35, 20000);
  g.fillStyle = 'rgba(30,30,30,.25)';
  g.fillRect(0, 0, w, 3);
  g.fillRect(0, 0, 3, h);
});
TX.court = makeTex(256, 256, (g, w, h) => {
  g.fillStyle = '#3e6b58';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#2f5d8a';
  g.fillRect(28, 20, 200, 216);
  g.strokeStyle = '#eee';
  g.lineWidth = 3;
  g.strokeRect(28, 20, 200, 216);
  g.beginPath();
  g.moveTo(28, 128);
  g.lineTo(228, 128);
  g.stroke();
  g.strokeRect(52, 64, 152, 128);
});
TX.path = makeTex(256, 256, (g, w, h) => {
  const r = mulberry(21);
  g.fillStyle = '#a19d95';
  g.fillRect(0, 0, w, h);
  speckle(g, w, h, r, 0.2, 15000);
});

/* ---- facades ---- each tile = bays × floors, uv in meters / tile size */
function facadeTex(o) {
  const W = 512,
    H = 512,
    r = mulberry(o.seed || 5);
  const tw = o.bays * o.bw,
    th = o.floors * o.fh,
    sx = W / tw,
    sy = H / th;
  return makeTex(W, H, (g) => {
    g.fillStyle = o.wall;
    g.fillRect(0, 0, W, H);
    speckle(g, W, H, r, o.grain || 0.08, 30000);
    if (o.kind === 'brick') {
      for (let y = 0; y < H; y += 3) {
        g.fillStyle = `rgba(${r() < 0.5 ? 40 : 200},${r() < 0.5 ? 20 : 120},10,${0.05 + r() * 0.08})`;
        g.fillRect(0, y, W, 2);
        g.fillStyle = 'rgba(210,200,185,.18)';
        g.fillRect(0, y + 2, W, 1);
      }
    }
    if (o.kind === 'stone') {
      g.fillStyle = 'rgba(60,50,40,.16)';
      const c = 0.62 * sy;
      for (let y = H; y > 0; y -= c) g.fillRect(0, y | 0, W, 1);
    }
    if (o.kind === 'curtain') {
      for (let f = 0; f < o.floors; f++)
        for (let b = 0; b < o.bays; b++) {
          const x = b * o.bw * sx,
            y = H - (f + 1) * o.fh * sy,
            w = o.bw * sx,
            h = o.fh * sy,
            t = r();
          const gr = g.createLinearGradient(0, y, 0, y + h);
          gr.addColorStop(0, o.glassTop);
          gr.addColorStop(1, o.glassBot);
          g.fillStyle = gr;
          g.fillRect(x, y, w, h);
          g.fillStyle = `rgba(${t < 0.5 ? 0 : 255},${t < 0.5 ? 0 : 255},${t < 0.5 ? 10 : 255},${0.04 + r() * 0.1})`;
          g.fillRect(x, y, w, h);
          if (r() < 0.25) {
            g.fillStyle = 'rgba(220,220,215,.35)';
            g.fillRect(x, y, w, h * (0.15 + r() * 0.4));
          }
          g.fillStyle = o.spandrel;
          g.fillRect(x, y + h - o.span * sy, w, o.span * sy);
          g.fillStyle = o.mullion;
          g.fillRect(x, y, 2, h);
          g.fillRect(x, y + h - o.span * sy, w, 1.5);
          g.fillStyle = 'rgba(255,255,255,.12)';
          g.fillRect(x + 2, y, 1, h);
        }
      return;
    }
    if (o.piers) {
      g.fillStyle = o.pierCol || 'rgba(255,255,255,.12)';
      for (let b = 0; b <= o.bays; b++) g.fillRect(b * o.bw * sx - (o.piers * sx) / 2, 0, o.piers * sx, H);
    }
    if (o.bands) {
      g.fillStyle = o.bandCol || 'rgba(0,0,0,.1)';
      for (let f = 0; f < o.floors; f++) {
        g.fillRect(0, H - (f * o.fh + o.wy - 0.15) * sy, W, 0.25 * sy);
      }
    }
    for (let f = 0; f < o.floors; f++)
      for (let b = 0; b < o.bays; b++) {
        const nw = o.chicago ? 1 : 1;
        const x = (b * o.bw + (o.bw - o.ww) / 2) * sx,
          y = H - (f * o.fh + o.wy + o.wh) * sy,
          w = o.ww * sx,
          h = o.wh * sy;
        g.fillStyle = 'rgba(0,0,0,.4)';
        if (o.arch && f === o.floors - 1) {
          g.beginPath();
          g.moveTo(x - 1.5, y + h + 1);
          g.lineTo(x - 1.5, y + w / 2);
          g.arc(x + w / 2, y + w / 2, w / 2 + 1.5, Math.PI, 0);
          g.lineTo(x + w + 1.5, y + h + 1);
          g.fill();
        } else g.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
        const t = r(),
          gr = g.createLinearGradient(x, y, x + w * 0.3, y + h);
        const top = o.glassTop || '#8fa3b4',
          bot = o.glassBot || '#33404c';
        gr.addColorStop(0, top);
        gr.addColorStop(1, bot);
        g.fillStyle = gr;
        if (o.arch && f === o.floors - 1) {
          g.beginPath();
          g.moveTo(x, y + h);
          g.lineTo(x, y + w / 2);
          g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
          g.lineTo(x + w, y + h);
          g.fill();
        } else g.fillRect(x, y, w, h);
        g.fillStyle = `rgba(${t < 0.5 ? 10 : 240},${t < 0.5 ? 14 : 240},${t < 0.5 ? 20 : 235},${0.06 + r() * 0.18})`;
        g.fillRect(x, y, w, h);
        if (r() < 0.3) {
          g.fillStyle = `rgba(225,222,212,${0.5 + r() * 0.3})`;
          g.fillRect(x, y, w, h * (0.15 + r() * 0.45));
        }
        g.fillStyle = o.frame || 'rgba(230,226,215,.75)';
        if (o.chicago) {
          g.fillRect(x + w * 0.24, y, Math.max(1.5, w * 0.03), h);
          g.fillRect(x + w * 0.73, y, Math.max(1.5, w * 0.03), h);
        } else if (w > 18) g.fillRect(x + w / 2 - 1, y, 2, h);
        if (h > 28) g.fillRect(x, y + h * 0.62, w, 1.5);
        g.fillStyle = 'rgba(255,255,255,.25)';
        g.fillRect(x - 2, y + h, w + 4, 2);
      }
  });
}
export const STY = {
  limestone: {
    tex: {
      kind: 'stone',
      wall: '#cfc3a8',
      bays: 4,
      bw: 3.4,
      floors: 4,
      fh: 4.2,
      ww: 1.7,
      wh: 2.6,
      wy: 0.9,
      frame: 'rgba(240,236,224,.8)',
      bands: 1,
      bandCol: 'rgba(90,80,60,.14)',
      seed: 31,
    },
  },
  culture: {
    tex: {
      kind: 'stone',
      wall: '#d2c7ad',
      bays: 4,
      bw: 4.2,
      floors: 3,
      fh: 6.6,
      ww: 2.4,
      wh: 4.4,
      wy: 1.1,
      arch: 1,
      frame: 'rgba(70,60,45,.7)',
      bands: 1,
      bandCol: 'rgba(80,70,55,.18)',
      seed: 32,
    },
  },
  terracotta: {
    tex: {
      kind: 'stone',
      wall: '#ddd5c2',
      bays: 4,
      bw: 4.6,
      floors: 4,
      fh: 3.9,
      ww: 3.8,
      wh: 2.5,
      wy: 0.8,
      chicago: 1,
      piers: 0.55,
      pierCol: 'rgba(255,252,240,.35)',
      seed: 33,
    },
  },
  brick: {
    tex: {
      kind: 'brick',
      wall: '#86513d',
      bays: 4,
      bw: 3.1,
      floors: 4,
      fh: 3.6,
      ww: 1.4,
      wh: 2.1,
      wy: 0.85,
      frame: 'rgba(235,230,220,.8)',
      seed: 34,
    },
  },
  brickTan: {
    tex: {
      kind: 'brick',
      wall: '#a98a66',
      bays: 4,
      bw: 3.2,
      floors: 4,
      fh: 3.7,
      ww: 1.6,
      wh: 2.2,
      wy: 0.85,
      seed: 35,
    },
  },
  gothic: {
    tex: {
      kind: 'stone',
      wall: '#a8a296',
      bays: 4,
      bw: 3.0,
      floors: 4,
      fh: 4.0,
      ww: 1.6,
      wh: 2.7,
      wy: 0.8,
      piers: 0.5,
      pierCol: 'rgba(255,255,255,.14)',
      arch: 1,
      seed: 36,
    },
  },
  gothicDark: {
    tex: {
      kind: 'stone',
      wall: '#6f5b4c',
      bays: 4,
      bw: 3.2,
      floors: 4,
      fh: 4.2,
      ww: 1.8,
      wh: 2.8,
      wy: 0.9,
      arch: 1,
      piers: 0.4,
      pierCol: 'rgba(0,0,0,.15)',
      frame: 'rgba(220,200,170,.7)',
      seed: 37,
    },
  },
  concrete: {
    tex: {
      kind: 'stone',
      wall: '#a9a59c',
      bays: 4,
      bw: 3.0,
      floors: 4,
      fh: 3.5,
      ww: 2.6,
      wh: 1.6,
      wy: 1.0,
      frame: 'rgba(40,40,40,.7)',
      seed: 38,
    },
  },
  glassBlue: {
    metal: 0.35,
    rough: 0.22,
    tex: {
      kind: 'curtain',
      bays: 4,
      bw: 1.55,
      floors: 4,
      fh: 3.9,
      glassTop: '#9cb7cc',
      glassBot: '#4f6a80',
      spandrel: '#4b5a66',
      span: 0.9,
      mullion: '#cfd6dc',
      seed: 39,
    },
  },
  glassDark: {
    metal: 0.4,
    rough: 0.2,
    tex: {
      kind: 'curtain',
      bays: 4,
      bw: 1.5,
      floors: 4,
      fh: 4.0,
      glassTop: '#6f7f8d',
      glassBot: '#262e36',
      spandrel: '#1e2328',
      span: 1.1,
      mullion: '#444b52',
      seed: 40,
    },
  },
  glassGreen: {
    metal: 0.35,
    rough: 0.22,
    tex: {
      kind: 'curtain',
      bays: 4,
      bw: 1.5,
      floors: 4,
      fh: 3.3,
      glassTop: '#a9c4c0',
      glassBot: '#4d6a6a',
      spandrel: '#5c7372',
      span: 0.7,
      mullion: '#d7e0de',
      seed: 41,
    },
  },
  aon: {
    tex: {
      kind: 'stone',
      wall: '#e8e6e0',
      bays: 4,
      bw: 1.55,
      floors: 4,
      fh: 3.85,
      ww: 0.8,
      wh: 3.1,
      wy: 0.4,
      piers: 0.55,
      pierCol: 'rgba(255,255,255,.55)',
      glassTop: '#6f7c86',
      glassBot: '#2f363c',
      frame: 'rgba(0,0,0,0)',
      grain: 0.04,
      seed: 42,
    },
  },
  pru2: {
    tex: {
      kind: 'stone',
      wall: '#b29a88',
      bays: 4,
      bw: 3.0,
      floors: 4,
      fh: 3.9,
      ww: 2.4,
      wh: 2.3,
      wy: 0.9,
      glassTop: '#8394a2',
      glassBot: '#36414b',
      frame: 'rgba(0,0,0,0)',
      seed: 43,
    },
  },
  pru1: {
    tex: {
      kind: 'stone',
      wall: '#d8d2c2',
      bays: 4,
      bw: 2.6,
      floors: 4,
      fh: 3.7,
      ww: 1.3,
      wh: 2.6,
      wy: 0.6,
      piers: 0.6,
      pierCol: 'rgba(150,155,160,.35)',
      seed: 44,
    },
  },
  white: {
    tex: {
      kind: 'stone',
      wall: '#ecebe6',
      bays: 4,
      bw: 4.0,
      floors: 2,
      fh: 6.0,
      ww: 3.6,
      wh: 4.6,
      wy: 0.8,
      frame: 'rgba(200,200,200,.8)',
      glassTop: '#a9bccb',
      glassBot: '#5d7383',
      grain: 0.03,
      seed: 45,
    },
  },
  beaux: {
    tex: {
      kind: 'stone',
      wall: '#c9bea6',
      bays: 4,
      bw: 4.6,
      floors: 2,
      fh: 8.0,
      ww: 2.6,
      wh: 5.2,
      wy: 1.4,
      arch: 1,
      frame: 'rgba(60,55,45,.6)',
      bands: 1,
      seed: 46,
    },
  },
  harris: {
    metal: 0.3,
    rough: 0.25,
    tex: {
      kind: 'curtain',
      bays: 4,
      bw: 2.2,
      floors: 2,
      fh: 4.6,
      glassTop: '#b9cad6',
      glassBot: '#6a8090',
      spandrel: '#3a4248',
      span: 0.3,
      mullion: '#2b3035',
      seed: 47,
    },
  },
  backstage: {
    tex: {
      kind: 'stone',
      wall: '#9b9d9e',
      bays: 4,
      bw: 6,
      floors: 2,
      fh: 7,
      ww: 0,
      wh: 0,
      wy: 0,
      grain: 0.05,
      seed: 48,
    },
  },
};
for (const k in STY) {
  const s = STY[k];
  s.tw = s.tex.bays * s.tex.bw;
  s.th = s.tex.floors * s.tex.fh;
  s.map = facadeTex(s.tex);
}
export const GENERIC = [
  'limestone',
  'terracotta',
  'brick',
  'brickTan',
  'gothic',
  'concrete',
  'glassBlue',
  'glassDark',
  'glassGreen',
  'concrete',
  'brick',
  'glassBlue',
];

/* storefront textures · tile 9 m wide × 5 m tall */
function storefrontTex(v, seed) {
  const r = mulberry(seed);
  return makeTex(512, 284, (g, W, H) => {
    const sx = W / 9,
      sy = H / 5;
    g.fillStyle = v.pier;
    g.fillRect(0, 0, W, H);
    speckle(g, W, H, r, 0.08, 8000);
    g.fillStyle = v.band;
    g.fillRect(0, H - 4.7 * sy, W, 0.85 * sy);
    if (v.awning) {
      g.fillStyle = v.awning;
      g.beginPath();
      g.moveTo(0.6 * sx, H - 3.75 * sy);
      g.lineTo(8.4 * sx, H - 3.75 * sy);
      g.lineTo(8.6 * sx, H - 3.3 * sy);
      g.lineTo(0.4 * sx, H - 3.3 * sy);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,.12)';
      for (let i = 0; i < 14; i++) g.fillRect((0.6 + i * 0.56) * sx, H - 3.75 * sy, 0.28 * sx, 0.45 * sy);
    }
    const bays = [
      [0.55, 3.9],
      [4.35, 8.45],
    ];
    for (const [a, b] of bays) {
      const x = a * sx,
        y = H - 3.7 * sy,
        w = (b - a) * sx,
        h = 3.3 * sy;
      const gr = g.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, '#2b2b29');
      gr.addColorStop(0.5, '#3e3a33');
      gr.addColorStop(1, '#1c1c1b');
      g.fillStyle = gr;
      g.fillRect(x, y, w, h);
      for (let i = 0; i < 6; i++) {
        g.fillStyle = 'rgba(255,236,190,.9)';
        g.fillRect(x + ((i + 0.5) * w) / 6 - 3, y + 5, 6, 2);
      }
      for (let i = 0; i < 5; i++) {
        const c = pick(['#7a5a3a', '#b33a2f', '#d9cfb8', '#3c5f7a', '#6e7a3c', '#c49a3a'], r);
        g.fillStyle = c;
        const bx = x + r() * (w - 40),
          bh = 20 + r() * 45;
        g.fillRect(bx, y + h - bh, 18 + r() * 30, bh);
      }
      g.fillStyle = 'rgba(200,220,235,.18)';
      g.beginPath();
      g.moveTo(x + w * 0.15, y);
      g.lineTo(x + w * 0.45, y);
      g.lineTo(x + w * 0.2, y + h);
      g.lineTo(x - w * 0.1, y + h);
      g.fill();
      g.fillStyle = v.mull;
      g.fillRect(x, y, w, 3);
      g.fillRect(x, y + h - 6, w, 6);
      g.fillRect(x, y, 3, h);
      g.fillRect(x + w - 3, y, 3, h);
      g.fillRect(x + w / 2 - 1.5, y, 3, h);
      g.fillRect(x, y + h * 0.22, w, 2);
    }
    const dx = 3.95 * sx,
      dy = H - 3.2 * sy,
      dw = 0.4 * sx,
      dh = 3.2 * sy; // door between bays
    g.fillStyle = '#161616';
    g.fillRect(dx, dy, dw, dh);
    g.fillStyle = 'rgba(220,210,180,.8)';
    g.fillRect(dx + dw * 0.7, dy + dh * 0.45, 2, 10);
    g.fillStyle = 'rgba(0,0,0,.3)';
    g.fillRect(0, H - 0.18 * sy, W, 0.18 * sy);
    // abstract sign panels (no invented brand names)
    g.fillStyle = v.signA;
    g.fillRect(1.2 * sx, H - 4.62 * sy, 2.2 * sx, 0.6 * sy);
    g.fillStyle = v.signB;
    g.fillRect(5.6 * sx, H - 4.62 * sy, 2.0 * sx, 0.6 * sy);
    g.fillStyle = 'rgba(255,255,255,.75)';
    for (let i = 0; i < 5; i++) {
      g.fillRect(1.4 * sx + i * 0.38 * sx, H - 4.42 * sy, 0.26 * sx, 0.2 * sy);
      g.fillRect(5.8 * sx + i * 0.34 * sx, H - 4.42 * sy, 0.22 * sx, 0.2 * sy);
    }
  });
}
export const SF = {
  stone: storefrontTex(
    { pier: '#cdbf9f', band: '#3a3a36', mull: '#2a2a28', signA: '#6b1e1e', signB: '#20354d' },
    61,
  ),
  glass: storefrontTex(
    { pier: '#2d3136', band: '#1d2024', mull: '#111315', signA: '#b7442e', signB: '#2e6b4f' },
    62,
  ),
  brick: storefrontTex(
    {
      pier: '#7f4c3a',
      band: '#2f2a26',
      mull: '#1d1b19',
      awning: '#1f4a3a',
      signA: '#d6b25a',
      signB: '#5a2a5e',
    },
    63,
  ),
  cream: storefrontTex(
    {
      pier: '#ddd3bd',
      band: '#4d3c2b',
      mull: '#3a2e22',
      awning: '#7a2323',
      signA: '#1d3b5c',
      signB: '#3a3a3a',
    },
    64,
  ),
  modern: storefrontTex(
    { pier: '#8e9296', band: '#22262a', mull: '#5b6066', signA: '#0f5c82', signB: '#a8342b' },
    65,
  ),
};
