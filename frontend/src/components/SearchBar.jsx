
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SearchBar() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    if (search.trim()) {
      navigate(`/?search=${search.trim()}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex max-w-md w-full mx-auto font-caveat animate-fadeIn">
      <input
        type="text"
        placeholder="Search legends..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyPress={handleKeyPress}
        className="flex-1 p-3 text-lg border-2 border-r-0 border-gray-600 rounded-l-full bg-white text-gray-800 placeholder-gray-400 placeholder:font-semibold placeholder:text-gray-700/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-2 transition-all duration-300"
      />
      <button
        onClick={handleSearch}
        disabled={!search.trim()}
        className="flex items-center gap-2 bg-blue-500 px-5 py-2.5 text-lg font-semibold text-white rounded-r-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-2 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
