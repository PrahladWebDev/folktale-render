import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function SearchBar() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    try {
      const trimmedSearch = search.trim();
      if (!trimmedSearch) {
        toast.warn('Please enter a search term.');
        return;
      }

      // Validate search query length
      if (trimmedSearch.length > 100) {
        toast.error('Search term is too long. Please use up to 100 characters.');
        return;
      }

      const query = new URLSearchParams();
      query.set('search', trimmedSearch);

      // Validate query string length
      const queryString = query.toString();
      if (queryString.length > 2000) {
        toast.error('Query parameters are too long.');
        return;
      }

      navigate(`/?${queryString}`);
      toast.success('Search initiated!');
    } catch (error) {
      console.error('Error during search:', error);
      toast.error('Failed to perform search. Please try again.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex max-w-md w-full mx-auto">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme="light"
      />
      <input
        type="text"
        placeholder="Search folktales..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyPress={handleKeyPress}
        className="flex-1 p-3 text-base border border-amber-200 border-r-0 rounded-l-full font-serif text-gray-800 outline-none transition-all duration-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 placeholder:italic placeholder:text-gray-400"
      />
      <button
        onClick={handleSearch}
        disabled={!search.trim()}
        className={`px-5 rounded-r-full font-semibold text-base flex items-center gap-2 transition-all duration-300 ${
          search.trim()
            ? 'bg-amber-800 text-white hover:bg-amber-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-1"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        Search
      </button>
    </div>
  );
}

export default SearchBar;
