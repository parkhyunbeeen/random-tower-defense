// ============================================================
// main.js — 부트스트랩 + 게임 루프
// ============================================================

import { CONFIG } from './data/config.js';
import { state, resetState, selectedTowers, clearSelection, cycleSpeed, setSpeed } from './core/state.js';
import { bindInput } from './core/input.js';
import { tileIndex, isBuildable } from './core/grid.js';
import { summonAt } from './systems/summon.js';
import { render } from './render/renderer.js';
import { initHud, updateHud, hudElements } from './render/hud.js';
import { updateTower, collectKills } from './systems/combat.js';
import { updateWave, skipPrep, startPrep, beginWave } from './systems/wave.js';
import { mergeTo, mergeOptions, mergeLegendary, legendaryStatus } from './systems/merge.js';
import { earn } from './systems/economy.js';
import { buyUpgrade, upgradeCost } from './systems/upgrade.js';
import { startMission, refreshMissions } from './systems/mission.js';

const canvas = document.getElementById('game');
canvas.width = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;
const ctx = canvas.getContext('2d');

initHud({
  // 등급별 합성 버튼 (고급 / 희귀 / 영웅)
  merge: (targetTier) => {
    const sel = selectedTowers();
    if (sel.length === 1) mergeTo(sel[0], targetTier);
  },
  // 좌측 미션 도전
  mission: (id) => startMission(id),
  // 우측 등급 강화
  upgrade: (tier) => buyUpgrade(tier),
});

bindInput(canvas);

// --- 버튼 핸들러 -------------------------------------------------

hudElements.btnWave.addEventListener('click', () => skipPrep());

hudElements.btnSpeed.addEventListener('click', () => cycleSpeed());

// 숫자키 1 / 2 / 3 으로도 배속 전환
window.addEventListener('keydown', (evt) => {
  const n = Number(evt.key);
  if (CONFIG.speed.options.includes(n)) setSpeed(n);
});

hudElements.btnLegend.addEventListener('click', () => {
  const sel = selectedTowers();
  if (sel.length === CONFIG.merge.legendaryRequired) mergeLegendary(sel);
});

hudElements.btnSell.addEventListener('click', () => {
  const sel = selectedTowers();
  if (sel.length !== 1) return;
  const t = sel[0];
  earn(t.sellValue, t.x, t.y);
  state.towers.delete(t.tileIdx);
  clearSelection();
});

hudElements.btnRestart.addEventListener('click', () => {
  resetState();
  startPrep();
});

// --- 게임 루프 ---------------------------------------------------

function update(dt) {
  if (state.toast.timer > 0) state.toast.timer -= dt;

  if (state.phase === 'over' || state.phase === 'clear') {
    tickVisuals(dt);
    return;
  }

  updateWave(dt);

  for (const e of state.enemies) e.update(dt);
  for (const t of state.towers.values()) updateTower(t, dt);

  for (const p of state.projectiles) p.update(dt);
  state.projectiles = state.projectiles.filter((p) => !p.dead);

  collectKills();
  tickVisuals(dt);
}

function tickVisuals(dt) {
  for (const e of state.effects) e.life -= dt;
  state.effects = state.effects.filter((e) => e.life > 0);

  for (const f of state.floaters) {
    f.life -= dt;
    f.y += f.vy * dt;
  }
  state.floaters = state.floaters.filter((f) => f.life > 0);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  // 배속만큼 시뮬레이션을 반복 실행합니다.
  // dt 에 배속을 곱하지 않는 이유: 한 프레임 이동 거리가 커지면
  // 빠른 투사체가 적을 지나쳐 버려 명중 판정이 새기 때문입니다.
  for (let i = 0; i < state.speed; i++) update(dt);

  render(ctx);
  updateHud();
  requestAnimationFrame(loop);
}

// --- 시작 -------------------------------------------------------

resetState();
startPrep();
requestAnimationFrame(loop);

// 디버그 / 자동테스트용 훅
// 브라우저 콘솔에서 __GAME__.state, __GAME__.CONFIG 로 값을 바꿀 수 있고,
// __GAME__.api 로 게임 내부 기능을 직접 호출할 수 있습니다.
window.__GAME__ = {
  state,
  CONFIG,
  api: {
    summonAt, mergeTo, mergeOptions, mergeLegendary, legendaryStatus,
    buyUpgrade, upgradeCost, startMission, refreshMissions,
    updateWave, updateTower, collectKills, startPrep, beginWave, resetState,
    tileIndex, isBuildable,
  },
};
