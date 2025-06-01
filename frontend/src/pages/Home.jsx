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
  const limit = 10;
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
        const response = await axios.get(`http://localhost:5000/api/folktales?${apiQuery.toString()}`);
        setFolktales(response.data.folktales);
        setTotal(response.data.total);
      } catch (error) {
        console.error('Error fetching folktales:', error);
      }
    };

    const fetchPopular = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/folktales/popular');
        setPopular(response.data);
      } catch (error) {
        console.error('Error fetching popular folktales:', error);
      }
    };

    fetchFolktales();
    fetchPopular();
  }, [location.search]);

  const scrollPopular = (direction) => {
    const container = popularContainerRef.current;
    const scrollAmount = 300;
    if (container) {
      container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="home" style={styles.home}>
      <RandomFolktale />
      <h2 style={styles.sectionTitle}>Popular Folktales</h2>

      <div style={styles.sliderWrapper}>
        <button onClick={() => scrollPopular('left')} style={styles.scrollButton}>&lt;</button>
        <div ref={popularContainerRef} style={styles.horizontalScroll}>
          {popular.map((folktale) => (
            <div style={styles.cardWrapper} key={folktale._id}>
              <FolktaleCard folktale={folktale} />
            </div>
          ))}
        </div>
        <button onClick={() => scrollPopular('right')} style={styles.scrollButton}>&gt;</button>
      </div>

      <h2 style={styles.sectionTitle}>Browse Folktales</h2>
      <FilterBar />
      <div className="folktale-grid" style={styles.folktaleGrid}>
        {folktales.map((folktale) => (
          <FolktaleCard key={folktale._id} folktale={folktale} />
        ))}
      </div>
      <Pagination currentPage={page} total={total} limit={limit} setPage={setPage} />
    </div>
  );
}

const styles = {
  home: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: "'Merriweather', serif",
    backgroundColor: '#f9f5e9',
    color: '#3a3a3a',
    minHeight: '100vh'
  },
  sectionTitle: {
    fontSize: '2rem',
    fontWeight: '600',
    margin: '40px 0 20px',
    color: '#5c3c10',
    borderBottom: '2px solid #e0c9a6',
    paddingBottom: '10px',
    textAlign: 'center',
    fontFamily: "'Playfair Display', serif"
  },
  folktaleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '25px',
    margin: '30px 0'
  },
  sliderWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '40px'
  },
  horizontalScroll: {
    display: 'flex',
    overflowX: 'auto',
    scrollBehavior: 'smooth',
    padding: '10px 0',
    gap: '20px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none'
  },
  cardWrapper: {
    flex: '0 0 auto',
    width: '280px'
  },
  scrollButton: {
    backgroundColor: '#e0c9a6',
    border: 'none',
    color: '#5c3c10',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '10px',
    margin: '0 10px',
    borderRadius: '5px',
    zIndex: 1,
    height: 'fit-content'
  }
};

export default Home;