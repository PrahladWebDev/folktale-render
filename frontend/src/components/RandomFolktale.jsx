import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function RandomFolktale() {
  const [folktale, setFolktale] = useState(null);
  const [nextFolktale, setNextFolktale] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalTime = 2000; // 2 seconds

  const fetchRandomFolktale = async () => {
    try {
      const response = await axios.get(
        "/api/folktales/random"
      );
      return response.data;
    } catch (err) {
      console.error("Failed to fetch folktale:", err);
      throw err;
    }
  };

  useEffect(() => {
    // Initial fetch
    const initFetch = async () => {
      setIsLoading(true);
      try {
        const data = await fetchRandomFolktale();
        setFolktale(data);
        setIsLoading(false);
      } catch (err) {
        console.log(err);

        setError("Unable to load a folktale. Please try again later.");
        setIsLoading(false);
      }
    };

    // Periodic fetch for next folktale
    const fetchNext = async () => {
      try {
        const data = await fetchRandomFolktale();
        setNextFolktale(data);
      } catch (err) {
        console.log(err);

        setError("Unable to load a folktale. Please try again later.");
      }
    };

    initFetch();
    const interval = setInterval(async () => {
      await fetchNext();
    }, intervalTime);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (nextFolktale) {
      // Trigger fade-out and update folktale after a delay to allow transition
      const timer = setTimeout(() => {
        setFolktale(nextFolktale);
        setNextFolktale(null);
        setError(null);
      }, 300); // Matches CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [nextFolktale]);

  return (
    <div className="mx-auto max-w-xl bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-6 m-8 shadow-lg border-2 border-amber-300 font-caveat text-gray-800 transition-opacity duration-300 ease-in-out">
      {isLoading || error || !folktale ? (
        <div className="min-h-[450px] flex items-center justify-center text-gray-600 italic rounded-xl border-2 border-amber-300 bg-amber-50 p-6 shadow-md animate-shake">
          {isLoading && <p className="text-xl">Loading folktale...</p>}
          {error && (
            <p className="text-red-600 text-xl font-semibold">{error}</p>
          )}
          {!isLoading && !error && !folktale && (
            <p className="text-xl">No folktale to display.</p>
          )}
        </div>
      ) : (
        <div className="animate-fadeIn">
          <h3 className="text-2xl sm:text-3xl font-bold text-center text-amber-900 mb-4">
            {folktale.title}
          </h3>
          <div className="flex flex-col items-center">
            <Link
              to={`/folktale/${folktale._id}`}
              className="no-underline text-inherit w-full"
            >
              <div className="w-full max-h-[400px] rounded-lg overflow-hidden shadow-md bg-gray-100 flex justify-center items-center transform hover:scale-105 transition-transform duration-300">
                <img
                  src={folktale.imageUrl}
                  alt={folktale.title}
                  className="w-full h-auto max-h-[400px] object-contain transition-transform duration-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://via.placeholder.com/600x400?text=Folktale+Image";
                  }}
                />
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default RandomFolktale;
