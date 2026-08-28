const express = require("express");
const router = express.Router();
const lessons = require("../data/lessons.json");
const { gradeChallenge, calculateXp } = require("../lib/grading");
const { pool } = require("../lib/db");
const { requireAuth } = require("../lib/auth");

function findChallenge(challengeId) {
  for (const lesson of lessons) {
    const found = lesson.challenges.find((c) => c.challenge_id === challengeId);
    if (found) return { lesson, challenge: found };
  }
  return null;
}

// POST /api/challenges/:challengeId/submit   (requires auth)
// body: { answer?, circuit?, hints_used }
router.post("/challenges/:challengeId/submit", requireAuth, async (req, res) => {
  const found = findChallenge(req.params.challengeId);
  if (!found) return res.status(404).json({ error: "Challenge not found" });

  const { challenge, lesson } = found;
  const { hints_used = 0 } = req.body;
  const userId = req.user.user_id;

  let result;
  try {
    result = gradeChallenge(challenge, req.body);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  let xpEarned = 0;

  try {
    const already = await pool.query(
      `select 1 from attempts where user_id = $1 and challenge_id = $2 and result = true`,
      [userId, challenge.challenge_id]
    );
    const alreadyCompleted = already.rows.length > 0;

    if (result.correct && !alreadyCompleted) {
      xpEarned = calculateXp(challenge.xp_reward, hints_used);
      await pool.query(`update users set xp = xp + $1 where user_id = $2`, [xpEarned, userId]);
      await pool.query(
        `insert into user_progress (user_id, lesson_id, completed, score)
         values ($1, $2, true, $3)
         on conflict (user_id, lesson_id) do update set completed = true, score = $3`,
        [userId, lesson.lesson_id, xpEarned]
      );
    }

    await pool.query(
      `insert into attempts (user_id, challenge_id, submitted_data, result, hints_used, xp_earned)
       values ($1, $2, $3, $4, $5, $6)`,
      [userId, challenge.challenge_id, JSON.stringify(req.body), result.correct, hints_used, xpEarned]
    );

    const userRow = await pool.query(`select xp from users where user_id = $1`, [userId]);

    res.json({
      correct: result.correct,
      detail: result.detail,
      probs: result.probs,
      xp_earned: xpEarned,
      total_xp: userRow.rows[0].xp,
    });
  } catch (e) {
    res.status(500).json({ error: "Could not save attempt", detail: e.message });
  }
});

// GET /api/users/me/progress   (requires auth)
router.get("/users/me/progress", requireAuth, async (req, res) => {
  try {
    const userRow = await pool.query(`select xp, level, streak from users where user_id = $1`, [req.user.user_id]);
    const progressRows = await pool.query(
      `select lesson_id from user_progress where user_id = $1 and completed = true`,
      [req.user.user_id]
    );
    res.json({
      ...userRow.rows[0],
      completed_lessons: progressRows.rows.map((r) => r.lesson_id),
    });
  } catch (e) {
    res.status(500).json({ error: "Could not load progress", detail: e.message });
  }
});

module.exports = router;
