import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import FolktaleDetail from "./pages/FolktaleDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EmailVerificationSent from "./pages/EmailVerificationSent";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AdminPanel from "./pages/AdminPanel";
import Navbar from "./components/Navbar";
import MapFolktaleExplorer from "./components/MapFilter";
import BookmarkedFolktale from "./pages/BookmarkedFolktale";
import Profile from './components/Profile';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<MapFolktaleExplorer />} />
        <Route path="/bookmarks" element={<BookmarkedFolktale />} />
        <Route path="/folktale/:id" element={<FolktaleDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/email-verification-sent" element={<EmailVerificationSent />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
