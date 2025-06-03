
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function FilterBar() {
  const [region, setRegion] = useState('');
  const [genre, setGenre] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    setRegion(query.get('region') || '');
    setGenre(query.get('genre') || '');
    setAgeGroup(query.get('ageGroup') || '');
  }, [location.search]);

  const handleFilter = () => {
    const query = new URLSearchParams();
    if (region) query.set('region', region);
    if (genre) query.set('genre', genre);
    if (ageGroup) query.set('ageGroup', ageGroup);
    navigate(`/?${query.toString()}`);
  };

  const handleReset = () => {
    setRegion('');
    setGenre('');
    setAgeGroup('');
    navigate('/');
  };

  return (
    <div className="flex flex-wrap gap-4 p-5 bg-gradient-to-br from-amber-50 to-orange-100 rounded-lg shadow-lg border-2 border-amber-300 my-5 font-caveat text-gray-800 animate-fadeIn md:items-center">
      <div className="flex items-center gap-2 flex-1 min-w-[200px] md:flex-row flex-col">
        <label className="font-bold text-amber-900 text-lg min-w-[80px]">
          Region:
        </label>
        <select
          onChange={(e) => setRegion(e.target.value)}
          value={region}
          className="flex-1 p-2 rounded-md border-2 border-amber-200 bg-white text-gray-800 text-lg cursor-pointer focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-300 min-w-[150px] md:w-auto w-full"
        >
          <option value="">All Regions</option>
          <option value="Afghanistan">Afghanistan</option>
          <option value="Albania">Albania</option>
          <option value="Algeria">Algeria</option>
          {/* Add remaining regions from your original code here */}
        </select>
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-[200px] md:flex-row flex-col">
        <label className="font-bold text-amber-900 text-lg min-w-[80px]">
          Genre:
        </label>
        <select
          onChange={(e) => setGenre(e.target.value)}
          value={genre}
          className="flex-1 p-2 rounded-md border-2 border-amber-200 bg-white text-gray-800 text-lg cursor-pointer focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-300 min-w-[150px] md:w-auto w-full"
        >
          <option value="">All Genres</option>
          <option value="Fable">Fable</option>
          <option value="Myth">Myth</option>
          <option value="Legend">Legend</option>
          <option value="Fairy Tale">Fairy Tale</option>
          <option value="Horror">Horror</option>
          <option value="Fantasy">Fantasy</option>
          <option value="Adventure">Adventure</option>
          <option value="Mystery">Mystery</option>
          <option value="Historical">Historical</option>
          <option value="Ghost Story">Ghost Story</option>
          <option value="Supernatural">Supernatural</option>
          <option value="Tragedy">Tragedy</option>
          <option value="Moral Tale">Moral Tale</option>
          <option value="Urban Legend">Urban Legend</option>
          <option value="Comedy">Comedy</option>
          <option value="Parable">Parable</option>
          <option value="Epic">Epic</option>
          <option value="Romance">Romance</option>
        </select>
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-[200px] md:flex-row flex-col">
        <label className="font-bold text-amber-900 text-lg min-w-[80px]">
          Age Group:
        </label>
        <select
          onChange={(e) => setAgeGroup(e.target.value)}
          value={ageGroup}
          className="flex-1 p-2 rounded-md border-2 border-amber-200 bg-white text-gray-800 text-lg cursor-pointer focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-300 min-w-[150px] md:w-auto w-full"
        >
          <option value="">All Ages</option>
          <option value="Kids">Kids</option>
          <option value="Teens">Teens</option>
          <option value="Adults">Adults</option>
        </select>
      </div>

      <div className="flex gap-2 md:w-auto w-full mt-2 md:mt-0">
        <button
          onClick={handleFilter}
          className="flex-1 bg-amber-900 text-white rounded-md px-5 py-2 text-lg font-bold hover:bg-amber-800 hover:shadow-lg transform hover:scale-105 transition-all duration-300"
        >
          Apply Filters
        </button>
        <button
          onClick={handleReset}
          className="flex-1 bg-transparent text-amber-900 border-2 border-amber-900 rounded-md px-5 py-2 text-lg font-bold hover:bg-amber-100 hover:shadow-sm transition-all duration-300"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default FilterBar;
