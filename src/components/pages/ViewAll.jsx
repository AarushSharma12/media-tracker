import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getTrending, getPopular, getTopRated } from "../../services/tmdbApi";
import MediaCard from "../media/MediaCard";
import LoadingSpinner from "../common/LoadingSpinner";

function ViewAll() {
  const { category, type } = useParams(); // category: trending/popular/top_rated, type: movie/tv/all
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // Reset state when category or type changes
    setItems([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchItems(1, true);
  }, [category, type]);

  async function fetchItems(page = 1, reset = false) {
    try {
      setLoading(true);
      setError("");

      let response;

      switch (category) {
        case "trending":
          response = await getTrending(type === "all" ? "all" : type, "week");
          break;
        case "popular":
          if (type === "all") {
            // Fetch both movies and TV shows
            const [moviesResponse, tvResponse] = await Promise.all([
              getPopular("movie", page),
              getPopular("tv", page),
            ]);
            response = {
              results: [
                ...moviesResponse.results.map((item) => ({
                  ...item,
                  media_type: "movie",
                })),
                ...tvResponse.results.map((item) => ({
                  ...item,
                  media_type: "tv",
                })),
              ].sort((a, b) => b.popularity - a.popularity),
              total_pages: Math.max(
                moviesResponse.total_pages,
                tvResponse.total_pages
              ),
            };
          } else {
            response = await getPopular(type, page);
          }
          break;
        case "top_rated":
          if (type === "all") {
            const [moviesResponse, tvResponse] = await Promise.all([
              getTopRated("movie", page),
              getTopRated("tv", page),
            ]);
            response = {
              results: [
                ...moviesResponse.results.map((item) => ({
                  ...item,
                  media_type: "movie",
                })),
                ...tvResponse.results.map((item) => ({
                  ...item,
                  media_type: "tv",
                })),
              ].sort((a, b) => b.vote_average - a.vote_average),
              total_pages: Math.max(
                moviesResponse.total_pages,
                tvResponse.total_pages
              ),
            };
          } else {
            response = await getTopRated(type, page);
          }
          break;
        default:
          throw new Error("Invalid category");
      }

      const newItems = response.results.map((item) => ({
        ...item,
        media_type: item.media_type || type,
      }));

      if (reset) {
        setItems(newItems);
      } else {
        setItems((prev) => [...prev, ...newItems]);
      }

      setTotalPages(response.total_pages);
      setHasMore(page < response.total_pages);
      setCurrentPage(page);
    } catch (err) {
      console.error("Error fetching items:", err);
      setError("Failed to load content. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function loadMore() {
    if (hasMore && !loading) {
      fetchItems(currentPage + 1, false);
    }
  }

  function getPageTitle() {
    const categoryName =
      {
        trending: "Trending",
        popular: "Popular",
        top_rated: "Top Rated",
      }[category] || "Content";

    const typeName =
      {
        movie: "Movies",
        tv: "TV Shows",
        all: "Content",
      }[type] || "Content";

    return `${categoryName} ${typeName}`;
  }

  function getPageDescription() {
    const descriptions = {
      trending: "Discover what's trending this week",
      popular: "Most popular content right now",
      top_rated: "Highest rated content of all time",
    };
    return descriptions[category] || "Browse content";
  }

  if (!category || !type) {
    navigate("/");
    return null;
  }

  if (loading && items.length === 0) {
    return <LoadingSpinner message="Loading content..." />;
  }

  if (error && items.length === 0) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <h4>Error Loading Content</h4>
          <p>{error}</p>
          <button
            className="btn btn-outline-danger"
            onClick={() => fetchItems(1, true)}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <button
                  className="btn btn-link p-0 text-decoration-none"
                  onClick={() => navigate("/")}
                >
                  Home
                </button>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {getPageTitle()}
              </li>
            </ol>
          </nav>
          <h1 className="fw-bold">{getPageTitle()}</h1>
          <p className="text-muted">{getPageDescription()}</p>
        </div>
      </div>

      {/* Content Grid */}
      {items.length > 0 ? (
        <>
          <div className="row">
            {items.map((item, index) => (
              <MediaCard
                key={`${item.media_type || type}-${item.id}-${index}`}
                media={item}
                showAddButton={!!user}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-5 mb-5">
              <button
                className="btn btn-primary btn-lg"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    Loading More...
                  </>
                ) : (
                  `Load More (Page ${currentPage + 1} of ${totalPages})`
                )}
              </button>
            </div>
          )}

          {!hasMore && items.length > 0 && (
            <div className="text-center mt-5 mb-5">
              <p className="text-muted">
                You've reached the end! Showing all {items.length} results.
              </p>
              <button
                className="btn btn-outline-primary"
                onClick={() => navigate("/")}
              >
                Back to Home
              </button>
            </div>
          )}
        </>
      ) : (
        !loading && (
          <div className="text-center py-5">
            <div className="display-1 text-muted mb-3">📺</div>
            <h3>No content found</h3>
            <p className="text-muted">Unable to load content at this time</p>
            <button className="btn btn-primary" onClick={() => navigate("/")}>
              Back to Home
            </button>
          </div>
        )
      )}
    </div>
  );
}

export default ViewAll;
