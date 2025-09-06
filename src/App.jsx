// React/Router imports
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Local imports
import { AuthProvider } from "./hooks/useAuth";
import Header from "./components/common/Header";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Page components
import Home from "./components/pages/Home";
import Dashboard from "./components/pages/Dashboard";
import SearchResults from "./components/pages/SearchResults";
import MediaDetails from "./components/pages/MediaDetails";

// Auth components
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";

// Styles
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route path="/:mediaType/:id" element={<MediaDetails />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
