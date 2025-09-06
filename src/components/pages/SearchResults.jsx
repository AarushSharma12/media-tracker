import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchMulti } from "../../services/tmdbApi";
import { useAuth } from "../../hooks/useAuth";
import MediaCard from "../media/MediaCard";
import LoadingSpinner from "../common/LoadingSpinner";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const query = searchParams.get("q");

  useEffect(() => {
    if (!query) {
      navigate("/");
      return;
    }

    const performSearch = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await searchMulti(query, currentPage);

        if (currentPage === 1) {
          setResults(response.results);
        } else {
          // Append results for pagination
          setResults((prev) => [...prev, ...response.results]);
        }

        setTotalPages(response.total_pages);
      } catch (error) {
        console.error("Search error:", error);
        setError("Failed to search. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query, currentPage, navigate]);

  const loadMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const filteredResults = results.filter(
    (item) => item.media_type === "movie" || item.media_type === "tv"
  );

  if (loading && currentPage === 1) {
    return <LoadingSpinner message={`Searching for "${query}"...`} />;
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <h4>Search Error</h4>
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
    <div className="container mt-4">
      {/* Search Header */}
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="fw-bold">Search Results for "{query}"</h2>
          <p className="text-muted">
            Found {filteredResults.length} results
            {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
          </p>
        </div>
      </div>

      {/* Results */}
      {filteredResults.length > 0 ? (
        <>
          <div className="row">
            {filteredResults.map((item) => (
              <MediaCard
                key={`${item.media_type}-${item.id}`}
                media={item}
                showAddButton={!!user}
              />
            ))}
          </div>

          {/* Load More Button */}
          {currentPage < totalPages && (
            <div className="text-center mt-4 mb-5">
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
                    Loading...
                  </>
                ) : (
                  `Load More Results (${currentPage}/${totalPages})`
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        !loading && (
          <div className="text-center py-5">
            <div className="display-1 text-muted mb-3">🔍</div>
            <h3>No results found</h3>
            <p className="text-muted">
              Try searching for different keywords or check your spelling
            </p>
            <button className="btn btn-primary" onClick={() => navigate("/")}>
              Back to Home
            </button>
          </div>
        )
      )}
    </div>
  );
};

export default SearchResults;
