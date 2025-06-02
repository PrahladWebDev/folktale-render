import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function FilterBar() {
  const [region, setRegion] = useState('');
  const [genre, setGenre] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const newRegion = query.get('region') || '';
    const newGenre = query.get('genre') || '';
    const newAgeGroup = query.get('ageGroup') || '';

    // Validate query parameters to prevent invalid values
    const validRegions = [
      'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina',
      'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados',
      'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana',
      'Brazil', 'Brunei Darussalam', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
      'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
      'Congo (Congo-Brazzaville)', 'Congo (Democratic Republic of the)', 'Costa Rica', 'Croatia', 'Cuba',
      'Cyprus', 'Czech Republic (Czechia)', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
      'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini (fmr. "Swaziland")',
      'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece',
      'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland',
      'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan',
      'Kazakhstan', 'Kenya', 'Kiribati', 'Korea (North)', 'Korea (South)', 'Kuwait', 'Kyrgyzstan', 'Laos',
      'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
      'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania',
      'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco',
      'Mozambique', 'Myanmar (formerly Burma)', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand',
      'Nicaragua', 'Niger'
    ];
    const validGenres = [
      'Fable', 'Myth', 'Legend', 'Fairy Tale', 'Horror', 'Fantasy', 'Adventure', 'Mystery', 'Historical',
      'Ghost Story', 'Supernatural', 'Tragedy', 'Moral Tale', 'Urban Legend', 'Comedy', 'Parable', 'Epic', 'Romance'
    ];
    const validAgeGroups = ['Kids', 'Teens', 'Adults'];

    if (newRegion && !validRegions.includes(newRegion)) {
      toast.warn('Invalid region selected. Resetting to default.');
      setRegion('');
    } else {
      setRegion(newRegion);
    }

    if (newGenre && !validGenres.includes(newGenre)) {
      toast.warn('Invalid genre selected. Resetting to default.');
      setGenre('');
    } else {
      setGenre(newGenre);
    }

    if (newAgeGroup && !validAgeGroups.includes(newAgeGroup)) {
      toast.warn('Invalid age group selected. Resetting to default.');
      setAgeGroup('');
    } else {
      setAgeGroup(newAgeGroup);
    }
  }, [location.search]);

  const handleFilter = () => {
    try {
      const query = new URLSearchParams();
      if (region) query.set('region', region);
      if (genre) query.set('genre', genre);
      if (ageGroup) query.set('ageGroup', ageGroup);

      // Validate query string length to prevent overly long URLs
      const queryString = query.toString();
      if (queryString.length > 2000) {
        toast.error('Filter selection is too long. Please select fewer options.');
        return;
      }

      navigate(`/?${queryString}`);
      toast.success('Filters applied successfully!');
    } catch (error) {
      console.error('Error applying filters:', error);
      toast.error('Failed to apply filters. Please try again.');
    }
  };

  const handleReset = () => {
    try {
      setRegion('');
      setGenre('');
      setAgeGroup('');
      navigate('/');
      toast.info('Filters reset successfully.');
    } catch (error) {
      console.error('Error resetting filters:', error);
      toast.error('Failed to reset filters. Please try again.');
    }
  };

  return (
    <div className="flex flex-wrap gap-4 p-5 bg-amber-50 rounded-lg shadow-md border border-amber-200 my-5">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme="light"
      />
      <div className="flex flex-1 min-w-[200px] items-center gap-2 max-md:flex-col max-md:items-start">
        <label className="font-semibold text-amber-900 text-sm min-w-[80px]">
          Region:
        </label>
        <select
          onChange={(e) => setRegion(e.target.value)}
          value={region}
          className="flex-1 p-2 rounded-md border border-amber-200 bg-white font-serif text-sm text-gray-800 cursor-pointer min-w-[150px] focus:outline-none focus:ring-2 focus:ring-amber-500 max-md:w-full"
        >
          <option value="">All Regions</option>
          {[
            'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina',
            'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados',
            'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana',
            'Brazil', 'Brunei Darussalam', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
            'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
            'Congo (Congo-Brazzaville)', 'Congo (Democratic Republic of the)', 'Costa Rica', 'Croatia', 'Cuba',
            'Cyprus', 'Czech Republic (Czechia)', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
            'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini (fmr. "Swaziland")',
            'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece',
            'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland',
            'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan',
            'Kazakhstan', 'Kenya', 'Kiribati', 'Korea (North)', 'Korea (South)', 'Kuwait', 'Kyrgyzstan', 'Laos',
            'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
            'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania',
            'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco',
            'Mozambique', 'Myanmar (formerly Burma)', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand',
            'Nicaragua', 'Niger'
          ].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-1 min-w-[200px] items-center gap-2 max-md:flex-col max-md:items-start">
        <label className="font-semibold text-amber-900 text-sm min-w-[80px]">
          Genre:
        </label>
        <select
          onChange={(e) => setGenre(e.target.value)}
          value={genre}
          className="flex-1 p-2 rounded-md border border-amber-200 bg-white font-serif text-sm text-gray-800 cursor-pointer min-w-[150px] focus:outline-none focus:ring-2 focus:ring-amber-500 max-md:w-full"
        >
          <option value="">All Genres</option>
          {[
            'Fable', 'Myth', 'Legend', 'Fairy Tale', 'Horror', 'Fantasy', 'Adventure', 'Mystery', 'Historical',
            'Ghost Story', 'Supernatural', 'Tragedy', 'Moral Tale', 'Urban Legend', 'Comedy', 'Parable', 'Epic', 'Romance'
          ].map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-1 min-w-[200px] items-center gap-2 max-md:flex-col max-md:items-start">
        <label className="font-semibold text-amber-900 text-sm min-w-[80px]">
          Age Group:
        </label>
        <select
          onChange={(e) => setAgeGroup(e.target.value)}
          value={ageGroup}
          className="flex-1 p-2 rounded-md border border-amber-200 bg-white font-serif text-sm text-gray-800 cursor-pointer min-w-[150px] focus:outline-none focus:ring-2 focus:ring-amber-500 max-md:w-full"
        >
          <option value="">All Ages</option>
          <option value="Kids">Kids</option>
          <option value="Teens">Teens</option>
          <option value="Adults">Adults</option>
        </select>
      </div>
      <div className="flex gap-2 max-md:w-full max-md:mt-2">
        <button
          onClick={handleFilter}
          className="bg-amber-900 text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-amber-800 transition-all duration-300 max-md:flex-1"
        >
          Apply Filters
        </button>
        <button
          onClick={handleReset}
          className="bg-transparent border border-amber-900 text-amber-900 px-4 py-2 rounded-md font-semibold text-sm hover:bg-amber-100 transition-all duration-300 max-md:flex-1"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default FilterBar;
