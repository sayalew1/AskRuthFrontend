import React, { useState } from 'react';
import './SearchBar.css';

interface ApiResponse {
  ok: boolean;
  facts: string[];
  causes: string[];
  failed_urls: string[];
  source_count: number;
  deduped: boolean;
  job_id: string;
  phase: string;
  error?: any;
}

interface SearchBarProps {
  onFactsExtracted: (response: ApiResponse) => void;
  onChunkFactsReady: (facts: string[], fullData: any) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onFactsExtracted, onChunkFactsReady }) => {
  const [searchText, setSearchText] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleGoClick = async () => {
    const url = searchText.trim();
    if (!isValidUrl(url)) return;

    setIsLoading(true);
    try {
      // Add protocol if missing
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;

      const response = await fetch('http://localhost:8000/api/extract-facts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: fullUrl
        })
      });

      const data = await response.json();



      // Pass facts to parent component
      onFactsExtracted(data);

      // Start polling for chunk facts if job_id is available
      if (data.job_id) {

        pollChunkFactsStatus(data.job_id);
      } else {

      }


    } catch (error) {

      // Handle error silently or show user-friendly message
    } finally {
      setIsLoading(false);
    }
  };

  const isValidUrl = (text: string): boolean => {
    try {
      const url = new URL(text);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      // Also check for URLs without protocol
      const urlPattern = /^(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}([\/\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/;
      return urlPattern.test(text);
    }
  };

  const pollChunkFactsStatus = async (jobId: string) => {
    const maxAttempts = 60; // Poll for up to 5 minutes (60 * 5 seconds)
    let attempts = 0;

    const poll = async () => {
      try {

        const timestamp = Date.now();
        const response = await fetch(`http://localhost:8000/api/chunk-facts-status?job_id=${jobId}&_t=${timestamp}`, {
          cache: 'no-cache'
        });
        const data = await response.json();



        if (data.ok) {
          if (data.status === 'done' && data.chunk_facts && data.chunk_facts.facts) {

            onChunkFactsReady(data.chunk_facts.facts, data);
            return;
          } else if (data.status === 'error') {

            return;
          } else {

          }
        } else {

        }


        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {

        }
      } catch (error) {

      }
    };

    // Start polling after a short delay
    setTimeout(poll, 1000);
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
          {isValidUrl(searchText.trim()) && (
            <button className="go-button" onClick={handleGoClick} disabled={isLoading}>
              {isLoading ? (
                <div className="loading-content">
                  <div className="spinner"></div>
                  <span>Extracting...</span>
                </div>
              ) : (
                'Go'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-modal">
            <div className="large-spinner"></div>
            <h3>Extracting Facts</h3>
            <p>Analyzing content with AI to identify key facts, causes, and insights...</p>
          </div>
        </div>
      )}



    </div>
  );
};

export default SearchBar;
