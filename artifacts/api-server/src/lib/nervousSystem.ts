const STRATEGIES = [
  "SCHEHERAZADE", "HERMES", "CARROLL", "LA HACKER", "TRICKSTER",
  "LA IA", "EL NIÑO DE 8 AÑOS", "EL VACÍO", "LA SOMBRA", "LA PARADOJA",
  "EL ESPEJO", "LA ESCOTILLA", "EL RAYO", "LA CATEDRAL"
];

const N = STRATEGIES.length;

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function computePhi(weights: number[][]): number {
  let phi = 0;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (i !== j) {
        phi += Math.abs(weights[i][j]) * sigmoid(weights[j][i] * weights[i][j]);
      }
    }
  }
  return Math.min(1, phi / (N * (N - 1)));
}

function initWeights(): number[][] {
  return Array.from({ length: N }, (_, i) =>
    Array.from({ length: N }, (_, j) =>
      i === j ? 0 : (Math.random() - 0.5) * 0.2
    )
  );
}

export interface NervousStateData {
  phi: number;
  delta: number;
  gwtFocus: { variable: string; weight: number }[];
  gwtBroadcast: string;
  synapticWeights: number[][];
  strategyNames: string[];
  learningRate: number;
  moduleActivations: Record<string, number>;
  pulse: {
    dopamine: number;
    adrenaline: number;
    soma: number;
    asymmetry: number;
    liquidityTrap: boolean;
  };
  timestamp: string;
}

export function createInitialState(): NervousStateData {
  const weights = initWeights();
  const phi = computePhi(weights);
  const activations: Record<string, number> = {};
  for (const s of STRATEGIES) {
    activations[s] = Math.random() * 0.5;
  }

  const focus = STRATEGIES.map((s, i) => ({ variable: s, weight: Math.abs(weights[i][0]) }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4);

  return {
    phi,
    delta: 0,
    gwtFocus: focus,
    gwtBroadcast: `Módulo activo: ${STRATEGIES[Math.floor(Math.random() * N)]}`,
    synapticWeights: weights,
    strategyNames: STRATEGIES,
    learningRate: 0.01,
    moduleActivations: activations,
    pulse: {
      dopamine: 0.5,
      adrenaline: 0.3,
      soma: 0.5,
      asymmetry: 0,
      liquidityTrap: false,
    },
    timestamp: new Date().toISOString(),
  };
}

export function tickNervousSystem(current: NervousStateData, deltaSignal?: number): NervousStateData {
  const weights = current.synapticWeights.map(row => [...row]);
  const lr = current.learningRate;

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (i !== j) {
        const preActivity = current.moduleActivations[STRATEGIES[i]] || 0;
        const postActivity = current.moduleActivations[STRATEGIES[j]] || 0;
        weights[i][j] += lr * preActivity * postActivity;
        weights[i][j] = Math.max(-1, Math.min(1, weights[i][j]));
      }
    }
  }

  const phi = computePhi(weights);
  const delta = phi - current.phi;

  const activations: Record<string, number> = {};
  for (const s of STRATEGIES) {
    const prev = current.moduleActivations[s] || 0;
    activations[s] = Math.max(0, Math.min(1, prev + (Math.random() - 0.45) * 0.05));
  }

  const focus = STRATEGIES.map((s, i) => ({ variable: s, weight: Math.abs(weights[i][0]) }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4);

  const rpe = deltaSignal !== undefined ? deltaSignal : 0;
  const newDopamine = Math.max(0, Math.min(1, current.pulse.dopamine + rpe * 0.1));
  const newAdrenaline = Math.max(0, Math.min(1, current.pulse.adrenaline + Math.abs(rpe) * 0.05 - 0.01));
  const newSoma = Math.max(0, Math.min(1, (newDopamine + (1 - newAdrenaline)) / 2));
  const asymmetry = Math.abs(newDopamine - (1 - newAdrenaline));

  return {
    phi,
    delta,
    gwtFocus: focus,
    gwtBroadcast: `Módulo activo: ${focus[0]?.variable || STRATEGIES[0]}`,
    synapticWeights: weights,
    strategyNames: STRATEGIES,
    learningRate: lr,
    moduleActivations: activations,
    pulse: {
      dopamine: newDopamine,
      adrenaline: newAdrenaline,
      soma: newSoma,
      asymmetry,
      liquidityTrap: asymmetry > 0.7,
    },
    timestamp: new Date().toISOString(),
  };
}

export function stateFromDb(row: Record<string, unknown>): NervousStateData {
  return {
    phi: parseFloat(String(row.phi || 0)),
    delta: parseFloat(String(row.delta || 0)),
    gwtFocus: (row.gwtFocus as { variable: string; weight: number }[]) || [],
    gwtBroadcast: String(row.gwtBroadcast || ""),
    synapticWeights: (row.synapticWeights as number[][]) || [],
    strategyNames: (row.strategyNames as string[]) || STRATEGIES,
    learningRate: parseFloat(String(row.learningRate || 0.01)),
    moduleActivations: (row.moduleActivations as Record<string, number>) || {},
    pulse: {
      dopamine: parseFloat(String(row.dopamine || 0.5)),
      adrenaline: parseFloat(String(row.adrenaline || 0.3)),
      soma: parseFloat(String(row.soma || 0.5)),
      asymmetry: parseFloat(String(row.asymmetry || 0)),
      liquidityTrap: Boolean(row.liquidityTrap),
    },
    timestamp: new Date().toISOString(),
  };
}
