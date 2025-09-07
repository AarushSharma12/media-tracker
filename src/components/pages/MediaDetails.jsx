import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useWatchlist } from "../../hooks/useWatchlist";
import {
  getMediaDetails,
  getMediaCredits,
  getMediaVideos,
  getSimilarMedia,
} from "../../services/tmdbApi";
import {
  addToWatchlist,
  removeFromWatchlist,
  getUserMediaStatus,
  updateWatchedStatus,
  addRating,
} from "../../services/userService";
import LoadingSpinner from "../common/LoadingSpinner";
import MediaCard from "../media/MediaCard";
import Modal from "../common/Modal";

function MediaDetails() {
  const { mediaType, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isInWatchlist, addToWatchlistCache, removeFromWatchlistCache } =
    useWatchlist();

  const [media, setMedia] = useState(null);
  const [credits, setCredits] = useState(null);
  const [videos, setVideos] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isWatched, setIsWatched] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    fetchMediaData();
    if (user) {
      checkUserStatus();
    }
  }, [id, mediaType, user]);

  async function fetchMediaData() {
    try {
      setLoading(true);
      setError(null);
      const [mediaData, creditsData, videosData, similarData] =
        await Promise.all([
          getMediaDetails(mediaType, id),
          getMediaCredits(mediaType, id),
          getMediaVideos(mediaType, id),
          getSimilarMedia(mediaType, id),
        ]);
      setMedia(mediaData);
      setCredits(creditsData);
      setVideos(videosData.results || []);
      setSimilar(similarData.results || []);
    } catch (err) {
      setError("Failed to load media details. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function checkUserStatus() {
    if (!user) return;
    try {
      const status = await getUserMediaStatus(user.uid, id, mediaType);
      setIsWatched(status.watched || false);
      setUserRating(status.rating || 0);
    } catch (err) {}
  }

  async function handleWatchlistToggle() {
    if (!user) {
      navigate("/login");
      return;
    }

    const currentlyInWatchlist = isInWatchlist(id, mediaType);

    try {
      if (currentlyInWatchlist) {
        removeFromWatchlistCache(id, mediaType);
        await removeFromWatchlist(user.uid, id, mediaType);
      } else {
        addToWatchlistCache(id, mediaType);
        const mediaData = {
          id,
          mediaType,
          title: media.title || media.name,
          poster_path: media.poster_path,
          vote_average: media.vote_average,
          release_date: media.release_date || media.first_air_date,
        };
        await addToWatchlist(user.uid, mediaData);
      }
    } catch (err) {
      // Revert on error
      if (currentlyInWatchlist) {
        addToWatchlistCache(id, mediaType);
      } else {
        removeFromWatchlistCache(id, mediaType);
      }
      alert("Failed to update watchlist. Please try again.");
    }
  }

  function handleWatchedToggle() {
    if (!user) {
      navigate("/login");
      return;
    }
    async function toggleWatched() {
      try {
        const mediaData = isWatched
          ? null
          : {
              title: media.title || media.name,
              poster_path: media.poster_path,
              vote_average: media.vote_average,
              release_date: media.release_date || media.first_air_date,
            };

        await updateWatchedStatus(
          user.uid,
          id,
          mediaType,
          !isWatched,
          mediaData
        );
        setIsWatched(!isWatched);
      } catch (err) {
        console.error("Failed to update watched status:", err);
      }
    }
    toggleWatched();
  }

  function handleRating(rating) {
    if (!user) {
      navigate("/login");
      return;
    }
    async function saveRating() {
      try {
        await addRating(user.uid, id, mediaType, rating);
        setUserRating(rating);
        setShowRatingModal(false);
        setHoverRating(0);
      } catch (err) {}
    }
    saveRating();
  }

  function handleCloseModal() {
    setShowRatingModal(false);
    setHoverRating(0);
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning" role="alert">
          Media not found
        </div>
      </div>
    );
  }

  const releaseYear =
    media.release_date || media.first_air_date
      ? new Date(media.release_date || media.first_air_date).getFullYear()
      : null;
  const runtime = media.runtime || media.episode_run_time?.[0];
  const trailer = videos.find(
    (v) => v.type === "Trailer" && v.site === "YouTube"
  );
  const director = credits?.crew?.find((person) => person.job === "Director");
  const topCast = credits?.cast?.slice(0, 6) || [];

  const ratingStars = [...Array(10)].map((_, index) => {
    const starValue = index + 1;
    const isFilled = starValue <= (hoverRating || userRating);
    return (
      <i
        key={starValue}
        className={`bi bi-star${isFilled ? "-fill" : ""} fs-3 mx-1`}
        style={{ cursor: "pointer", color: isFilled ? "#ffc107" : "#6c757d" }}
        onMouseEnter={() => setHoverRating(starValue)}
        onMouseLeave={() => setHoverRating(0)}
        onClick={() => handleRating(starValue)}
      ></i>
    );
  });

  const similarMediaCards = similar
    .slice(0, 6)
    .map((item) => (
      <MediaCard key={item.id} media={item} showAddButton={!!user} />
    ));

  const castCards = topCast.map((actor) => (
    <div key={actor.id} className="col-6 col-md-4 col-lg-2">
      <div className="card h-100 bg-dark text-white">
        <img
          src={
            actor.profile_path
              ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
              : "/placeholder-person.png"
          }
          className="card-img-top"
          alt={actor.name}
        />
        <div className="card-body p-2">
          <h6 className="card-title mb-1">{actor.name}</h6>
          <p className="card-text small text-muted">{actor.character}</p>
        </div>
      </div>
    </div>
  ));

  return (
    <div className="bg-dark text-white min-vh-100">
      {/* Hero Section */}
      <div
        className="position-relative"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.9)), 
                           url(https://image.tmdb.org/t/p/original${media.backdrop_path})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "70vh",
        }}
      >
        <div className="container py-5">
          <div className="row">
            <div className="col-12 col-md-4 col-lg-3">
              <img
                src={
                  media.poster_path
                    ? `https://image.tmdb.org/t/p/w500${media.poster_path}`
                    : "/placeholder-poster.png"
                }
                className="img-fluid rounded shadow-lg"
                alt={media.title || media.name}
              />
            </div>
            <div className="col-12 col-md-8 col-lg-9 mt-4 mt-md-0">
              <h1 className="display-4 fw-bold">
                {media.title || media.name}
                {releaseYear && (
                  <span className="fw-light text-muted"> ({releaseYear})</span>
                )}
              </h1>
              <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                <span className="badge bg-warning text-dark fs-6">
                  <i className="bi bi-star-fill me-1"></i>
                  {media.vote_average?.toFixed(1)}/10
                </span>
                {runtime && (
                  <span className="text-muted">
                    <i className="bi bi-clock me-1"></i>
                    {runtime} min
                  </span>
                )}
              </div>
              {media.genres && (
                <div className="mb-3">
                  {media.genres.map((genre) => (
                    <span key={genre.id} className="badge bg-secondary me-2">
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
              <p className="lead">{media.overview}</p>
              {director && (
                <p className="mb-4">
                  <strong>Director:</strong> {director.name}
                </p>
              )}
              {/* Action Buttons */}
              <div className="d-flex flex-wrap gap-2">
                <button
                  className={`btn ${
                    isInWatchlist(id, mediaType)
                      ? "btn-success"
                      : "btn-outline-light"
                  }`}
                  onClick={handleWatchlistToggle}
                >
                  <i
                    className={`bi bi-${
                      isInWatchlist(id, mediaType)
                        ? "check-circle-fill"
                        : "plus-circle"
                    } me-2`}
                  ></i>
                  {isInWatchlist(id, mediaType)
                    ? "In Watchlist"
                    : "Add to Watchlist"}
                </button>
                <button
                  className={`btn ${
                    isWatched ? "btn-info" : "btn-outline-info"
                  }`}
                  onClick={handleWatchedToggle}
                >
                  <i
                    className={`bi bi-${isWatched ? "eye-fill" : "eye"} me-2`}
                  ></i>
                  {isWatched ? "Watched" : "Mark as Watched"}
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => setShowRatingModal(true)}
                >
                  <i className="bi bi-star me-2"></i>
                  {userRating ? `Rated: ${userRating}/10` : "Rate"}
                </button>
                {trailer && (
                  <a
                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-danger"
                  >
                    <i className="bi bi-play-circle-fill me-2"></i>
                    Watch Trailer
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cast Section */}
      {topCast.length > 0 && (
        <section className="container my-5">
          <h2 className="mb-4 border-bottom border-secondary pb-2">Top Cast</h2>
          <div className="row g-3">{castCards}</div>
        </section>
      )}

      {/* Additional Info Section */}
      <section className="container my-5">
        <h2 className="mb-4 border-bottom border-secondary pb-2">Details</h2>
        <div className="row g-3 bg-secondary bg-opacity-10 rounded p-3">
          {media.status && (
            <div className="col-md-6 col-lg-3">
              <strong className="text-info">Status:</strong> {media.status}
            </div>
          )}
          {media.original_language && (
            <div className="col-md-6 col-lg-3">
              <strong className="text-info">Language:</strong>{" "}
              {media.original_language.toUpperCase()}
            </div>
          )}
          {media.budget > 0 && (
            <div className="col-md-6 col-lg-3">
              <strong className="text-info">Budget:</strong> $
              {media.budget.toLocaleString()}
            </div>
          )}
          {media.revenue > 0 && (
            <div className="col-md-6 col-lg-3">
              <strong className="text-info">Revenue:</strong> $
              {media.revenue.toLocaleString()}
            </div>
          )}
          {media.number_of_seasons && (
            <div className="col-md-6 col-lg-3">
              <strong className="text-info">Seasons:</strong>{" "}
              {media.number_of_seasons}
            </div>
          )}
          {media.number_of_episodes && (
            <div className="col-md-6 col-lg-3">
              <strong className="text-info">Episodes:</strong>{" "}
              {media.number_of_episodes}
            </div>
          )}
        </div>
      </section>

      {/* Similar Media Section */}
      {similar.length > 0 && (
        <section className="container my-5">
          <h2 className="mb-4 border-bottom border-secondary pb-2">
            You Might Also Like
          </h2>
          <div className="row">{similarMediaCards}</div>
        </section>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <Modal
          show={showRatingModal}
          onHide={handleCloseModal}
          title={`Rate this ${mediaType === "movie" ? "Movie" : "Show"}`}
        >
          <div className="text-center">
            <div className="mb-3">{ratingStars}</div>
            <p className="fs-4 text-warning mb-4">
              {hoverRating || userRating || 0}/10
            </p>
            <button className="btn btn-secondary" onClick={handleCloseModal}>
              Cancels
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default MediaDetails;
