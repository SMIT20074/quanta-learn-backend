const express = require("express");
const router = express.Router();
const lessons = require("../data/lessons.json");

// GET /api/lessons — the learning map
router.get("/", (req, res) => {
  const summary = lessons.map((l) => ({
    lesson_id: l.lesson_id,
    chapter: l.chapter,
    title: l.title,
    explanation: l.explanation,
    challenge_count: l.challenges.length,
  }));
  res.json(summary);
});

// GET /api/lessons/:lessonId — full lesson + challenges (no answers leaked)
router.get("/:lessonId", (req, res) => {
  const lesson = lessons.find((l) => l.lesson_id === req.params.lessonId);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });

  const safe = {
    ...lesson,
    challenges: lesson.challenges.map(({ expected_answer, expected_circuit, grading_rules, ...rest }) => rest),
  };
  res.json(safe);
});

module.exports = router;
