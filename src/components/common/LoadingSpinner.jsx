const LoadingSpinner = ({ message = "Loading...", size = "medium" }) => {
  const spinnerSize = size === "small" ? "spinner-border-sm" : "";

  return (
    <div className="d-flex flex-column justify-content-center align-items-center py-5">
      <div
        className={`spinner-border text-primary ${spinnerSize}`}
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && <p className="mt-3 text-muted">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
