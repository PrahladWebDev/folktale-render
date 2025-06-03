
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
    <div className="flex justify-center items-center gap-2 my-10 flex-wrap font-caveat text-gray-800 animate-fadeIn">
      <button
        className={`min-w-[40px] h-10 px-5 rounded-md border-2 border-amber-200 bg-white text-amber-900 text-base cursor-pointer hover:bg-amber-50 hover:border-amber-400 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-amber-200 sm:px-5 max-sm:px-3 max-sm:text-sm`}
        disabled={currentPage === 1}
        onClick={() => handlePageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        « Previous
      </button>

      <div className="flex gap-2">
        {pages.map((page) => (
          <button
            key={page}
            className={`min-w-[40px] h-10 px-3 rounded-md border-2 text-base transition-all duration-200 flex items-center justify-center ${
              currentPage === page
                ? 'bg-amber-900 text-white border-amber-900 font-semibold hover:bg-amber-900'
                : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-50 hover:border-amber-400'
            }`}
            onClick={() => handlePageChange(page)}
            aria-label={`Page ${page}`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        className={`min-w-[40px] h-10 px-5 rounded-md border-2 border-amber-200 bg-white text-amber-900 text-base cursor-pointer hover:bg-amber-50 hover:border-amber-400 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-amber-200 sm:px-5 max-sm:px-3 max-sm:text-sm`}
        disabled={currentPage === totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
        aria-label="Next page"
      >
        Next »
      </button>
    </div>
  );
}

export default Pagination;
