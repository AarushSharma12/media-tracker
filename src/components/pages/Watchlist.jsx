import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useWatchlist } from "../../hooks/useWatchlist";
import {
  getUserMediaLists,
  removeFromWatchlist,
  removeFromList,
  updateWatchedStatus,
} from "../../services/userService";
import { getImageUrl } from "../../services/tmdbApi";
import { Link } from "react-router-dom";
import LoadingSpinner from "../common/LoadingSpinner";

function Watchlist() {
  const { user } = useAuth();
  const { removeFromWatchlistCache, forceRefresh } = useWatchlist();
  const [mediaLists, setMediaLists] = useState({
    watchlist: [],
    watching: [],
    completed: [],
    favorites: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("watchlist");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    if (user) {
      fetchUserLists();
    }
  }, [user]);

  async function fetchUserLists() {
    try {
      setLoading(true);
      const lists = await getUserMediaLists(user.uid);
      if (lists) {
        setMediaLists(lists);
      }
    } catch (err) {
      setError("Failed to load your lists. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveFromList(mediaId, mediaType, listType) {
    try {
      if (listType === "watchlist") {
        // Update global context cache immediately for watchlist
        removeFromWatchlistCache(mediaId, mediaType);
        // Then update server
        await removeFromWatchlist(user.uid, mediaId, mediaType);
      } else {
        // For other lists (completed, favorites, watching), use generic remove
        await removeFromList(user.uid, mediaId, mediaType, listType);
      }
      // Refresh the local lists
      await fetchUserLists();
    } catch (err) {
      console.error("Failed to remove item:", err);
      alert("Failed to remove item. Please try again.");
      // Refresh context to sync with server state for watchlist
      if (listType === "watchlist" && forceRefresh) {
        forceRefresh();
      }
    }
  }

  async function handleMarkAsWatched(mediaItem) {
    try {
      // First update the watched status (this should add to completed list)
      await updateWatchedStatus(
        user.uid,
        mediaItem.id,
        mediaItem.mediaType,
        true
      );

      // Then remove from watchlist
      removeFromWatchlistCache(mediaItem.id, mediaItem.mediaType);
      await removeFromWatchlist(user.uid, mediaItem.id, mediaItem.mediaType);

      // Refresh the lists to get updated data
      await fetchUserLists();
    } catch (err) {
      console.error("Failed to mark as watched:", err);
      alert("Failed to update status. Please try again.");
      // Refresh context to sync with server state
      if (forceRefresh) {
        forceRefresh();
      }
    }
  }

  function getFilteredItems(list) {
    if (filterType === "all") {
      return list;
    }
    return list.filter((item) => item.mediaType === filterType);
  }

  function formatDate(dateString) {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString();
  }

  function renderEmptyState(listName) {
    const messages = {
      watchlist: {
        title: "Your watchlist is empty",
        description: "Start adding movies and TV shows you want to watch later",
      },
      watching: {
        title: "Not currently watching anything",
        description: "Mark shows as currently watching to track your progress",
      },
      completed: {
        title: "No completed items yet",
        description: "Items you mark as watched will appear here",
      },
      favorites: {
        title: "No favorites yet",
        description: "Mark your favorite movies and shows to find them easily",
      },
    };

    const message = messages[listName];

    return (
      <div className="text-center py-5">
        <div className="display-1 text-muted mb-3">📺</div>
        <h3>{message.title}</h3>
        <p className="text-muted mb-4">{message.description}</p>
        <Link to="/" className="btn btn-primary">
          Discover Content
        </Link>
      </div>
    );
  }

  function renderMediaItem(item, listType) {
    const title = item.title || item.name;
    const releaseDate = item.release_date || item.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : "Unknown";
    const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";

    // Get user rating from mediaLists.ratings
    const ratingKey = `${item.mediaType}_${item.id}`;
    const userRating = mediaLists.ratings?.[ratingKey] || 0;

    return (
      <div
        key={`${item.mediaType}-${item.id}`}
        className="col-md-6 col-lg-4 mb-4"
      >
        <div className="card h-100 shadow-sm">
          <div className="row g-0 h-100">
            <div className="col-4">
              <Link to={`/${item.mediaType}/${item.id}`}>
                <img
                  src={getImageUrl(item.poster_path, "w300")}
                  className="img-fluid rounded-start h-100"
                  alt={title}
                  style={{ objectFit: "cover", minHeight: "200px" }}
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/200x300/e9ecef/6c757d?text=No+Image";
                  }}
                />
              </Link>
            </div>
            <div className="col-8">
              <div className="card-body d-flex flex-column h-100">
                <div className="flex-grow-1">
                  <Link
                    to={`/${item.mediaType}/${item.id}`}
                    className="text-decoration-none text-dark"
                  >
                    <h6 className="card-title fw-bold mb-2">{title}</h6>
                  </Link>

                  <div className="mb-2">
                    <span className="badge bg-secondary me-2">
                      {item.mediaType === "movie" ? "Movie" : "TV Show"}
                    </span>
                    <span className="text-muted small">{year}</span>
                  </div>

                  <div className="mb-2 d-flex gap-2 flex-wrap">
                    <span className="badge bg-warning text-dark">
                      ⭐ {rating}
                    </span>
                    {userRating > 0 && (
                      <span className="badge bg-success">
                        My Rating: {userRating}/10
                      </span>
                    )}
                  </div>

                  {item.addedAt && (
                    <p className="text-muted small mb-2">
                      Added:{" "}
                      {formatDate(item.addedAt.toDate?.() || item.addedAt)}
                    </p>
                  )}
                </div>

                <div className="mt-auto">
                  <div className="btn-group w-100" role="group">
                    {listType === "watchlist" && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleMarkAsWatched(item)}
                        title="Mark as watched"
                      >
                        ✓ Watched
                      </button>
                    )}

                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() =>
                        handleRemoveFromList(item.id, item.mediaType, listType)
                      }
                      title="Remove from list"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading your lists..." />;
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <h4>Error Loading Lists</h4>
          <p>{error}</p>
          <button className="btn btn-outline-danger" onClick={fetchUserLists}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentList = mediaLists[activeTab] || [];
  const filteredItems = getFilteredItems(currentList);

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="fw-bold">My Lists</h1>
          <p className="text-muted">Manage your saved movies and TV shows</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="row mb-4">
        <div className="col-12">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "watchlist" ? "active" : ""
                }`}
                onClick={() => setActiveTab("watchlist")}
              >
                Watchlist ({mediaLists.watchlist?.length || 0})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "watching" ? "active" : ""
                }`}
                onClick={() => setActiveTab("watching")}
              >
                Currently Watching ({mediaLists.watching?.length || 0})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "completed" ? "active" : ""
                }`}
                onClick={() => setActiveTab("completed")}
              >
                Completed ({mediaLists.completed?.length || 0})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "favorites" ? "active" : ""
                }`}
                onClick={() => setActiveTab("favorites")}
              >
                Favorites ({mediaLists.favorites?.length || 0})
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Filters */}
      {currentList.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex gap-2">
              <span className="fw-medium me-2">Filter:</span>
              <button
                className={`btn btn-sm ${
                  filterType === "all" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setFilterType("all")}
              >
                All ({currentList.length})
              </button>
              <button
                className={`btn btn-sm ${
                  filterType === "movie" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setFilterType("movie")}
              >
                Movies (
                {
                  currentList.filter((item) => item.mediaType === "movie")
                    .length
                }
                )
              </button>
              <button
                className={`btn btn-sm ${
                  filterType === "tv" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setFilterType("tv")}
              >
                TV Shows (
                {currentList.filter((item) => item.mediaType === "tv").length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="row">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => renderMediaItem(item, activeTab))
        ) : (
          <div className="col-12">
            {currentList.length === 0 ? (
              renderEmptyState(activeTab)
            ) : (
              <div className="text-center py-5">
                <h4>No {filterType} items found</h4>
                <p className="text-muted">Try selecting a different filter</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Watchlist;
