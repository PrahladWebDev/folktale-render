
import { Link } from 'react-router-dom';

function FolktaleCard({ folktale }) {
  const averageRating = folktale.ratings.length
    ? (folktale.ratings.reduce((sum, r) => sum + r.rating, 0) / folktale.ratings.length).toFixed(1)
    : 'No ratings';

  return (
    <Link
      to={`/folktale/${folktale._id}`}
      className="block bg-white rounded-lg overflow-hidden shadow-md border-2 border-amber-200 h-full no-underline text-gray-800 transform hover:scale-105 hover:shadow-lg transition-all duration-300 animate-fadeIn font-caveat"
    >
      <div className="relative pt-[60%] bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center overflow-hidden">
        <img
          src={folktale.imageUrl}
          alt={folktale.title}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full object-contain transition-transform duration-300"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/600x400?text=Folktale+Image';
          }}
        />
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold text-amber-900 mb-3 leading-tight min-h-[3em] animate-pulseSketchy">
          {folktale.title}
        </h3>
        <div className="mb-3">
          <p className="text-sm text-gray-600 m-1">
            <span className="font-bold text-amber-900">Region:</span> {folktale.region}
          </p>
          <p className="text-sm text-gray-600 m-1">
            <span className="font-bold text-amber-900">Genre:</span> {folktale.genre}
          </p>
          <p className="text-sm text-gray-600 m-1">
            <span className="font-bold text-amber-900">Age Group:</span> {folktale.ageGroup}
          </p>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="text-sm text-gray-600">Rating:</span>
          <span className="font-bold text-amber-600">
            {averageRating}
            <span className="ml-1">⭐</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default FolktaleCard;
