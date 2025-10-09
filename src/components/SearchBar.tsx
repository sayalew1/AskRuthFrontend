import React, { useState } from 'react';
import './SearchBar.css';

const SearchBar: React.FC = () => {
  const [searchText, setSearchText] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleGoClick = () => {
    if (searchText.trim()) {
      // Handle the search/go action here
      console.log('Searching for:', searchText);
    }
  };

  return (
    <div className="search-bar-section">
      <div className="search-bar-container">
        <div className="search-container">
          <div className="search-icon">🔗</div>
          <input
            type="text"
            placeholder="Paste links here to factcheck, research and create campaigns."
            className="search-input"
            value={searchText}
            onChange={handleInputChange}
          />
          {searchText.trim() && (
            <button className="go-button" onClick={handleGoClick}>
              Go
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
