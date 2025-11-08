import TopBar from "./components/topbar/TopBar";
import Write from "./pages/write/Write";
import Single from "./pages/single/Single";
import Home from "./pages/home/Home";
import Settings from "./pages/settings/Settings";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useContext } from "react";
import { Context } from "./context/Context";
import ContactPage from "./pages/contact/ContactPage";
import CategoryPage from "./pages/category/CategoryPage";
import BooksPage from "./pages/books/BooksPage";
import ReviewsPage from "./pages/reviews/ReviewsPage";

function App() {
  const { user, theme, readerMode } = useContext(Context);
  return (
    <Router>
      <TopBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={user ? <Home /> : <Register />} />
        <Route path="/login" element={user ? <Home /> : <Login />} />
        <Route path="/settings" element={user ? <Settings /> : <Register />} />
        <Route path="/contact" element={user ? <ContactPage /> : <Home />} />
        <Route path="/write" element={user ? <Write /> : <Register />} />
        <Route path="/post/:postId" element={<Single />} />
        <Route path="/category/:name" element={<CategoryPage />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/register" element={user ? <Home /> : <Register />} />
      </Routes>
    </Router>
  );
}


export default App;
