import { WORLD_CHANNEL_ID } from "../data/runtime-contract.js";
import { ECONOMY_ENTRY_TYPES } from "./economy-ledger.js";
import { GAME_ACTION_TYPES, GAME_EFFECT_TYPES, createActionEnvelope } from "./game-action-master.js";

export const ODD_EVEN_PAYOUT_MULTIPLIER = 2;
export const ODD_EVEN_ROUND_STATUSES = Object.freeze({
  SETTLED: "settled",
  REFUNDED: "refunded"
});

export function createOddEvenBetSettleEnvelope({ interior, playerState = {}, contract = {}, reservation = {}, result } = {}) {
  const round = normalizeOddEvenReservation({ interior, playerState, reservation });
  const safeResult = result === "even" ? "even" : "odd";
  const won = round.pick === safeResult;
  const payoutChips = won ? round.chips * ODD_EVEN_PAYOUT_MULTIPLIER : 0;
  return createOddEvenRoundCloseEnvelope({
    actionType: GAME_ACTION_TYPES.BET_SETTLED,
    ledgerType: ECONOMY_ENTRY_TYPES.BET_SETTLED,
    status: ODD_EVEN_ROUND_STATUSES.SETTLED,
    interior,
    playerState,
    contract,
    round,
    result: safeResult,
    won,
    deltas: { chips: payoutChips },
    text: won ? `홀짝 승리: ${payoutChips}칩 정산` : "홀짝 패배: 정산 칩 없음"
  });
}

export function createOddEvenBetRefundEnvelope({ interior, playerState = {}, contract = {}, reservation = {}, reason = "round_refund" } = {}) {
  const round = normalizeOddEvenReservation({ interior, playerState, reservation });
  return createOddEvenRoundCloseEnvelope({
    actionType: GAME_ACTION_TYPES.BET_REFUNDED,
    ledgerType: ECONOMY_ENTRY_TYPES.BET_REFUNDED,
    status: ODD_EVEN_ROUND_STATUSES.REFUNDED,
    interior,
    playerState,
    contract,
    round,
    result: null,
    won: null,
    deltas: { chips: round.chips },
    text: `홀짝 환불: ${round.chips}칩 반환`,
    reason
  });
}

export function normalizeOddEvenReservation({ interior, playerState = {}, reservation = {} } = {}) {
  const tableId = reservation.tableId || playerState.tableId || interior?.channels?.table || `${interior?.id || "venue"}:main`;
  const roundId = reservation.roundId || `round:odd-even:local:${tableId}`;
  const pick = reservation.pick === "even" ? "even" : "odd";
  const chips = Math.max(1, Math.round(Number(reservation.chips) || 1));
  return { gameType: "odd-even", roundId, tableId, pick, chips };
}

function createOddEvenRoundCloseEnvelope(input) {
  const channelId = input.playerState.chatChannelId || input.round.tableId || WORLD_CHANNEL_ID;
  return createActionEnvelope({
    action: {
      type: input.actionType,
      actorId: "player:local",
      source: "table_game_panel",
      interactionId: `${input.status}:${input.round.roundId}`,
      targetId: input.round.tableId,
      payload: {
        ...input.round,
        result: input.result,
        won: input.won,
        status: input.status
      },
      context: actionContext(input.playerState, input.contract.mapVersion)
    },
    effects: [
      {
        type: GAME_EFFECT_TYPES.ECONOMY_LEDGER_ENTRY,
        targetId: "economy:local",
        payload: {
          type: input.ledgerType,
          deltas: input.deltas,
          reason: input.reason || input.text,
          channelId,
          venueId: input.playerState.venueId || input.interior?.id || null,
          tableId: input.round.tableId,
          roundId: input.round.roundId,
          mapVersion: input.contract.mapVersion || input.playerState.mapVersion || null
        }
      },
      {
        type: GAME_EFFECT_TYPES.WORLD_OBJECT_STATE_PATCH,
        targetId: input.round.roundId,
        payload: {
          roundId: input.round.roundId,
          tableId: input.round.tableId,
          status: input.status,
          result: input.result,
          won: input.won
        }
      },
      {
        type: GAME_EFFECT_TYPES.UI_MESSAGE,
        targetId: "ui:toast",
        payload: { text: input.text }
      }
    ]
  });
}

function actionContext(playerState, mapVersion) {
  return {
    scene: playerState.scene || null,
    sceneId: playerState.sceneId || null,
    mapId: playerState.mapId || null,
    spawnId: playerState.spawnId || null,
    channelId: playerState.chatChannelId || WORLD_CHANNEL_ID,
    venueId: playerState.venueId || null,
    tableId: playerState.tableId || null,
    mapVersion: mapVersion || playerState.mapVersion || null
  };
}
