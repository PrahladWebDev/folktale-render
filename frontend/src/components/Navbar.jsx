
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SearchBar from "./SearchBar";
import { FaBookmark } from "react-icons/fa";

function Navbar() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const checkAdmin = async () => {
      if (token) {
        try {
          const response = await axios.get("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsAdmin(response.data.isAdmin);
        } catch (error) {
          console.error("Error checking admin:", error);
        }
      }
    };
    checkAdmin();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="bg-gradient-to-r from-amber-50 to-orange-100 shadow-md p-3 sticky top-0 z-[1000] font-caveat text-gray-800 animate-fadeIn">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <h1
          className="text-2xl sm:text-3xl font-bold text-amber-900 cursor-pointer hover:text-amber-700 transition-colors duration-200"
          onClick={() => navigate("/")}
        >
          Folktale Haven
        </h1>

        <div className="flex-1 max-w-md mx-4 w-full md:w-auto">
          <SearchBar />
        </div>

        <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 hover:shadow-lg transform hover:scale-105 transition-all duration-200 w-full md:w-auto"
            onClick={() => navigate("/map")}
          >
            <span>🌍</span> Map
          </button>

          <button
            className="flex items-center justify-center px-4 py-2 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 hover:shadow-lg transform hover:scale-105 transition-all duration-200 w-full md:w-auto"
            onClick={() => navigate("/bookmarks")}
            title="Bookmarks"
          >
            <FaBookmark />
          </button>

          {token ? (
            <>
              {isAdmin && (
                <button
                  className="px-4 py-2 rounded-md bg-amber-200 text-amber-900 font-semibold hover:bg-amber-300 hover:shadow-lg transform hover:scale-105 transition-all duration-200 w-full md:w-auto"
                  onClick={() => navigate("/admin")}
                >
                  Admin Panel
                </button>
              )}
              <button
                className="px-4 py-2 rounded-md bg-amber-200 text-amber-900 font-semibold hover:bg-amber-300 hover:shadow-lg transform hover:scale-105 transition-all duration-200 w-full md:w-auto"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="px-4 py-2 rounded-md bg-amber-200 text-amber-900 font-semibold hover:bg-amber-300 hover:shadow-lg transform hover:scale-105 transition-all duration-200 w-full md:w-auto"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
              <button
                className="px-4 py-2 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 hover:shadow-lg transform hover:scale-105 transition-all duration-200 w-full md:w-auto"
                onClick={() => navigate("/register")}
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
