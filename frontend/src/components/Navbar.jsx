import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SearchBar from "./SearchBar";
import { FaBookmark, FaBars, FaTimes, FaUser } from "react-icons/fa";

function Navbar() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [username, setUsername] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const checkAdmin = async () => {
      if (token) {
        try {
          const response = await axios.get("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsAdmin(response.data.isAdmin);
          setUsername(response.data.username);
        } catch (error) {
          console.error("Error checking user:", error);
        }
      }
    };
    checkAdmin();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUsername(null);
    navigate("/login");
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-gradient-to-r from-amber-50 to-orange-100 shadow-md p-3 sticky top-0 z-[1000] font-caveat text-gray-800 animate-fadeIn">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <h1
          className="text-2xl sm:text-3xl font-bold text-amber-900 cursor-pointer hover:text-amber-700 transition-colors duration-200"
          onClick={() => {
            navigate("/");
            setIsMenuOpen(false);
          }}
        >
          Legend संसार
        </h1>

        <button
          className="md:hidden text-amber-900 focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>

        <div className="hidden md:flex flex-1 items-center gap-4 mx-4">
          <SearchBar />
          {username && (
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <button
                className="flex items-center gap-2 hover:text-amber-700 transition-colors duration-200"
                onClick={() => navigate("/profile")}
                title="Profile"
              >
                <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center hover:bg-amber-300 transition-colors duration-200">
                  <FaUser size={16} />
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            onClick={() => navigate("/map")}
          >
            <span>🌍</span> Map
          </button>

          <button
            className="flex items-center justify-center px-4 py-2 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            onClick={() => navigate("/bookmarks")}
            title="Bookmarks"
          >
            <FaBookmark />
          </button>

          {token ? (
            <>
              {isAdmin && (
                <button
                  className="px-4 py-2 rounded-md bg-amber-200 text-amber-900 font-semibold hover:bg-amber-300 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  onClick={() => navigate("/admin")}
                >
                  Admin Panel
                </button>
              )}
              <button
                className="px-4 py-2 rounded-md bg-amber-200 text-amber-900 font-semibold hover:bg-amber-300 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="px-4 py-2 rounded-md bg-amber-200 text-amber-900 font-semibold hover:bg-amber-300 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
              <button
                className="px-4 py-2 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                onClick={() => navigate("/register")}
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-3 pt-4">
          <div className="px-4 flex flex-col gap-3">
            <SearchBar />
            {username && (
              <div className="flex items-center gap-2 text-amber-900 font-semibold">
                <button
                  className="flex items-center gap-2 hover:text-amber-700 transition-colors duration-200"
                  onClick={() => {
                    navigate("/profile");
                    setIsMenuOpen(false);
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center hover:bg-amber-300 transition-colors duration-200">
                    <FaUser size={16} />
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 hover:shadow-lg transition-all duration-200"
            onClick={() => {
              navigate("/map");
              setIsMenuOpen(false);
            }}
          >
            <span>🌍</span> Map
          </button>

          <button
            className="flex items-center justify-center px-4 py-2 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 hover:shadow-lg transition-all duration-200"
            onClick={() => {
              navigate("/bookmarks");
              setIsMenuOpen(false);
            }}
            title="Bookmarks"
          >
            <FaBookmark />
          </button>

          {token ? (
            <>
              {isAdmin && (
                <button
                  className="px-4 py-2 rounded-md bg-amber-200 text-amber-900 font-semibold hover:bg-amber-300 hover:shadow-lg transition-all duration-200"
                  onClick={() => {
                    navigate("/admin");
                    setIsMenuOpen(false);
                  }}
                >
                  Admin Panel
                </button>
              )}
            
              <button
                className="px-4 py-2 rounded-md bg-amber-200 text-amber-900 font-semibold hover:bg-amber-300 hover:shadow-lg transition-all duration-200"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="px-4 py-2 rounded-md bg-amber-200 text-amber-900 font-semibold hover:bg-amber-300 hover:shadow-lg transition-all duration-200"
                onClick={() => {
                  navigate("/login");
                  setIsMenuOpen(false);
                }}
              >
                Login
              </button>
              <button
                className="px-4 py-2 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 hover:shadow-lg transition-all duration-200"
                onClick={() => {
                  navigate("/register");
                  setIsMenuOpen(false);
                }}
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
