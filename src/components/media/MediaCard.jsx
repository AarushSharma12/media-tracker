import { Link } from "react-router-dom";
import { getImageUrl } from "../../services/tmdbApi";

function MediaCard({ media, showAddButton = false }) {
  const title = media.title || media.name;
  const releaseDate = media.release_date || media.first_air_date;
  const mediaType = media.media_type || (media.title ? "movie" : "tv");
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : "N/A";
  const rating = media.vote_average ? media.vote_average.toFixed(1) : "N/A";
  const linkUrl = `/${mediaType}/${media.id}`;

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
            <div className="mt-1">
              <span className="badge bg-secondary">
                {mediaType === "movie" ? "Movie" : "TV Show"}
              </span>
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

          {/* Add to Watchlist Button */}
          {showAddButton && (
            <div className="mt-auto">
              <button
                className="btn btn-primary btn-sm w-100"
                onClick={(e) => {
                  e.preventDefault();
                  // TODO: Add to watchlist functionality
                }}
              >
                + Add to Watchlist
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MediaCard;
