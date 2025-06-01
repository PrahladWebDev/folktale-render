import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import FolktaleDetail from "./pages/FolktaleDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminPanel from "./pages/AdminPanel";
import Navbar from "./components/Navbar";
import MapFolktaleExplorer from "./components/MapFilter";
import BookmarkedFolktale from "./pages/BookmarkedFolktale";

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
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;
