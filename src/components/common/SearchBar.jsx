import { useState } from "react";
import { useNavigate } from "react-router-dom";

function SearchBar({ placeholder = "Search movies and TV shows..." }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  function handleChange(event) {
    setQuery(event.target.value);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="d-flex me-3"
      style={{ minWidth: "300px" }}
    >
      <input
        className="form-control me-2"
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
      />
      <button
        className="btn btn-outline-light"
        type="submit"
        disabled={!query.trim()}
      >
        🔍
      </button>
    </form>
  );
}

export default SearchBar;
