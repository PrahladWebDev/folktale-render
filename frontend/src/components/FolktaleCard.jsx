import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function FolktaleCard({ folktale }) {
  // Validate folktale prop
  if (!folktale || !folktale._id) {
    toast.error('Invalid folktale data provided.');
    return null;
  }

  const averageRating = folktale.ratings?.length
    ? (folktale.ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / folktale.ratings.length).toFixed(1)
    : 'No ratings';

  return (
    <Link
      to={`/folktale/${folktale._id}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-gray-800 no-underline h-full"
    >
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme="light"
      />
      <div className="relative pt-[60%] overflow-hidden bg-amber-50 flex items-center justify-center">
        <img
          src={folktale.imageUrl || '/placeholder.jpg'}
          alt={folktale.title || 'Folktale'}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full object-contain transition-transform duration-300"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder.jpg';
            toast.warn(`Failed to load image for "${folktale.title || 'folktale'}". Using placeholder.`);
          }}
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-amber-900 font-serif mb-3 min-h-[3.9em] line-clamp-2">
          {folktale.title || 'Untitled Folktale'}
        </h3>
        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold text-amber-900">Region:</span>{' '}
            {folktale.region || 'Unknown'}
          </p>
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold text-amber-900">Genre:</span>{' '}
            {folktale.genre || 'Unknown'}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-amber-900">Age Group:</span>{' '}
            {folktale.ageGroup || 'Unknown'}
          </p>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="text-sm text-gray-600">Rating:</span>
          <span className="font-semibold text-amber-600">
            {averageRating}
            <span className="ml-1">⭐</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default FolktaleCard;
