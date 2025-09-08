import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useWatchlist } from "../../hooks/useWatchlist";
import { getImageUrl } from "../../services/tmdbApi";
import {
  addToWatchlist,
  removeFromWatchlist,
  getUserMediaStatus,
} from "../../services/userService.js";

function MediaCard({ media, showAddButton = false }) {
  const { user } = useAuth();
  const { isInWatchlist, addToWatchlistCache, removeFromWatchlistCache } =
    useWatchlist();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userRating, setUserRating] = useState(0);

  const title = media.title || media.name;
  const releaseDate = media.release_date || media.first_air_date;
  const mediaType = media.media_type || (media.title ? "movie" : "tv");
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : "N/A";
  const rating = media.vote_average ? media.vote_average.toFixed(1) : "N/A";
  const linkUrl = `/${mediaType}/${media.id}`;

  const itemInWatchlist = isInWatchlist(media.id, mediaType);

  useEffect(() => {
    if (user) {
      loadUserRating();
    }
  }, [user, media.id, mediaType]);

  async function loadUserRating() {
    try {
      const status = await getUserMediaStatus(user.uid, media.id, mediaType);
      setUserRating(status.rating || 0);
    } catch (err) {
      console.error("Failed to load user rating:", err);
    }
  }

  async function handleWatchlistToggle(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      if (itemInWatchlist) {
        // Optimistically update UI first
        removeFromWatchlistCache(media.id, mediaType);
        // Then update server
        await removeFromWatchlist(user.uid, media.id, mediaType);
      } else {
        // Optimistically update UI first
        addToWatchlistCache(media.id, mediaType);
        // Then update server
        const mediaData = {
          id: media.id,
          mediaType: mediaType,
          title: title,
          poster_path: media.poster_path,
          vote_average: media.vote_average,
          release_date: releaseDate,
        };
        await addToWatchlist(user.uid, mediaData);
      }
    } catch (err) {
      console.error("Watchlist toggle error:", err);
      // Revert optimistic update on error
      if (itemInWatchlist) {
        addToWatchlistCache(media.id, mediaType);
      } else {
        removeFromWatchlistCache(media.id, mediaType);
      }
      alert("Failed to update watchlist. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="col-md-3 col-sm-6 mb-4">
      <div className="card h-100 shadow-sm">
        <Link to={linkUrl} className="text-decoration-none">
          <img
            src={getImageUrl(media.poster_path)}
            className="card-img-top"
            alt={title}
            style={{
              height: "400px",
              objectFit: "cover",
              cursor: "pointer",
            }}
            onError={(e) => {
              e.target.src =
                "https://via.placeholder.com/300x450/e9ecef/6c757d?text=No+Image";
            }}
          />
        </Link>

        <div className="card-body d-flex flex-column">
          <Link to={linkUrl} className="text-decoration-none text-dark">
            <h6 className="card-title fw-bold" style={{ fontSize: "0.9rem" }}>
              {title}
            </h6>
          </Link>

          <div className="text-muted small mb-2">
            <div className="d-flex justify-content-between">
              <span>{releaseYear}</span>
              <span className="badge bg-warning text-dark">⭐ {rating}</span>
            </div>
            <div className="mt-1 d-flex justify-content-between align-items-center">
              <span className="badge bg-secondary">
                {mediaType === "movie" ? "Movie" : "TV Show"}
              </span>
              {userRating > 0 && (
                <span className="badge bg-success">
                  My Rating: {userRating}/10
                </span>
              )}
            </div>
          </div>

          {/* Overview with truncation */}
          {media.overview && (
            <p className="card-text small text-muted flex-grow-1">
              {media.overview.length > 100
                ? `${media.overview.substring(0, 100)}...`
                : media.overview}
            </p>
          )}

          {/* Action Buttons */}
          {showAddButton && (
            <div className="mt-auto">
              <button
                className={`btn btn-sm w-100 ${
                  itemInWatchlist ? "btn-success" : "btn-primary"
                }`}
                onClick={handleWatchlistToggle}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    {itemInWatchlist ? "Removing..." : "Adding..."}
                  </>
                ) : (
                  <>
                    {itemInWatchlist ? (
                      <>✓ In Watchlist</>
                    ) : (
                      <>+ Add to Watchlist</>
                    )}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MediaCard;
