import React, { useState } from 'react';
import './RightSidebar.css';

interface RightSidebarProps {
  variations?: any;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ variations }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState('campaign'); // 'campaign' or 'other'
  const [customCampaignSuggestion, setCustomCampaignSuggestion] = useState(''); // For storing custom combined paragraph
  const [sectionIndices, setSectionIndices] = useState({
    opening_paragraph: 0,
    core_message: 0,
    supporting_evidence: 0,
    emotional_appeal: 0,
    call_to_action: 0
  });

  const images = [
    { id: 1, src: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&h=200&fit=crop&crop=center', alt: 'Polar bears on ice' },
    { id: 2, src: 'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=300&h=200&fit=crop&crop=center', alt: 'Supreme Court building' },
    { id: 3, src: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=300&h=200&fit=crop&crop=center', alt: 'Person with protest sign' }
  ];

  const handleSectionRefresh = (sectionKey: string) => {
    if (!variations || !variations[sectionKey] || variations[sectionKey].length === 0) {
      return;
    }
    setSectionIndices(prev => ({
      ...prev,
      [sectionKey]: (prev[sectionKey] + 1) % variations[sectionKey].length
    }));
  };

  const getSectionContent = (sectionKey: string, defaultContent: string) => {
    if (variations && variations[sectionKey] && variations[sectionKey].length > 0) {
      return variations[sectionKey][sectionIndices[sectionKey]];
    }
    return defaultContent;
  };

  const getCombinedCampaignSuggestion = () => {
    // If user has created a custom suggestion via "Done" button, use that
    if (customCampaignSuggestion) {
      return customCampaignSuggestion;
    }

    // Otherwise, use the default first elements from variations
    if (!variations) {
      return "No campaign suggestions available. Please create a campaign first.";
    }

    const sections = [
      'opening_paragraph',
      'core_message',
      'supporting_evidence',
      'emotional_appeal',
      'call_to_action'
    ];

    const combinedText = sections
      .map(section => {
        if (variations[section] && variations[section].length > 0) {
          return variations[section][0]; // Get first element from each section
        }
        return '';
      })
      .filter(text => text.trim() !== '') // Remove empty sections
      .join(' '); // Join with spaces to form one paragraph

    return combinedText || "Campaign suggestions will appear here after creating a campaign.";
  };

  const handleDoneClick = () => {
    // Get currently showing values from each section
    const sections = [
      'opening_paragraph',
      'core_message',
      'supporting_evidence',
      'emotional_appeal',
      'call_to_action'
    ];

    const currentValues = sections
      .map(section => {
        return getSectionContent(section, '');
      })
      .filter(text => text.trim() !== '') // Remove empty sections
      .join(' '); // Join with spaces to form one paragraph

    // Update the custom campaign suggestion
    setCustomCampaignSuggestion(currentValues);

    // Switch to campaign suggestion view
    setSelectedOption('campaign');
  };

  return (
    <div className="right-sidebar">
      <div className="top-actions">
        <div className="left-buttons">
          <button
            className={`action-button ${selectedOption === 'campaign' ? 'primary' : 'secondary'}`}
            onClick={() => setSelectedOption('campaign')}
          >
            Campaign Suggestion
          </button>
          <button
            className={`action-button ${selectedOption === 'other' ? 'primary' : 'secondary'}`}
            onClick={() => setSelectedOption('other')}
          >
            Other Options
          </button>
        </div>
        <div className="right-buttons">
          <button className="action-button icon">↻</button>
          <button className="action-button secondary">Undo</button>
        </div>
      </div>
      
      <div className="image-carousel">
        <div className="carousel-container">
          {images.map((image, index) => (
            <div key={image.id} className={'carousel-slide ' + (index === currentImageIndex ? 'active' : '')}>
              <img src={image.src} alt={image.alt} />
              <button className="copy-btn">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 2C3 1.44772 3.44772 1 4 1H9L13 5V13C13 13.5523 12.5523 14 12 14H4C3.44772 14 3 13.5523 3 13V2Z"
                        fill="currentColor" stroke="currentColor" strokeWidth="0.5"/>
                  <path d="M9 1V4C9 4.55228 9.44772 5 10 5H13"
                        fill="none" stroke="currentColor" strokeWidth="0.5"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
        <div className="carousel-dots">
          {images.map((_, index) => (
            <button key={index} className={'dot ' + (index === currentImageIndex ? 'active' : '')} onClick={() => setCurrentImageIndex(index)} />
          ))}
        </div>
      </div>

      <div className="additional-text-content">
        {selectedOption === 'campaign' ? (
          // Campaign Suggestions View - Combined paragraph
          <div className="content-section">
            <div className="section-header">
              <h4 className="section-title">Campaign Suggestion</h4>
            </div>
            <p className="section-content">
              {getCombinedCampaignSuggestion()}
            </p>
          </div>
        ) : (
          // Other Options View - Individual sections
          <>
            <div className="content-section">
              <div className="section-header">
                <h4 className="section-title">Opening Paragraph</h4>
                <div className="section-actions">
                  <button className="action-btn refresh-btn" onClick={() => handleSectionRefresh('opening_paragraph')}>↻</button>
                  <button className="action-btn undo-btn">Undo</button>
                </div>
              </div>
              <p className="section-content">
                {getSectionContent('opening_paragraph', 'Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula. 📖')}
              </p>
            </div>

            <div className="content-section">
              <div className="section-header">
                <h4 className="section-title">Core Message</h4>
                <div className="section-actions">
                  <button className="action-btn refresh-btn" onClick={() => handleSectionRefresh('core_message')}>↻</button>
                  <button className="action-btn undo-btn">Undo</button>
                </div>
              </div>
              <p className="section-content">
                {getSectionContent('core_message', 'Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. ❤️')}
              </p>
            </div>

            <div className="content-section">
              <div className="section-header">
                <h4 className="section-title">Supporting Evidence</h4>
                <div className="section-actions">
                  <button className="action-btn refresh-btn" onClick={() => handleSectionRefresh('supporting_evidence')}>↻</button>
                  <button className="action-btn undo-btn">Undo</button>
                </div>
              </div>
              <p className="section-content">
                {getSectionContent('supporting_evidence', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes. 😊')}
              </p>
            </div>

            <div className="content-section">
              <div className="section-header">
                <h4 className="section-title">Emotional Appeal</h4>
                <div className="section-actions">
                  <button className="action-btn refresh-btn" onClick={() => handleSectionRefresh('emotional_appeal')}>↻</button>
                  <button className="action-btn undo-btn">Undo</button>
                </div>
              </div>
              <p className="section-content">
                {getSectionContent('emotional_appeal', 'Maecenas nec odio et ante tincidunt tempus. Donec vitae sapien ut libero venenatis faucibus. 😊')}
              </p>
            </div>

            <div className="content-section">
              <div className="section-header">
                <h4 className="section-title">Call to Action</h4>
                <div className="section-actions">
                  <button className="action-btn refresh-btn" onClick={() => handleSectionRefresh('call_to_action')}>↻</button>
                  <button className="action-btn undo-btn">Undo</button>
                </div>
              </div>
              <p className="section-content">
                {getSectionContent('call_to_action', 'Nulla facilisi morbi tempus iaculis urna id volutpat lacus laoreet non curabitur gravida arcu ac tortor dignissim convallis aenean et tortor at risus viverra adipiscing at in tellus. 🎯')}
              </p>
            </div>
          </>
        )}
      </div>

      {selectedOption === 'other' && (
        <div className="bottom-buttons">
          <button className="cancel-btn">Cancel</button>
          <button className="done-btn" onClick={handleDoneClick}>Done</button>
        </div>
      )}
    </div>
  );
};

export default RightSidebar;
