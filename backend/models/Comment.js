import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  folktaleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folktale', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // Reference to parent comment for replies
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }], // Array of reply comment IDs
});

export default mongoose.model('Comment', commentSchema);
