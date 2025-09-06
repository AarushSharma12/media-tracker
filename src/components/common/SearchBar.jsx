import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SearchBar = ({ placeholder = "Search movies and TV shows..." }) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      // Navigate to search results page with query parameter
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

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
};

export default SearchBar;
