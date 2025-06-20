import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUser, FaEnvelope, FaLock, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ username: "", email: "", isAdmin: false });
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const response = await axios.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        setFormData({ username: response.data.username, password: "" });
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile");
      }
    };
    fetchProfile();
  }, [token, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const response = await axios.put(
        "/api/auth/update-profile",
        { username: formData.username, password: formData.password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser({ ...user, username: formData.username });
      setMessage("Profile updated successfully");
      setFormData({ ...formData, password: "" });
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center flex items-center justify-center gap-2">
          <FaUser /> User Profile
        </h2>

        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md flex items-center gap-2">
            <FaCheckCircle /> {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center gap-2">
            <FaExclamationCircle /> {error}
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center gap-2 text-gray-700 mb-2">
            <FaEnvelope /> <strong>Email:</strong> {user.email}
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <FaUser /> <strong>Role:</strong> {user.isAdmin ? "Admin" : "User"}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-gray-700 font-semibold mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Enter new username"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700 font-semibold mb-1">
              New Password (optional)
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Enter new password"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 rounded-md bg-amber-900 text-white font-semibold hover:bg-amber-800 hover:shadow-lg transition-all duration-200"
          >
            Update Profile
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
