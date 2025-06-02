import express from 'express';
import Folktale from '../models/Folktale.js';
import Comment from '../models/Comment.js';
import Bookmark from '../models/Bookmark.js';
import { auth } from '../middleware/auth.js';
import { body, query, validationResult } from 'express-validator';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import mongoose from 'mongoose';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp'); // Writable in Render environment
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
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
    }
    cb(new Error('Only JPEG, JPG, or PNG images are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Validation middleware for folktale creation/update
const folktaleValidation = [
  body('title').notEmpty().withMessage('Title is required').trim().isLength({ max: 100 }).withMessage('Title must be 100 characters or less'),
  body('content').notEmpty().withMessage('Content is required').trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
  body('region').notEmpty().withMessage('Region is required').trim().isLength({ max: 50 }).withMessage('Region must be 50 characters or less'),
  body('genre').notEmpty().withMessage('Genre is required').trim().isLength({ max: 50 }).withMessage('Genre must be 50 characters or less'),
  body('ageGroup').notEmpty().withMessage('Age group is required').trim().isLength({ max: 50 }).withMessage('Age group must be 50 characters or less'),
];

// Validation middleware for query parameters
const queryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('region').optional().trim().isLength({ max: 50 }).withMessage('Region must be 50 characters or less'),
  query('genre').optional().trim().isLength({ max: 50 }).withMessage('Genre must be 50 characters or less'),
  query('ageGroup').optional().trim().isLength({ max: 50 }).withMessage('Age group must be 50 characters or less'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search query must be 100 characters or less'),
];

// Create a new folktale with image upload
router.post(
  '/',
  auth,
  upload.single('image'),
  folktaleValidation,
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          error: 'validation_error',
          details: errors.array(),
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          message: 'Image is required',
          error: 'missing_image',
        });
      }

      // Upload to Cloudinary
      let result;
      try {
        result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'folktales',
          resource_type: 'image',
        });
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          message: 'Failed to upload image to Cloudinary',
          error: 'cloudinary_upload_error',
        });
      } finally {
        // Clean up temporary file
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting temporary file:', unlinkError);
        }
      }

      // Create folktale
      const folktale = new Folktale({
        title: req.body.title,
        content: req.body.content,
        region: req.body.region,
        genre: req.body.genre,
        ageGroup: req.body.ageGroup,
        imageUrl: result.secure_url,
        createdBy: req.user._id,
      });

      await folktale.save();
      res.status(201).json({
        message: 'Folktale created successfully',
        data: folktale,
      });
    } catch (error) {
      console.error('Error creating folktale:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Invalid folktale data',
          error: 'mongoose_validation_error',
          details: Object.values(error.errors).map(err => err.message),
        });
      }
      res.status(500).json({
        message: 'Internal server error while creating folktale',
        error: 'server_error',
      });
    }
  }
);

// Get paginated folktales with filters and search
router.get('/', queryValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Invalid query parameters',
        error: 'validation_error',
        details: errors.array(),
      });
    }

    const { page = 1, limit = 10, region, genre, ageGroup, search } = req.query;
    const query = {};
    if (region) query.region = region;
    if (genre) query.genre = genre;
    if (ageGroup) query.ageGroup = ageGroup;
    if (search) query.title = { $regex: search, $options: 'i' };

    const folktales = await Folktale.find(query)
      .lean()
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    const total = await Folktale.countDocuments(query);

    res.json({
      message: folktales.length ? 'Folktales retrieved successfully' : 'No folktales found',
      data: { folktales, total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (error) {
    console.error('Error fetching folktales:', error);
    res.status(500).json({
      message: 'Internal server error while fetching folktales',
      error: 'server_error',
    });
  }
});

// Get popular folktales
router.get('/popular', async (req, res) => {
  try {
    const folktales = await Folktale.find()
      .lean()
      .sort({ views: -1 })
      .limit(5);
    
    res.json({
      message: folktales.length ? 'Popular folktales retrieved successfully' : 'No popular folktales found',
      data: folktales,
    });
  } catch (error) {
    console.error('Error fetching popular folktales:', error);
    res.status(500).json({
      message: 'Internal server error while fetching popular folktales',
      error: 'server_error',
    });
  }
});

// Get random folktale
router.get('/random', async (req, res) => {
  try {
    const count = await Folktale.countDocuments();
    if (count === 0) {
      return res.status(200).json({
        message: 'No folktales available',
        data: null,
      });
    }

    const random = Math.floor(Math.random() * count);
    const folktale = await Folktale.findOne().lean().skip(random);
    
    res.json({
      message: 'Random folktale retrieved successfully',
      data: folktale,
    });
  } catch (error) {
    console.error('Error fetching random folktale:', error);
    res.status(500).json({
      message: 'Internal server error while fetching random folktale',
      error: 'server_error',
    });
  }
});

// Add a bookmark
router.post(
  '/bookmarks',
  auth,
  [
    body('folktaleId').notEmpty().withMessage('Folktale ID is required'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          error: 'validation_error',
          details: errors.array(),
        });
      }

      const { folktaleId } = req.body;
      const userId = req.user._id;

      // Validate MongoDB ObjectId
      if (!mongoose.isValidObjectId(folktaleId)) {
        return res.status(400).json({
          message: 'Invalid folktale ID format',
          error: 'invalid_id',
        });
      }

      // Check if folktale exists
      const folktale = await Folktale.findById(folktaleId).lean();
      if (!folktale) {
        return res.status(404).json({
          message: 'Folktale not found',
          error: 'not_found',
        });
      }

      // Check for existing bookmark
      const existingBookmark = await Bookmark.findOne({ userId, folktaleId });
      if (existingBookmark) {
        return res.status(400).json({
          message: 'Folktale already bookmarked',
          error: 'already_bookmarked',
        });
      }

      // Create and save bookmark
      const bookmark = new Bookmark({ userId, folktaleId });
      await bookmark.save();

      // Populate folktale data
      const populatedBookmark = await Bookmark.findById(bookmark._id)
        .populate('folktaleId', 'title region genre imageUrl')
        .lean();

      res.status(201).json({
        message: 'Bookmark added successfully',
        data: populatedBookmark,
      });
    } catch (error) {
      console.error('Error adding bookmark:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Invalid bookmark data',
          error: 'mongoose_validation_error',
          details: Object.values(error.errors).map(err => err.message),
        });
      }
      res.status(500).json({
        message: 'Internal server error while adding bookmark',
        error: 'server_error',
      });
    }
  }
);

// Get user's bookmarks
router.get('/bookmark', auth, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user._id })
      .populate('folktaleId', 'title region genre imageUrl')
      .lean();

    res.json({
      message: bookmarks.length ? 'Bookmarks retrieved successfully' : 'No bookmarks found',
      data: bookmarks,
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({
      message: 'Internal server error while fetching bookmarks',
      error: 'server_error',
    });
  }
});

// Remove a bookmark
router.delete('/bookmarks/:folktaleId', auth, async (req, res) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.isValidObjectId(req.params.folktaleId)) {
      return res.status(400).json({
        message: 'Invalid folktale ID format',
        error: 'invalid_id',
      });
    }

    const bookmark = await Bookmark.findOneAndDelete({
      userId: req.user._id,
      folktaleId: req.params.folktaleId,
    });

    if (!bookmark) {
      return res.status(404).json({
        message: 'Bookmark not found',
        error: 'not_found',
      });
    }

    res.json({
      message: 'Bookmark removed successfully',
      data: { folktaleId: req.params.folktaleId },
    });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({
      message: 'Internal server error while removing bookmark',
      error: 'server_error',
    });
  }
});

// Update a folktale
router.put(
  '/:id',
  auth,
  upload.single('image'),
  folktaleValidation,
  async (req, res) => {
    try {
      // Validate MongoDB ObjectId
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          message: 'Invalid folktale ID format',
          error: 'invalid_id',
        });
      }

      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          error: 'validation_error',
          details: errors.array(),
        });
      }

      // Check if folktale exists
      const folktale = await Folktale.findById(req.params.id);
      if (!folktale) {
        return res.status(404).json({
          message: 'Folktale not found',
          error: 'not_found',
        });
      }

      // Update fields
      folktale.title = req.body.title;
      folktale.content = req.body.content;
      folktale.region = req.body.region;
      folktale.genre = req.body.genre;
      folktale.ageGroup = req.body.ageGroup;
      folktale.updatedBy = req.user._id;
      folktale.updatedAt = Date.now();

      // Update image if provided
      if (req.file) {
        try {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'folktales',
            resource_type: 'image',
          });
          folktale.imageUrl = result.secure_url;
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          return res.status(500).json({
            message: 'Failed to upload image to Cloudinary',
            error: 'cloudinary_upload_error',
          });
        } finally {
          // Clean up temporary file
          try {
            await fs.unlink(req.file.path);
          } catch (unlinkError) {
            console.error('Error deleting temporary file:', unlinkError);
          }
        }
      }

      await folktale.save();
      res.json({
        message: 'Folktale updated successfully',
        data: folktale,
      });
    } catch (error) {
      console.error('Error updating folktale:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Invalid folktale data',
          error: 'mongoose_validation_error',
          details: Object.values(error.errors).map(err => err.message),
        });
      }
      res.status(500).json({
        message: 'Internal server error while updating folktale',
        error: 'server_error',
      });
    }
  }
);

// Get folktale by ID
router.get('/:id', async (req, res) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid folktale ID format',
        error: 'invalid_id',
      });
    }

    const folktale = await Folktale.findById(req.params.id).lean();
    if (!folktale) {
      return res.status(404).json({
        message: 'Folktale not found',
        error: 'not_found',
      });
    }

    // Increment views in a separate operation to avoid lean() conflicts
    await Folktale.updateOne({ _id: req.params.id }, { $inc: { views: 1 } });

    res.json({
      message: 'Folktale retrieved successfully',
      data: folktale,
    });
  } catch (error) {
    console.error('Error fetching folktale:', error);
    res.status(500).json({
      message: 'Internal server error while fetching folktale',
      error: 'server_error',
    });
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
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          error: 'validation_error',
          details: errors.array(),
        });
      }

      // Validate MongoDB ObjectId
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          message: 'Invalid folktale ID format',
          error: 'invalid_id',
        });
      }

      const { rating } = req.body;
      const userId = req.user._id;
      const folktaleId = req.params.id;

      const folktale = await Folktale.findById(folktaleId);
      if (!folktale) {
        return res.status(404).json({
          message: 'Folktale not found',
          error: 'not_found',
        });
      }

      const existingRating = folktale.ratings.find(
        (r) => r.userId.toString() === userId.toString()
      );
      if (existingRating) {
        return res.status(400).json({
          message: 'You have already rated this folktale',
          error: 'already_rated',
        });
      }

      folktale.ratings.push({ userId, rating });
      await folktale.save();

      res.json({
        message: 'Rating added successfully',
        data: folktale,
      });
    } catch (error) {
      console.error('Error rating folktale:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Invalid rating data',
          error: 'mongoose_validation_error',
          details: Object.values(error.errors).map(err => err.message),
        });
      }
      res.status(500).json({
        message: 'Internal server error while rating folktale',
        error: 'server_error',
      });
    }
  }
);

// Post comment
router.post(
  '/:id/comments',
  auth,
  [
    body('content')
      .notEmpty().withMessage('Comment content is required')
      .trim().isLength({ max: 500 }).withMessage('Comment must be 500 characters or less'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          error: 'validation_error',
          details: errors.array(),
        });
      }

      // Validate MongoDB ObjectId
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          message: 'Invalid folktale ID format',
          error: 'invalid_id',
        });
      }

      const { content } = req.body;
      const userId = req.user._id;
      const folktaleId = req.params.id;

      // Check if folktale exists
      const folktale = await Folktale.findById(folktaleId).lean();
      if (!folktale) {
        return res.status(404).json({
          message: 'Folktale not found',
          error: 'not_found',
        });
      }

      // Check for existing comment
      const existingComment = await Comment.findOne({ folktaleId, userId });
      if (existingComment) {
        return res.status(400).json({
          message: 'You have already commented on this folktale',
          error: 'already_commented',
        });
      }

      // Create and save comment
      const comment = new Comment({ folktaleId, userId, content });
      await comment.save();

      // Populate user data
      const populatedComment = await Comment.findById(comment._id)
        .populate('userId', 'username')
        .lean();

      res.status(201).json({
        message: 'Comment posted successfully',
        data: populatedComment,
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Invalid comment data',
          error: 'mongoose_validation_error',
          details: Object.values(error.errors).map(err => err.message),
        });
      }
      res.status(500).json({
        message: 'Internal server error while posting comment',
        error: 'server_error',
      });
    }
  }
);

// Get comments
router.get('/:id/comments', async (req, res) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid folktale ID format',
        error: 'invalid_id',
      });
    }

    const comments = await Comment.find({ folktaleId: req.params.id })
      .populate('userId', 'username')
      .lean();

    res.json({
      message: comments.length ? 'Comments retrieved successfully' : 'No comments found',
      data: comments,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      message: 'Internal server error while fetching comments',
      error: 'server_error',
    });
  }
});

// Delete a folktale by ID
router.delete('/:id', auth, async (req, res) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid folktale ID format',
        error: 'invalid_id',
      });
    }

    const folktale = await Folktale.findById(req.params.id);
    if (!folktale) {
      return res.status(404).json({
        message: 'Folktale not found',
        error: 'not_found',
      });
    }

    // Delete folktale and associated data in a transaction
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await Folktale.deleteOne({ _id: req.params.id }, { session });
        await Comment.deleteMany({ folktaleId: req.params.id }, { session });
        await Bookmark.deleteMany({ folktaleId: req.params.id }, { session });
      });
    } catch (error) {
      console.error('Error deleting associated data:', error);
      throw new Error('Failed to delete associated data');
    } finally {
      session.endSession();
    }

    res.json({
      message: 'Folktale and associated data deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    console.error('Error deleting folktale:', error);
    res.status(500).json({
      message: 'Internal server error while deleting folktale',
      error: 'server_error',
    });
  }
});

export default router;
