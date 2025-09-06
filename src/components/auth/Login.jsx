import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await login(formData.email, formData.password);
      navigate("/");
    } catch (error) {
      setError("Failed to log in. Please check your credentials.");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid bg-primary bg-gradient min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow">
              <div className="card-body p-4">
                <h2 className="card-title text-center mb-3">Welcome Back</h2>
                <p className="text-muted text-center mb-4">
                  Sign in to your MovieTracker account
                </p>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>

                <div className="text-center">
                  <p className="mb-0">
                    Don't have an account?
                    <Link to="/signup" className="text-decoration-none ms-1">
                      Create one
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
