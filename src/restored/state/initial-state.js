export const RESTORED_INITIAL_STATE_VERSION = "restored-initial-state-001";

export const EXCHANGE_RATE = 1350;

export const INITIAL_RESTORED_STATE = Object.freeze({
  cash: 10000,
  stocks: {
    NASDAQ: { name: "나스닥", price: 15000.00, qty: 0, avg: 0 },
    TSLA: { name: "테슬라", price: 200.00, qty: 0, avg: 0 },
    AAPL: { name: "애플", price: 180.00, qty: 0, avg: 0 },
    NVDA: { name: "엔비디아", price: 450.00, qty: 0, avg: 0 }
  },
  crypto: {
    BTC: { name: "Bitcoin", price: 60000.00 },
    ETH: { name: "Ethereum", price: 3000.00 }
  },
  futures: [],
  realEstate: {
    oneroom: { name: "원룸", price: 80000, rent: 300, count: 0, img: "🏠" },
    apt: { name: "아파트", price: 1500000, rent: 6000, count: 0, img: "🌆" },
    building: { name: "빌딩", price: 5000000, rent: 25000, count: 0, img: "🏦" }
  },
  luxury: {
    phone: {
      name: "폴더폰",
      price: 500,
      count: 0,
      img: "📱",
      type: "essential",
      desc: "뉴스 열람"
    },
    smartphone: {
      name: "스마트폰",
      price: 3000,
      count: 0,
      img: "📲",
      type: "essential",
      desc: "코인 시세 확인"
    },
    gold: {
      name: "금괴 1kg",
      price: 65000,
      count: 0,
      img: "🧈",
      type: "asset",
      desc: "안전 자산",
      fixedPrice: false
    },
    bag: {
      name: "루이비통 가방",
      price: 3000,
      count: 0,
      img: "👜",
      type: "asset",
      desc: "명품",
      fixedPrice: true
    },
    shoes: {
      name: "명품 구두",
      price: 1500,
      count: 0,
      img: "👠",
      type: "asset",
      desc: "명품",
      fixedPrice: true
    },
    ring: {
      name: "다이아 반지",
      price: 5000,
      count: 0,
      img: "💍",
      type: "asset",
      desc: "청혼용",
      fixedPrice: true
    },
    rolex: {
      name: "롤렉스",
      price: 15000,
      count: 0,
      img: "⌚",
      type: "asset",
      desc: "성공의 상징",
      fixedPrice: true
    },
    sedan: {
      name: "고급 세단",
      price: 60000,
      count: 0,
      img: "🚘",
      type: "asset",
      desc: "편안한 승차감",
      fixedPrice: true
    },
    supercar: {
      name: "람보르기니",
      price: 300000,
      count: 0,
      img: "🏎️",
      type: "asset",
      desc: "부의 상징",
      fixedPrice: true
    }
  },
  newsHistory: [],
  partners: []
});

export function cloneRestoredState(state = INITIAL_RESTORED_STATE) {
  return JSON.parse(JSON.stringify(state));
}

export function createInitialRestoredState() {
  return cloneRestoredState(INITIAL_RESTORED_STATE);
}
