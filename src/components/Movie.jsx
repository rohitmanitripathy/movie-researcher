import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AiOutlineSearch, AiOutlineReload, AiOutlinePlus } from 'react-icons/ai';
import './Movie.css';

const MovieRecommendations = () => {
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastSearch, setLastSearch] = useState('');

  const API_KEY = 'e5610bc4';
  const myKeywords = ['Marvel', 'Batman', 'Disney', 'Star Wars', 'Action', 'Joker'];

  const getMovies = async (titleToSearch, pageNumber = 1, isNewSearch = true) => {
    setLoading(true);
    setErrorMessage('');
    if (isNewSearch) setIsSpinning(true);

    try {
      const response = await axios.get(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${titleToSearch}&type=movie&page=${pageNumber}`);

      if (response.data.Response === "True") {
        const movieResults = response.data.Search;
        
        const detailedList = await Promise.all(
          movieResults.map(async (item) => {
            const details = await axios.get(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${item.imdbID}`);
            return details.data;
          })
        );
        
        if (isNewSearch) {
          setMovies(detailedList);
          setCurrentPage(1);
          setLastSearch(titleToSearch);
        } else {
          // --- UNIQUE FILTER LOGIC ---
          setMovies((prevMovies) => {
            const combinedList = [...prevMovies, ...detailedList];
            
            // We use a Map to keep only unique movies based on their imdbID
            const uniqueMap = new Map();
            combinedList.forEach(movie => uniqueMap.set(movie.imdbID, movie));
            
            return Array.from(uniqueMap.values());
          });
          setCurrentPage(pageNumber);
        }
      } else {
        if (isNewSearch) setMovies([]);
        setErrorMessage(response.data.Error);
      }
    } catch (err) {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => setIsSpinning(false), 500);
    }
  };

  useEffect(() => {
    const randomStart = myKeywords[Math.floor(Math.random() * myKeywords.length)];
    getMovies(randomStart);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim() !== "") getMovies(searchQuery, 1, true);
  };

  const handleRefresh = () => {
    setSearchQuery('');
    const randomWord = myKeywords[Math.floor(Math.random() * myKeywords.length)];
    getMovies(randomWord, 1, true);
  };

  const loadMore = () => {
    getMovies(lastSearch, currentPage + 1, false);
  };

  return (
    <div className="app-container">
      <div className="top-bar">
        <h1>MovieHouse</h1>
        <div className="controls">
          <div className="search-group">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} className="btn-blue"><AiOutlineSearch /></button>
          </div>
          <button className={`refresh-icon ${isSpinning ? 'spin' : ''}`} onClick={handleRefresh}>
            <AiOutlineReload />
          </button>
        </div>
      </div>

      <div className="movie-grid">
        {movies.map((movie) => (
          <div key={movie.imdbID} className="movie-card">
            <img 
              src={movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Image"} 
              alt={movie.Title}
              referrerPolicy="no-referrer"
            />
            <div className="info">
              <span className="genre-pill">{movie.Genre.split(',')[0]}</span>
              <h3>{movie.Title}</h3>
              <p className="rating">⭐ {movie.imdbRating}</p>
              <p className="description">{movie.Plot.substring(0, 60)}...</p>
            </div>
          </div>
        ))}
      </div>

      {loading && <p className="loading-text">Fetching movies...</p>}
      {errorMessage && <p className="error-text">No more movies found or {errorMessage}</p>}

      {!loading && movies.length > 0 && (
        <div className="load-more-container">
          <button onClick={loadMore} className="load-more-btn">
            <AiOutlinePlus /> Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default MovieRecommendations;