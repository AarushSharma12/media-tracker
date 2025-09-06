import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  getTrending,
  getPopularMovies,
  getPopularTVShows,
} from "../../services/tmdbApi";
import MediaCard from "../media/MediaCard";
import LoadingSpinner from "../common/LoadingSpinner";

const Home = () => {
  const { user } = useAuth();
  const [trendingContent, setTrendingContent] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTVShows, setPopularTVShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);

        // Fetch all content in parallel
        const [trendingData, moviesData, tvData] = await Promise.all([
          getTrending("all", "week"),
          getPopularMovies(),
          getPopularTVShows(),
        ]);

        setTrendingContent(trendingData.results.slice(0, 8)); // Show top 8
        setPopularMovies(moviesData.results.slice(0, 8));
        setPopularTVShows(tvData.results.slice(0, 8));
      } catch (error) {
        console.error("Error fetching content:", error);
        setError("Failed to load content. Please check your TMDB API key.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading awesome content..." />;
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <h4>Oops! Something went wrong</h4>
          <p>{error}</p>
          <button
            className="btn btn-outline-danger"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Hero Section */}
      <div className="bg-primary text-white py-5 mb-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="display-4 fw-bold">Welcome to MovieTracker</h1>
              <p className="lead">
                Discover, track, and organize your favorite movies and TV shows
              </p>
              {user ? (
                <p className="mb-0">
                  Welcome back,{" "}
                  <strong>
                    {user.displayName || user.email.split("@")[0]}
                  </strong>
                  ! Ready to discover something new?
                </p>
              ) : (
                <div>
                  <Link to="/signup" className="btn btn-light btn-lg me-3">
                    Get Started
                  </Link>
                  <Link to="/login" className="btn btn-outline-light btn-lg">
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Trending This Week */}
        <section className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold">🔥 Trending This Week</h2>
            <button className="btn btn-outline-primary btn-sm">View All</button>
          </div>
          <div className="row">
            {trendingContent.map((item) => (
              <MediaCard key={item.id} media={item} showAddButton={!!user} />
            ))}
          </div>
        </section>

        {/* Popular Movies */}
        <section className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold">🎬 Popular Movies</h2>
            <button className="btn btn-outline-primary btn-sm">View All</button>
          </div>
          <div className="row">
            {popularMovies.map((movie) => (
              <MediaCard
                key={movie.id}
                media={{ ...movie, media_type: "movie" }}
                showAddButton={!!user}
              />
            ))}
          </div>
        </section>

        {/* Popular TV Shows */}
        <section className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold">📺 Popular TV Shows</h2>
            <button className="btn btn-outline-primary btn-sm">View All</button>
          </div>
          <div className="row">
            {popularTVShows.map((show) => (
              <MediaCard
                key={show.id}
                media={{ ...show, media_type: "tv" }}
                showAddButton={!!user}
              />
            ))}
          </div>
        </section>

        {/* Call to Action for Non-Users */}
        {!user && (
          <section className="bg-light p-5 rounded text-center mb-5">
            <h3>Ready to start tracking?</h3>
            <p className="lead text-muted">
              Create an account to build your personal watchlists and never
              forget what to watch next!
            </p>
            <Link to="/signup" className="btn btn-primary btn-lg">
              Sign Up Free
            </Link>
          </section>
        )}
      </div>
    </div>
  );
};

export default Home;
