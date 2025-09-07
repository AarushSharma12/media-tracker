import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useWatchlist } from "../../hooks/useWatchlist";
import { getImageUrl } from "../../services/tmdbApi";
import {
  addToWatchlist,
  removeFromWatchlist,
  addRating,
  getUserMediaStatus,
} from "../../services/userService.js";
import Modal from "../common/Modal";

function MediaCard({ media, showAddButton = false }) {
  const { user } = useAuth();
  const { isInWatchlist, addToWatchlistCache, removeFromWatchlistCache } =
    useWatchlist();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);

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

  async function handleRating(rating) {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setRatingLoading(true);
      await addRating(user.uid, media.id, mediaType, rating);
      setUserRating(rating);
      setShowRatingModal(false);
      setHoverRating(0);
    } catch (err) {
      console.error("Failed to save rating:", err);
      alert("Failed to save rating. Please try again.");
    } finally {
      setRatingLoading(false);
    }
  }

  function handleRateClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    setShowRatingModal(true);
  }

  function handleCloseModal() {
    setShowRatingModal(false);
    setHoverRating(0);
  }

  const ratingStars = [...Array(10)].map((_, index) => {
    const starValue = index + 1;
    const isFilled = starValue <= (hoverRating || userRating);
    return (
      <i
        key={starValue}
        className={`bi bi-star${isFilled ? "-fill" : ""} fs-4 mx-1`}
        style={{
          cursor: "pointer",
          color: isFilled ? "#ffc107" : "#6c757d",
          transition: "color 0.2s ease",
          userSelect: "none",
          pointerEvents: ratingLoading ? "none" : "auto",
        }}
        onMouseEnter={() => !ratingLoading && setHoverRating(starValue)}
        onMouseLeave={() => !ratingLoading && setHoverRating(0)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!ratingLoading) {
            handleRating(starValue);
          }
        }}
      />
    );
  });

  return (
    <>
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
                <div className="d-flex gap-2 mb-2">
                  <button
                    className={`btn btn-sm flex-fill ${
                      itemInWatchlist ? "btn-success" : "btn-primary"
                    }`}
                    onClick={handleWatchlistToggle}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-1"
                          role="status"
                        ></span>
                        {itemInWatchlist ? "Removing..." : "Adding..."}
                      </>
                    ) : (
                      <>{itemInWatchlist ? <>✓ In List</> : <>+ Watchlist</>}</>
                    )}
                  </button>

                  <button
                    className={`btn btn-sm ${
                      userRating > 0 ? "btn-warning" : "btn-outline-warning"
                    }`}
                    onClick={handleRateClick}
                    disabled={ratingLoading}
                    title={
                      userRating > 0
                        ? `Your rating: ${userRating}/10`
                        : "Rate this"
                    }
                  >
                    {ratingLoading ? (
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                      ></span>
                    ) : (
                      <>
                        <i className="bi bi-star-fill"></i>
                        {userRating > 0 ? ` ${userRating}` : " Rate"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <Modal
          show={showRatingModal}
          onHide={handleCloseModal}
          title={`Rate "${title}"`}
          size="modal-md"
        >
          <div className="text-center">
            <div className="mb-3" style={{ lineHeight: "1" }}>
              {ratingStars}
            </div>
            <p className="fs-4 text-warning mb-4">
              {hoverRating || userRating || 0}/10
            </p>
            <div className="d-flex gap-2 justify-content-center">
              {userRating > 0 && (
                <button
                  className="btn btn-outline-danger"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRating(0);
                  }}
                  disabled={ratingLoading}
                >
                  {ratingLoading ? (
                    <span className="spinner-border spinner-border-sm me-1" />
                  ) : (
                    "Remove Rating"
                  )}
                </button>
              )}
              <button
                className="btn btn-secondary"
                onClick={handleCloseModal}
                disabled={ratingLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default MediaCard;
