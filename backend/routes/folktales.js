import express from 'express';
import Folktale from '../models/Folktale.js';
import Comment from '../models/Comment.js';
import Bookmark from '../models/Bookmark.js';
import { auth } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import axios from 'axios';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs/promises';

const router = express.Router();
dotenv.config();

// Set up Multer for file uploads with storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp'); // Writable directory on Render
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|mp3|wav/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Images (jpeg, jpg, png) or audio (mp3, wav) only'));
    }
  },
});

// Middleware to handle both image and audio uploads
const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
]);

// Generate a folktale story using OpenAI
router.post('/generate-story', auth, async (req, res) => {
  const { genre, region, ageGroup } = req.body;

  if (!genre || !region || !ageGroup) {
    return res.status(400).json({ message: 'Genre, region, and age group are required.' });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: `Generate a ${genre} folktale from ${region} suitable for ${ageGroup}. The story should be engaging, culturally relevant, and appropriate for the selected age group. Provide a title prefixed with "Title:" followed by the story content.`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const generatedText = response.data.choices[0].message.content;
    res.json({ generatedText });
  } catch (error) {
    console.error('Error generating story:', error);
    console.error('Error response data:', error.response?.data);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    let errorMessage = 'Failed to generate story.';
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timed out. Please try again later.';
    } else if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    }

    res.status(500).json({ message: errorMessage });
  }
});

// Create a new folktale with image and optional audio upload
router.post(
  '/',
  auth,
  uploadFields,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('region').notEmpty().withMessage('Region is required'),
    body('genre').notEmpty().withMessage('Genre is required'),
    body('ageGroup').notEmpty().withMessage('Age group is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.files?.image) {
        return res.status(400).json({ message: 'Image is required' });
      }

      // Upload image to Cloudinary
      const imageResult = await cloudinary.uploader.upload(req.files.image[0].path, {
        folder: 'folktales',
        resource_type: 'image',
      });
      await fs.unlink(req.files.image[0].path); // Delete temporary image file

      
        const audioResult = await cloudinary.uploader.upload(req.files.audio[0].path, {
          folder: 'folktales/audio',
          resource_type: 'video', // Cloudinary uses 'video' for audio files
        });
        await fs.unlink(req.files.audio[0].path); // Delete temporary audio file
      

      const folktale = new Folktale({
        title: req.body.title,
        content: req.body.content,
        region: req.body.region,
        genre: req.body.genre,
        ageGroup: req.body.ageGroup,
        imageUrl: imageResult.secure_url,
        audioUrl: audioResult.secure_url,
      });

      await folktale.save();
      res.status(201).json(folktale);
    } catch (error) {
      console.error('Error creating folktale:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get paginated folktales with filters and search
router.get('/', async (req, res) => {
  const { page = 1, limit = 10, region, genre, ageGroup, search } = req.query;
  const query = {};
  if (region) query.region = region;
  if (genre) query.genre = genre;
  if (ageGroup) query.ageGroup = ageGroup;
  if (search) query.title = { $regex: search, $options: 'i' };

  try {
    const folktales = await Folktale.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Folktale.countDocuments(query);
    res.json({ folktales, total });
  } catch (error) {
    console.error('Error fetching folktales:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get popular folktales
router.get('/popular', async (req, res) => {
  try {
    const folktales = await Folktale.find().sort({ views: -1 }).limit(5);
    res.json(folktales);
  } catch (error) {
    console.error('Error fetching popular folktales:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get random folktale
router.get('/random', async (req, res) => {
  try {
    const count = await Folktale.countDocuments();
    const random = Math.floor(Math.random() * count);
    const folktale = await Folktale.findOne().skip(random);
    res.json(folktale);
  } catch (error) {
    console.error('Error fetching random folktale:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a bookmark
router.post('/bookmarks', auth, async (req, res) => {
  try {
    const { folktaleId } = req.body;
    const userId = req.user.id;

    const folktale = await Folktale.findById(folktaleId);
    if (!folktale) {
      return res.status(404).json({ message: 'Folktale not found' });
    }

    const existingBookmark = await Bookmark.findOne({ userId, folktaleId });
    if (existingBookmark) {
      return res.status(400).json({ message: 'Folktale already bookmarked' });
    }

    const bookmark = new Bookmark({
      userId,
      folktaleId,
    });
    await bookmark.save();

    const populatedBookmark = await Bookmark.findById(bookmark._id)
      .populate('folktaleId', 'title region genre imageUrl audioUrl');
    res.status(201).json(populatedBookmark);
  } catch (error) {
    console.error('Error adding bookmark:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's bookmarks
router.get('/bookmark', auth, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user.id })
      .populate('folktaleId', 'title region genre imageUrl audioUrl');
    res.json(bookmarks);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove a bookmark
router.delete('/bookmarks/:folktaleId', auth, async (req, res) => {
  try {
    const bookmark = await Bookmark.findOneAndDelete({
      userId: req.user.id,
      folktaleId: req.params.folktaleId,
    });
    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }
    res.json({ message: 'Bookmark removed' });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a folktale
router.put(
  '/:id',
  auth,
  uploadFields,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('region').notEmpty().withMessage('Region is required'),
    body('genre').notEmpty().withMessage('Genre is required'),
    body('ageGroup').notEmpty().withMessage('Age group is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const folktale = await Folktale.findById(req.params.id);
      if (!folktale) {
        return res.status(404).json({ message: 'Folktale not found' });
      }

      // Update fields
      folktale.title = req.body.title;
      folktale.content = req.body.content;
      folktale.region = req.body.region;
      folktale.genre = req.body.genre;
      folktale.ageGroup = req.body.ageGroup;

      // Update image if provided
      if (req.files?.image) {
        const imageResult = await cloudinary.uploader.upload(req.files.image[0].path, {
          folder: 'folktales',
          resource_type: 'image',
        });
        await fs.unlink(req.files.image[0].path);
        folktale.imageUrl = imageResult.secure_url;
      }

      // Update audio if provided
      if (req.files?.audio) {
        const audioResult = await cloudinary.uploader.upload(req.files.audio[0].path, {
          folder: 'folktales/audio',
          resource_type: 'video',
        });
        await fs.unlink(req.files.audio[0].path);
        folktale.audioUrl = audioResult.secure_url;
      }

      await folktale.save();
      res.json(folktale);
    } catch (error) {
      console.error('Error updating folktale:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get folktale by ID
router.get('/:id', async (req, res) => {
  try {
    const folktale = await Folktale.findById(req.params.id);
    if (!folktale) return res.status(404).json({ message: 'Folktale not found' });
    folktale.views += 1;
    await folktale.save();
    res.json(folktale);
  } catch (error) {
    console.error('Error fetching folktale:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Rate folktale
router.post(
  '/:id/rate',
  auth,
  [
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be an integer between 1 and 5'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { rating } = req.body;
      const userId = req.user.id;
      const folktaleId = req.params.id;

      const folktale = await Folktale.findById(folktaleId);
      if (!folktale) {
        return res.status(404).json({ message: 'Folktale not found' });
      }

      const existingRating = folktale.ratings.find(
        (r) => r.userId.toString() === userId
      );
      if (existingRating) {
        return res.status(400).json({ message: 'You have already rated this folktale' });
      }

      folktale.ratings.push({ userId, rating });
      await folktale.save();
      res.json(folktale);
    } catch (error) {
      console.error('Error rating folktale:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Post comment
router.post(
  '/:id/comments',
  auth,
  [
    body('content')
      .notEmpty()
      .withMessage('Comment content is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { content } = req.body;
      const userId = req.user.id;
      const folktaleId = req.params.id;

      const folktale = await Folktale.findById(folktaleId);
      if (!folktale) {
        return res.status(404).json({ message: 'Folktale not found' });
      }

      const existingComment = await Comment.findOne({
        folktaleId,
        userId,
      });
      if (existingComment) {
        return res.status(400).json({ message: 'You have already commented on this folktale' });
      }

      const comment = new Comment({
        folktaleId,
        userId,
        content,
      });
      await comment.save();
      const populatedComment = await Comment.findById(comment._id).populate('userId', 'username');
      res.status(201).json(populatedComment);
    } catch (error) {
      console.error('Error posting comment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get comments
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ folktaleId: req.params.id }).populate('userId', 'username');
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a folktale by ID
router.delete('/:id', auth, async (req, res) => {
  try {
    const folktale = await Folktale.findById(req.params.id);
    if (!folktale) {
      return res.status(404).json({ message: 'Folktale not found' });
    }

    await Folktale.deleteOne({ _id: req.params.id });
    res.json({ message: 'Folktale deleted' });
  } catch (error) {
    console.error('Error deleting folktale:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
