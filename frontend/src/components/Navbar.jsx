import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SearchBar from "./SearchBar";
import { FaBookmark, FaBars, FaTimes, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

function Navbar() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [user, setUser] = useState({ username: null, profileImageUrl: "" });

  const token = localStorage.getItem("token");
  const DEFAULT_PROFILE_IMAGE =
    "https://res.cloudinary.com/dvws2chvw/image/upload/v1750929194/user_profiles/jwkack4vcko50qfaawfn.png";

  useEffect(() => {
    const checkUser = async () => {
      if (token) {
        try {
          const response = await axios.get("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsAdmin(response.data.user.isAdmin);
          setUser({
            username: response.data.user.username,
            profileImageUrl:
              response.data.user.profileImageUrl || DEFAULT_PROFILE_IMAGE,
          });
        } catch (error) {
          console.error("Error checking user:", error);
        }
      }
    };
    checkUser();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser({ username: null, profileImageUrl: "" });
    navigate("/login");
    setIsMenuOpen(false);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleExplore = () => setIsExploreOpen(!isExploreOpen);
  const toggleAccount = () => setIsAccountOpen(!isAccountOpen);

  const renderProfileIcon = () => (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="w-8 h-8 rounded-full overflow-hidden bg-amber-200 hover:bg-amber-300 transition-all duration-200 shadow-md"
    >
      <img
        src={user.profileImageUrl || DEFAULT_PROFILE_IMAGE}
        alt="Profile"
        className="w-full h-full object-cover"
        onError={(e) => {
          e.target.src = DEFAULT_PROFILE_IMAGE;
        }}
      />
    </motion.div>
  );

  return (
    <nav className="bg-gradient-to-r from-amber-50 to-orange-100 shadow-md p-3 sticky top-0 z-[1000] font-caveat text-gray-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo with animation */}
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl sm:text-3xl font-bold text-amber-900 cursor-pointer hover:text-amber-700 transition"
          onClick={() => {
            navigate("/");
            setIsMenuOpen(false);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Legend 𝓢𝓪𝓷𝓼𝓪𝓻
        </motion.h1>

        {/* Toggle button for mobile */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="md:hidden text-amber-900"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </motion.button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <SearchBar />
          </motion.div>

          {/* Explore dropdown */}
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.05 }}
          >
            <button 
              className="px-4 py-2 bg-amber-200 rounded-md hover:bg-amber-300 transition flex items-center gap-1"
              onClick={toggleExplore}
            >
              Explore {isExploreOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </button>
            
            <AnimatePresence>
              {isExploreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute flex flex-col bg-white shadow-lg rounded-md mt-1 min-w-[150px] right-0 z-10"
                >
                  <motion.button
                    whileHover={{ x: 5 }}
                    onClick={() => {
                      navigate("/map");
                      setIsExploreOpen(false);
                    }}
                    className="px-4 py-2 hover:bg-amber-100 text-left"
                  >
                    🌍 Map
                  </motion.button>
                  <motion.button
                    whileHover={{ x: 5 }}
                    onClick={() => {
                      navigate("/bookmarks");
                      setIsExploreOpen(false);
                    }}
                    className="px-4 py-2 hover:bg-amber-100 text-left flex items-center gap-2"
                  >
                    <FaBookmark /> Bookmarks
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Account dropdown (with profile) */}
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.05 }}
          >
            <button 
              className="px-4 py-2 bg-amber-900 text-white rounded-md hover:bg-amber-800 transition flex items-center gap-1"
              onClick={toggleAccount}
            >
              Account {isAccountOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </button>
            
            <AnimatePresence>
              {isAccountOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute flex flex-col bg-white shadow-lg rounded-md mt-1 right-0 min-w-[160px] z-10"
                >
                  {user.username && (
                    <motion.button
                      whileHover={{ x: 5 }}
                      onClick={() => {
                        navigate("/profile");
                        setIsAccountOpen(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-amber-100 text-left"
                    >
                      {renderProfileIcon()} <span>Profile</span>
                    </motion.button>
                  )}

                  {token ? (
                    <>
                      {isAdmin && (
                        <motion.button
                          whileHover={{ x: 5 }}
                          onClick={() => {
                            navigate("/admin");
                            setIsAccountOpen(false);
                          }}
                          className="px-4 py-2 hover:bg-amber-100 text-left"
                        >
                          Admin Panel
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ x: 5 }}
                        onClick={handleLogout}
                        className="px-4 py-2 hover:bg-amber-100 text-left"
                      >
                        Logout
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <motion.button
                        whileHover={{ x: 5 }}
                        onClick={() => {
                          navigate("/login");
                          setIsAccountOpen(false);
                        }}
                        className="px-4 py-2 hover:bg-amber-100 text-left"
                      >
                        Login
                      </motion.button>
                      <motion.button
                        whileHover={{ x: 5 }}
                        onClick={() => {
                          navigate("/register");
                          setIsAccountOpen(false);
                        }}
                        className="px-4 py-2 hover:bg-amber-100 text-left"
                      >
                        Register
                      </motion.button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden"
          >
            <div className="flex flex-col gap-4 pt-4 px-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <SearchBar />
              </motion.div>

              <div className="pt-2 border-t border-amber-300">
                <motion.p 
                  className="text-sm font-semibold text-amber-700"
                  whileHover={{ scale: 1.02 }}
                >
                  Explore
                </motion.p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    navigate("/map");
                    setIsMenuOpen(false);
                  }}
                  className="mt-1 px-4 py-2 rounded-md bg-amber-900 text-white hover:bg-amber-800"
                >
                  🌍 Map
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    navigate("/bookmarks");
                    setIsMenuOpen(false);
                  }}
                  className="mt-1 px-4 py-2 rounded-md bg-amber-900 text-white hover:bg-amber-800 flex items-center gap-2"
                >
                  <FaBookmark /> Bookmarks
                </motion.button>
              </div>

              <div className="pt-2 border-t border-amber-300">
                <motion.p 
                  className="text-sm font-semibold text-amber-700"
                  whileHover={{ scale: 1.02 }}
                >
                  Account
                </motion.p>

                {user.username && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      navigate("/profile");
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2"
                  >
                    {renderProfileIcon()} <span>Profile</span>
                  </motion.button>
                )}

                {token ? (
                  <>
                    {isAdmin && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          navigate("/admin");
                          setIsMenuOpen(false);
                        }}
                        className="mt-1 px-4 py-2 rounded-md bg-amber-200 text-amber-900 hover:bg-amber-300"
                      >
                        Admin Panel
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleLogout}
                      className="mt-1 px-4 py-2 rounded-md bg-amber-200 text-amber-900 hover:bg-amber-300"
                    >
                      Logout
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        navigate("/login");
                        setIsMenuOpen(false);
                      }}
                      className="mt-1 px-4 py-2 rounded-md bg-amber-200 text-amber-900 hover:bg-amber-300"
                    >
                      Login
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        navigate("/register");
                        setIsMenuOpen(false);
                      }}
                      className="mt-1 px-4 py-2 rounded-md bg-amber-900 text-white hover:bg-amber-800"
                    >
                      Register
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
