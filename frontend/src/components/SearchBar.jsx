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
    <div style={styles.container}>
      <input
        type="text"
        placeholder="Search folktales..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyPress={handleKeyPress}
        style={styles.input}
      />
      <button 
        onClick={handleSearch}
        style={styles.button}
        disabled={!search.trim()}
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
          style={styles.icon}
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        Search
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    maxWidth: '500px',
    width: '100%',
    margin: '0 auto'
  },
  input: {
    flex: '1',
    padding: '12px 16px',
    fontSize: '1rem',
    border: '1px solid #e0c9a6',
    borderRight: 'none',
    borderTopLeftRadius: '24px',
    borderBottomLeftRadius: '24px',
    fontFamily: "'Merriweather', serif",
    color: '#3a3a3a',
    outline: 'none',
    transition: 'all 0.3s ease',
    ':focus': {
      borderColor: '#d4a017',
      boxShadow: '0 0 0 2px rgba(212, 160, 23, 0.2)'
    },
    '::placeholder': {
      color: '#999',
      fontStyle: 'italic'
    }
  },
  button: {
    backgroundColor: '#5c3c10',
    color: '#fff',
    border: 'none',
    borderTopRightRadius: '24px',
    borderBottomRightRadius: '24px',
    padding: '0 20px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    ':hover': {
      backgroundColor: '#6e4a1f'
    },
    ':disabled': {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    }
  },
  icon: {
    marginRight: '4px'
  }
};

export default SearchBar;