import React from 'react';
import './NoFactsPopup.css';

interface NoFactsPopupProps {
  isVisible: boolean;
  onClose: () => void;
}

const NoFactsPopup: React.FC<NoFactsPopupProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <div className="popup-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2" fill="#fef3c7"/>
              <path d="M12 8v4" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 16h.01" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h3 className="popup-title">No Facts Found</h3>
        </div>
        
        <div className="popup-body">
          <p className="popup-message">
            We couldn't extract any facts from the provided URL. This might happen if:
          </p>
          
          <ul className="popup-reasons">
            <li>The article content is behind a paywall</li>
            <li>The page requires JavaScript to load content</li>
            <li>The URL contains mostly multimedia content</li>
            <li>The website blocks automated content extraction</li>
            <li>The article is too short or lacks substantial text</li>
          </ul>
          
          <div className="popup-suggestions">
            <h4>Try these suggestions:</h4>
            <ul>
              <li>Use a different news article URL</li>
              <li>Try a direct article link instead of a homepage</li>
              <li>Ensure the URL is publicly accessible</li>
              <li>Check if the article has substantial text content</li>
            </ul>
          </div>
        </div>
        
        <div className="popup-footer">
          <button className="popup-close-btn" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoFactsPopup;
