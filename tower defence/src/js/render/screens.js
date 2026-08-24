// ============================================================
// screens.js — 타이틀 화면 / 설정 모달 제어
//
// 설정 모달은 타이틀과 인게임이 같은 창을 공유합니다.
// 차이는 [게임 나가기] 버튼의 표시 여부뿐입니다.
//   · 타이틀에서 열면  → 사운드 바 + 확인
//   · 인게임에서 열면  → 사운드 바 + 게임 나가기 + 확인, 그리고 게임이 멈춤
// ============================================================

import { state } from '../core/state.js';
import { initAudio, setVolume, SFX } from '../systems/audio.js';

const el = {};
/** main.js가 넘겨주는 동작들 */
const actions = { start: null, exit: null };

export function initScreens(callbacks = {}) {
  Object.assign(actions, callbacks);

  [
    'titleScreen', 'gameRoot',
    'btnStart', 'btnTitleSettings', 'btnGear',
    'settingsModal', 'settingsTitle', 'btnSettingsClose', 'btnSettingsOk',
    'btnExitGame', 'volume', 'volumeValue', 'volumeHint',
  ].forEach((id) => (el[id] = document.getElementById(id)));

  // --- 사운드 슬라이더 ---
  el.volume.value = String(Math.round(state.volume * 100));
  syncVolumeLabel();
  el.volume.addEventListener('input', () => {
    setVolume(Number(el.volume.value) / 100);
    syncVolumeLabel();
  });
  // 손을 뗐을 때 한 번 들려줘서 현재 음량을 확인할 수 있게 합니다
  el.volume.addEventListener('change', () => {
    initAudio();
    SFX.click();
  });

  // --- 타이틀 ---
  el.btnStart.addEventListener('click', () => {
    initAudio();       // 브라우저 정책상 클릭 시점에 오디오를 켭니다
    SFX.click();
    actions.start?.();
  });
  el.btnTitleSettings.addEventListener('click', () => {
    initAudio();
    SFX.click();
    openSettings();
  });

  // --- 인게임 톱니바퀴 ---
  el.btnGear.addEventListener('click', () => {
    SFX.click();
    openSettings();
  });

  // --- 모달 닫기 ---
  el.btnSettingsClose.addEventListener('click', () => { SFX.click(); closeSettings(); });
  el.btnSettingsOk.addEventListener('click', () => { SFX.click(); closeSettings(); });
  el.settingsModal.addEventListener('click', (evt) => {
    if (evt.target === el.settingsModal) closeSettings();   // 바깥 클릭
  });

  // --- 게임 나가기 ---
  el.btnExitGame.addEventListener('click', () => {
    SFX.click();
    closeSettings();
    actions.exit?.();
  });

  showTitle();
}

function syncVolumeLabel() {
  const v = Number(el.volume.value);
  el.volumeValue.textContent = String(v);
  el.volumeHint.textContent =
    v === 0 ? '음소거 상태입니다.' : '0으로 내리면 음소거됩니다.';
}

/** 타이틀 화면 표시 */
export function showTitle() {
  state.screen = 'title';
  state.settingsOpen = false;
  el.titleScreen.hidden = false;
  el.gameRoot.hidden = true;
  el.settingsModal.hidden = true;
}

/** 게임 화면 표시 */
export function showGame() {
  state.screen = 'playing';
  state.settingsOpen = false;
  el.titleScreen.hidden = true;
  el.gameRoot.hidden = false;
  el.settingsModal.hidden = true;
}

/** 설정창 열기 — 인게임에서 열면 게임이 멈춥니다 */
export function openSettings() {
  const inGame = state.screen === 'playing';
  state.settingsOpen = inGame;          // 타이틀에서는 멈출 게임이 없음

  el.settingsTitle.textContent = inGame ? '설정 (일시정지)' : '설정';
  el.btnExitGame.hidden = !inGame;
  el.btnSettingsOk.textContent = inGame ? '계속하기' : '확인';

  el.volume.value = String(Math.round(state.volume * 100));
  syncVolumeLabel();

  el.settingsModal.hidden = false;
  el.volume.focus();
}

/** 설정창 닫기 */
export function closeSettings() {
  state.settingsOpen = false;
  el.settingsModal.hidden = true;
}

export function isSettingsOpen() {
  return !el.settingsModal.hidden;
}

/** ESC 로 토글 — 게임 중에만 동작 */
export function toggleSettings() {
  if (state.screen !== 'playing') return;
  if (isSettingsOpen()) closeSettings();
  else openSettings();
}
