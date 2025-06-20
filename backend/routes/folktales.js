
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
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
dotenv.config();

// Ensure /tmp/chunks directory exists
const ensureChunksDir = async () => {
  try {
    await fs.mkdir('/tmp/chunks', { recursive: true });
  } catch (error) {
    console.error('Error creating /tmp/chunks directory:', error);
  }
};

// Clean up stale chunks older than 1 hour
const cleanupStaleChunks = async () => {
  try {
    const files = await fs.readdir('/tmp/chunks');
    const now = Date.now();
    for (const file of files) {
      const filePath = path.join('/tmp/chunks', file);
      const stats = await fs.stat(filePath);
      if (now - stats.mtimeMs > 60 * 60 * 1000) { // 1 hour
        await fs.unlink(filePath);
      }
    }
  } catch (error) {
    console.error('Error cleaning up stale chunks:', error);
  }
};

// Run directory setup and cleanup on server start
ensureChunksDir();
setInterval(cleanupStaleChunks, 60 * 60 * 1000); // Run hourly

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
    fileSize: 1024 * 1024 * 1024, // 1 GB
  },
});

const chunkStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureChunksDir();
    cb(null, '/tmp/chunks');
  },
  filename: (req, file, cb) => {
    const { fileId, chunkIndex } = req.body;
    cb(null, `${fileId}-${chunkIndex}${path.extname(file.originalname)}`);
  },
});

const chunkUpload = multer({
  storage: chunkStorage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|mp3/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /image\/(jpeg|png)|audio\/(mp3|mpeg)/.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type for chunk'));
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1 GB
  },
});

router.post('/upload-chunk', auth, chunkUpload.single('chunk'), async (req, res) => {
  try {
    const { fileId, chunkIndex, totalChunks } = req.body;
    if (!fileId || !chunkIndex || !totalChunks) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ message: 'fileId, chunkIndex, and totalChunks are required' });
    }
    console.log(`Chunk uploaded: fileId=${fileId}, chunkIndex=${chunkIndex}`);
    res.status(200).json({ message: 'Chunk uploaded', chunkIndex });
  } catch (error) {
    console.error('Error uploading chunk:', error);
    await fs.unlink(req.file.path).catch(() => {});
    res.status(500).json({ message: 'Failed to upload chunk' });
  }
});

router.get('/upload-status/:fileId', auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const chunkFiles = await fs.readdir('/tmp/chunks').catch(() => []);
    const uploadedChunks = chunkFiles
      .filter(file => file.startsWith(fileId))
      .map(file => parseInt(file.split('-')[1]));
    res.json({ uploadedChunks: uploadedChunks.sort((a, b) => a - b) });
  } catch (error) {
    console.error('Error checking upload status:', error);
    res.status(500).json({ message: 'Failed to check upload status' });
  }
});

router.post(
  '/',
  auth,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('region').notEmpty().withMessage('Region is required'),
    body('genre').notEmpty().withMessage('Genre is required'),
    body('ageGroup').notEmpty().withMessage('Age group is required'),
    body('fileIds').notEmpty().withMessage('File IDs are required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, content, region, genre, ageGroup, fileIds } = req.body;
      const parsedFileIds = JSON.parse(fileIds);
      if (!parsedFileIds.image) {
        return res.status(400).json({ message: 'Image fileId is required' });
      }

      const imageChunks = await fs.readdir('/tmp/chunks').catch(() => []);
      const imageChunkFiles = imageChunks
        .filter(file => file.startsWith(parsedFileIds.image))
        .sort((a, b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]));
      if (imageChunkFiles.length === 0) {
        return res.status(400).json({ message: 'No image chunks found' });
      }
      const imagePath = `/tmp/final-${parsedFileIds.image}${path.extname(imageChunkFiles[0])}`;
      const writeStream = (await fs.open(imagePath, 'w')).createWriteStream();
      for (const chunkFile of imageChunkFiles) {
        const chunkPath = path.join('/tmp/chunks', chunkFile);
        const chunkData = await fs.readFile(chunkPath);
        writeStream.write(chunkData);
        await fs.unlink(chunkPath).catch(() => {});
      }
      writeStream.end();

      const imageResult = await cloudinary.uploader.upload(imagePath, {
        folder: 'folktales',
      });
      await fs.unlink(imagePath).catch(() => {});
      console.log('Image uploaded:', imageResult.secure_url);

      let audioUrl = null;
      if (parsedFileIds.audio) {
        const audioChunkFiles = imageChunks
          .filter(file => file.startsWith(parsedFileIds.audio))
          .sort((a, b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]));
        if (audioChunkFiles.length === 0) {
          return res.status(400).json({ message: 'No audio chunks found' });
        }
        const audioPath = `/tmp/final-${parsedFileIds.audio}${path.extname(audioChunkFiles[0])}`;
        const audioWriteStream = (await fs.open(audioPath, 'w')).createWriteStream();
        for (const chunkFile of audioChunkFiles) {
          const chunkPath = path.join('/tmp/chunks', chunkFile);
          const chunkData = await fs.readFile(chunkPath);
          audioWriteStream.write(chunkData);
          await fs.unlink(chunkPath).catch(() => {});
        }
        audioWriteStream.end();

        try {
          const audioResult = await cloudinary.uploader.upload(audioPath, {
            folder: 'folktales_audio',
            resource_type: 'video',
          });
          audioUrl = audioResult.secure_url;
          await fs.unlink(audioPath).catch(() => {});
          console.log('Audio uploaded:', audioUrl);
        } catch (cloudinaryError) {
          console.error('Cloudinary audio upload error:', cloudinaryError);
          await fs.unlink(audioPath).catch(() => {});
          return res.status(500).json({ message: 'Failed to upload audio file' });
        }
      }

      const folktale = new Folktale({
        title,
        content,
        region,
        genre,
        ageGroup,
        imageUrl: imageResult.secure_url,
        audioUrl,
      });

      await folktale.save();
      res.status(201).json(folktale);
    } catch (error) {
      console.error('Error creating folktale:', error);
      res.status(500).json({ message: error.message || 'Server error' });
    }
  }
);

router.put(
  '/:id',
  auth,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('region').notEmpty().withMessage('Region is required'),
    body('genre').notEmpty().withMessage('Genre is required'),
    body('ageGroup').notEmpty().withMessage('Age group is required'),
    body('fileIds').optional().isString().withMessage('File IDs must be a string'),
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

      folktale.title = req.body.title;
      folktale.content = req.body.content;
      folktale.region = req.body.region;
      folktale.genre = req.body.genre;
      folktale.ageGroup = req.body.ageGroup;

      if (req.body.fileIds) {
        const parsedFileIds = JSON.parse(req.body.fileIds);
        if (parsedFileIds.image) {
          const imageChunks = await fs.readdir('/tmp/chunks').catch(() => []);
          const imageChunkFiles = imageChunks
            .filter(file => file.startsWith(parsedFileIds.image))
            .sort((a, b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]));
          if (imageChunkFiles.length === 0) {
            return res.status(400).json({ message: 'No image chunks found' });
          }
          const imagePath = `/tmp/final-${parsedFileIds.image}${path.extname(imageChunkFiles[0])}`;
          const writeStream = (await fs.open(imagePath, 'w')).createWriteStream();
          for (const chunkFile of imageChunkFiles) {
            const chunkPath = path.join('/tmp/chunks', chunkFile);
            const chunkData = await fs.readFile(chunkPath);
            writeStream.write(chunkData);
            await fs.unlink(chunkPath).catch(() => {});
          }
          writeStream.end();

          const imageResult = await cloudinary.uploader.upload(imagePath, {
            folder: 'folktales',
          });
          await fs.unlink(imagePath).catch(() => {});
          folktale.imageUrl = imageResult.secure_url;
          console.log('Image updated:', imageResult.secure_url);
        }

        if (parsedFileIds.audio) {
          const audioChunkFiles = await fs.readdir('/tmp/chunks').catch(() => []);
          const audioChunkFilesFiltered = audioChunkFiles
            .filter(file => file.startsWith(parsedFileIds.audio))
            .sort((a, b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]));
          if (audioChunkFilesFiltered.length === 0) {
            return res.status(400).json({ message: 'No audio chunks found' });
          }
          const audioPath = `/tmp/final-${parsedFileIds.audio}${path.extname(audioChunkFilesFiltered[0])}`;
          const audioWriteStream = (await fs.open(audioPath, 'w')).createWriteStream();
          for (const chunkFile of audioChunkFilesFiltered) {
            const chunkPath = path.join('/tmp/chunks', chunkFile);
            const chunkData = await fs.readFile(chunkPath);
            audioWriteStream.write(chunkData);
            await fs.unlink(chunkPath).catch(() => {});
          }
          audioWriteStream.end();

          try {
            const audioResult = await cloudinary.uploader.upload(audioPath, {
              folder: 'folktales_audio',
              resource_type: 'video',
            });
            folktale.audioUrl = audioResult.secure_url;
            await fs.unlink(audioPath).catch(() => {});
            console.log('Audio updated:', audioResult.secure_url);
          } catch (cloudinaryError) {
            console.error('Cloudinary audio update error:', cloudinaryError);
            await fs.unlink(audioPath).catch(() => {});
            return res.status(500).json({ message: 'Failed to upload audio file' });
          }
        }
      }

      await folktale.save();
      res.json(folktale);
    } catch (error) {
      console.error('Error updating folktale:', error);
      res.status(500).json({ message: error.message || 'Server error' });
    }
  }
);

// Remaining routes (unchanged)
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
    let errorMessage = 'Failed to generate story.';
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timed out. Please try again later.';
    } else if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    }
    res.status(500).json({ message: errorMessage });
  }
});

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
      .populate('folktaleId', 'title region genre imageUrl audioUrl');
    res.status(201).json(populatedBookmark);
  } catch (error) {
    console.error('Error adding bookmark:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

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

router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ folktaleId: req.params.id }).populate('userId', 'username');
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

    await Folktale.deleteOne({ _id: req.params.id });
    res.json({ message: 'Folktale deleted' });
  } catch (error) {
    console.error('Error deleting folktale:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
