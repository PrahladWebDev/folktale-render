import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SearchBar from "./SearchBar";
import { FaBookmark, FaBars, FaTimes, FaUser } from "react-icons/fa";

function Navbar() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState({ username: null, profileImageUrl: "" });
  const token = localStorage.getItem("token");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const checkUser = async () => {
      if (token) {
        try {
          const response = await axios.get("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsAdmin(response.data.isAdmin);
          setUser({
            username: response.data.username,
            profileImageUrl: response.data.profileImageUrl || "",
          });
        } catch (error) {
          console.error("Error checking user:", error);
        }
      }
    };
    checkUser();
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser({ username: null, profileImageUrl: "" });
    navigate("/login");
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleDropdownNavigation = (path) => {
    navigate(path);
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
  };

  const renderProfileIcon = () => (
    <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center hover:bg-amber-300 transition-colors duration-200 overflow-hidden">
      {user.profileImageUrl ? (
        <img
          src={user.profileImageUrl}
          alt="Profile"
          className="w-full h-full object-cover"
        />
      ) : (
        <FaUser size={16} />
      )}
    </div>
  );

  const renderDropdown = () => (
    <div
      className="absolute right-0 mt-2 w-48 bg-amber-50 shadow-lg rounded-md py-2 z-50 animate-slideDown"
      ref={dropdownRef}
    >
      <button
        className="w-full text-left px-4 py-2 text-amber-900 hover:bg-amber-200 transition-colors duration-200"
        onClick={() => handleDropdownNavigation("/profile")}
      >
        My Profile
      </button>
      <button
        className="w-full text-left px-4 py-2 text-amber-900 hover:bg-amber-200 transition-colors duration-200 flex items-center gap-2"
        onClick={() => handleDropdownNavigation("/bookmarks")}
      >
        <FaBookmark /> Bookmarks
      </button>
      {isAdmin && (
        <button
          className="w-full text-left px-4 py-2 text-amber-900 hover:bg-amber-200 transition-colors duration-200"
          onClick={() => handleDropdownNavigation("/admin")}
        >
          Admin Panel
        </button>
      )}
      <button
        className="w-full text-left px-4 py-2 text-amber-900 hover:bg-amber-200 transition-colors duration-200"
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );

  return (
    <nav className="bg-gradient-to-r from-amber-50 to-orange-100 shadow-md p-3 sticky top-0 z-[1000] font-caveat text-gray-800 animate-fadeIn">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <h1
          className="text-2xl sm:text-3xl font-bold text-amber-900 cursor-pointer hover:text-amber-700 transition-colors duration-200"
          onClick={() => {
            navigate("/");
            setIsMenuOpen(false);
            setIsDropdownOpen(false);
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
          {user.username && (
            <div className="relative">
              <button
                className="flex items-center gap-2 hover:text-amber-700 transition-colors duration-200"
                onClick={toggleDropdown}
                title="Profile"
              >
                {renderProfileIcon()}
              </button>
              {isDropdownOpen && renderDropdown()}
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

          {token ? (
            <>
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
            {user.username && (
              <div className="relative">
                <button
                  className="flex items-center gap-2 hover:text-amber-700 transition-colors duration-200"
                  onClick={toggleDropdown}
                >
                  {renderProfileIcon()}
                </button>
                {isDropdownOpen && renderDropdown()}
              </div>
            )}
          </div>

          <button
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 hover:shadow-lg transition-all duration-200"
            onClick={() => {
              navigate("/map");
              setIsMenuOpen(false);
              setIsDropdownOpen(false);
            }}
          >
            <span>🌍</span> Map
          </button>

          {token ? (
            <>
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
                  setIsDropdownOpen(false);
                }}
              >
                Login
              </button>
              <button
                className="px-4 py-2 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 hover:shadow-lg transition-all duration-200"
                onClick={() => {
                  navigate("/register");
                  setIsMenuOpen(false);
                  setIsDropdownOpen(false);
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
