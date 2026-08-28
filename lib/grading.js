// grading.js
// Three grading types from the Quanta Learn spec:
//   A) answer   — exact match (multiple choice)
//   B) circuit  — structural match (gates/qubits/order)
//   C) result   — probability-range match (quantum outcomes aren't exact)

const { runCircuit } = require("./quantumSim");

function gradeAnswer(challenge, submission) {
  const correct =
    String(submission.answer).trim().toLowerCase() ===
    String(challenge.expected_answer).trim().toLowerCase();
  return { correct, detail: correct ? "Matched expected answer." : "Did not match expected answer." };
}

function gradeCircuitStructure(challenge, submission) {
  const expected = challenge.expected_circuit; // { qubits, ops: [...] }
  const submitted = submission.circuit;

  if (!submitted || submitted.qubits !== expected.qubits) {
    return { correct: false, detail: "Qubit count doesn't match." };
  }
  if (submitted.ops.length !== expected.ops.length) {
    return { correct: false, detail: "Number of gates doesn't match." };
  }
  const orderMatters = challenge.order_matters !== false; // default true
  const normalize = (ops) =>
    ops.map((o) => JSON.stringify({ gate: (o.gate || "").toUpperCase(), target: o.target, control: o.control }));

  const expNorm = normalize(expected.ops);
  const subNorm = normalize(submitted.ops);

  const correct = orderMatters
    ? JSON.stringify(expNorm) === JSON.stringify(subNorm)
    : [...expNorm].sort().join() === [...subNorm].sort().join();

  return { correct, detail: correct ? "Circuit matches expected structure." : "Circuit structure doesn't match." };
}

/**
 * Probability-range grading — the important one for gates like H and CNOT
 * where exact 50/50 shouldn't be required.
 *
 * challenge.grading_rules example (Bell state):
 * {
 *   accept: [
 *     { states: ["00", "11"], min_sum: 0.8 },
 *     { states: ["01", "10"], max_sum: 0.2 }
 *   ]
 * }
 */
function gradeQuantumResult(challenge, submission) {
  let probs;
  try {
    probs = runCircuit(submission.circuit);
  } catch (e) {
    return { correct: false, detail: `Circuit error: ${e.message}` };
  }

  for (const rule of challenge.grading_rules.accept) {
    const sum = rule.states.reduce((acc, s) => acc + (probs[s] || 0), 0);
    if (rule.min_sum !== undefined && sum < rule.min_sum) {
      return { correct: false, detail: `P(${rule.states.join(",")}) = ${sum.toFixed(2)}, needed ≥ ${rule.min_sum}`, probs };
    }
    if (rule.max_sum !== undefined && sum > rule.max_sum) {
      return { correct: false, detail: `P(${rule.states.join(",")}) = ${sum.toFixed(2)}, needed ≤ ${rule.max_sum}`, probs };
    }
  }
  return { correct: true, detail: "Probability distribution within accepted range.", probs };
}

function gradeChallenge(challenge, submission) {
  switch (challenge.grading_method) {
    case "answer": return gradeAnswer(challenge, submission);
    case "circuit": return gradeCircuitStructure(challenge, submission);
    case "result": return gradeQuantumResult(challenge, submission);
    default: throw new Error(`Unknown grading_method: ${challenge.grading_method}`);
  }
}

// XP scaling based on hints used, per the spec's hint-ladder rule.
function calculateXp(baseXp, hintsUsed) {
  const multipliers = [1, 0.9, 0.75, 0.5]; // 0,1,2,3 hints
  const solutionShown = hintsUsed >= 4;
  if (solutionShown) return Math.round(baseXp * 0.25);
  return Math.round(baseXp * (multipliers[hintsUsed] ?? 0.5));
}

module.exports = { gradeChallenge, calculateXp };
