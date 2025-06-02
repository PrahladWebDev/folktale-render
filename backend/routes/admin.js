import express from 'express';
import Folktale from '../models/Folktale.js';
import Comment from '../models/Comment.js';
import { adminAuth } from '../middleware/auth.js';
import sanitizeHtml from 'sanitize-html';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';

const router = express.Router();

// Validation middleware for folktale creation/update
const folktaleValidation = [
  body('title').notEmpty().withMessage('Title is required').trim().isLength({ max: 100 }).withMessage('Title must be 100 characters or less'),
  body('content').notEmpty().withMessage('Content is required').trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
  body('region').notEmpty().withMessage('Region is required').trim().isLength({ max: 50 }).withMessage('Region must be 50 characters or less'),
  body('genre').notEmpty().withMessage('Genre is required').trim().isLength({ max: 50 }).withMessage('Genre must be 50 characters or less'),
  body('ageGroup').notEmpty().withMessage('Age Group is required').trim().isLength({ max: 50 }).withMessage('Age Group must be 50 characters or less'),
  body('imageUrl').notEmpty().isURL({ protocols: ['https'], require_protocol: true }).withMessage('Valid HTTPS Image URL is required'),
];

// Create folktale
router.post(
  '/folktales',
  adminAuth,
  folktaleValidation,
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation failed',
          error: 'validation_error',
          details: errors.array()
        });
      }

      // Sanitize the content field to prevent XSS
      const sanitizedContent = sanitizeHtml(req.body.content, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'img']),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          img: ['src', 'alt'],
        },
      });

      if (!sanitizedContent || sanitizedContent === req.body.content) {
        return res.status(400).json({ 
          message: 'Content sanitization failed or produced no output',
          error: 'sanitization_error'
        });
      }

      const folktaleData = {
        ...req.body,
        content: sanitizedContent,
        createdBy: req.user._id, // Track the admin who created it
      };

      const folktale = new Folktale(folktaleData);
      await folktale.save();
      res.status(201).json({
        message: 'Folktale created successfully',
        data: folktale
      });
    } catch (error) {
      console.error('Error creating folktale:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          message: 'Invalid folktale data',
          error: 'mongoose_validation_error',
          details: Object.values(error.errors).map(err => err.message)
        });
      }
      res.status(500).json({ 
        message: 'Internal server error while creating folktale',
        error: 'server_error'
      });
    }
  }
);

// Update folktale
router.put(
  '/folktales/:id',
  adminAuth,
  folktaleValidation,
  async (req, res) => {
    try {
      // Validate MongoDB ObjectId
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ 
          message: 'Invalid folktale ID format',
          error: 'invalid_id'
        });
      }

      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation failed',
          error: 'validation_error',
          details: errors.array()
        });
      }

      // Sanitize the content field
      const sanitizedContent = sanitizeHtml(req.body.content, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'img']),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          img: ['src', 'alt'],
        },
      });

      if (!sanitizedContent || sanitizedContent === req.body.content) {
        return res.status(400).json({ 
          message: 'Content sanitization failed or produced no output',
          error: 'sanitization_error'
        });
      }

      const folktaleData = {
        ...req.body,
        content: sanitizedContent,
        updatedBy: req.user._id, // Track the admin who updated it
        updatedAt: Date.now(),
      };

      const folktale = await Folktale.findByIdAndUpdate(
        req.params.id,
        { $set: folktaleData },
        { new: true, runValidators: true }
      );

      if (!folktale) {
        return res.status(404).json({ 
          message: 'Folktale not found',
          error: 'not_found'
        });
      }

      res.json({
        message: 'Folktale updated successfully',
        data: folktale
      });
    } catch (error) {
      console.error('Error updating folktale:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          message: 'Invalid folktale data',
          error: 'mongoose_validation_error',
          details: Object.values(error.errors).map(err => err.message)
        });
      }
      res.status(500).json({ 
        message: 'Internal server error while updating folktale',
        error: 'server_error'
      });
    }
  }
);

// Delete folktale
router.delete('/folktales/:id', adminAuth, async (req, res) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ 
        message: 'Invalid folktale ID format',
        error: 'invalid_id'
      });
    }

    const folktale = await Folktale.findByIdAndDelete(req.params.id);
    if (!folktale) {
      return res.status(404).json({ 
        message: 'Folktale not found',
        error: 'not_found'
      });
    }

    // Delete associated comments in a transaction to ensure data consistency
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await Comment.deleteMany({ folktaleId: req.params.id }, { session });
      });
    } catch (error) {
      console.error('Error deleting associated comments:', error);
      throw new Error('Failed to delete associated comments');
    } finally {
      session.endSession();
    }

    res.json({ 
      message: 'Folktale and associated comments deleted successfully',
      data: { id: req.params.id }
    });
  } catch (error) {
    console.error('Error deleting folktale:', error);
    res.status(500).json({ 
      message: 'Internal server error while deleting folktale',
      error: 'server_error'
    });
  }
});

// View all folktales with comments and ratings
router.get('/folktales', adminAuth, async (req, res) => {
  try {
    const folktales = await Folktale.find().lean();
    if (!folktales.length) {
      return res.status(200).json({ 
        message: 'No folktales found',
        data: []
      });
    }

    const folktalesWithDetails = await Promise.all(
      folktales.map(async (folktale) => {
        const comments = await Comment.find({ folktaleId: folktale._id })
          .populate('userId', 'username')
          .lean()
          .catch(err => {
            console.error(`Error fetching comments for folktale ${folktale._id}:`, err);
            return [];
          });

        return {
          ...folktale,
          comments,
          averageRating: folktale.ratings?.length
            ? (folktale.ratings.reduce((sum, r) => sum + r.rating, 0) / folktale.ratings.length).toFixed(1)
            : 'No ratings',
        };
      })
    );

    res.json({
      message: 'Folktales retrieved successfully',
      data: folktalesWithDetails
    });
  } catch (error) {
    console.error('Error fetching folktales:', error);
    res.status(500).json({ 
      message: 'Internal server error while fetching folktales',
      error: 'server_error'
    });
  }
});

export default router;
