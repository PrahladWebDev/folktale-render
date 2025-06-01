import mongoose from 'mongoose';

const folktaleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  region: { type: String, required: true },
  genre: { type: String, required: true },
  ageGroup: { type: String, required: true },
  imageUrl: { type: String, required: true },
  views: { type: Number, default: 0 },
  ratings: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 }
  }],
});

export default mongoose.model('Folktale', folktaleSchema);