import React, { useState, useEffect } from 'react';
import './RightSidebar.css';

interface RightSidebarProps {
  variations?: any;
  campaignData?: any;
  campaignFilters?: any;
  selectedButtons?: { socialChannel: number; goal: number; voice: number } | null;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ variations, campaignData, campaignFilters, selectedButtons }) => {
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
  const [selectedSocialChannel, setSelectedSocialChannel] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [campaignContent, setCampaignContent] = useState<any>(null);

  // Clear RightSidebar state when campaignData becomes null (new story clicked)
  useEffect(() => {
    if (!campaignData) {
      setCurrentImageIndex(0);
      setSelectedOption('campaign');
      setCustomCampaignSuggestion('');
      setSectionIndices({
        opening_paragraph: 0,
        core_message: 0,
        supporting_evidence: 0,
        emotional_appeal: 0,
        call_to_action: 0
      });
      setSelectedSocialChannel(null);
      setSelectedGoal(null);
      setSelectedVoice(null);
      setCampaignContent(null);
    }
  }, [campaignData]);

  // Initialize campaign data with default values (first combination excluding "neutral" voice)
  useEffect(() => {
    if (campaignData?.matrix?.charismatic) {
      const charismatic = campaignData.matrix.charismatic;

      // Get first social media channel
      const socialChannels = Object.keys(charismatic);
      if (socialChannels.length > 0) {
        const firstChannel = socialChannels[0];
        setSelectedSocialChannel(firstChannel);

        // Get first goal
        const goals = Object.keys(charismatic[firstChannel]);
        if (goals.length > 0) {
          const firstGoal = goals[0];
          setSelectedGoal(firstGoal);

          // Get first voice that is not "neutral"
          const voices = Object.keys(charismatic[firstChannel][firstGoal]);
          const firstVoice = voices.find(v => v !== 'neutral') || voices[0];
          setSelectedVoice(firstVoice);

          // Set the campaign content
          const content = charismatic[firstChannel][firstGoal][firstVoice];
          console.log('Campaign content loaded:', { firstChannel, firstGoal, firstVoice, content });
          setCampaignContent(content);
        }
      }
    }
  }, [campaignData]);

  // Update campaign content when button selections change
  useEffect(() => {
    if (selectedButtons && campaignData?.matrix?.charismatic && campaignFilters) {
      const charismatic = campaignData.matrix.charismatic;

      // Get the selected channel, goal, and voice names from filters
      const selectedChannel = campaignFilters.channels?.[selectedButtons.socialChannel]?.code;
      const selectedGoal = campaignFilters.goals?.[selectedButtons.goal]?.slug;
      const selectedVoice = campaignFilters.voices?.[selectedButtons.voice]?.slug;

      if (selectedChannel && selectedGoal && selectedVoice) {
        // Check if this combination exists in the campaign data
        const content = charismatic[selectedChannel]?.[selectedGoal]?.[selectedVoice];
        if (content) {
          setSelectedSocialChannel(selectedChannel);
          setSelectedGoal(selectedGoal);
          setSelectedVoice(selectedVoice);
          setCampaignContent(content);
        }
      }
    }
  }, [selectedButtons, campaignData, campaignFilters]);

  // Reset sidebar state when variations change (e.g., when switching URLs)
  useEffect(() => {
    // Reset section indices to 0 when variations change
    setSectionIndices({
      opening_paragraph: 0,
      core_message: 0,
      supporting_evidence: 0,
      emotional_appeal: 0,
      call_to_action: 0
    });

    // Clear custom campaign suggestion when variations change
    setCustomCampaignSuggestion('');

    // Reset to campaign view when new variations are loaded
    setSelectedOption('campaign');
  }, [variations]);

  const images = [
    { id: 1, src: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&h=200&fit=crop&crop=center', alt: 'Polar bears on ice' },
    { id: 2, src: 'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=300&h=200&fit=crop&crop=center', alt: 'Supreme Court building' },
    { id: 3, src: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=300&h=200&fit=crop&crop=center', alt: 'Person with protest sign' },
    { id: 4, src: 'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=300&h=200&fit=crop&crop=center', alt: 'Supreme Court building 2' }
  ];

  const handleSectionRefresh = (sectionKey: string) => {
    // Check campaign data first, then variations
    const data = campaignContent?.[sectionKey] || variations?.[sectionKey];
    if (!data || data.length === 0) {
      return;
    }
    setSectionIndices(prev => ({
      ...prev,
      [sectionKey]: Math.floor(Math.random() * data.length)
    }));
  };

  const handleSectionPrevious = (sectionKey: string) => {
    // Check campaign data first, then variations
    const data = campaignContent?.[sectionKey] || variations?.[sectionKey];
    if (!data || data.length === 0) {
      return;
    }
    setSectionIndices(prev => ({
      ...prev,
      [sectionKey]: (prev[sectionKey] - 1 + data.length) % data.length
    }));
  };

  const handleSectionNext = (sectionKey: string) => {
    // Check campaign data first, then variations
    const data = campaignContent?.[sectionKey] || variations?.[sectionKey];
    if (!data || data.length === 0) {
      return;
    }
    setSectionIndices(prev => ({
      ...prev,
      [sectionKey]: (prev[sectionKey] + 1) % data.length
    }));
  };

  const getSectionContent = (sectionKey: string, defaultContent: string) => {
    // First check campaign data
    if (campaignContent && campaignContent[sectionKey] && campaignContent[sectionKey].length > 0) {
      return campaignContent[sectionKey][sectionIndices[sectionKey]];
    }
    // Then check variations
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

    // If campaign data is available, use that
    if (campaignContent) {
      const sections = [
        'opening_paragraph',
        'core_message',
        'supporting_evidence',
        'emotional_appeal',
        'call_to_action'
      ];

      const combinedText = sections
        .map(section => {
          if (campaignContent[section] && campaignContent[section].length > 0) {
            return campaignContent[section][0]; // Get first element from each section
          }
          return '';
        })
        .filter(text => text.trim() !== '') // Remove empty sections
        .join(' '); // Join with spaces to form one paragraph

      if (combinedText) {
        return combinedText;
      }
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

      </div>
      
      <div className="image-carousel">
        <div className="carousel-container">
          {images.map((image, index) => (
            <div key={image.id} className={'carousel-slide ' + (index === currentImageIndex ? 'active' : '')}>
              <img src={image.src} alt={image.alt} />
              {index < 3 && (
                <button className="copy-btn">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Back rectangle (copy) */}
                    <rect x="5" y="3" width="8" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2"/>
                    {/* Front rectangle (original) */}
                    <rect x="3" y="1" width="8" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                </button>
              )}
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
                  <button className="action-btn prev-btn" onClick={() => handleSectionPrevious('opening_paragraph')}>←</button>
                  <button className="action-btn next-btn" onClick={() => handleSectionNext('opening_paragraph')}>→</button>
                </div>
              </div>
              <p className="section-content">
                {getSectionContent('opening_paragraph', 'Please create a campaign to view Opening Paragraph')}
              </p>
            </div>

            <div className="content-section">
              <div className="section-header">
                <h4 className="section-title">Core Message</h4>
                <div className="section-actions">
                  <button className="action-btn prev-btn" onClick={() => handleSectionPrevious('core_message')}>←</button>
                  <button className="action-btn next-btn" onClick={() => handleSectionNext('core_message')}>→</button>
                </div>
              </div>
              <p className="section-content">
                {getSectionContent('core_message', 'Please create a campaign to view Core Message')}
              </p>
            </div>

            <div className="content-section">
              <div className="section-header">
                <h4 className="section-title">Supporting Evidence</h4>
                <div className="section-actions">
                  <button className="action-btn prev-btn" onClick={() => handleSectionPrevious('supporting_evidence')}>←</button>
                  <button className="action-btn next-btn" onClick={() => handleSectionNext('supporting_evidence')}>→</button>
                </div>
              </div>
              <p className="section-content">
                {getSectionContent('supporting_evidence', 'Please create a campaign to view Supporting Evidence')}
              </p>
            </div>

            <div className="content-section">
              <div className="section-header">
                <h4 className="section-title">Emotional Appeal</h4>
                <div className="section-actions">
                  <button className="action-btn prev-btn" onClick={() => handleSectionPrevious('emotional_appeal')}>←</button>
                  <button className="action-btn next-btn" onClick={() => handleSectionNext('emotional_appeal')}>→</button>
                </div>
              </div>
              <p className="section-content">
                {getSectionContent('emotional_appeal', 'Please create a campaign to view Emotional Appeal')}
              </p>
            </div>

            <div className="content-section">
              <div className="section-header">
                <h4 className="section-title">Call to Action</h4>
                <div className="section-actions">
                  <button className="action-btn prev-btn" onClick={() => handleSectionPrevious('call_to_action')}>←</button>
                  <button className="action-btn next-btn" onClick={() => handleSectionNext('call_to_action')}>→</button>
                </div>
              </div>
              <p className="section-content">
                {getSectionContent('call_to_action', 'Please create a campaign to view Call to Action')}
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
