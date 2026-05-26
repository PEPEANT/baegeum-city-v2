export const BLACKJACK_RESULT_LABELS = Object.freeze({
  blackjack: "BLACKJACK",
  win: "WIN",
  push: "PUSH",
  lose: "LOSE"
});

const SUITS = Object.freeze(["spade", "heart", "diamond", "club"]);
const RANKS = Object.freeze(["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]);
const SUIT_SYMBOLS = Object.freeze({ spade: "♠", heart: "♥", diamond: "♦", club: "♣" });

export function createBlackjackRound({ bet, rng = Math.random } = {}) {
  const wager = normalizeBet(bet);
  const deck = shuffleDeck(createDeck(), rng);
  const round = enrichRound({
    status: "playing",
    bet: wager,
    totalBet: wager,
    deck,
    playerCards: [drawCard(deck), drawCard(deck)],
    dealerCards: [drawCard(deck), drawCard(deck)],
    dealerHidden: true,
    doubled: false,
    outcome: null,
    payout: 0,
    message: "첫 패가 나왔습니다.",
    feed: ["딜러가 카드를 돌렸습니다."]
  });

  if (isNaturalBlackjack(round.playerCards) || isNaturalBlackjack(round.dealerCards)) {
    return settleBlackjackRound({ ...round, dealerHidden: false }, "natural");
  }

  return round;
}

export function hitBlackjackRound(round) {
  if (!isPlayable(round)) return round;
  const next = cloneRound(round);
  next.playerCards.push(drawCard(next.deck));
  next.feed.push("플레이어가 한 장 받았습니다.");
  next.message = "카드 한 장 추가.";

  if (scoreBlackjackHand(next.playerCards).value > 21) {
    return settleBlackjackRound({ ...next, dealerHidden: false }, "player_bust");
  }

  return enrichRound(next);
}

export function standBlackjackRound(round) {
  if (!isPlayable(round)) return round;
  const next = cloneRound(round);
  next.dealerHidden = false;
  next.feed.push("플레이어가 멈췄습니다.");
  playDealer(next);
  return settleBlackjackRound(next, "stand");
}

export function doubleBlackjackRound(round) {
  if (!canDoubleDown(round)) return round;
  const next = cloneRound(round);
  next.doubled = true;
  next.totalBet += next.bet;
  next.playerCards.push(drawCard(next.deck));
  next.dealerHidden = false;
  next.feed.push("더블다운으로 판돈을 두 배로 올렸습니다.");

  if (scoreBlackjackHand(next.playerCards).value <= 21) playDealer(next);
  return settleBlackjackRound(next, "double_down");
}

export function canDoubleDown(round) {
  return Boolean(round && round.status === "playing" && !round.doubled && round.playerCards.length === 2);
}

export function scoreBlackjackHand(hand = []) {
  let value = 0;
  let aces = 0;

  for (const card of hand) {
    if (card.rank === "A") {
      value += 11;
      aces += 1;
    } else if (["J", "Q", "K"].includes(card.rank)) {
      value += 10;
    } else {
      value += Number(card.rank);
    }
  }

  while (value > 21 && aces > 0) {
    value -= 10;
    aces -= 1;
  }

  return Object.freeze({ value, soft: aces > 0 });
}

export function formatBlackjackCard(card) {
  return `${card.rank}${SUIT_SYMBOLS[card.suit] || "?"}`;
}

export function getBlackjackStrategyHint(round) {
  if (!round || round.status !== "playing") return "새 판 대기 중";
  const score = scoreBlackjackHand(round.playerCards);
  const dealerUpCard = round.dealerCards[1] || round.dealerCards[0];
  const dealerValue = getCardBaseValue(dealerUpCard);

  if (canDoubleDown(round) && [10, 11].includes(score.value)) return "더블다운 각";
  if (score.value <= 11) return "안전하게 한 장";
  if (score.value >= 17) return "멈추기 유리";
  if (score.value >= 12 && dealerValue >= 2 && dealerValue <= 6) return "딜러 버스트 압박";
  return "승부수 판단 중";
}

function settleBlackjackRound(round, reason) {
  const playerScore = scoreBlackjackHand(round.playerCards).value;
  const dealerScore = scoreBlackjackHand(round.dealerCards).value;
  const playerNatural = isNaturalBlackjack(round.playerCards);
  const dealerNatural = isNaturalBlackjack(round.dealerCards);
  let outcome = "lose";

  if (playerScore > 21) outcome = "lose";
  else if (dealerScore > 21) outcome = "win";
  else if (playerNatural && dealerNatural) outcome = "push";
  else if (playerNatural) outcome = "blackjack";
  else if (dealerNatural) outcome = "lose";
  else if (playerScore > dealerScore) outcome = "win";
  else if (playerScore === dealerScore) outcome = "push";

  const payout = getPayout(round.totalBet, outcome);
  const message = createResultMessage(outcome, reason, payout, round.totalBet);
  return enrichRound({ ...round, status: "settled", dealerHidden: false, outcome, payout, message });
}

function playDealer(round) {
  let score = scoreBlackjackHand(round.dealerCards);
  while (score.value < 17 || (score.value === 17 && score.soft)) {
    round.dealerCards.push(drawCard(round.deck));
    round.feed.push("딜러가 한 장 받았습니다.");
    score = scoreBlackjackHand(round.dealerCards);
  }
}

function createDeck() {
  return SUITS.flatMap((suit) => RANKS.map((rank) => Object.freeze({ rank, suit })));
}

function shuffleDeck(deck, rng) {
  const next = [...deck];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function drawCard(deck) {
  return deck.pop();
}

function normalizeBet(bet) {
  return Math.max(0, Math.floor(Number(bet) || 0));
}

function isNaturalBlackjack(hand) {
  return hand.length === 2 && scoreBlackjackHand(hand).value === 21;
}

function getPayout(totalBet, outcome) {
  if (outcome === "blackjack") return Math.floor(totalBet * 2.5);
  if (outcome === "win") return totalBet * 2;
  if (outcome === "push") return totalBet;
  return 0;
}

function createResultMessage(outcome, reason, payout, totalBet) {
  if (outcome === "blackjack") return "블랙잭! 3:2 보너스.";
  if (outcome === "win") return reason === "double_down" ? "더블다운 성공!" : "승리했습니다.";
  if (outcome === "push") return "무승부. 판돈 반환.";
  if (reason === "player_bust") return "버스트. 판돈을 잃었습니다.";
  return payout > totalBet ? "승리했습니다." : "패배했습니다.";
}

function cloneRound(round) {
  return {
    ...round,
    deck: [...round.deck],
    playerCards: [...round.playerCards],
    dealerCards: [...round.dealerCards],
    feed: [...round.feed]
  };
}

function enrichRound(round) {
  return Object.freeze({
    ...round,
    playerScore: scoreBlackjackHand(round.playerCards),
    dealerScore: scoreBlackjackHand(round.dealerCards)
  });
}

function isPlayable(round) {
  return Boolean(round && round.status === "playing");
}

function getCardBaseValue(card) {
  if (!card) return 0;
  if (card.rank === "A") return 11;
  if (["J", "Q", "K"].includes(card.rank)) return 10;
  return Number(card.rank) || 0;
}
