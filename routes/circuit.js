const express = require("express");
const router = express.Router();
const { runCircuit, sampleShots } = require("../lib/quantumSim");

// POST /api/circuit/run
// body: { qubits: 2, ops: [{gate:"H", target:0}, {gate:"CNOT", control:0, target:1}], shots: 20 }
router.post("/run", (req, res) => {
  try {
    const { qubits, ops, shots } = req.body;
    const probs = runCircuit({ qubits, ops });
    const response = { probs };
    if (shots) response.samples = sampleShots(probs, shots);
    res.json(response);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
