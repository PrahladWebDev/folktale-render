import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function RandomFolktale() {
  const [folktale, setFolktale] = useState(null);
  const intervalTime = 2000; // 2 seconds

  const fetchRandomFolktale = async () => {
    try {
      const response = await axios.get('/api/folktales/random');
      const data = response.data.data;
      if (!data || !data?._id) {
        throw new Error('Invalid folktale data received');
      }
      setFolktale(data);
      toast.success('New random folktale loaded!');
    } catch (error) {
      console.error('Failed to fetch folktale:', error);
      const errorMessage = handleError(error);
      toast.error(errorMessage);
      setFolktale(null); // Clear folktale on error to show loading state
    }
  };

  const handleError = (error) => {
    const errorData = error.response?.data;
    const errorCode = errorData?.error;
    const message = errorData?.message || error.message || 'An unexpected error occurred';

    switch (errorCode) {
      case 'not_found':
        return 'No folktales available at the moment.';
      case 'server_error':
        return 'Failed to load a random folktale due to a server error.';
      default:
        return errorMessage;
    }
  };

  useEffect(() => {
    fetchRandomFolktale(); // Initial fetch
    const interval = setInterval(fetchRandomFolktale, intervalTime);
    return () => clearInterval(interval);
  }, []); // Empty dependency array for stable interval

  return (
    <div className="mx-auto max-w-md bg-white rounded-xl p-6 my-8 shadow-sm border border-amber-100 text-center">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme="light"
      />
      {!folktale ? (
        <p className="text-gray-600">Loading folktale...</p>
      ) : (
        <>
            <h3 className="text-xl font-serif text-gray-900 mb-4"> {folktale.title || 'Untitled Folktale'}</h3>
            <div className="flex-col items-center>
              <Link to={`/folktale/${folktale._id}`} className="block w-full">
                <div className="w-full max-h-[400px] overflow-hidden rounded-lg mb-4 shadow-md flex justify-center items-center bg-gray-100">
                  <img
                    src={folktale.imageUrl || '/placeholder.jpg'}
                    alt={folktale.title || 'Folktale'}
                    className="w-full h-full object-contain max-h-[400px] transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder.jpg';
                      toast.warn('Failed to load folktale image. Using placeholder.');
                    }}
                  />
                </div>
              </Link>
              {/* Optional refresh button */}
              {/* <button
                onClick={fetchRandomFolktale}
                className="mt-4 px-6 py-2 bg-amber-800 text-amber-50 rounded-md font-semibold flex items-center gap-2 mx-auto hover:bg-amber-700 transition-all duration-300"
              >
                <span className="text-lg">⟳</span> Discover Another Tale
              </button> */}
            </div>
          </>
      )}
    </div>
  );
}

export default RandomFolktale;
