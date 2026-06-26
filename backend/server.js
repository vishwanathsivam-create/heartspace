const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// AWS clients - uses IAM role automatically!
const s3 = new S3Client({ region: 'ap-south-1' });
const dynamoClient = new DynamoDBClient({ region: 'ap-south-1' });
const dynamo = DynamoDBDocumentClient.from(dynamoClient);

const BUCKET_NAME = 'heartspace-photos-vishwanath';
const TABLE_NAME = 'heartspace-notes';

// Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'HeartSpace backend is running!' });
});

// Get all notes from DynamoDB
app.get('/api/notes', async (req, res) => {
  try {
    const result = await dynamo.send(new ScanCommand({
      TableName: TABLE_NAME
    }));
    // Sort by createdAt newest first
    const notes = result.Items.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    res.json({ success: true, notes });
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ success: false, error: err.message });
  }
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

    // Save note to DynamoDB
    const note = {
      id: uuidv4(),
      author,
      message,
      recipient,
      photoUrl: photoUrl || null,
      createdAt: new Date().toISOString()
    };

    await dynamo.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: note
    }));

    res.json({ success: true, note });
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a note from DynamoDB
app.delete('/api/notes/:id', async (req, res) => {
  try {
    await dynamo.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id: req.params.id }
    }));
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`HeartSpace backend running on port ${PORT}`);
});
