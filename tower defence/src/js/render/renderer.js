// ============================================================
// renderer.js — 캔버스 드로잉 총괄
// ============================================================

import { CONFIG } from '../data/config.js';
import { PATH_POINTS, PATH_TILES, tileIndex, isBuildable } from '../core/grid.js';
import { state, selectedTowers } from '../core/state.js';
import { drawTower, drawEnemy } from './shapes.js';

const { cols, rows, tile } = CONFIG.grid;

let hoverTile = null;
export function setHoverTile(t) {
  hoverTile = t;
}

function drawBoard(ctx) {
  // 배경
  ctx.fillStyle = '#12161f';
  ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

  // 타일
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tile;
      const y = r * tile;
      const onPath = PATH_TILES.has(tileIndex(c, r));
      ctx.fillStyle = onPath
        ? '#2a2f3d'
        : (c + r) % 2 === 0
        ? '#1a1f2b'
        : '#171c26';
      ctx.fillRect(x, y, tile, tile);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.strokeRect(x + 0.5, y + 0.5, tile - 1, tile - 1);
    }
  }

  // 경로 라인
  ctx.save();
  ctx.strokeStyle = 'rgba(120,140,180,0.35)';
  ctx.lineWidth = 26;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  PATH_POINTS.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  ctx.restore();

  // 시작/종료 표시
  ctx.save();
  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = '#8fa3c0';
  ctx.fillText('START', 4, PATH_POINTS[0].y - 22);
  ctx.textAlign = 'right';
  ctx.fillText('GOAL', CONFIG.canvas.width - 4, PATH_POINTS[PATH_POINTS.length - 1].y - 22);
  ctx.restore();

  // 마우스 오버 슬롯
  if (hoverTile && isBuildable(hoverTile.col, hoverTile.row)) {
    const occupied = state.towers.has(tileIndex(hoverTile.col, hoverTile.row));
    ctx.save();
    ctx.strokeStyle = occupied ? 'rgba(255,255,255,0.35)' : 'rgba(93,220,132,0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(hoverTile.col * tile + 2, hoverTile.row * tile + 2, tile - 4, tile - 4);
    ctx.restore();
  }
}

function drawRanges(ctx) {
  for (const t of selectedTowers()) {
    ctx.save();
    ctx.fillStyle = 'rgba(120,180,255,0.07)';
    ctx.strokeStyle = 'rgba(120,180,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawProjectiles(ctx) {
  for (const p of state.projectiles) {
    ctx.save();
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawEffects(ctx) {
  for (const e of state.effects) {
    const a = Math.max(0, e.life / e.maxLife);
    ctx.save();
    ctx.globalAlpha = a;
    if (e.type === 'ring' || e.type === 'burst') {
      ctx.strokeStyle = e.color;
      ctx.lineWidth = e.type === 'burst' ? 4 : 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius * (1.15 - a * 0.55), 0, Math.PI * 2);
      ctx.stroke();
    } else if (e.type === 'beam') {
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(e.x1, e.y1);
      ctx.lineTo(e.x2, e.y2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawFloaters(ctx) {
  ctx.save();
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  for (const f of state.floaters) {
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.restore();
}

function drawOverlay(ctx) {
  if (state.phase === 'over' || state.phase === 'clear') {
    ctx.save();
    ctx.fillStyle = 'rgba(8,10,16,0.82)';
    ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
    ctx.textAlign = 'center';
    const cx = CONFIG.canvas.width / 2;
    const cy = CONFIG.canvas.height / 2;

    ctx.fillStyle = state.phase === 'clear' ? '#ffc83d' : '#ff5c5c';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(state.phase === 'clear' ? 'GAME CLEAR!' : 'GAME OVER', cx, cy - 18);

    ctx.fillStyle = '#c9d3e4';
    ctx.font = '15px sans-serif';
    ctx.fillText(
      `도달 라운드 ${state.wave} · 처치 ${state.stats.killed} · 합성 ${state.stats.merges} · 전설 ${state.stats.legendaries}`,
      cx,
      cy + 16
    );
    ctx.fillStyle = '#7f8ca3';
    ctx.font = '13px sans-serif';
    ctx.fillText('다시 시작하려면 아래 [재시작] 버튼을 누르세요', cx, cy + 44);
    ctx.restore();
  }

  // 토스트
  if (state.toast.timer > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, state.toast.timer * 2);
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    const w = ctx.measureText(state.toast.text).width + 28;
    const x = CONFIG.canvas.width / 2;
    ctx.fillStyle = 'rgba(10,13,20,0.85)';
    ctx.fillRect(x - w / 2, 12, w, 30);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.strokeRect(x - w / 2, 12, w, 30);
    ctx.fillStyle = '#e8eefc';
    ctx.fillText(state.toast.text, x, 32);
    ctx.restore();
  }
}

/** 한 프레임 전체 그리기 */
export function render(ctx) {
  drawBoard(ctx);
  drawRanges(ctx);
  for (const t of state.towers.values()) {
    drawTower(ctx, t, state.selection.includes(t.tileIdx));
  }
  for (const e of state.enemies) drawEnemy(ctx, e);
  drawProjectiles(ctx);
  drawEffects(ctx);
  drawFloaters(ctx);
  drawOverlay(ctx);
}
