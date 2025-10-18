import React, { useEffect, useRef } from 'react';
import './MainContent.css';
import NoFactsPopup from './NoFactsPopup';

interface StoryData {
  story: {
    id: number;
    title: string;
    summary: string;
    hero_image_url: string;
    published_at: string;
  };
  facts: {
    story_facts: Array<{
      text: string;
      metadata: {
        source_url: string;
      };
    }>;
    related_facts: Array<{
      text: string;
      metadata: {
        source_url: string;
      };
    }>;
  };
  sources: Array<{
    url: string;
    title?: string;
  }>;
  chips?: {
    channels: Array<{
      id: number;
      code: string;
      name: string;
      character_limit: number;
      image_aspect_ratio: string;
      instructions: string;
    }>;
    goals: Array<{
      id: number;
      slug: string;
      name: string;
      description: string;
    }>;
    voices: Array<{
      id: number;
      slug: string;
      name: string;
      description: string;
    }>;
    selected: {
      channels: number[];
      goals: number[];
      voices: number[];
    };
  };
}

interface MainContentProps {
  storyFacts: string[];
  chunkFacts: string[];
  chunkFactsReady: boolean;
  chunkFactsData: any;
  onVariationsGenerated?: (variations: any) => void;
  currentUrl: string;
  onUrlSwitch?: (url: string) => void;
  goButtonClicked?: boolean;
  storyData?: StoryData | null;
  isLoadingStory?: boolean;
  shouldActivateStoryTab?: boolean;
  onStoryTabActivated?: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ storyFacts, chunkFacts, chunkFactsReady, chunkFactsData, onVariationsGenerated, currentUrl, onUrlSwitch, goButtonClicked, storyData, isLoadingStory, shouldActivateStoryTab, onStoryTabActivated }) => {
  const mainContentRef = useRef<HTMLDivElement>(null);
  const tabs = ['Story Facts', 'Related Facts & Data', 'Sources'];
  const [activeTab, setActiveTab] = React.useState(-1); // Start with no tab selected
  const [activeSocialChannel, setActiveSocialChannel] = React.useState(0);
  const [activeActionButton, setActiveActionButton] = React.useState(0);
  const [activeCharacteristic, setActiveCharacteristic] = React.useState(0);
  const [showAllFacts, setShowAllFacts] = React.useState(false);
  const [campaignResponse, setCampaignResponse] = React.useState<any>(null);
  const [isCreatingCampaign, setIsCreatingCampaign] = React.useState(false);
  const [lastCampaignSettings, setLastCampaignSettings] = React.useState<{
    socialChannel: number;
    actionButton: number;
    characteristic: number;
  } | null>(null);

  // Track campaign history per URL
  const [urlCampaignHistory, setUrlCampaignHistory] = React.useState<{
    [url: string]: {
      history: any[];
      currentIndex: number;
      lastSettings: {
        socialChannel: number;
        actionButton: number;
        characteristic: number;
      } | null;
    }
  }>({});

  // currentUrl is now passed as a prop from App.tsx
  const [showUndoRedo, setShowUndoRedo] = React.useState(false);
  const [isNewUrlSession, setIsNewUrlSession] = React.useState(true);
  const [showUrlDropdown, setShowUrlDropdown] = React.useState(false);
  const [showNoFactsPopup, setShowNoFactsPopup] = React.useState(false);

  // Effect to measure and sync component height with right sidebar
  useEffect(() => {
    const updateHeight = () => {
      if (mainContentRef.current) {
        const height = mainContentRef.current.scrollHeight;
        document.documentElement.style.setProperty('--component-height', `${height}px`);
      }
    };

    // Update on mount and when content changes
    updateHeight();

    // Use ResizeObserver to watch for size changes
    const resizeObserver = new ResizeObserver(updateHeight);
    if (mainContentRef.current) {
      resizeObserver.observe(mainContentRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Effect to activate Story Facts tab when story data is loaded
  useEffect(() => {
    if (shouldActivateStoryTab && storyData?.facts?.story_facts?.length) {
      setActiveTab(0); // Activate Story Facts tab (index 0)
      if (onStoryTabActivated) {
        onStoryTabActivated();
      }
    }
  }, [shouldActivateStoryTab, storyData, onStoryTabActivated]);

  // Automatically select "Story Facts" tab when GO button is clicked
  useEffect(() => {
    if (goButtonClicked) {
      setActiveTab(0); // Select "Story Facts" tab immediately when GO is clicked
      setShowAllFacts(false); // Collapse facts if they were expanded (Show Less)
    }
  }, [goButtonClicked]);

  // Automatically select "Story Facts" tab when facts are received from API (fallback)
  useEffect(() => {
    if (storyFacts.length > 0 && activeTab === -1) {
      setActiveTab(0); // Select "Story Facts" tab
      // Hide popup if it's showing since we now have facts
      setShowNoFactsPopup(false);
    }
  }, [storyFacts, activeTab]);

  // Hide popup when chunk facts are received
  useEffect(() => {
    if (chunkFacts.length > 0) {
      setShowNoFactsPopup(false);
    }
  }, [chunkFacts.length]);

  // Set default selections based on API chips data
  useEffect(() => {
    if (storyData?.chips?.selected) {
      const { channels, goals, voices } = storyData.chips.selected;

      // Set default channel selection (use first selected channel or 0)
      if (channels && channels.length > 0 && storyData.chips.channels) {
        const channelIndex = storyData.chips.channels.findIndex(ch => ch.id === channels[0]);
        if (channelIndex !== -1) {
          setActiveSocialChannel(channelIndex);
        }
      }

      // Set default goal selection (use first selected goal or 0)
      if (goals && goals.length > 0 && storyData.chips.goals) {
        const goalIndex = storyData.chips.goals.findIndex(g => g.id === goals[0]);
        if (goalIndex !== -1) {
          setActiveActionButton(goalIndex);
        }
      }

      // Set default voice selection (use first selected voice or 0)
      if (voices && voices.length > 0 && storyData.chips.voices) {
        const voiceIndex = storyData.chips.voices.findIndex(v => v.id === voices[0]);
        if (voiceIndex !== -1) {
          setActiveCharacteristic(voiceIndex);
        }
      }
    } else {
      // Reset to defaults when no story data or switching to a story without chips
      setActiveSocialChannel(0);
      setActiveActionButton(0);
      setActiveCharacteristic(0);
    }
  }, [storyData]);

  // Default buttons (fallback when no chips data available)
  const defaultSocialChannels = [
    { name: 'Plain Text', active: true, description: null },
    { name: 'Bluesky', active: false, description: null },
    { name: 'Email', active: false, description: null },
    { name: 'Facebook', active: false, description: null },
    { name: 'Instagram', active: false, description: null },
    { name: 'TikTok', active: false, description: null },
    { name: 'Twitter/X', active: false, description: null },
    { name: 'Website', active: false, description: null }
  ];

  const defaultActionButtons = [
    { name: 'Contact Your Rep', color: '#dc2626', description: null },
    { name: 'Donate', color: '#059669', description: null },
    { name: 'Go to a Protest', color: '#7c3aed', description: null },
    { name: 'Spread the Word', color: '#0891b2', description: null },
    { name: 'Volunteer', color: '#f59e0b', description: null }
  ];

  const defaultCharacteristicTags = [
    'Charismatic', 'Diplomatic', 'Empathetic', 'Empowered', 'Logical',
    'Passionate', 'Strategic'
  ];

  // Dynamic buttons from API or fallback to defaults
  const socialChannels = storyData?.chips?.channels ?
    storyData.chips.channels.map(channel => ({
      name: channel.name,
      active: true,
      description: channel.instructions || null
    })) : defaultSocialChannels;

  const actionButtons = storyData?.chips?.goals ?
    storyData.chips.goals.map(goal => ({
      name: goal.name,
      color: '#dc2626', // Default color, could be enhanced later
      description: goal.description || "Coming Soon"
    })) : defaultActionButtons;

  const characteristicTags = storyData?.chips?.voices ?
    storyData.chips.voices.map(voice => voice.name) : defaultCharacteristicTags;

  const handleCreateCampaign = async () => {
    if (!chunkFactsData || !isCreateCampaignEnabled()) return;

    setIsCreatingCampaign(true);
    try {
      // Map the selected options to the expected format
      const socialChannelMap = ['plain_text', 'bluesky', 'email', 'facebook', 'instagram', 'tiktok', 'twitter', 'website'];
      const goalMap = ['contact', 'donate', 'protest', 'spread', 'volunteer'];
      const voiceToPersonalityMap = [
        'charismatic_leader',      // Charismatic
        'diplomatic_peacemaker',   // Diplomatic
        'empathetic_connector',    // Empathetic
        'resilient_survivor',      // Empowered
        'logical_analyst',         // Logical
        'passionate_advocate',     // Passionate
        'pragmatic_strategist'     // Strategic
      ];

      const requestBody = {
        url_facts: chunkFactsData.url_facts || storyFacts,
        rag_facts: chunkFactsData.chunk_facts?.facts || chunkFacts,
        personality_type: voiceToPersonalityMap[activeCharacteristic],
        goal: goalMap[activeActionButton],
        by_cause: chunkFactsData.chunk_facts?.by_cause || {}
      };

      const response = await fetch('/api/generate-from-facts/', {
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

        // Add to campaign history for current URL
        const newHistoryEntry = {
          response: data,
          timestamp: new Date().toISOString(),
          settings: {
            socialChannel: activeSocialChannel,
            actionButton: activeActionButton,
            characteristic: activeCharacteristic
          }
        };

        // Get current URL's data
        const urlData = getCurrentUrlData();

        // If this is a new URL session, start with fresh history (reset to 1/1)
        let updatedHistory;
        let newIndex;

        if (isNewUrlSession) {
          updatedHistory = [newHistoryEntry]; // Start fresh with just this entry
          newIndex = 0; // First entry (1/1)
          setIsNewUrlSession(false); // Mark session as no longer new
        } else {
          // Continue existing history for this URL
          updatedHistory = [...urlData.history, newHistoryEntry];
          newIndex = updatedHistory.length - 1;
        }

        // Update URL-specific data
        updateUrlData({
          history: updatedHistory,
          currentIndex: newIndex,
          lastSettings: {
            socialChannel: activeSocialChannel,
            actionButton: activeActionButton,
            characteristic: activeCharacteristic
          }
        });



        // Save the current settings as the last campaign settings
        setLastCampaignSettings({
          socialChannel: activeSocialChannel,
          actionButton: activeActionButton,
          characteristic: activeCharacteristic
        });

        // Show undo/redo buttons after first refresh (second campaign) for this URL
        if (updatedHistory.length > 1) {
          setShowUndoRedo(true);
        }

        // Note: All campaign data is preserved in urlCampaignHistory for this URL
        // This includes all previous sessions' data, but UI starts fresh each time
      }
    } catch (error) {
      // Handle error silently
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

  // Helper functions for URL-based campaign history
  const getCurrentUrlData = () => {
    return urlCampaignHistory[currentUrl] || {
      history: [],
      currentIndex: -1,
      lastSettings: null
    };
  };

  const updateUrlData = (updates: Partial<{
    history: any[];
    currentIndex: number;
    lastSettings: any;
  }>) => {


    setUrlCampaignHistory(prev => {
      const newHistory = {
        ...prev,
        [currentUrl]: {
          ...getCurrentUrlData(),
          ...updates
        }
      };

      return newHistory;
    });
  };

  // Check if we should show Refresh button (only for current active session)
  const isRefreshMode = () => {
    // Only show "Refresh" if:
    // 1. User has created a campaign in current session (campaignResponse exists)
    // 2. AND we're not in a new URL session (facts are ready for current URL)
    // 3. AND the current URL has campaign history
    const urlData = getCurrentUrlData();
    const hasCurrentCampaign = campaignResponse !== null;
    const hasUrlHistory = urlData.history.length > 0;
    const factsAreReady = chunkFactsReady;

    const shouldShowRefresh = hasCurrentCampaign && !isNewUrlSession && hasUrlHistory && factsAreReady;

    return shouldShowRefresh;
  };

  // Undo function - go back in history for current URL
  const handleUndo = () => {
    const urlData = getCurrentUrlData();
    if (urlData.currentIndex > 0) {
      const newIndex = urlData.currentIndex - 1;
      const historyEntry = urlData.history[newIndex];

      updateUrlData({ currentIndex: newIndex });
      setCampaignResponse(historyEntry.response);

      // Restore the campaign settings from this history entry
      if (historyEntry.settings) {
        setActiveSocialChannel(historyEntry.settings.socialChannel);
        setActiveActionButton(historyEntry.settings.actionButton);
        setActiveCharacteristic(historyEntry.settings.characteristic);
      }

      if (onVariationsGenerated) {
        onVariationsGenerated(historyEntry.response.variations);
      }
    }
  };

  // Redo function - go forward in history for current URL
  const handleRedo = () => {
    const urlData = getCurrentUrlData();
    if (urlData.currentIndex < urlData.history.length - 1) {
      const newIndex = urlData.currentIndex + 1;
      const historyEntry = urlData.history[newIndex];

      updateUrlData({ currentIndex: newIndex });
      setCampaignResponse(historyEntry.response);

      // Restore the campaign settings from this history entry
      if (historyEntry.settings) {
        setActiveSocialChannel(historyEntry.settings.socialChannel);
        setActiveActionButton(historyEntry.settings.actionButton);
        setActiveCharacteristic(historyEntry.settings.characteristic);
      }

      if (onVariationsGenerated) {
        onVariationsGenerated(historyEntry.response.variations);
      }
    }
  };

  // Check if undo is available for current URL
  const canUndo = () => {
    const urlData = getCurrentUrlData();
    return urlData.currentIndex > 0;
  };

  // Check if redo is available for current URL
  const canRedo = () => {
    const urlData = getCurrentUrlData();
    return urlData.currentIndex < urlData.history.length - 1;
  };

  // Handle switching to a different URL from dropdown
  const handleUrlSwitch = (selectedUrl: string) => {


    // Notify parent component about the URL switch
    if (onUrlSwitch) {
      onUrlSwitch(selectedUrl);
    }

    setShowUrlDropdown(false);
    setIsNewUrlSession(false); // Not a new session since we're switching back



    // Get the selected URL's data and restore its state
    const urlData = urlCampaignHistory[selectedUrl];
    if (urlData && urlData.history.length > 0) {
      // Always go to the LAST (most recent) campaign for this URL
      const lastIndex = urlData.history.length - 1;
      const latestEntry = urlData.history[lastIndex];

      // Update the URL data to point to the last campaign
      const updatedUrlData = {
        ...urlData,
        currentIndex: lastIndex
      };

      setUrlCampaignHistory(prev => ({
        ...prev,
        [selectedUrl]: updatedUrlData
      }));

      setCampaignResponse(latestEntry.response);
      setLastCampaignSettings(urlData.lastSettings);
      setShowUndoRedo(urlData.history.length > 1);

      // Restore the campaign settings from the latest entry
      if (latestEntry.settings) {
        setActiveSocialChannel(latestEntry.settings.socialChannel);
        setActiveActionButton(latestEntry.settings.actionButton);
        setActiveCharacteristic(latestEntry.settings.characteristic);
      }

      if (onVariationsGenerated) {
        onVariationsGenerated(latestEntry.response.variations);
      }
    } else {
      // URL has no history, show fresh state
      setCampaignResponse(null);
      setShowUndoRedo(false);
      setLastCampaignSettings(null);

      // Reset selections to default values for fresh URL
      setActiveSocialChannel(0);
      setActiveActionButton(0);
      setActiveCharacteristic(0);

      if (onVariationsGenerated) {
        onVariationsGenerated(null);
      }
    }
  };

  // Get list of all URLs for dropdown (filter out session-based URLs)
  const getAllUrls = () => {
    const urls = Object.keys(urlCampaignHistory).filter(url =>
      url.startsWith('http://') || url.startsWith('https://')
    );
    if (currentUrl && !urls.includes(currentUrl) && (currentUrl.startsWith('http://') || currentUrl.startsWith('https://'))) {
      urls.push(currentUrl);
    }

    return urls.sort();
  };

  // Format URL for display (show domain + path, truncate if too long)
  const formatUrlForDisplay = (url: string) => {
    try {
      const urlObj = new URL(url);
      const display = urlObj.hostname + urlObj.pathname;
      return display.length > 30 ? display.substring(0, 27) + '...' : display;
    } catch {
      return url.length > 30 ? url.substring(0, 27) + '...' : url;
    }
  };

  // Handle new URL - reset campaign state but preserve all URL histories
  // Handle new URL - reset to fresh state like first website visit
  const handleNewUrl = (url: string) => {
    // If this is a different URL, completely reset the UI to initial state
    if (url !== currentUrl) {
      // Note: currentUrl is now a prop, so we can't set it directly

      // Always reset to fresh state for new URL (like first website visit)
      setCampaignResponse(null);
      setShowUndoRedo(false);
      setLastCampaignSettings(null);

      // Reset selections to default values for new URL
      setActiveSocialChannel(0);
      setActiveActionButton(0);
      setActiveCharacteristic(0);

      // Clear variations from parent component
      if (onVariationsGenerated) {
        onVariationsGenerated(null);
      }

      // Note: We preserve all URL history data in urlCampaignHistory
      // but don't restore it to the UI - user starts fresh
    }
  };

  // Effect to immediately reset UI when new facts start loading (GO button clicked)
  React.useEffect(() => {


    // IMMEDIATELY reset UI when any new facts data comes in (GO button clicked)
    if (chunkFactsData) {
      // Reset UI to fresh state immediately
      setCampaignResponse(null);
      setShowUndoRedo(false);
      setLastCampaignSettings(null);
      setIsNewUrlSession(true); // Mark as new URL session

      // Clear variations from parent component
      if (onVariationsGenerated) {
        onVariationsGenerated(null);
      }

      // Extract URL for tracking
      let url = '';

      // Try all possible URL extraction methods
      if (chunkFactsData.original_url) {
        url = chunkFactsData.original_url;
      } else if (chunkFactsData.url) {
        url = chunkFactsData.url;
      } else if (chunkFactsData.source_url) {
        url = chunkFactsData.source_url;
      }

      // Update current URL for tracking
      if (url && url.startsWith('http')) {
        // Clean up session-based URLs only if we have multiple real URLs
        const realUrls = Object.keys(urlCampaignHistory).filter(u => u.startsWith('http'));
        const sessionUrls = Object.keys(urlCampaignHistory).filter(u => u.startsWith('session-'));

        // Only clean up if we have at least 2 real URLs (including current one)
        if (realUrls.length >= 1 && sessionUrls.length > 0) {
          const cleanedHistory = { ...urlCampaignHistory };
          sessionUrls.forEach(sessionUrl => {
            delete cleanedHistory[sessionUrl];
          });

          setUrlCampaignHistory(cleanedHistory);
        }

        // Note: currentUrl is now a prop, so we can't set it directly


      } else {
        // This should not happen anymore, but keep as fallback
        const fallbackUrl = `session-${Date.now()}`;
        // Note: currentUrl is now a prop, so we can't set it directly
      }
    }
  }, [chunkFactsData]);

  // Show popup when both story facts and related facts are empty after processing
  useEffect(() => {
    // Only show popup if:
    // 1. We have processed a URL (chunkFactsReady is true, meaning processing is complete)
    // 2. Both story facts and chunk facts are empty
    // 3. We have a current URL (meaning user actually tried to process something)
    if (chunkFactsReady && storyFacts.length === 0 && chunkFacts.length === 0 && currentUrl && currentUrl.trim() !== '') {
      setShowNoFactsPopup(true);
    }
  }, [chunkFactsReady, storyFacts.length, chunkFacts.length, currentUrl]);

  // URL is now managed by App.tsx and passed as a prop - no complex synchronization needed!



  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showUrlDropdown && !target.closest('.url-dropdown-container-left')) {
        setShowUrlDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUrlDropdown]);

  // Display logic for facts based on active tab
  const getCurrentFacts = () => {
    if (activeTab === 0) {
      // Story Facts tab - prioritize story data if available
      if (storyData?.facts?.story_facts && storyData.facts.story_facts.length > 0) {
        return storyData.facts.story_facts.map(fact => fact.text);
      } else if (storyFacts.length > 0) {
        return storyFacts;
      } else {
        return [
          "No facts extracted yet. Use the search bar above to analyze an article.",
          "Enter a valid URL and click 'Go' to extract key facts from news articles.",
          "AI will analyze the content and identify important information."
        ];
      }
    } else if (activeTab === 1) {
      // Related Facts & Data tab - prioritize story data if available
      if (storyData?.facts?.related_facts && storyData.facts.related_facts.length > 0) {
        return storyData.facts.related_facts.map(fact => fact.text);
      } else if (chunkFacts.length > 0) {
        return chunkFacts;
      } else {
        return [
          "Related facts are being processed...",
          "This may take a few moments to complete.",
          "Additional context will appear here when ready."
        ];
      }
    } else if (activeTab === 2) {
      // Sources tab - prioritize story data if available
      if (storyData?.sources && storyData.sources.length > 0) {
        return storyData.sources.map(source => source.url);
      } else {
        const sources = chunkFactsData?.chunk_facts?.sources || [];
        if (sources.length > 0) {
          return sources.map((source: any) => source.title || 'Untitled Source');
        } else if (chunkFactsReady) {
          return [
            "No sources found for this article.",
            "Sources will appear here when available from the analysis."
          ];
        } else {
          return [
            "Sources are being processed...",
            "This may take a few moments to complete.",
            "Source links will appear here when ready."
          ];
        }
      }
    }
    return [
      "Select a tab above to view facts.",
      "Story Facts will show immediate results from URL analysis.",
      "Related Facts & Data will show additional contextual information."
    ];
  };

  const displayFacts = getCurrentFacts();

  // For Sources tab, always show all sources (don't limit with Show More/Less)
  const factsToShow = (activeTab === 2) ? displayFacts : (showAllFacts ? displayFacts : displayFacts.slice(0, 3));
  const hasMoreFacts = (activeTab === 2) ? false : displayFacts.length > 3;

  // Handler to close the no facts popup
  const handleCloseNoFactsPopup = () => {
    setShowNoFactsPopup(false);
  };

  return (
    <div className="main-content" ref={mainContentRef}>
      <div className="content-header">
        <h1>{storyData?.story?.title || "Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero"}</h1>
      </div>

      <div className="tabs">
        {tabs.map((tab, index) => {
          const isStoryFacts = index === 0;
          const isRelatedFacts = index === 1;
          const isSources = index === 2;
          const sources = chunkFactsData?.chunk_facts?.sources || [];
          const isDisabled = (isStoryFacts && !storyData?.facts?.story_facts?.length && storyFacts.length === 0) ||
                           (isRelatedFacts && !storyData?.facts?.related_facts?.length && (!chunkFactsReady || chunkFacts.length === 0)) ||
                           (isSources && !storyData?.sources?.length && (!chunkFactsReady || sources.length === 0));

          return (
            <button
              key={index}
              className={`tab ${activeTab === index ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => {
                if (!isDisabled) {
                  setActiveTab(index);
                  // Reset showAllFacts when switching to Sources tab since it doesn't use Show More/Less
                  if (index === 2) {
                    setShowAllFacts(false);
                  }
                }
              }}
              disabled={isDisabled}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div className={`content-body ${showAllFacts ? 'expanded-facts' : ''}`}>
        <div className="main-text">
          <div className={`facts-container ${showAllFacts ? 'expanded' : ''}`}>
            <ul className="facts-list">
              {factsToShow.map((fact, index) => {
                const isPlaceholder = (activeTab === 0 && !storyData?.facts?.story_facts && storyFacts.length === 0) ||
                                    (activeTab === 1 && !storyData?.facts?.related_facts && chunkFacts.length === 0) ||
                                    (activeTab === 2 && !storyData?.sources && (!chunkFactsReady || (chunkFactsData?.chunk_facts?.sources || []).length === 0));

                // Handle Sources tab with clickable links
                if (activeTab === 2 && !isPlaceholder) {
                  // Check if we have story data sources first
                  if (storyData?.sources && storyData.sources.length > 0) {
                    const source = storyData.sources[index];
                    if (source && source.url) {
                      return (
                        <li key={index} className="extracted-fact source-fact">
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="source-link"
                          >
                            {fact}
                          </a>
                        </li>
                      );
                    }
                  } else {
                    // Fallback to chunk facts sources
                    const sources = chunkFactsData?.chunk_facts?.sources || [];
                    const source = sources[index];
                    if (source && source.url) {
                      return (
                        <li key={index} className="extracted-fact source-fact">
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="source-link"
                          >
                            {fact}
                          </a>
                        </li>
                      );
                    }
                  }
                }

                // Handle Story Facts and Related Facts with source URLs
                if ((activeTab === 0 || activeTab === 1) && !isPlaceholder) {
                  let sourceUrl = null;

                  if (activeTab === 0 && storyData?.facts?.story_facts) {
                    const storyFact = storyData.facts.story_facts[index];
                    sourceUrl = storyFact?.metadata?.source_url;
                  } else if (activeTab === 1 && storyData?.facts?.related_facts) {
                    const relatedFact = storyData.facts.related_facts[index];
                    sourceUrl = relatedFact?.metadata?.source_url;
                  }

                  return (
                    <li key={index} className={isPlaceholder ? 'placeholder-fact' : 'extracted-fact'}>
                      <span className="fact-text">
                        {fact}
                        {sourceUrl && (
                          <>
                            {' '}
                            <a
                              href={sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="source-link-small"
                            >
                              Source
                            </a>
                          </>
                        )}
                      </span>
                    </li>
                  );
                }

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
                {showAllFacts ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>

        </div>

        <div className="divider"></div>

        <div className={`bottom-sections ${showAllFacts ? 'compressed' : ''}`}>
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
          {activeSocialChannel !== null && activeSocialChannel >= 0 && socialChannels[activeSocialChannel].description && (
            <div className="social-description">
              {socialChannels[activeSocialChannel].description}
            </div>
          )}
        </div>

        <div className="goal-section">
          <h3>Goal</h3>
          <div className="goal-buttons">
            {actionButtons.map((button, index) => (
              <button
                key={index}
                className={`goal-btn ${activeActionButton === index ? 'active' : ''}`}
                onClick={() => handleActionButtonClick(index)}
              >
                {button.name}
              </button>
            ))}
          </div>
          {activeActionButton !== null && activeActionButton >= 0 && (
            <div className="goal-description">
              {actionButtons[activeActionButton].description}
            </div>
          )}
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
          <div className="campaign-section-layout">
            {/* URL Dropdown positioned on the far left - always render container for layout */}
            <div className="url-dropdown-container-left">
              {(() => {
                const allUrls = getAllUrls();
                const totalHistoryUrls = Object.keys(urlCampaignHistory).length;
                const shouldShow = totalHistoryUrls > 1; // Show dropdown when there are multiple URLs in history (even if some filtered)

                return shouldShow ? (
                  <>
                    <button
                      className={`url-dropdown-btn ${showUrlDropdown ? 'open' : ''}`}
                      onClick={() => {
                        setShowUrlDropdown(!showUrlDropdown);
                      }}
                      title="Switch to previous URL"

                    >
                      <span className="dropdown-text">All URLs</span>
                      <span className="dropdown-icon">🌐</span>
                      <span className="dropdown-arrow">▼</span>
                    </button>

                    {showUrlDropdown && (
                      <div className="url-dropdown-menu">
                        {getAllUrls().map((url) => (
                          <div
                            key={url}
                            className={`url-dropdown-item ${url === currentUrl ? 'active' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleUrlSwitch(url);
                            }}
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
                  </>
                ) : null;
              })()}
            </div>

            <div className="campaign-buttons-container">
              <button
              className={`create-btn ${!isCreateCampaignEnabled() ? 'disabled' : ''} ${(() => {
                const urlData = getCurrentUrlData();
                const shouldSlideLeft = showUndoRedo && !isNewUrlSession && urlData.history.length > 1;
                return shouldSlideLeft ? 'slide-left' : '';
              })()} ${getAllUrls().length > 1 ? 'with-dropdown' : ''}`}
              onClick={handleCreateCampaign}
              disabled={!isCreateCampaignEnabled() || isCreatingCampaign}
            >
              {isCreatingCampaign ? (
                <div className="button-loading-content">
                  <div className="button-spinner"></div>
                </div>
              ) : (
                (() => {
                  const refreshMode = isRefreshMode();
                  const buttonText = refreshMode ? 'Refresh ✨' : 'Create Campaign ✨';

                  return buttonText;
                })()
              )}
            </button>

            {(() => {
              // Only show undo/redo buttons if:
              // 1. showUndoRedo is true
              // 2. NOT in a new URL session
              // 3. Current URL has multiple campaigns
              const urlData = getCurrentUrlData();
              const shouldShowButtons = showUndoRedo && !isNewUrlSession && urlData.history.length > 1;
              return shouldShowButtons;
            })() && (
              <div className="undo-redo-buttons">
                <button
                  className={`undo-btn ${!canUndo() ? 'disabled' : ''}`}
                  onClick={handleUndo}
                  disabled={!canUndo()}
                  title={`Previous (${getCurrentUrlData().currentIndex + 1}/${getCurrentUrlData().history.length})`}
                >
                  ←
                </button>

                {canRedo() && (
                  <button
                    className="redo-btn"
                    onClick={handleRedo}
                    title={`Next (${getCurrentUrlData().currentIndex + 2}/${getCurrentUrlData().history.length})`}
                  >
                    →
                  </button>
                )}
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Loading Overlay for Campaign Creation */}
        {isCreatingCampaign && (
          <div className="simple-loading-overlay">
            <div className="simple-spinner"></div>
          </div>
        )}

        </div> {/* End of bottom-sections */}
      </div>

      {/* Loading Overlay for Story Data */}
      {isLoadingStory && (
        <div className="simple-loading-overlay">
          <div className="simple-spinner"></div>
        </div>
      )}

      {/* No Facts Popup */}
      <NoFactsPopup
        isVisible={showNoFactsPopup}
        onClose={handleCloseNoFactsPopup}
      />
    </div>
  );
};

export default MainContent;
