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
  onUrlChanged: (url: string) => void;
  searchText?: string; // Allow external control of search text
  onSearchTextChange?: (text: string) => void; // Notify parent of search text changes
  onGoButtonClicked?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onFactsExtracted, onChunkFactsReady, onUrlChanged, searchText: externalSearchText, onSearchTextChange, onGoButtonClicked }) => {
  const [internalSearchText, setInternalSearchText] = useState('');

  // Use external search text if provided, otherwise use internal state
  const searchText = externalSearchText !== undefined ? externalSearchText : internalSearchText;

  const [isLoading, setIsLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = React.useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (externalSearchText !== undefined && onSearchTextChange) {
      // If using external control, notify parent
      onSearchTextChange(newValue);
    } else {
      // Otherwise use internal state
      setInternalSearchText(newValue);
    }
  };

  const handleGoClick = async () => {
    const url = searchText.trim();
    if (!isValidUrl(url)) return;

    // Notify parent that GO button was clicked (for immediate tab selection)
    if (onGoButtonClicked) {
      onGoButtonClicked();
    }

    // Notify parent about URL change immediately when Go is clicked
    onUrlChanged(url);

    setIsLoading(true);
    try {
      // Add protocol if missing
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;

      // Store the current URL for later use
      setCurrentUrl(fullUrl);

      const response = await fetch('/api/extract-facts/', {
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
        const response = await fetch(`/api/chunk-facts-status?job_id=${jobId}&_t=${timestamp}`, {
          cache: 'no-cache'
        });
        const data = await response.json();

        if (data.ok) {
          if (data.status === 'done' && data.chunk_facts && data.chunk_facts.facts) {
            // Add the original URL to the chunk facts data
            const chunkFactsWithUrl = {
              ...data,
              original_url: currentUrl,
              url: currentUrl
            };
            onChunkFactsReady(data.chunk_facts.facts, chunkFactsWithUrl);
            return;
          } else if (data.status === 'error') {
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        }
      } catch (error) {
        // Handle polling error silently
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
        <div className="simple-loading-overlay">
          <div className="simple-spinner"></div>
        </div>
      )}



    </div>
  );
};

export default SearchBar;
