import React, { useEffect } from 'react';
import './MainContent.css';

interface MainContentProps {
  storyFacts: string[];
  chunkFacts: string[];
  chunkFactsReady: boolean;
  chunkFactsData: any;
}

const MainContent: React.FC<MainContentProps> = ({ storyFacts, chunkFacts, chunkFactsReady, chunkFactsData }) => {
  const tabs = ['Story Facts', 'Related Facts & Data', 'Sources'];
  const [activeTab, setActiveTab] = React.useState(-1); // Start with no tab selected
  const [activeSocialChannel, setActiveSocialChannel] = React.useState(0);
  const [activeActionButton, setActiveActionButton] = React.useState(0);
  const [activeCharacteristic, setActiveCharacteristic] = React.useState(0);
  const [showAllFacts, setShowAllFacts] = React.useState(false);
  const [campaignResponse, setCampaignResponse] = React.useState<any>(null);
  const [isCreatingCampaign, setIsCreatingCampaign] = React.useState(false);

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

  const handleCreateCampaign = async () => {
    if (!chunkFactsData || !isCreateCampaignEnabled()) return;

    setIsCreatingCampaign(true);
    try {
      // Map the selected options to the expected format
      const socialChannelMap = ['Plain Text', 'Instagram', 'Facebook', 'Blue Sky'];
      const goalMap = ['donate', 'spread', 'protest', 'contact'];
      const voiceToPersonalityMap = [
        'charismatic_leader',      // Charismatic
        'logical_analyst',         // Logical
        'passionate_advocate',     // Passionate
        'empathetic_connector',    // Empathetic
        'pragmatic_strategist',    // Strategic
        'fearless_challenger',     // Adversarial
        'diplomatic_peacemaker',   // Diplomatic
        'resilient_survivor'       // Empowered
      ];

      const requestBody = {
        url_facts: chunkFactsData.url_facts || storyFacts,
        rag_facts: chunkFactsData.chunk_facts?.facts || chunkFacts,
        personality_type: voiceToPersonalityMap[activeCharacteristic],
        goal: goalMap[activeActionButton],
        by_cause: chunkFactsData.chunk_facts?.by_cause || {}
      };

      const response = await fetch('http://localhost:8000/api/generate-from-facts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      setCampaignResponse(data);

      // Pass variations to parent component
      if (data.ok && data.variations && onVariationsGenerated) {
        onVariationsGenerated(data.variations);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setIsCreatingCampaign(false);
    }
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
            disabled={!isCreateCampaignEnabled() || isCreatingCampaign}
          >
            {isCreatingCampaign ? 'Creating Campaign...' : 'Create Campaign ✨'}
          </button>
        </div>

        {campaignResponse && (
          <div className="campaign-response">
            <div className="campaign-response-header">
              <h3>🎯 Campaign Generated Successfully!</h3>
              <button
                className="close-response-btn"
                onClick={() => setCampaignResponse(null)}
              >
                ×
              </button>
            </div>

            <div className="campaign-response-content">
              {campaignResponse.url_facts && (
                <div className="response-section">
                  <h4>📰 Story Facts</h4>
                  <ul className="response-facts-list">
                    {campaignResponse.url_facts.map((fact: string, index: number) => (
                      <li key={index}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}

              {campaignResponse.req_facts && (
                <div className="response-section">
                  <h4>🔍 Related Facts</h4>
                  <ul className="response-facts-list">
                    {campaignResponse.req_facts.map((fact: string, index: number) => (
                      <li key={index}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="response-section">
                <h4>⚙️ Campaign Settings</h4>
                <div className="campaign-settings">
                  <div className="setting-item">
                    <span className="setting-label">Goal:</span>
                    <span className="setting-value">{campaignResponse.goal || 'Not specified'}</span>
                  </div>
                  <div className="setting-item">
                    <span className="setting-label">Personality:</span>
                    <span className="setting-value">{campaignResponse.personality_type || 'Not specified'}</span>
                  </div>
                  {campaignResponse.by_cause && Object.keys(campaignResponse.by_cause).length > 0 && (
                    <div className="setting-item">
                      <span className="setting-label">By Cause:</span>
                      <div className="cause-mapping">
                        {Object.entries(campaignResponse.by_cause).map(([cause, facts]: [string, any]) => (
                          <div key={cause} className="cause-item">
                            <strong>{cause}:</strong>
                            <span>{Array.isArray(facts) ? `${facts.length} facts` : facts}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Raw Response Section */}
              <div className="response-section">
                <h4>🔍 Complete API Response</h4>
                <div className="raw-response">
                  <pre style={{
                    background: '#f5f5f5',
                    padding: '15px',
                    borderRadius: '8px',
                    overflow: 'auto',
                    maxHeight: '400px',
                    fontSize: '12px',
                    border: '1px solid #ddd'
                  }}>
                    {JSON.stringify(campaignResponse, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainContent;
