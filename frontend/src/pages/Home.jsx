import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import FolktaleCard from '../components/FolktaleCard';
import FilterBar from '../components/FilterBar';
import RandomFolktale from '../components/RandomFolktale';
import Pagination from '../components/Pagination';

function Home() {
  const [folktales, setFolktales] = useState([]);
  const [popular, setPopular] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [errorFolktales, setErrorFolktales] = useState(null);
  const [errorPopular, setErrorPopular] = useState(null);
  const limit = 12;
  const location = useLocation();

  const popularContainerRef = useRef(null);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const pageFromQuery = parseInt(query.get('page')) || 1;
    setPage(pageFromQuery);

    const fetchFolktales = async () => {
      const apiQuery = new URLSearchParams();
      apiQuery.set('page', pageFromQuery);
      apiQuery.set('limit', limit);

      query.forEach((value, key) => {
        if (key !== 'page' && key !== 'limit') {
          apiQuery.set(key, value);
        }
      });

      try {
        const response = await axios.get(`/api/folktales?${apiQuery.toString()}`);

        const { folktales, total } = response.data;
        if (!Array.isArray(folktales) || typeof total !== 'number') {
          throw new Error('Invalid legend data structure.');
        }

        setFolktales(folktales);
        setTotal(total);
        setErrorFolktales(null);
      } catch (error) {
        console.error('Error fetching folktales:', error);
        if (error.response?.status === 500) {
          setErrorFolktales('Server error. Please try again later.');
        } else {
          setErrorFolktales('Unable to load legends. Please try again later.');
        }
      }
    };

    const fetchPopular = async () => {
      try {
        const response = await axios.get('/api/folktales/popular');

        if (!Array.isArray(response.data)) {
          throw new Error('Invalid popular legends format.');
        }

        setPopular(response.data);
        setErrorPopular(null);
      } catch (error) {
        console.error('Error fetching popular legends:', error);
        setErrorPopular('Unable to load popular legends.');
      }
    };

    fetchFolktales();
    fetchPopular();
  }, [location.search]);

  const scrollPopular = (direction) => {
    const container = popularContainerRef.current;
    const scrollAmount = 300;
    if (container) {
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="home mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 font-caveat text-gray-800 animate-fadeIn">
      <RandomFolktale />

      <h2 className="text-4xl sm:text-5xl font-bold mb-8 text-center text-amber-900 border-b-4 border-amber-300 pb-4 animate-pulseSketchy">Popular Legends</h2>
      {errorPopular ? (
        <p className="text-red-600 text-center text-xl font-semibold my-8 animate-shake"> {errorPopular}</p>
      ) : popular.length === 0 ? (
        <p className="text-red-600 text-center text-xl font-semibold my-8 animate-shake">No popular legends found.</p>
      ) : (
        <div className="relative flex items-center mb-12">
          <button
            onClick={() => scrollPopular('left')}
            className="bg-amber-300 text-amber-900 font-bold text-2xl px-4 py-2 rounded-full mr-4 hover:bg-amber-400 transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-lg z-10 animate-bounce"
          >
            &lt;
          </button>
          <div
            ref={popularContainerRef}
            className="flex overflow-x-auto space-x-6 p-4 scrollbar-hide snap-x snap-mandatory"
          >
            {popular.map((folktale) => (
              <div key={folktale._id} className="flex-shrink-0 w-72 transform hover:scale-105 transition-transform duration-300">
                <FolktaleCard folktale={folktale} />
              </div>
            ))}
          </div>
          <button
            onClick={() => scrollPopular('right')}
            className="bg-amber-300 text-amber-900 font-bold text-2xl px-4 py-2 rounded-full ml-4 hover:bg-amber-400 transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-lg z-10 animate-bounce"
          >
            &gt;
          </button>
        </div>
      )}

      <h2 className="text-4xl sm:text-5xl font-bold mb-8 text-center text-amber-900 border-b-4 border-amber-300 pb-4 animate-pulseSketchy">Browse Legends</h2>
      <FilterBar />

      {errorFolktales ? (
        <p className="text-red-600 text-center text-xl font-semibold my-8 animate-shake">{errorFolktales}</p>
      ) : folktales.length === 0 ? (
        <p className="text-red-600 text-center text-xl font-semibold my-8 animate-shake">No legends match your filters.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 my-12">
            {folktales.map((folktale) => (
              <div key={folktale._id} className="transform hover:scale-105 transition-transform duration-300">
                <FolktaleCard folktale={folktale} />
              </div>
            ))}
          </div>
          <Pagination currentPage={page} total={total} limit={limit} setPage={setPage} />
        </>
      )}
    </div>
  );
}

export default Home;
