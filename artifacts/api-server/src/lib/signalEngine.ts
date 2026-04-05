import { getBTCPrice } from "./btcPrice";

export interface GeneratedSignal {
  strategy: string;
  type: string;
  message: string;
  price: number;
  confidence: number;
}

const STRATEGIES = [
  { name: "SCHEHERAZADE", weight: 0.85 },
  { name: "HERMES", weight: 0.78 },
  { name: "CARROLL", weight: 0.72 },
  { name: "LA HACKER", weight: 0.90 },
  { name: "TRICKSTER", weight: 0.65 },
  { name: "LA IA", weight: 0.88 },
  { name: "EL NIÑO DE 8 AÑOS", weight: 0.60 },
  { name: "EL VACÍO", weight: 0.70 },
  { name: "LA SOMBRA", weight: 0.75 },
  { name: "LA PARADOJA", weight: 0.80 },
  { name: "EL ESPEJO", weight: 0.73 },
  { name: "LA ESCOTILLA", weight: 0.68 },
  { name: "EL RAYO", weight: 0.92 },
  { name: "LA CATEDRAL", weight: 0.95 },
];

const SIGNAL_TYPES = ["BUY", "SELL", "HOLD", "ALERT"];

function generateSignalForStrategy(
  strategy: { name: string; weight: number },
  price: number,
  change24h: number
): GeneratedSignal {
  const momentum = change24h / 10;
  const rand = Math.random();
  const typeWeights = [
    0.35 + momentum * 0.1,
    0.25 - momentum * 0.1,
    0.25,
    0.15,
  ];

  let cumWeight = 0;
  let typeIdx = 0;
  for (let i = 0; i < typeWeights.length; i++) {
    cumWeight += typeWeights[i];
    if (rand < cumWeight) {
      typeIdx = i;
      break;
    }
  }

  const type = SIGNAL_TYPES[typeIdx];
  const confidence = Math.round(
    Math.min(99, Math.max(40, strategy.weight * 100 + (Math.random() - 0.5) * 20))
  );

  const messages: Record<string, string[]> = {
    BUY: [
      `${strategy.name}: Impulso ascendente detectado. Acumulación estratégica recomendada a $${price.toFixed(0)}.`,
      `${strategy.name}: Convergencia de señales alcistas. Zona de entrada: $${price.toFixed(0)}.`,
      `${strategy.name}: Patrón de reversión confirmado. Compra ejecutable en $${price.toFixed(0)}.`,
    ],
    SELL: [
      `${strategy.name}: Divergencia bajista identificada. Reducción de exposición a $${price.toFixed(0)}.`,
      `${strategy.name}: Señal de distribución activa. Salida parcial recomendada a $${price.toFixed(0)}.`,
      `${strategy.name}: Zona de resistencia crítica. Toma de ganancias en $${price.toFixed(0)}.`,
    ],
    HOLD: [
      `${strategy.name}: Sistema en equilibrio. Mantener posición actual a $${price.toFixed(0)}.`,
      `${strategy.name}: Sin señal definitiva. Observación activa requerida.`,
      `${strategy.name}: Consolidación en curso. Paciencia táctica recomendada.`,
    ],
    ALERT: [
      `${strategy.name}: Volatilidad elevada detectada. Gestión de riesgo activa en $${price.toFixed(0)}.`,
      `${strategy.name}: Anomalía en correlaciones. Vigilancia máxima recomendada.`,
      `${strategy.name}: Brecha de liquidez identificada. Monitoreo continuo en $${price.toFixed(0)}.`,
    ],
  };

  const typeMessages = messages[type] || messages["HOLD"];
  const message = typeMessages[Math.floor(Math.random() * typeMessages.length)];

  return { strategy: strategy.name, type, message, price, confidence };
}

export async function generateAllSignals(): Promise<GeneratedSignal[]> {
  const { price, change24h } = await getBTCPrice();
  return STRATEGIES.map(s => generateSignalForStrategy(s, price, change24h));
}

export async function generateSignalForId(strategyIndex: number): Promise<GeneratedSignal | null> {
  if (strategyIndex < 0 || strategyIndex >= STRATEGIES.length) return null;
  const { price, change24h } = await getBTCPrice();
  return generateSignalForStrategy(STRATEGIES[strategyIndex], price, change24h);
}
