import express from 'express';
import Folktale from '../models/Folktale.js';
import Comment from '../models/Comment.js';
import { adminAuth } from '../middleware/auth.js';
import sanitizeHtml from 'sanitize-html';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Validation middleware for folktale creation/update
const folktaleValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('region').notEmpty().withMessage('Region is required'),
  body('genre').notEmpty().withMessage('Genre is required'),
  body('ageGroup').notEmpty().withMessage('Age Group is required'),
  body('imageUrl').notEmpty().isURL().withMessage('Valid Image URL is required'),
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
        return res.status(400).json({ errors: errors.array() });
      }

      // Sanitize the content field to prevent XSS
      const sanitizedContent = sanitizeHtml(req.body.content, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'img']),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          img: ['src', 'alt'],
        },
      });

      const folktaleData = {
        ...req.body,
        content: sanitizedContent,
      };

      const folktale = new Folktale(folktaleData);
      await folktale.save();
      res.status(201).json(folktale);
    } catch (error) {
      console.error('Error creating folktale:', error);
      res.status(500).json({ message: 'Server error' });
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
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Sanitize the content field
      const sanitizedContent = sanitizeHtml(req.body.content, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'img']),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          img: ['src', 'alt'],
        },
      });

      const folktaleData = {
        ...req.body,
        content: sanitizedContent,
      };

      const folktale = await Folktale.findByIdAndUpdate(
        req.params.id,
        folktaleData,
        { new: true }
      );
      if (!folktale) {
        return res.status(404).json({ message: 'Folktale not found' });
      }
      res.json(folktale);
    } catch (error) {
      console.error('Error updating folktale:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete folktale
router.delete('/folktales/:id', adminAuth, async (req, res) => {
  try {
    const folktale = await Folktale.findByIdAndDelete(req.params.id);
    if (!folktale) {
      return res.status(404).json({ message: 'Folktale not found' });
    }
    await Comment.deleteMany({ folktaleId: req.params.id }); // Delete associated comments
    res.json({ message: 'Folktale deleted' });
  } catch (error) {
    console.error('Error deleting folktale:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// View all folktales with comments and ratings
router.get('/folktales', adminAuth, async (req, res) => {
  try {
    const folktales = await Folktale.find();
    const folktalesWithDetails = await Promise.all(
      folktales.map(async (folktale) => {
        const comments = await Comment.find({ folktaleId: folktale._id }).populate('userId', 'username');
        return {
          ...folktale._doc,
          comments,
          averageRating: folktale.ratings.length
            ? (folktale.ratings.reduce((sum, r) => sum + r.rating, 0) / folktale.ratings.length).toFixed(1)
            : 'No ratings',
        };
      })
    );
    res.json(folktalesWithDetails);
  } catch (error) {
    console.error('Error fetching folktales:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;