const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// S3 client - uses IAM role automatically (no keys needed!)
const s3 = new S3Client({ region: 'ap-south-1' });
const BUCKET_NAME = 'heartspace-photos-vishwanath';

// Multer for file uploads (store in memory)
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In memory storage (will move to DynamoDB next)
let notes = [
  {
    id: uuidv4(),
    author: "Admin",
    message: "Welcome to HeartSpace! 💕",
    recipient: "Everyone",
    photoUrl: null,
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

// Create a note with optional photo
app.post('/api/notes', upload.single('photo'), async (req, res) => {
  try {
    const { author, message, recipient } = req.body;
    let photoUrl = null;

    // If photo uploaded, send to S3
    if (req.file) {
      const photoKey = `photos/${uuidv4()}-${req.file.originalname}`;
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: photoKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      }));
      photoUrl = `https://${BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${photoKey}`;
    }

    const note = {
      id: uuidv4(),
      author,
      message,
      recipient,
      photoUrl,
      createdAt: new Date().toISOString()
    };
    notes.push(note);
    res.json({ success: true, note });
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a note
app.delete('/api/notes/:id', (req, res) => {
  notes = notes.filter(n => n.id !== req.params.id);
  res.json({ success: true });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`HeartSpace backend running on port ${PORT}`);
});
