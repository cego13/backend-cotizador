const express = require("express");
const Note = require("../models/Note");

const router = express.Router();

// GET /api/notes
router.get("/", async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/notes
router.post("/", async (req, res) => {
  console.log("POST /api/notes recibida:", req.body);
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: "El texto es requerido" });

  try {
    const note = new Note({ text });
    const savedNote = await note.save();
    res.status(201).json(savedNote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/notes/:id
router.put("/:id", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: "El texto es requerido" });

  try {
    const updatedNote = await Note.findByIdAndUpdate(req.params.id, { text }, { new: true });
    if (!updatedNote) return res.status(404).json({ message: "Nota no encontrada" });
    res.json(updatedNote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/notes/:id
router.delete("/:id", async (req, res) => {
  try {
    const deletedNote = await Note.findByIdAndDelete(req.params.id);
    if (!deletedNote) return res.status(404).json({ message: "Nota no encontrada" });
    res.json({ message: "Nota eliminada correctamente" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
