import express from 'express';
import Folktale from '../models/Folktale.js';
import Comment from '../models/Comment.js';
import Bookmark from '../models/Bookmark.js';
import { auth } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises'; // Use promises version for async/await

const router = express.Router();

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Images only (jpeg, jpg, png)'));
    }
  },
});

// Create a new folktale with image upload
router.post(
  '/',
  auth,
  upload.single('image'),
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

      if (!req.file) {
        return res.status(400).json({ message: 'Image is required' });
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'folktales',
      });
      await fs.unlink(req.file.path); // Delete temporary file using promises

      const folktale = new Folktale({
        title: req.body.title,
        content: req.body.content,
        region: req.body.region,
        genre: req.body.genre,
        ageGroup: req.body.ageGroup,
        imageUrl: result.secure_url,
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

// Get popular folktales (specific path)
router.get('/popular', async (req, res) => {
  try {
    const folktales = await Folktale.find().sort({ views: -1 }).limit(5);
    res.json(folktales);
  } catch (error) {
    console.error('Error fetching popular folktales:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get random folktale (specific path)
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

// Add a bookmark (specific path)
router.post('/bookmarks', auth, async (req, res) => {
  try {
    const { folktaleId } = req.body;
    const userId = req.user.id;

    // Validate folktale exists
    const folktale = await Folktale.findById(folktaleId);
    if (!folktale) {
      return res.status(404).json({ message: 'Folktale not found' });
    }

    // Check for existing bookmark
    const existingBookmark = await Bookmark.findOne({ userId, folktaleId });
    if (existingBookmark) {
      return res.status(400).json({ message: 'Folktale already bookmarked' });
    }

    const bookmark = new Bookmark({
      userId,
      folktaleId,
    });
    await bookmark.save();

    // Populate folktale data for response
    const populatedBookmark = await Bookmark.findById(bookmark._id)
      .populate('folktaleId', 'title region genre imageUrl');
    res.status(201).json(populatedBookmark);
  } catch (error) {
    console.error('Error adding bookmark:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's bookmarks (specific path, placed before /:id to avoid conflict)
router.get('/bookmark', auth, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user.id })
      .populate('folktaleId', 'title region genre imageUrl');
    res.json(bookmarks);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove a bookmark (specific path with parameter)
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

// Update a folktale (dynamic route)
router.put(
  '/:id',
  auth,
  upload.single('image'),
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
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'folktales',
        });
        await fs.unlink(req.file.path); // Delete temporary file using promises
        folktale.imageUrl = result.secure_url;
      }

      await folktale.save();
      res.json(folktale);
    } catch (error) {
      console.error('Error updating folktale:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get folktale by ID (dynamic route)
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

// Rate folktale (dynamic route with subpath)
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

// Post comment (dynamic route with subpath)
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

// Get comments (dynamic route with subpath)
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ folktaleId: req.params.id }).populate('userId', 'username');
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a folktale by ID (dynamic route, added for completeness)
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