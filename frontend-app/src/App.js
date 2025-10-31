import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Components/Login/Login";
import Register from "./Components/Register/Register";
import Navbar from "./Components/Navbar/Navbar";
import Home from "./Components/Home/Home";
import About from "./Components/About/About";
import Contact from "./Components/ContactUs/Contact";
import Requests from "./Components/Requests/Requests";
import AdminPanel from "./Components/AdminPanel/AdminPanel";
import Laptops from "./Components/Laptops/Laptops";
import Mobiles from "./Components/Mobiles/Mobiles";
import Tablets from "./Components/Tablets/Tablets";
import ContactedUs from "./Components/ContactedUs/ContactedUs";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

function App() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData)); // still save user info
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <Router>
      {user && <Navbar user={user} onLogout={handleLogout} />}
      <Routes>
        {!user ? (
          <>
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <>
            <Route
              path="/"
              element={user?.email?.includes("@admin") ? <Navigate to="/adminpanel" /> : <Home />}
            />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/requests" element={<Requests />} />

            {/* Admin-only routes */}
            <Route
              path="/adminpanel"
              element={user?.email?.includes("@admin") ? <AdminPanel /> : <Navigate to="/" />}
            />
            <Route
              path="/contactedus"
              element={user?.email?.includes("@admin") ? <ContactedUs /> : <Navigate to="/" />}
            />
            <Route
              path="/laptops"
              element={user?.email?.includes("@admin") ? <Laptops /> : <Navigate to="/" />}
            />
            <Route
              path="/mobiles"
              element={user?.email?.includes("@admin") ? <Mobiles /> : <Navigate to="/" />}
            />
            <Route
              path="/tablets"
              element={user?.email?.includes("@admin") ? <Tablets /> : <Navigate to="/" />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
