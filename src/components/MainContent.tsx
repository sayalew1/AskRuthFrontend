import React, { useEffect } from 'react';
import './MainContent.css';

interface MainContentProps {
  storyFacts: string[];
  chunkFacts: string[];
  chunkFactsReady: boolean;
}

const MainContent: React.FC<MainContentProps> = ({ storyFacts, chunkFacts, chunkFactsReady }) => {
  const tabs = ['Story Facts', 'Related Facts & Data', 'Sources'];
  const [activeTab, setActiveTab] = React.useState(-1); // Start with no tab selected
  const [activeSocialChannel, setActiveSocialChannel] = React.useState(0);
  const [activeActionButton, setActiveActionButton] = React.useState(0);
  const [activeCharacteristic, setActiveCharacteristic] = React.useState(0);
  const [showAllFacts, setShowAllFacts] = React.useState(false);

  // Automatically select "Story Facts" tab when facts are received from API
  useEffect(() => {
    if (storyFacts.length > 0 && activeTab === -1) {
      setActiveTab(0); // Select "Story Facts" tab
    }
  }, [storyFacts, activeTab]);

  const socialChannels = [
    { name: 'Plain Text', active: true },
    { name: 'Instagram', active: false },
    { name: 'Facebook', active: false },
    { name: 'Blue Sky', active: false }
  ];

  const actionButtons = [
    { name: 'Donate', color: '#dc2626' },
    { name: 'Spread the Word', color: '#059669' },
    { name: 'Go to a Protest', color: '#7c3aed' },
    { name: 'Contact your Rep', color: '#0891b2' }
  ];

  const voiceOptions = ['Voice'];
  const characteristicTags = [
    'Charismatic', 'Logical', 'Passionate', 'Empathetic', 'Strategic',
    'Adversarial', 'Diplomatic', 'Empowered'
  ];

  const handleCreateCampaign = () => {
    alert('Create Campaign clicked!');
  };

  // Check if Create Campaign button should be enabled
  const isCreateCampaignEnabled = () => {
    const hasStoryFacts = storyFacts.length > 0;
    const hasChunkFacts = chunkFactsReady && chunkFacts.length > 0;
    const hasSocialChannel = activeSocialChannel !== null && activeSocialChannel >= 0;
    const hasGoal = activeActionButton !== null && activeActionButton >= 0;
    const hasVoice = activeCharacteristic !== null && activeCharacteristic >= 0;

    return hasStoryFacts && hasChunkFacts && hasSocialChannel && hasGoal && hasVoice;
  };

  const handleSocialChannelClick = (index: number) => {
    setActiveSocialChannel(index);
  };

  const handleActionButtonClick = (index: number) => {
    setActiveActionButton(index);
  };

  const handleCharacteristicClick = (index: number) => {
    setActiveCharacteristic(index);
  };

  const handleShowMore = () => {
    setShowAllFacts(!showAllFacts);
  };

  // Display logic for facts based on active tab
  const getCurrentFacts = () => {
    if (activeTab === 0) {
      // Story Facts tab
      return storyFacts.length > 0 ? storyFacts : [
        "No facts extracted yet. Use the search bar above to analyze an article.",
        "Enter a valid URL and click 'Go' to extract key facts from news articles.",
        "AI will analyze the content and identify important information."
      ];
    } else if (activeTab === 1) {
      // Related Facts & Data tab
      return chunkFacts.length > 0 ? chunkFacts : [
        "Related facts are being processed...",
        "This may take a few moments to complete.",
        "Additional context will appear here when ready."
      ];
    }
    return [
      "Select a tab above to view facts.",
      "Story Facts will show immediate results from URL analysis.",
      "Related Facts & Data will show additional contextual information."
    ];
  };

  const displayFacts = getCurrentFacts();
  const factsToShow = showAllFacts ? displayFacts : displayFacts.slice(0, 3);
  const hasMoreFacts = displayFacts.length > 3;

  return (
    <div className="main-content">
      <div className="content-header">
        <h1>Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero</h1>
      </div>

      <div className="tabs">
        {tabs.map((tab, index) => {
          const isStoryFacts = index === 0;
          const isRelatedFacts = index === 1;
          const isDisabled = (isStoryFacts && storyFacts.length === 0) || (isRelatedFacts && !chunkFactsReady);



          return (
            <button
              key={index}
              className={`tab ${activeTab === index ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => !isDisabled && setActiveTab(index)}
              disabled={isDisabled}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div className="content-body">
        <div className="main-text">
          <div className="facts-container">
            <ul className="facts-list">
              {factsToShow.map((fact, index) => {
                const isPlaceholder = (activeTab === 0 && storyFacts.length === 0) ||
                                    (activeTab === 1 && chunkFacts.length === 0);
                return (
                  <li key={index} className={isPlaceholder ? 'placeholder-fact' : 'extracted-fact'}>
                    {fact}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="show-more-container">
            {hasMoreFacts && (
              <button className="show-more-btn" onClick={handleShowMore}>
                {showAllFacts ? 'Show Less' : `Show More (${displayFacts.length - 3} more)`}
              </button>
            )}
          </div>

        </div>

        <div className="divider"></div>

        <div className="social-section">
          <h3>Social Media Channel</h3>
          <div className="social-channels">
            {socialChannels.map((channel, index) => (
              <button
                key={index}
                className={`channel-btn ${activeSocialChannel === index ? 'active' : ''}`}
                onClick={() => handleSocialChannelClick(index)}
              >
                {channel.name}
              </button>
            ))}
          </div>
        </div>

        <div className="goal-section">
          <h3>Goal</h3>
          <div className="action-buttons-grid">
            {actionButtons.map((button, index) => (
              <button
                key={index}
                className={`action-btn ${activeActionButton === index ? 'active' : ''}`}
                onClick={() => handleActionButtonClick(index)}
              >
                {button.name}
              </button>
            ))}
          </div>
        </div>

        <div className="voice-section">
          <h3>Voice</h3>
          <div className="characteristic-tags">
            {characteristicTags.map((tag, index) => (
              <button
                key={index}
                className={`characteristic-tag ${activeCharacteristic === index ? 'active' : ''}`}
                onClick={() => handleCharacteristicClick(index)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="create-campaign">
          <button
            className={`create-btn ${!isCreateCampaignEnabled() ? 'disabled' : ''}`}
            onClick={handleCreateCampaign}
            disabled={!isCreateCampaignEnabled()}
          >
            Create Campaign ✨
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainContent;
