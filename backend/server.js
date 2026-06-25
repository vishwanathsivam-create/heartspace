const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// In memory storage for now (will move to DynamoDB later)
let notes = [
  {
    id: uuidv4(),
    author: "Admin",
    message: "Welcome to HeartSpace! 💕",
    recipient: "Everyone",
    createdAt: new Date().toISOString()
  }
];

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'HeartSpace backend is running!' });
});

// Get all notes
app.get('/api/notes', (req, res) => {
  res.json({ success: true, notes });
});

// Create a note
app.post('/api/notes', (req, res) => {
  const { author, message, recipient } = req.body;
  const note = {
    id: uuidv4(),
    author,
    message,
    recipient,
    createdAt: new Date().toISOString()
  };
  notes.push(note);
  res.json({ success: true, note });
});

// Delete a note
app.delete('/api/notes/:id', (req, res) => {
  notes = notes.filter(n => n.id !== req.params.id);
  res.json({ success: true });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`HeartSpace backend running on port ${PORT}`);
});
