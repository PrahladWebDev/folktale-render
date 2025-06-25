
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext";
import Home from "./pages/Home";
import FolktaleDetail from "./pages/FolktaleDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOTP from './components/VerifyOTP';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AdminPanel from "./pages/AdminPanel";
import Navbar from "./components/Navbar";
import MapFolktaleExplorer from "./components/MapFilter";
import BookmarkedFolktale from "./pages/BookmarkedFolktale";
import Profile from './components/Profile';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapFolktaleExplorer />} />
          <Route path="/bookmarks" element={<BookmarkedFolktale />} />
          <Route path="/folktale/:id" element={<FolktaleDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
