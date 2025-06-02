import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Pagination({ currentPage, total, limit, setPage }) {
  const navigate = useNavigate();

  // Validate props
  if (!Number.isInteger(currentPage) || currentPage < 1) {
    toast.error('Invalid current page number.');
    return null;
  }
  if (!Number.isInteger(total) || total < 0) {
    toast.error('Invalid total items count.');
    return null;
  }
  if (!Number.isInteger(limit) || limit < 1) {
    toast.error('Invalid items per page limit.');
    return null;
  }

  const totalPages = Math.ceil(total / limit);
  if (totalPages === 0) {
    return null; // No pagination needed for empty results
  }

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
    try {
      if (page < 1 || page > totalPages) {
        toast.warn(`Page ${page} is out of range.`);
        return;
      }

      setPage(page);
      const query = new URLSearchParams(window.location.search);
      query.set('page', page);
      const cleanQuery = new URLSearchParams();
      query.forEach((value, key) => {
        if (key !== 'page' || value === page.toString()) {
          cleanQuery.set(key, value);
        }
      });

      // Validate query string length
      const queryString = cleanQuery.toString();
      if (queryString.length > 2000) {
        toast.error('Query parameters are too long. Please reduce filters.');
        return;
      }

      navigate(`/?${queryString}`);
    } catch (error) {
      console.error('Error changing page:', error);
      toast.error('Failed to navigate to page. Please try again.');
    }
  };

  return (
    <div className="flex justify-center items-center gap-2 my-10 flex-wrap">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme="light"
      />
      <button
        className={`min-w-[100px] h-10 px-4 border border-amber-200 rounded-md bg-white text-amber-900 font-serif text-base flex items-center justify-center transition-all duration-200 ${
          currentPage === 1
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-amber-50 hover:border-amber-400'
        }`}
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
            className={`min-w-[40px] h-10 px-3 border border-amber-200 rounded-md font-serif text-base transition-all duration-200 ${
              currentPage === page
                ? 'bg-amber-900 text-white border-amber-900 font-semibold'
                : 'bg-white text-amber-900 hover:bg-amber-50 hover:border-amber-400'
            }`}
            onClick={() => handlePageChange(page)}
            aria-label={`Page ${page}`}
          >
            {page}
          </button>
        ))}
      </div>
      <button
        className={`min-w-[100px] h-10 px-4 border border-amber-200 rounded-md bg-white text-amber-900 font-serif text-base flex items-center justify-center transition-all duration-200 ${
          currentPage === totalPages
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-amber-50 hover:border-amber-400'
        }`}
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
