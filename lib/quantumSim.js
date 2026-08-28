// quantumSim.js
// Minimal statevector simulator for Quanta Learn.
// Supports up to 3 qubits and the gate set the syllabus teaches: X, H, Z, CNOT.
// No external quantum library needed — plain complex-number arithmetic.

class Complex {
  constructor(re = 0, im = 0) { this.re = re; this.im = im; }
  add(o) { return new Complex(this.re + o.re, this.im + o.im); }
  mul(o) { return new Complex(this.re * o.re - this.im * o.im, this.re * o.im + this.im * o.re); }
  scale(k) { return new Complex(this.re * k, this.im * k); }
  abs2() { return this.re * this.re + this.im * this.im; }
}

const SQRT1_2 = 1 / Math.sqrt(2);

/**
 * Build initial state |00...0> for n qubits.
 */
function initState(n) {
  const size = 1 << n; // 2^n
  const state = new Array(size).fill(0).map(() => new Complex(0, 0));
  state[0] = new Complex(1, 0);
  return state;
}

/**
 * Apply a single-qubit gate matrix [[a,b],[c,d]] to `qubit` index (0 = leftmost in our convention: qubit 0 is bit 0 of index... we use qubit i = bit i).
 */
function applySingleQubitGate(state, n, qubit, matrix) {
  const size = state.length;
  const newState = new Array(size).fill(0).map(() => new Complex(0, 0));
  const mask = 1 << qubit;

  for (let i = 0; i < size; i++) {
    const bit = (i & mask) ? 1 : 0;
    const pairIndex = i ^ mask; // index with this qubit flipped

    if (bit === 0) {
      // i has qubit=0, pairIndex has qubit=1
      const a0 = state[i];
      const a1 = state[pairIndex];
      newState[i] = newState[i].add(matrix[0][0].mul(a0)).add(matrix[0][1].mul(a1));
      newState[pairIndex] = newState[pairIndex].add(matrix[1][0].mul(a0)).add(matrix[1][1].mul(a1));
    }
  }
  return newState;
}

const GATES = {
  X: [[new Complex(0), new Complex(1)], [new Complex(1), new Complex(0)]],
  H: [[new Complex(SQRT1_2), new Complex(SQRT1_2)], [new Complex(SQRT1_2), new Complex(-SQRT1_2)]],
  Z: [[new Complex(1), new Complex(0)], [new Complex(0), new Complex(-1)]],
  I: [[new Complex(1), new Complex(0)], [new Complex(0), new Complex(1)]],
};

function applyCNOT(state, n, control, target) {
  const size = state.length;
  const newState = state.slice();
  const controlMask = 1 << control;
  const targetMask = 1 << target;

  for (let i = 0; i < size; i++) {
    if (i & controlMask) {
      const flipped = i ^ targetMask;
      if (i < flipped) {
        const tmp = newState[i];
        newState[i] = newState[flipped];
        newState[flipped] = tmp;
      }
    }
  }
  return newState;
}

/**
 * Run a circuit spec and return the probability distribution over all basis states.
 *
 * circuit = {
 *   qubits: 2,
 *   ops: [
 *     { gate: "H", target: 0 },
 *     { gate: "CNOT", control: 0, target: 1 },
 *   ]
 * }
 *
 * Returns: { "00": 0.5, "01": 0, "10": 0, "11": 0.5 }
 */
function runCircuit(circuit) {
  const n = circuit.qubits;
  if (!n || n < 1 || n > 3) throw new Error("qubits must be between 1 and 3");

  let state = initState(n);

  for (const op of circuit.ops || []) {
    const gate = (op.gate || "").toUpperCase();
    if (gate === "CNOT") {
      if (op.control === undefined || op.target === undefined) {
        throw new Error("CNOT requires control and target");
      }
      state = applyCNOT(state, n, op.control, op.target);
    } else if (GATES[gate]) {
      if (op.target === undefined) throw new Error(`${gate} requires target`);
      state = applySingleQubitGate(state, n, op.target, GATES[gate]);
    } else {
      throw new Error(`Unknown gate: ${op.gate}`);
    }
  }

  const probs = {};
  for (let i = 0; i < state.length; i++) {
    const label = i.toString(2).padStart(n, "0").split("").reverse().join("");
    probs[label] = Math.round(state[i].abs2() * 10000) / 10000;
  }
  return probs;
}

/**
 * Simulate `shots` measurements drawn from a probability distribution.
 * Useful for the "RUN 20 TIMES" style challenges.
 */
function sampleShots(probs, shots = 20) {
  const entries = Object.entries(probs);
  const results = [];
  for (let s = 0; s < shots; s++) {
    let r = Math.random();
    let chosen = entries[entries.length - 1][0];
    for (const [label, p] of entries) {
      if (r < p) { chosen = label; break; }
      r -= p;
    }
    results.push(chosen);
  }
  return results;
}

module.exports = { runCircuit, sampleShots };
