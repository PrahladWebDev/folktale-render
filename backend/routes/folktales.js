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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|mp3/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /image\/(jpeg|png)|audio\/(mp3|mpeg)/.test(file.mimetype);
    console.log('File validation:', { 
      name: file.originalname, 
      mimetype: file.mimetype, 
      extname: path.extname(file.originalname).toLowerCase(),
      valid: extname && mimetype 
    });
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Images (jpeg, jpg, png) or audio (mp3, mpeg) only'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
]);

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
    console.error('Error generating story:', error.response?.data || error.message);
    let errorMessage = ' Hawkins';
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timed out. Please try again later.';
    } else if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    }
    res.status(500).json({ message: errorMessage });
  }
});

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
      console.log('Uploaded files:', req.files);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.files || !req.files.image) {
        return res.status(400).json({ message: 'Image is required' });
      }

      const imageFile = req.files.image[0];
      const audioFile = req.files.audio ? req.files.audio[0] : null;

      const imageResult = await cloudinary.uploader.upload(imageFile.path, {
        folder: 'folktales',
      });
      console.log('Image uploaded:', imageResult.secure_url);
      await fs.unlink(imageFile.path);

      let audioUrl = null;
      if (audioFile) {
        try {
          const audioResult = await cloudinary.uploader.upload(audioFile.path, {
            folder: 'folktales_audio',
            resource_type: 'video',
          });
          audioUrl = audioResult.secure_url;
          console.log('Audio uploaded:', audioUrl);
          await fs.unlink(audioFile.path);
        } catch (cloudinaryError) {
          console.error('Cloudinary audio upload error:', cloudinaryError);
          await fs.unlink(audioFile.path);
          return res.status(500).json({ message: 'Failed to upload audio file' });
        }
      }

      const folktale = new Folktale({
        title: req.body.title,
        content: req.body.content,
        region: req.body.region,
        genre: req.body.genre,
        ageGroup: req.body.ageGroup,
        imageUrl: imageResult.secure_url,
        audioUrl,
      });

      await folktale.save();
      res.status(201).json(folktale);
    } catch (error) {
      console.error('Error creating folktale:', error);
      if (req.files?.image?.[0]?.path) await fs.unlink(req.files.image[0].path).catch(() => {});
      if (req.files?.audio?.[0]?.path) await fs.unlink(req.files.audio[0].path).catch(() => {});
      res.status(500).json({ message: error.message || 'Server error' });
    }
  }
);

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

router.get('/popular', async (req, res) => {
  try {
    const folktales = await Folktale.find().sort({ views: -1 }).limit(5);
    res.json(folktales);
  } catch (error) {
    console.error('Error fetching popular folktales:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

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
      .populate('folktaleId', 'title region genre imageUrl audioUrl ageGroup');
    res.status(201).json(populatedBookmark);
  } catch (error) {
    console.error('Error adding bookmark:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/bookmark', auth, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user.id })
      .populate('folktaleId', 'title region genre imageUrl audioUrl ageGroup');
    res.json(bookmarks);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

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
      console.log('Uploaded files for update:', req.files);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        if (req.files?.image?.[0]?.path) await fs.unlink(req.files.image[0].path).catch(() => {});
        if (req.files?.audio?.[0]?.path) await fs.unlink(req.files.audio[0].path).catch(() => {});
        return res.status(400).json({ errors: errors.array() });
      }

      const folktale = await Folktale.findById(req.params.id);
      if (!folktale) {
        if (req.files?.image?.[0]?.path) await fs.unlink(req.files.image[0].path).catch(() => {});
        if (req.files?.audio?.[0]?.path) await fs.unlink(req.files.audio[0].path).catch(() => {});
        return res.status(404).json({ message: 'Folktale not found' });
      }

      folktale.title = req.body.title;
      folktale.content = req.body.content;
      folktale.region = req.body.region;
      folktale.genre = req.body.genre;
      folktale.ageGroup = req.body.ageGroup;

      if (req.files?.image?.[0]) {
        const imageResult = await cloudinary.uploader.upload(req.files.image[0].path, {
          folder: 'folktales',
        });
        console.log('Image updated:', imageResult.secure_url);
        await fs.unlink(req.files.image[0].path);
        folktale.imageUrl = imageResult.secure_url;
      }

      if (req.files?.audio?.[0]) {
        try {
          const audioResult = await cloudinary.uploader.upload(req.files.audio[0].path, {
            folder: 'folktales_audio',
            resource_type: 'video',
          });
          console.log('Audio updated:', audioResult.secure_url);
          await fs.unlink(req.files.audio[0].path);
          folktale.audioUrl = audioResult.secure_url;
        } catch (cloudinaryError) {
          console.error('Cloudinary audio update error:', cloudinaryError);
          await fs.unlink(req.files.audio[0].path);
          return res.status(500).json({ message: 'Failed to upload audio file' });
        }
      }

      await folktale.save();
      res.json(folktale);
    } catch (error) {
      console.error('Error updating folktale:', error);
      if (req.files?.image?.[0]?.path) await fs.unlink(req.files.image[0].path).catch(() => {});
      if (req.files?.audio?.[0]?.path) await fs.unlink(req.files.audio[0].path).catch(() => {});
      res.status(500).json({ message: error.message || 'Server error' });
    }
  }
);

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

router.post(
  '/:id/comments',
  auth,
  [
    body('content')
      .notEmpty()
      .withMessage('Comment content is required'),
    body('parentId')
      .optional()
      .isMongoId()
      .withMessage('Invalid parent comment ID'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { content, parentId } = req.body;
      const userId = req.user.id;
      const folktaleId = req.params.id;

      const folktale = await Folktale.findById(folktaleId);
      if (!folktale) {
        return res.status(404).json({ message: 'Folktale not found' });
      }

      if (parentId) {
        const parentComment = await Comment.findById(parentId);
        if (!parentComment) {
          return res.status(404).json({ message: 'Parent comment not found' });
        }
        // Prevent deep nesting (e.g., limit to one level of replies)
        if (parentComment.parentId) {
          return res.status(400).json({ message: 'Replies to replies are not allowed' });
        }
      }

      // Check for existing comment by user on this folktale (optional, removed to allow multiple comments)
      // const existingComment = await Comment.findOne({ folktaleId, userId, parentId: parentId || null });
      // if (existingComment) {
      //   return res.status(400).json({ message: 'You have already commented on this folktale' });
      // }

      const comment = new Comment({
        folktaleId,
        userId,
        content,
        parentId: parentId || null,
      });
      await comment.save();

      if (parentId) {
        await Comment.findByIdAndUpdate(parentId, {
          $push: { replies: comment._id },
        });
      }

      const populatedComment = await Comment.findById(comment._id)
        .populate('userId', 'username')
        .populate({
          path: 'replies',
          populate: { path: 'userId', select: 'username' },
        });
      res.status(201).json(populatedComment);
    } catch (error) {
      console.error('Error posting comment:', error);
      res.status(500).json({ message: error.message || 'Server error' });
    }
  }
);

router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ 
      folktaleId: req.params.id, 
      parentId: null 
    })
      .populate('userId', 'username')
      .populate({
        path: 'replies',
        populate: { path: 'userId', select: 'username' },
      });
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const folktale = await Folktale.findById(req.params.id);
    if (!folktale) {
      return res.status(404).json({ message: 'Folktale not found' });
    }

    // Delete associated comments and their replies
    await Comment.deleteMany({ 
      $or: [
        { folktaleId: req.params.id },
        { parentId: { $in: await Comment.find({ folktaleId: req.params.id }).distinct('_id') } },
      ],
    });

    await Folktale.deleteOne({ _id: req.params.id });
    res.json({ message: 'Folktale and associated comments deleted' });
  } catch (error) {
    console.error('Error deleting folktale:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
