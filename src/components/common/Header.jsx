import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import SearchBar from "./SearchBar";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  // Get display name from user object or default to email username
  const getDisplayName = () => {
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "User";
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          🎬 MovieTracker
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          {/* Search Bar - Center */}
          <div className="mx-auto">
            <SearchBar />
          </div>

          {/* User Menu - Right */}
          <div className="navbar-nav">
            {user ? (
              <>
                <span className="navbar-text me-3 fw-semibold text-light">
                  Welcome, {getDisplayName()}!
                </span>
                <Link className="nav-link fw-medium" to="/dashboard">
                  Dashboard
                </Link>
                <button
                  className="btn btn-outline-light btn-sm ms-2 fw-medium"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="nav-link fw-medium" to="/login">
                  Login
                </Link>
                <Link className="nav-link fw-medium" to="/signup">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
