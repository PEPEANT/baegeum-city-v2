import {
  canCommitLocalGameAction,
  commitLocalGameAction,
  createOddEvenBetReserveEnvelope
} from "../systems/local-action-runtime.js";
import { LEDGER_EFFECT_STATUSES, applyLocalEconomyLedgerEffect } from "../systems/local-ledger-effect.js";
import {
  createOddEvenBetRefundEnvelope,
  createOddEvenBetSettleEnvelope,
  ODD_EVEN_ROUND_STATUSES
} from "../systems/odd-even-round-runtime.js";
import {
  canCloseOddEvenRound,
  closeOddEvenRound,
  createPendingOddEvenRound,
  ODD_EVEN_LOCAL_ROUND_STATUSES,
  upsertPendingOddEvenRound
} from "../systems/odd-even-round-state.js";
import { getRuntimeEconomy, getRuntimeGame } from "../systems/runtime-state-facade.js";

const refs = {
  panel: typeof document === "undefined" ? null : document.getElementById("oddEvenTablePanel"),
  venue: typeof document === "undefined" ? null : document.getElementById("oddEvenVenueLabel"),
  chips: typeof document === "undefined" ? null : document.getElementById("oddEvenChipStatus"),
  start: typeof document === "undefined" ? null : document.getElementById("oddEvenStartButton"),
  refund: typeof document === "undefined" ? null : document.getElementById("oddEvenRefundButton"),
  hint: typeof document === "undefined" ? null : document.getElementById("oddEvenHint"),
  picks: typeof document === "undefined" ? [] : [...document.querySelectorAll("[data-odd-even-pick]")],
  bets: typeof document === "undefined" ? [] : [...document.querySelectorAll("[data-chip-option]")],
  results: typeof document === "undefined" ? [] : [...document.querySelectorAll("[data-odd-even-result]")]
};

const selection = { pick: null, chips: 10, reserved: null, closed: null };

initOddEvenTablePanel();

export function resolveOddEvenPanelState(game, economy = {}, currentSelection = selection) {
  const visible = game?.playerState?.mode === "table_seated" && game?.currentInterior?.gameType === "odd-even";
  const chips = Math.max(0, Number(economy.chips) || 0);
  const selectedPick = currentSelection.pick === "even" ? "even" : currentSelection.pick === "odd" ? "odd" : null;
  const selectedChips = Math.max(1, Math.round(Number(currentSelection.chips) || 10));
  const reserved = currentSelection.reserved || null;
  const closed = currentSelection.closed || null;
  return {
    visible,
    venueName: game?.playerState?.venueName || game?.currentInterior?.name || "홀짝카지노",
    tableId: game?.playerState?.tableId || null,
    chips,
    selectedPick,
    selectedChips,
    reserved,
    closed,
    canStart: Boolean(visible && selectedPick && chips >= selectedChips && !reserved && !closed),
    canClose: Boolean(visible && reserved && !closed),
    canReset: Boolean(visible && closed)
  };
}

export function createOddEvenHintText(state) {
  if (state.closed) return createOddEvenClosedHint(state.closed);
  if (state.reserved) return `예약 완료: ${state.reserved.label} · ${state.reserved.chips}칩. 결과 또는 환불을 선택.`;
  if (!state.selectedPick) return "홀/짝을 먼저 고르세요. 아직 결과는 서버 대신 로컬 테스트로만 닫습니다.";
  if (state.chips < state.selectedChips) return `칩 ${state.selectedChips}개가 필요함. 환전 ATM에서 먼저 교환.`;
  return `${state.selectedPick === "odd" ? "홀" : "짝"} · 칩 ${state.selectedChips} 예약 가능`;
}

function initOddEvenTablePanel() {
  if (!refs.panel) return;
  refs.picks.forEach((button) => button.addEventListener("click", () => {
    selection.pick = button.dataset.oddEvenPick;
    renderOddEvenTablePanel();
  }));
  refs.bets.forEach((button) => button.addEventListener("click", () => {
    selection.chips = Number(button.dataset.chipOption) || 10;
    renderOddEvenTablePanel();
  }));
  refs.results.forEach((button) => button.addEventListener("click", () => {
    performOddEvenRoundSettlement(button.dataset.oddEvenResult);
  }));
  refs.refund?.addEventListener("click", performOddEvenRoundRefund);
  refs.start?.addEventListener("click", performOddEvenBetReservation);
  requestAnimationFrame(() => renderOddEvenTablePanel());
}

function performOddEvenBetReservation() {
  if (selection.closed) {
    selection.closed = null;
    return renderOddEvenTablePanel();
  }
  const game = getRuntimeGame();
  const economy = getRuntimeEconomy();
  const state = resolveOddEvenPanelState(game, economy?.getState?.() || {});
  if (!state.canStart) return renderOddEvenTablePanel(createOddEvenHintText(state));
  const envelope = createOddEvenBetReserveEnvelope({
    interior: game.currentInterior,
    playerState: game.playerState,
    contract: game.contract,
    pick: selection.pick,
    chips: selection.chips
  });
  const check = canCommitLocalGameAction(game, envelope);
  if (!check.ok) return renderOddEvenTablePanel("이미 처리된 베팅 요청");
  const ledgerResult = applyLocalEconomyLedgerEffect(envelope, economy);
  if (!ledgerResult.ok) return renderOddEvenTablePanel(oddEvenLedgerFailureMessage(ledgerResult));
  commitLocalGameAction(game, envelope);
  selection.reserved = {
    roundId: envelope.action.payload.roundId,
    tableId: envelope.action.payload.tableId,
    pick: envelope.action.payload.pick,
    label: envelope.action.payload.pick === "odd" ? "홀" : "짝",
    chips: envelope.action.payload.chips
  };
  selection.closed = null;
  upsertPendingOddEvenRound(createPendingOddEvenRound({
    interior: game.currentInterior,
    playerState: game.playerState,
    reservation: selection.reserved
  }));
  renderOddEvenTablePanel("베팅 예약 완료. 테스트 결과 또는 환불을 선택하세요.");
}

function performOddEvenRoundSettlement(result) {
  const safeResult = result === "even" ? "even" : "odd";
  const message = closeOddEvenRoundFromPanel({
    createEnvelope: (context) => createOddEvenBetSettleEnvelope({ ...context, result: safeResult }),
    status: ODD_EVEN_ROUND_STATUSES.SETTLED,
    result: safeResult
  });
  renderOddEvenTablePanel(message);
}

function performOddEvenRoundRefund() {
  const message = closeOddEvenRoundFromPanel({
    createEnvelope: (context) => createOddEvenBetRefundEnvelope({ ...context, reason: "local_table_refund" }),
    status: ODD_EVEN_ROUND_STATUSES.REFUNDED,
    result: null
  });
  renderOddEvenTablePanel(message);
}

function closeOddEvenRoundFromPanel({ createEnvelope, status, result }) {
  const game = getRuntimeGame();
  const economy = getRuntimeEconomy();
  const state = resolveOddEvenPanelState(game, economy?.getState?.() || {});
  if (!state.canClose) return createOddEvenHintText(state);
  const closeCheck = canCloseOddEvenRound(selection.reserved.roundId);
  if (!closeCheck.ok) return oddEvenRoundCloseFailureMessage(closeCheck.reason);
  const envelope = createEnvelope({
    interior: game.currentInterior,
    playerState: game.playerState,
    contract: game.contract,
    reservation: selection.reserved
  });
  const check = canCommitLocalGameAction(game, envelope);
  if (!check.ok) return "이미 처리된 라운드 요청입니다.";
  const ledgerResult = applyLocalEconomyLedgerEffect(envelope, economy);
  if (!ledgerResult.ok) return oddEvenLedgerFailureMessage(ledgerResult);
  commitLocalGameAction(game, envelope);
  const closeResult = closeOddEvenRound(selection.reserved.roundId, {
    status,
    result,
    won: envelope.action.payload.won
  });
  if (!closeResult.ok) return oddEvenRoundCloseFailureMessage(closeResult.reason);
  selection.reserved = null;
  selection.closed = closeResult.round;
  return createOddEvenClosedHint(closeResult.round);
}

export function oddEvenLedgerFailureMessage(result) {
  if (result.status === LEDGER_EFFECT_STATUSES.MISSING_ECONOMY_RECORD) return "베팅 시스템 준비 중";
  if (result.status === LEDGER_EFFECT_STATUSES.MISSING_EFFECT) return "베팅 기록 누락";
  return `베팅 처리 실패: ${result.reason || result.status}`;
}

export function createOddEvenClosedHint(closed) {
  if (closed.status === ODD_EVEN_LOCAL_ROUND_STATUSES.REFUNDED) return `환불 완료: ${closed.chips}칩 반환.`;
  if (closed.won) return `정산 완료: ${closed.result === "odd" ? "홀" : "짝"} 적중, ${closed.chips * 2}칩 지급.`;
  return `정산 완료: ${closed.result === "odd" ? "홀" : "짝"} 결과, 예약 칩 손실.`;
}

function oddEvenRoundCloseFailureMessage(reason) {
  if (reason === "missing_round") return "라운드 상태를 찾지 못했습니다. 새 라운드로 다시 시작하세요.";
  if (reason === "round_already_closed") return "이미 닫힌 라운드입니다.";
  return `라운드 처리 실패: ${reason}`;
}

function renderOddEvenTablePanel(message) {
  if (!refs.panel) return;
  const game = getRuntimeGame();
  const economy = getRuntimeEconomy()?.getState?.() || {};
  const state = resolveOddEvenPanelState(game, economy);
  refs.panel.hidden = !state.visible;
  refs.panel.setAttribute("aria-hidden", state.visible ? "false" : "true");
  if (refs.venue) refs.venue.textContent = state.venueName;
  if (refs.chips) refs.chips.textContent = `칩 ${state.chips}`;
  syncButtons(state);
  if (refs.start) {
    refs.start.disabled = !(state.canStart || state.canReset);
    refs.start.textContent = state.closed ? "다음 라운드" : state.reserved ? "예약 완료" : "베팅 예약";
  }
  if (refs.refund) refs.refund.disabled = !state.canClose;
  if (refs.hint) refs.hint.textContent = message || createOddEvenHintText(state);
  requestAnimationFrame(() => renderOddEvenTablePanel());
}

function syncButtons(state) {
  const locked = Boolean(state.reserved || state.closed);
  refs.picks.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.oddEvenPick === selection.pick);
    button.disabled = locked;
  });
  refs.bets.forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.chipOption) === selection.chips);
    button.disabled = locked;
  });
  refs.results.forEach((button) => {
    button.disabled = !state.canClose;
  });
}
