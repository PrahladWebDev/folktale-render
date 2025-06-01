import { useNavigate } from 'react-router-dom';

function Pagination({ currentPage, total, limit, setPage }) {
  const navigate = useNavigate();
  const totalPages = Math.ceil(total / limit);

  const maxButtons = 5;
  const halfRange = Math.floor(maxButtons / 2);
  let startPage = Math.max(1, currentPage - halfRange);
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage === totalPages) {
    startPage = Math.max(1, totalPages - maxButtons + 1);
  }

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const handlePageChange = (page) => {
    setPage(page);
    const query = new URLSearchParams(window.location.search);
    query.set('page', page);
    const cleanQuery = new URLSearchParams();
    query.forEach((value, key) => {
      if (key !== 'page' || value === page.toString()) {
        cleanQuery.set(key, value);
      }
    });
    navigate(`/?${cleanQuery.toString()}`);
  };

  return (
    <div style={styles.container}>
      <button
        style={{
          ...styles.button,
          ...styles.navButton,
          ...(currentPage === 1 && styles.disabledButton)
        }}
        disabled={currentPage === 1}
        onClick={() => handlePageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        « Previous
      </button>

      <div style={styles.pageNumbers}>
        {pages.map((page) => (
          <button
            key={page}
            style={{
              ...styles.button,
              ...(currentPage === page && styles.activeButton)
            }}
            onClick={() => handlePageChange(page)}
            aria-label={`Page ${page}`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        style={{
          ...styles.button,
          ...styles.navButton,
          ...(currentPage === totalPages && styles.disabledButton)
        }}
        disabled={currentPage === totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
        aria-label="Next page"
      >
        Next »
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    margin: '40px 0',
    flexWrap: 'wrap'
  },
  pageNumbers: {
    display: 'flex',
    gap: '8px'
  },
  button: {
    minWidth: '40px',
    height: '40px',
    padding: '0 12px',
    border: '1px solid #e0c9a6',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#5c3c10',
    fontFamily: "'Merriweather', serif",
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {
      backgroundColor: '#f9f5e9',
      borderColor: '#d4a017'
    }
  },
  activeButton: {
    backgroundColor: '#5c3c10',
    color: '#fff',
    borderColor: '#5c3c10',
    fontWeight: '600',
    ':hover': {
      backgroundColor: '#5c3c10'
    }
  },
  navButton: {
    padding: '0 20px',
    '@media (max-width: 480px)': {
      padding: '0 12px',
      fontSize: '0.9rem'
    }
  },
  disabledButton: {
    opacity: '0.5',
    cursor: 'not-allowed',
    ':hover': {
      backgroundColor: '#fff',
      borderColor: '#e0c9a6'
    }
  }
};

export default Pagination;