import React, { useEffect, useRef } from 'react';
import './MainContent.css';
import NoFactsPopup from './NoFactsPopup';

interface Fact {
  id: number;
  text: string;
  confidence: number;
  metadata: {
    topics: string[];
    publisher: string;
    source_url: string;
    jurisdictions: string[];
  };
  article: {
    id: number;
    url: string;
    headline: string;
    publisher: string;
    published_at: string | null;
    image_url: string;
  };
}

interface Source {
  id: number;
  url: string;
  headline: string;
  publisher: string;
  published_at: string | null;
  image_url: string;
}

interface StoryData {
  facts: Fact[];
  related_facts: Fact[];
  sources: Source[];
  meta: {
    story_updated_at: string;
    facts_last_updated: string;
    related_last_updated: string;
    articles_last_published: string;
    facts_count: number;
    related_facts_count: number;
    sources_count: number;
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
  storyTitle?: string;
  campaignFilters?: any;
  isLoadingStory?: boolean;
  shouldActivateStoryTab?: boolean;
  onStoryTabActivated?: () => void;
  onButtonSelectionChange?: (channelCode: string, goalSlug: string, voiceSlug: string) => void;
  campaignData?: any;
  currentFactsForCampaign?: { url_facts: string[]; rag_facts: { facts: string[] } } | null;
}

const MainContent: React.FC<MainContentProps> = ({ storyFacts, chunkFacts, chunkFactsReady, chunkFactsData, onVariationsGenerated, currentUrl, onUrlSwitch, goButtonClicked, storyData, storyTitle, campaignFilters, isLoadingStory, shouldActivateStoryTab, onStoryTabActivated, onButtonSelectionChange, campaignData, currentFactsForCampaign }) => {
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
    if (shouldActivateStoryTab && storyData?.facts?.length) {
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

      // Set default goal selection (use reordered campaignFilters.goals if available, otherwise use storyData.chips.goals)
      if (goals && goals.length > 0) {
        const goalsArray = campaignFilters?.goals || storyData.chips.goals;
        const goalIndex = goalsArray.findIndex((g: any) => g.id === goals[0]);
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
  }, [storyData, campaignFilters]);

  // Default buttons (fallback when no chips data available)
  const defaultSocialChannels = [
    { name: 'Plain Text', active: true, description: null },
    { name: 'Instagram', active: false, description: 'Coming Soon' },
    { name: 'Facebook', active: false, description: 'Coming Soon' },
    { name: 'Bluesky', active: false, description: 'Coming Soon' }
  ];

  const defaultActionButtons = [
    { name: 'Spread the Word', color: '#0891b2', description: 'Get the word out on issues that you care about' },
    { name: 'Donate', color: '#059669', description: "Support NPO's or crowdfund your own Cause" },
    { name: 'Go to a Protest', color: '#7c3aed', description: 'Coming Soon' },
    { name: 'Contact Your Rep', color: '#dc2626', description: 'Coming Soon' },
    { name: 'Volunteer', color: '#f59e0b', description: 'Coming Soon' }
  ];

  const defaultCharacteristicTags = [
    'Charismatic', 'Diplomatic', 'Empathetic', 'Empowered', 'Logical',
    'Passionate', 'Strategic'
  ];

  // Create a mapping from display index to original filter index for channels
  const channelIndexMap = React.useMemo(() => {
    if (!campaignFilters?.channels) return [];

    let channels = campaignFilters.channels.map((channel: any, originalIndex: number) => {
      const name = channel.name === 'Text' ? 'Plain Text' : channel.name;
      const channelCode = channel.code;
      const hasCampaignData = campaignData?.matrix?.charismatic?.[channelCode] !== undefined;

      let description = null;
      if (name !== 'Plain Text' && !hasCampaignData) {
        description = 'Coming Soon';
      }

      return {
        ...channel,
        name,
        originalIndex,
        active: true,
        description: description || null
      };
    });

    // Sort to put "Plain Text" first if it exists
    const plainTextIndex = channels.findIndex(c => c.name === 'Plain Text');
    if (plainTextIndex > 0) {
      const plainText = channels.splice(plainTextIndex, 1)[0];
      channels.unshift(plainText);
    }

    return channels;
  }, [campaignFilters?.channels, campaignData?.matrix?.charismatic]);

  const socialChannels = channelIndexMap.map((channel: any) => ({
    name: channel.name,
    active: channel.active,
    description: channel.description,
    code: channel.code
  }));

  // Create goal buttons with slug
  const actionButtons = React.useMemo(() => {
    if (!campaignFilters?.goals) return [];

    let goals = campaignFilters.goals.map((goal: any) => ({
      ...goal,
      description: 'Coming Soon'
    }));

    // Add descriptions
    goals = goals.map((goal: any) => {
      let description = 'Coming Soon';
      if (goal.name === 'Donate') {
        description = "Support NPO's or crowdfund your own Cause";
      } else if (goal.name === 'Spread the Word') {
        description = 'Get the word out on issues that you care about';
      } else if (goal.name === 'Contact Your Rep') {
        description = 'Reach out to your representatives and make change happen';
      } else if (goal.name === 'Go to a Protest') {
        description = 'Show up and take a stand for what you believe in';
      }
      return { ...goal, description };
    });

    return goals;
  }, [campaignFilters?.goals]);

  const characteristicTags = campaignFilters?.voices ?
    campaignFilters.voices.map((voice: any) => ({
      name: voice.name,
      slug: voice.slug
    })) : defaultCharacteristicTags.map((tag: string) => ({
      name: tag,
      slug: tag.toLowerCase()
    }));

  const handleCreateCampaign = async () => {
    if (!isCreateCampaignEnabled()) return;

    setIsCreatingCampaign(true);
    try {
      // Get the selected voice and goal slugs
      const selectedVoiceSlug = characteristicTags[activeCharacteristic]?.slug;
      const selectedGoalSlug = actionButtons[activeActionButton]?.slug;

      // Build request body using currentFactsForCampaign
      const requestBody = {
        ...currentFactsForCampaign,
        personality_type: selectedVoiceSlug,
        goal: selectedGoalSlug
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

        // Check if this is the first time generating a campaign for this combination
        const isFirstForCombination = isFirstCampaignForCombination();

        // If this is a new URL session, start with fresh history (reset to 1/1)
        let updatedHistory;
        let newIndex;

        if (isNewUrlSession) {
          // First time clicking "Create Campaign" or "Refresh" for this URL
          // Add the initial cached campaign data first, then the new generated campaign
          const initialHistoryEntry = {
            response: {
              ok: true,
              variations: null,
              matrix: campaignData?.matrix // Store the campaign matrix from cached data
            },
            timestamp: new Date().toISOString(),
            settings: {
              socialChannel: activeSocialChannel,
              actionButton: activeActionButton,
              characteristic: activeCharacteristic
            }
          };

          updatedHistory = [initialHistoryEntry, newHistoryEntry]; // Start with cached campaign, then new generated campaign
          newIndex = 1; // Point to the new generated campaign (second entry)
          setIsNewUrlSession(false); // Mark session as no longer new
        } else if (isFirstForCombination) {
          // First time generating a campaign for this specific combination
          // Add the initial cached campaign data first, then the new generated campaign
          const initialHistoryEntry = {
            response: {
              ok: true,
              variations: null,
              matrix: campaignData?.matrix // Store the campaign matrix from cached data
            },
            timestamp: new Date().toISOString(),
            settings: {
              socialChannel: activeSocialChannel,
              actionButton: activeActionButton,
              characteristic: activeCharacteristic
            }
          };

          updatedHistory = [...urlData.history, initialHistoryEntry, newHistoryEntry];
          newIndex = updatedHistory.length - 1; // Point to the new generated campaign
        } else {
          // Continue existing history for this URL and combination
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
    // 1. Story facts must exist (from URL or from clicking a story)
    const hasStoryFacts = storyFacts.length > 0;

    // 2. Related facts must exist (from URL or from clicking a story)
    const hasRelatedFacts = chunkFactsReady && chunkFacts.length > 0;

    // 3. Social media button "Plain Text" must be selected
    const isPlainTextSelected = activeSocialChannel !== null && activeSocialChannel >= 0 &&
                                socialChannels[activeSocialChannel]?.name === 'Plain Text';

    // 4. Goal button "Spread the Word" must be selected
    const isSpreadTheWordSelected = activeActionButton !== null && activeActionButton >= 0 &&
                                    actionButtons[activeActionButton]?.name === 'Spread the Word';

    // 5. Any voice button must be selected
    const hasVoiceSelected = activeCharacteristic !== null && activeCharacteristic >= 0;

    return hasStoryFacts && hasRelatedFacts && isPlainTextSelected && isSpreadTheWordSelected && hasVoiceSelected;
  };

  const handleSocialChannelClick = (displayIndex: number) => {
    setActiveSocialChannel(displayIndex);
    setCampaignResponse(null); // Clear campaign response when button changes
    const channelCode = socialChannels[displayIndex]?.code;
    const goalSlug = actionButtons[activeActionButton]?.slug;
    const voiceSlug = characteristicTags[activeCharacteristic]?.slug;
    if (channelCode && goalSlug && voiceSlug) {
      onButtonSelectionChange?.(channelCode, goalSlug, voiceSlug);
    }
  };

  const handleActionButtonClick = (displayIndex: number) => {
    setActiveActionButton(displayIndex);
    setCampaignResponse(null); // Clear campaign response when button changes
    const channelCode = socialChannels[activeSocialChannel]?.code;
    const goalSlug = actionButtons[displayIndex]?.slug;
    const voiceSlug = characteristicTags[activeCharacteristic]?.slug;
    if (channelCode && goalSlug && voiceSlug) {
      onButtonSelectionChange?.(channelCode, goalSlug, voiceSlug);
    }
  };

  const handleCharacteristicClick = (index: number) => {
    setActiveCharacteristic(index);
    setCampaignResponse(null); // Clear campaign response when button changes
    const channelCode = socialChannels[activeSocialChannel]?.code;
    const goalSlug = actionButtons[activeActionButton]?.slug;
    const voiceSlug = characteristicTags[index]?.slug;
    if (channelCode && goalSlug && voiceSlug) {
      onButtonSelectionChange?.(channelCode, goalSlug, voiceSlug);
    }
  };

  // Get the actual codes/slugs for the selected buttons
  const getSelectedCodes = () => {
    const channelCode = campaignFilters?.channels?.[activeSocialChannel]?.code;
    const goalSlug = campaignFilters?.goals?.[activeActionButton]?.slug;
    const voiceSlug = campaignFilters?.voices?.[activeCharacteristic]?.slug;
    return { channelCode, goalSlug, voiceSlug };
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

  // Check if we should show Refresh button
  const isRefreshMode = () => {
    // Show "Refresh" if:
    // 1. Campaign data exists (from story API) - this means there's already campaign content showing in the right sidebar
    // 2. OR campaign response exists (from generated campaign via POST request)
    const hasCampaignData = campaignData !== null && campaignData !== undefined;
    const hasCampaignResponse = campaignResponse !== null && campaignResponse !== undefined;

    return hasCampaignData || hasCampaignResponse;
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

      // If this entry has variations, show them; otherwise show cached campaign data
      if (historyEntry.response.variations) {
        if (onVariationsGenerated) {
          onVariationsGenerated(historyEntry.response.variations);
        }
      } else if (historyEntry.response.matrix) {
        // This is the initial cached campaign data, restore it
        if (onVariationsGenerated) {
          onVariationsGenerated(null); // Clear variations
        }
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

      // If this entry has variations, show them; otherwise show cached campaign data
      if (historyEntry.response.variations) {
        if (onVariationsGenerated) {
          onVariationsGenerated(historyEntry.response.variations);
        }
      } else if (historyEntry.response.matrix) {
        // This is the initial cached campaign data, restore it
        if (onVariationsGenerated) {
          onVariationsGenerated(null); // Clear variations
        }
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

  // Count campaigns for the current combination (channel + goal + voice)
  const getCampaignsForCurrentCombination = () => {
    const urlData = getCurrentUrlData();
    const currentSettings = {
      socialChannel: activeSocialChannel,
      actionButton: activeActionButton,
      characteristic: activeCharacteristic
    };

    // Filter history entries that match the current combination
    const matchingCampaigns = urlData.history.filter(entry => {
      const entrySettings = entry.settings;
      return (
        entrySettings.socialChannel === currentSettings.socialChannel &&
        entrySettings.actionButton === currentSettings.actionButton &&
        entrySettings.characteristic === currentSettings.characteristic
      );
    });

    return matchingCampaigns;
  };

  // Check if this is the first time generating a campaign for the current combination
  const isFirstCampaignForCombination = () => {
    const campaignsForCombination = getCampaignsForCurrentCombination();
    return campaignsForCombination.length === 0;
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
      if (storyData?.facts && storyData.facts.length > 0) {
        return storyData.facts.map(fact => fact.text);
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
      if (storyData?.related_facts && storyData.related_facts.length > 0) {
        return storyData.related_facts.map(fact => fact.text);
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
        <h1>{storyTitle || "Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero"}</h1>
      </div>

      <div className="tabs">
        {tabs.map((tab, index) => {
          const isStoryFacts = index === 0;
          const isRelatedFacts = index === 1;
          const isSources = index === 2;
          const sources = chunkFactsData?.chunk_facts?.sources || [];
          const isDisabled = (isStoryFacts && !storyData?.facts?.length && storyFacts.length === 0) ||
                           (isRelatedFacts && !storyData?.related_facts?.length && (!chunkFactsReady || chunkFacts.length === 0)) ||
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
                const isPlaceholder = (activeTab === 0 && !storyData?.facts?.length && storyFacts.length === 0) ||
                                    (activeTab === 1 && !storyData?.related_facts?.length && chunkFacts.length === 0) ||
                                    (activeTab === 2 && !storyData?.sources?.length && (!chunkFactsReady || (chunkFactsData?.chunk_facts?.sources || []).length === 0));

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

                  if (activeTab === 0 && storyData?.facts) {
                    const storyFact = storyData.facts[index];
                    sourceUrl = storyFact?.metadata?.source_url;
                  } else if (activeTab === 1 && storyData?.related_facts) {
                    const relatedFact = storyData.related_facts[index];
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
          {activeSocialChannel !== null && activeSocialChannel >= 0 && socialChannels[activeSocialChannel]?.description && (
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
          {activeActionButton !== null && activeActionButton >= 0 && actionButtons[activeActionButton]?.description && (
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
                {typeof tag === 'string' ? tag : tag.name}
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
              // 3. Current combination (channel + goal + voice) has multiple campaigns
              const campaignsForCombination = getCampaignsForCurrentCombination();
              const shouldShowButtons = showUndoRedo && !isNewUrlSession && campaignsForCombination.length > 1;
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
