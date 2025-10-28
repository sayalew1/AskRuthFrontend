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
  urlCampaignHistory?: { [url: string]: { history: any[] } }; // URL campaign history
  currentUrl?: string; // Current URL
  onUrlSwitch?: (url: string) => void; // Callback when switching URLs
  urlDataCache?: { [url: string]: { storyFacts: string[]; chunkFacts: string[]; chunkFactsData: any; chunkFactsReady: boolean } }; // URL data cache
}

const SearchBar: React.FC<SearchBarProps> = ({
  onFactsExtracted,
  onChunkFactsReady,
  onUrlChanged,
  searchText: externalSearchText,
  onSearchTextChange,
  onGoButtonClicked,
  urlCampaignHistory = {},
  currentUrl: propCurrentUrl,
  onUrlSwitch,
  urlDataCache = {}
}) => {
  const [internalSearchText, setInternalSearchText] = useState('');

  // Use external search text if provided, otherwise use internal state
  const searchText = externalSearchText !== undefined ? externalSearchText : internalSearchText;

  const [isLoading, setIsLoading] = useState(false);
  const [showUrlDropdown, setShowUrlDropdown] = useState(false);
  const [localCurrentUrl, setLocalCurrentUrl] = React.useState('');

  // Use prop currentUrl if provided, otherwise use local state
  const currentUrl = propCurrentUrl !== undefined ? propCurrentUrl : localCurrentUrl;

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

    // Add protocol if missing
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;

    // Notify parent that GO button was clicked (for immediate tab selection)
    if (onGoButtonClicked) {
      onGoButtonClicked();
    }

    // Notify parent about URL change immediately when Go is clicked (with full URL)
    onUrlChanged(fullUrl);

    setIsLoading(true);
    try {
      // Store the current URL for later use
      if (propCurrentUrl === undefined) {
        setLocalCurrentUrl(fullUrl);
      }

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

      // Pass facts to parent component with the URL
      onFactsExtracted({ ...data, url: fullUrl });

      // Start polling for chunk facts if job_id is available
      if (data.job_id) {
        pollChunkFactsStatus(data.job_id, fullUrl, data.facts || []);
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

  const pollChunkFactsStatus = async (jobId: string, urlForPolling: string, storyFactsFromGo: string[]) => {
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
            // Add the original URL and story facts to the chunk facts data
            const chunkFactsWithUrl = {
              ...data,
              original_url: urlForPolling,
              url: urlForPolling,
              storyFacts: storyFactsFromGo
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

  // Get list of all URLs for dropdown - from both campaign history and data cache
  const getAllUrls = () => {
    const urlSet = new Set<string>();

    // Add URLs from campaign history
    Object.keys(urlCampaignHistory).forEach(key => {
      if (!key.startsWith('story-') && (key.startsWith('http://') || key.startsWith('https://'))) {
        urlSet.add(key);
      }
    });

    // Add URLs from data cache
    Object.keys(urlDataCache).forEach(key => {
      if (!key.startsWith('story-') && (key.startsWith('http://') || key.startsWith('https://'))) {
        urlSet.add(key);
      }
    });

    // Add current URL if it's a valid URL
    if (currentUrl && (currentUrl.startsWith('http://') || currentUrl.startsWith('https://'))) {
      urlSet.add(currentUrl);
    }

    return Array.from(urlSet).sort();
  };

  // Format URL for display
  const formatUrlForDisplay = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname.substring(0, 30) + (urlObj.pathname.length > 30 ? '...' : '') : '');
    } catch {
      return url.substring(0, 50) + (url.length > 50 ? '...' : '');
    }
  };

  // Handle URL switch from dropdown
  const handleUrlSwitch = (selectedUrl: string) => {
    setShowUrlDropdown(false);
    if (onUrlSwitch) {
      onUrlSwitch(selectedUrl);
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showUrlDropdown && !target.closest('.search-bar-container')) {
        setShowUrlDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUrlDropdown]);

  const allUrls = getAllUrls();
  const shouldShowDropdown = allUrls.length >= 1;

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

          {/* URL Dropdown Toggle Button - Inside Search Container */}
          {shouldShowDropdown && (
            <button
              className={`url-dropdown-toggle-btn ${showUrlDropdown ? 'open' : ''}`}
              onClick={() => setShowUrlDropdown(!showUrlDropdown)}
              title="View all URLs"
              aria-label="Toggle URL history dropdown"
            >
              ▼
            </button>
          )}

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

        {/* URL Dropdown Menu - Inside Search Bar Container */}
        {shouldShowDropdown && showUrlDropdown && (
          <div className="search-bar-url-menu">
            {allUrls.map((url) => (
              <div
                key={url}
                className={`search-bar-url-item ${url === currentUrl ? 'active' : ''}`}
                onClick={() => handleUrlSwitch(url)}
                title={url}
              >
                <span className="url-text">{formatUrlForDisplay(url)}</span>
                <span className="url-campaigns">
                  {urlCampaignHistory[url]?.history.length || 0} campaigns
                </span>
              </div>
            ))}
          </div>
        )}
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
