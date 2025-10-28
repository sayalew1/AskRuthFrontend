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
  onVariationsGenerated?: (variations: any, combinationInfo?: any) => void;
  onStoryVariationsGenerated?: (variations: any, combinationInfo?: any) => void;
  currentUrl: string;
  goButtonClicked?: boolean;
  storyData?: StoryData | null;
  storyTitle?: string;
  campaignFilters?: any;
  isLoadingStory?: boolean;
  shouldActivateStoryTab?: boolean;
  onStoryTabActivated?: () => void;
  onButtonSelectionChange?: (channelCode: string, goalSlug: string, voiceSlug: string) => void;
  onCampaignDataUpdate?: (campaignData: any) => void;
  campaignData?: any;
  currentFactsForCampaign?: { url_facts: string[]; rag_facts: { facts: string[] } } | null;
  currentStoryId?: number | null;
  urlCampaignHistory?: { [url: string]: { history: any[]; currentIndex: number; lastSettings: any } };
  setUrlCampaignHistory?: (history: any) => void;
}

const MainContent: React.FC<MainContentProps> = ({ storyFacts, chunkFacts, chunkFactsReady, chunkFactsData, onVariationsGenerated, onStoryVariationsGenerated, currentUrl, goButtonClicked, storyData, storyTitle, campaignFilters, isLoadingStory, shouldActivateStoryTab, onStoryTabActivated, onButtonSelectionChange, onCampaignDataUpdate, campaignData, currentFactsForCampaign, currentStoryId, urlCampaignHistory = {}, setUrlCampaignHistory }) => {
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

  // Track campaign history per Story (completely separate from URLs)
  const [storyCampaignHistory, setStoryCampaignHistory] = React.useState<{
    [storyId: string]: {
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
  const [isNewStorySession, setIsNewStorySession] = React.useState(true);
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

  // Track the previous story ID to detect when story changes
  const prevStoryIdRef = React.useRef<number | null>(null);

  // Track if we're currently restoring settings to avoid triggering button click handlers
  const isRestoringSettingsRef = React.useRef<boolean>(false);

  // Handle story changes - restore cached campaigns or reset to fresh state
  useEffect(() => {
    if (currentStoryId !== null && currentStoryId !== undefined) {
      // Check if this is a new story (first time or switching to different story)
      const isNewStory = prevStoryIdRef.current === null || prevStoryIdRef.current !== currentStoryId;

      if (isNewStory) {
        // Get the story data for this story
        const storyData = storyCampaignHistory[currentStoryId.toString()];

        if (storyData && storyData.history.length > 0) {
          // This story has cached campaigns - restore the last one
          const latestEntry = storyData.history[storyData.currentIndex];

          if (latestEntry) {
            // Restore the campaign response
            setCampaignResponse(latestEntry.response);
            setLastCampaignSettings(storyData.lastSettings);

            // Restore the button selections from the last campaign
            if (latestEntry.settings) {
              setActiveSocialChannel(latestEntry.settings.socialChannel);
              setActiveActionButton(latestEntry.settings.actionButton);
              setActiveCharacteristic(latestEntry.settings.characteristic);
            }

            // Show undo/redo buttons if there are multiple campaigns for this combination
            const campaignsForThisCombination = storyData.history.filter(entry => {
              const entrySettings = entry.settings;
              return (
                entrySettings.socialChannel === latestEntry.settings.socialChannel &&
                entrySettings.actionButton === latestEntry.settings.actionButton &&
                entrySettings.characteristic === latestEntry.settings.characteristic
              );
            });

            if (campaignsForThisCombination.length > 1) {
              setShowUndoRedo(true);
            }

            // Restore variations if they exist
            if (latestEntry.response.variations) {
              if (onStoryVariationsGenerated) {
                const channelCode = socialChannels[latestEntry.settings.socialChannel]?.code;
                const goalSlug = actionButtons[latestEntry.settings.actionButton]?.slug;
                const voiceSlug = characteristicTags[latestEntry.settings.characteristic]?.slug;
                onStoryVariationsGenerated(latestEntry.response.variations, { channelCode, goalSlug, voiceSlug });
              }
            } else {
              // No variations, don't clear them - let RightSidebar show campaignData
              // For story mode, we don't call onStoryVariationsGenerated(null)
            }

            // Mark as not a new session since we have history
            setIsNewStorySession(false);
          }
        } else {
          // This story has no cached campaigns - reset to fresh state
          setCampaignResponse(null);
          setShowUndoRedo(false);
          setLastCampaignSettings(null);
          setIsNewStorySession(true);

          // For story mode, don't clear variations - let RightSidebar show default state
        }
      }
      // Update the ref to track current story
      prevStoryIdRef.current = currentStoryId;
    } else if (prevStoryIdRef.current !== null) {
      // User switched from a story to a URL (currentStoryId is now null)
      // Don't clear variations here - let the URL restoration effect handle it
      // Reset the middle component to default state
      setCampaignResponse(null);
      setShowUndoRedo(false);
      setLastCampaignSettings(null);
      setIsNewUrlSession(true);
      setActiveSocialChannel(0);
      setActiveActionButton(0);
      setActiveCharacteristic(0);

      // Update the ref to track that we're no longer on a story
      prevStoryIdRef.current = null;

      // Trigger URL restoration by resetting prevUrlRef so the URL effect runs
      prevUrlRef.current = '';
    }
  }, [currentStoryId, onVariationsGenerated, storyCampaignHistory]);

  // Track the previous URL to detect when URL changes
  const prevUrlRef = React.useRef<string>('');

  // Handle URL changes - restore cached campaigns for that URL
  useEffect(() => {
    // When we're in URL mode (currentStoryId is null) and either:
    // 1. URL has changed, OR
    // 2. We just switched from story mode to URL mode (prevUrlRef was reset)
    if (currentUrl && currentStoryId === null) {
      if (currentUrl !== prevUrlRef.current) {
        // URL has changed or we're switching from story to URL mode
        prevUrlRef.current = currentUrl;
        setIsNewUrlSession(false); // Not a new session since we're switching back

        // Get the selected URL's data and restore its state
        const urlData = urlCampaignHistory[currentUrl];
        if (urlData && urlData.history.length > 0) {
          // Always go to the LAST (most recent) campaign for this URL
          const lastIndex = urlData.history.length - 1;
          const latestEntry = urlData.history[lastIndex];

          // Update the URL data to point to the last campaign
          const updatedUrlData = {
            ...urlData,
            currentIndex: lastIndex
          };

          if (setUrlCampaignHistory) {
            setUrlCampaignHistory((prev: any) => ({
              ...prev,
              [currentUrl]: updatedUrlData
            }));
          }

          setCampaignResponse(latestEntry.response);
          setLastCampaignSettings(urlData.lastSettings);
          setShowUndoRedo(urlData.history.length > 1);

          // Restore the campaign settings from the latest entry
          if (latestEntry.settings) {
            isRestoringSettingsRef.current = true;
            setActiveSocialChannel(latestEntry.settings.socialChannel);
            setActiveActionButton(latestEntry.settings.actionButton);
            setActiveCharacteristic(latestEntry.settings.characteristic);
            // Reset the flag after a microtask to allow state updates to complete
            Promise.resolve().then(() => {
              isRestoringSettingsRef.current = false;
            });
          }

          if (onVariationsGenerated) {
            // Get the combination info from the latest entry
            const channelCode = socialChannels[latestEntry.settings.socialChannel]?.code;
            const goalSlug = actionButtons[latestEntry.settings.actionButton]?.slug;
            const voiceSlug = characteristicTags[latestEntry.settings.characteristic]?.slug;
            onVariationsGenerated(latestEntry.response.variations, { channelCode, goalSlug, voiceSlug });
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
      }
    }
  }, [currentUrl, currentStoryId, urlCampaignHistory]);

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
      // IMPORTANT: Capture campaignData NOW before it gets cleared by handleVariationsGenerated
      const cachedCampaignData = campaignData;

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
      if (data.ok && data.variations) {
        const channelCode = socialChannels[activeSocialChannel]?.code;
        const goalSlug = actionButtons[activeActionButton]?.slug;
        const voiceSlug = characteristicTags[activeCharacteristic]?.slug;

        if (currentStoryId !== null && currentStoryId !== undefined) {
          // Story mode
          if (onStoryVariationsGenerated) {
            onStoryVariationsGenerated(data.variations, { channelCode, goalSlug, voiceSlug });
          }
        } else {
          // URL mode
          if (onVariationsGenerated) {
            onVariationsGenerated(data.variations, { channelCode, goalSlug, voiceSlug });
          }
        }

        // Add to campaign history - STORY or URL depending on what's selected
        const newHistoryEntry = {
          response: data,
          timestamp: new Date().toISOString(),
          settings: {
            socialChannel: activeSocialChannel,
            actionButton: activeActionButton,
            characteristic: activeCharacteristic
          }
        };

        // Handle STORY campaign history
        if (currentStoryId !== null && currentStoryId !== undefined) {
          const storyData = getCurrentStoryData();
          const isFirstForCombination = isFirstCampaignForCombination();

          let updatedHistory;
          let newIndex;

          if (isNewStorySession) {
            // First time clicking "Create Campaign" or "Refresh" for this story
            // Add the initial cached campaign data first, then the new generated campaign
            const initialHistoryEntry = {
              response: {
                ok: true,
                variations: null,
                matrix: cachedCampaignData?.matrix
              },
              timestamp: new Date().toISOString(),
              settings: {
                socialChannel: activeSocialChannel,
                actionButton: activeActionButton,
                characteristic: activeCharacteristic
              }
            };

            updatedHistory = [initialHistoryEntry, newHistoryEntry];
            newIndex = 1;
            setIsNewStorySession(false);
          } else if (isFirstForCombination) {
            // First time generating a campaign for this specific combination
            // Add the initial cached campaign data first, then the new generated campaign
            const initialHistoryEntry = {
              response: {
                ok: true,
                variations: null,
                matrix: cachedCampaignData?.matrix
              },
              timestamp: new Date().toISOString(),
              settings: {
                socialChannel: activeSocialChannel,
                actionButton: activeActionButton,
                characteristic: activeCharacteristic
              }
            };

            updatedHistory = [...storyData.history, initialHistoryEntry, newHistoryEntry];
            newIndex = updatedHistory.length - 1;
          } else {
            // Continue existing history for this story and combination
            updatedHistory = [...storyData.history, newHistoryEntry];
            newIndex = updatedHistory.length - 1;
          }

          // Update story-specific data
          updateStoryData({
            history: updatedHistory,
            currentIndex: newIndex,
            lastSettings: {
              socialChannel: activeSocialChannel,
              actionButton: activeActionButton,
              characteristic: activeCharacteristic
            }
          });

          // Show undo/redo buttons if there are multiple campaigns for this combination
          const campaignsForThisCombination = updatedHistory.filter(entry => {
            const entrySettings = entry.settings;
            return (
              entrySettings.socialChannel === activeSocialChannel &&
              entrySettings.actionButton === activeActionButton &&
              entrySettings.characteristic === activeCharacteristic
            );
          });

          if (campaignsForThisCombination.length > 1) {
            setShowUndoRedo(true);
          }
        } else {
          // Handle URL campaign history
          // For URLs: Only add the newly generated campaign (no initial cached campaign like stories)
          const urlData = getCurrentUrlData();

          let updatedHistory;
          let newIndex;

          // For URLs, simply add the new campaign to history
          updatedHistory = [...urlData.history, newHistoryEntry];
          newIndex = updatedHistory.length - 1;

          // Mark that we've created at least one campaign for this URL
          if (isNewUrlSession) {
            setIsNewUrlSession(false);
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

          // Show undo/redo buttons if there are multiple campaigns for this combination
          const campaignsForThisCombination = updatedHistory.filter(entry => {
            const entrySettings = entry.settings;
            return (
              entrySettings.socialChannel === activeSocialChannel &&
              entrySettings.actionButton === activeActionButton &&
              entrySettings.characteristic === activeCharacteristic
            );
          });

          if (campaignsForThisCombination.length > 1) {
            setShowUndoRedo(true);
          }
        }

        // Save the current settings as the last campaign settings
        setLastCampaignSettings({
          socialChannel: activeSocialChannel,
          actionButton: activeActionButton,
          characteristic: activeCharacteristic
        });
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
    // If we're currently restoring settings, don't process the click
    if (isRestoringSettingsRef.current) {
      return;
    }

    setActiveSocialChannel(displayIndex);

    // Look for a campaign for this new combination
    const newChannelCode = socialChannels[displayIndex]?.code;
    const goalSlug = actionButtons[activeActionButton]?.slug;
    const voiceSlug = characteristicTags[activeCharacteristic]?.slug;

    // Check if there's a campaign for this combination in history
    const data = currentStoryId !== null && currentStoryId !== undefined ? getCurrentStoryData() : getCurrentUrlData();

    // Find ALL campaigns for this combination
    const campaignsForThisCombination = data.history.filter(entry => {
      const entrySettings = entry.settings;
      return (
        entrySettings.socialChannel === displayIndex &&
        entrySettings.actionButton === activeActionButton &&
        entrySettings.characteristic === activeCharacteristic
      );
    });

    if (campaignsForThisCombination.length > 0) {
      // Show the most recent campaign for this combination
      const mostRecentCampaign = campaignsForThisCombination[campaignsForThisCombination.length - 1];
      setCampaignResponse(mostRecentCampaign.response);

      // Show undo/redo buttons if there are multiple campaigns for this combination
      if (campaignsForThisCombination.length > 1) {
        setShowUndoRedo(true);
      } else {
        setShowUndoRedo(false);
      }

      // Restore variations from campaign
      if (mostRecentCampaign.response.variations) {
        if (currentStoryId !== null && currentStoryId !== undefined) {
          // Story mode
          if (onStoryVariationsGenerated) {
            onStoryVariationsGenerated(mostRecentCampaign.response.variations, { channelCode: newChannelCode, goalSlug, voiceSlug });
          }
        } else {
          // URL mode
          if (onVariationsGenerated) {
            onVariationsGenerated(mostRecentCampaign.response.variations, { channelCode: newChannelCode, goalSlug, voiceSlug });
          }
        }
      } else {
        // Campaign exists but has no variations
        if (currentStoryId === null || currentStoryId === undefined) {
          // URL mode - clear variations
          if (onVariationsGenerated) {
            onVariationsGenerated(null);
          }
        }
        // Story mode - don't clear variations, let RightSidebar show campaignData
      }
    } else {
      // No campaign for this combination, show default/empty state
      setCampaignResponse(null);
      setShowUndoRedo(false); // Hide undo/redo buttons

      // Clear variations only for URL mode
      if (currentStoryId === null || currentStoryId === undefined) {
        if (onVariationsGenerated) {
          onVariationsGenerated(null);
        }
      }
      // Story mode - don't clear variations, let RightSidebar show campaignData
    }

    // Call onButtonSelectionChange AFTER restoring variations so selectedButtons is updated
    if (newChannelCode && goalSlug && voiceSlug) {
      onButtonSelectionChange?.(newChannelCode, goalSlug, voiceSlug);
    }
  };

  const handleActionButtonClick = (displayIndex: number) => {
    // If we're currently restoring settings, don't process the click
    if (isRestoringSettingsRef.current) {
      return;
    }

    setActiveActionButton(displayIndex);

    // Look for a campaign for this new combination
    const channelCode = socialChannels[activeSocialChannel]?.code;
    const newGoalSlug = actionButtons[displayIndex]?.slug;
    const voiceSlug = characteristicTags[activeCharacteristic]?.slug;

    // Check if there's a campaign for this combination in history
    const data = currentStoryId !== null && currentStoryId !== undefined ? getCurrentStoryData() : getCurrentUrlData();

    // Find ALL campaigns for this combination
    const campaignsForThisCombination = data.history.filter(entry => {
      const entrySettings = entry.settings;
      return (
        entrySettings.socialChannel === activeSocialChannel &&
        entrySettings.actionButton === displayIndex &&
        entrySettings.characteristic === activeCharacteristic
      );
    });

    if (campaignsForThisCombination.length > 0) {
      // Show the most recent campaign for this combination
      const mostRecentCampaign = campaignsForThisCombination[campaignsForThisCombination.length - 1];
      setCampaignResponse(mostRecentCampaign.response);

      // Show undo/redo buttons if there are multiple campaigns for this combination
      if (campaignsForThisCombination.length > 1) {
        setShowUndoRedo(true);
      } else {
        setShowUndoRedo(false);
      }

      // Restore variations from campaign
      if (mostRecentCampaign.response.variations) {
        if (currentStoryId !== null && currentStoryId !== undefined) {
          // Story mode
          if (onStoryVariationsGenerated) {
            onStoryVariationsGenerated(mostRecentCampaign.response.variations, { channelCode, goalSlug: newGoalSlug, voiceSlug });
          }
        } else {
          // URL mode
          if (onVariationsGenerated) {
            onVariationsGenerated(mostRecentCampaign.response.variations, { channelCode, goalSlug: newGoalSlug, voiceSlug });
          }
        }
      } else {
        // Campaign exists but has no variations
        if (currentStoryId === null || currentStoryId === undefined) {
          // URL mode - clear variations
          if (onVariationsGenerated) {
            onVariationsGenerated(null);
          }
        }
        // Story mode - don't clear variations, let RightSidebar show campaignData
      }
    } else {
      // No campaign for this combination, show default/empty state
      setCampaignResponse(null);
      setShowUndoRedo(false); // Hide undo/redo buttons

      // Clear variations only for URL mode
      if (currentStoryId === null || currentStoryId === undefined) {
        if (onVariationsGenerated) {
          onVariationsGenerated(null);
        }
      }
      // Story mode - don't clear variations, let RightSidebar show campaignData
    }

    if (channelCode && newGoalSlug && voiceSlug) {
      onButtonSelectionChange?.(channelCode, newGoalSlug, voiceSlug);
    }
  };

  const handleCharacteristicClick = (index: number) => {
    // If we're currently restoring settings, don't process the click
    if (isRestoringSettingsRef.current) {
      return;
    }

    setActiveCharacteristic(index);

    // Look for a campaign for this new combination
    const channelCode = socialChannels[activeSocialChannel]?.code;
    const goalSlug = actionButtons[activeActionButton]?.slug;
    const newVoiceSlug = characteristicTags[index]?.slug;

    // Check if there's a campaign for this combination in history
    const data = currentStoryId !== null && currentStoryId !== undefined ? getCurrentStoryData() : getCurrentUrlData();

    // Find ALL campaigns for this combination
    const campaignsForThisCombination = data.history.filter(entry => {
      const entrySettings = entry.settings;
      return (
        entrySettings.socialChannel === activeSocialChannel &&
        entrySettings.actionButton === activeActionButton &&
        entrySettings.characteristic === index
      );
    });

    if (campaignsForThisCombination.length > 0) {
      // Show the most recent campaign for this combination
      const mostRecentCampaign = campaignsForThisCombination[campaignsForThisCombination.length - 1];
      setCampaignResponse(mostRecentCampaign.response);

      // Show undo/redo buttons if there are multiple campaigns for this combination
      if (campaignsForThisCombination.length > 1) {
        setShowUndoRedo(true);
      } else {
        setShowUndoRedo(false);
      }

      // Restore variations from campaign
      if (mostRecentCampaign.response.variations) {
        if (currentStoryId !== null && currentStoryId !== undefined) {
          // Story mode
          if (onStoryVariationsGenerated) {
            onStoryVariationsGenerated(mostRecentCampaign.response.variations, { channelCode, goalSlug, voiceSlug: newVoiceSlug });
          }
        } else {
          // URL mode
          if (onVariationsGenerated) {
            onVariationsGenerated(mostRecentCampaign.response.variations, { channelCode, goalSlug, voiceSlug: newVoiceSlug });
          }
        }
      } else {
        // Campaign exists but has no variations
        if (currentStoryId === null || currentStoryId === undefined) {
          // URL mode - clear variations
          if (onVariationsGenerated) {
            onVariationsGenerated(null);
          }
        }
        // Story mode - don't clear variations, let RightSidebar show campaignData
      }
    } else {
      // No campaign for this combination, show default/empty state
      setCampaignResponse(null);
      setShowUndoRedo(false); // Hide undo/redo buttons

      // Clear variations only for URL mode
      if (currentStoryId === null || currentStoryId === undefined) {
        if (onVariationsGenerated) {
          onVariationsGenerated(null);
        }
      }
      // Story mode - don't clear variations, let RightSidebar show campaignData
    }

    if (channelCode && goalSlug && newVoiceSlug) {
      onButtonSelectionChange?.(channelCode, goalSlug, newVoiceSlug);
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

  // ===== URL-SPECIFIC FUNCTIONS =====
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
    if (!setUrlCampaignHistory) return;

    setUrlCampaignHistory((prev: any) => {
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

  // ===== STORY-SPECIFIC FUNCTIONS =====
  const getCurrentStoryData = () => {
    if (currentStoryId === null || currentStoryId === undefined) {
      return {
        history: [],
        currentIndex: -1,
        lastSettings: null
      };
    }
    return storyCampaignHistory[currentStoryId.toString()] || {
      history: [],
      currentIndex: -1,
      lastSettings: null
    };
  };

  const updateStoryData = (updates: Partial<{
    history: any[];
    currentIndex: number;
    lastSettings: any;
  }>) => {
    if (currentStoryId === null || currentStoryId === undefined) {
      return;
    }

    setStoryCampaignHistory(prev => {
      const newHistory = {
        ...prev,
        [currentStoryId.toString()]: {
          ...getCurrentStoryData(),
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

  // Undo function - go back in history for current combination only
  const handleUndo = () => {
    const campaignsForCombination = getCampaignsForCurrentCombination();

    if (campaignsForCombination.length > 1) {
      // Get the appropriate data based on whether we're in story or URL mode
      const data = currentStoryId !== null && currentStoryId !== undefined ? getCurrentStoryData() : getCurrentUrlData();

      // Find the current index within the campaigns for this combination
      const currentCombinationIndex = campaignsForCombination.findIndex(entry => {
        const historyEntry = data.history[data.currentIndex];
        return entry === historyEntry;
      });

      if (currentCombinationIndex > 0) {
        // Get the previous campaign for this combination
        const previousCampaign = campaignsForCombination[currentCombinationIndex - 1];

        // Find the index of this campaign in the full history
        const newHistoryIndex = data.history.indexOf(previousCampaign);

        // Update the appropriate history
        if (currentStoryId !== null && currentStoryId !== undefined) {
          updateStoryData({ currentIndex: newHistoryIndex });
        } else {
          updateUrlData({ currentIndex: newHistoryIndex });
        }

        setCampaignResponse(previousCampaign.response);

        // Update campaignData in App.tsx if this entry has a matrix
        if (previousCampaign.response.matrix && onCampaignDataUpdate) {
          onCampaignDataUpdate({ matrix: previousCampaign.response.matrix });
        }

        // Restore the button selections to match the previous campaign's settings
        setActiveSocialChannel(previousCampaign.settings.socialChannel);
        setActiveActionButton(previousCampaign.settings.actionButton);
        setActiveCharacteristic(previousCampaign.settings.characteristic);

        // Get the channel code, goal slug, and voice slug for the previous campaign
        const channelCode = socialChannels[previousCampaign.settings.socialChannel]?.code;
        const goalSlug = actionButtons[previousCampaign.settings.actionButton]?.slug;
        const voiceSlug = characteristicTags[previousCampaign.settings.characteristic]?.slug;

        // Call onButtonSelectionChange to update parent's selectedButtons state
        if (channelCode && goalSlug && voiceSlug && onButtonSelectionChange) {
          onButtonSelectionChange(channelCode, goalSlug, voiceSlug);
        }

        // If this entry has variations, show them; otherwise clear variations to show cached campaign data
        if (previousCampaign.response.variations) {
          if (currentStoryId !== null && currentStoryId !== undefined) {
            // Story mode
            if (onStoryVariationsGenerated) {
              onStoryVariationsGenerated(previousCampaign.response.variations, { channelCode, goalSlug, voiceSlug });
            }
          } else {
            // URL mode
            if (onVariationsGenerated) {
              onVariationsGenerated(previousCampaign.response.variations, { channelCode, goalSlug, voiceSlug });
            }
          }
        } else if (previousCampaign.response.matrix) {
          // This is the initial cached campaign data, clear variations so RightSidebar shows campaignData.matrix
          if (currentStoryId !== null && currentStoryId !== undefined) {
            // Story mode - clear variations to show campaignData.matrix
            if (onStoryVariationsGenerated) {
              onStoryVariationsGenerated(null);
            }
          } else {
            // URL mode - clear variations
            if (onVariationsGenerated) {
              onVariationsGenerated(null);
            }
          }
        }
      }
    }
  };

  // Redo function - go forward in history for current combination only
  const handleRedo = () => {
    const campaignsForCombination = getCampaignsForCurrentCombination();

    if (campaignsForCombination.length > 1) {
      // Get the appropriate data based on whether we're in story or URL mode
      const data = currentStoryId !== null && currentStoryId !== undefined ? getCurrentStoryData() : getCurrentUrlData();

      // Find the current index within the campaigns for this combination
      const currentCombinationIndex = campaignsForCombination.findIndex(entry => {
        const historyEntry = data.history[data.currentIndex];
        return entry === historyEntry;
      });

      if (currentCombinationIndex < campaignsForCombination.length - 1) {
        // Get the next campaign for this combination
        const nextCampaign = campaignsForCombination[currentCombinationIndex + 1];

        // Find the index of this campaign in the full history
        const newHistoryIndex = data.history.indexOf(nextCampaign);

        // Update the appropriate history
        if (currentStoryId !== null && currentStoryId !== undefined) {
          updateStoryData({ currentIndex: newHistoryIndex });
        } else {
          updateUrlData({ currentIndex: newHistoryIndex });
        }

        setCampaignResponse(nextCampaign.response);

        // Update campaignData in App.tsx if this entry has a matrix
        if (nextCampaign.response.matrix && onCampaignDataUpdate) {
          onCampaignDataUpdate({ matrix: nextCampaign.response.matrix });
        }

        // Restore the button selections to match the next campaign's settings
        setActiveSocialChannel(nextCampaign.settings.socialChannel);
        setActiveActionButton(nextCampaign.settings.actionButton);
        setActiveCharacteristic(nextCampaign.settings.characteristic);

        // Get the channel code, goal slug, and voice slug for the next campaign
        const channelCode = socialChannels[nextCampaign.settings.socialChannel]?.code;
        const goalSlug = actionButtons[nextCampaign.settings.actionButton]?.slug;
        const voiceSlug = characteristicTags[nextCampaign.settings.characteristic]?.slug;

        // Call onButtonSelectionChange to update parent's selectedButtons state
        if (channelCode && goalSlug && voiceSlug && onButtonSelectionChange) {
          onButtonSelectionChange(channelCode, goalSlug, voiceSlug);
        }

        // If this entry has variations, show them; otherwise clear variations to show cached campaign data
        if (nextCampaign.response.variations) {
          if (currentStoryId !== null && currentStoryId !== undefined) {
            // Story mode
            if (onStoryVariationsGenerated) {
              onStoryVariationsGenerated(nextCampaign.response.variations, { channelCode, goalSlug, voiceSlug });
            }
          } else {
            // URL mode
            if (onVariationsGenerated) {
              onVariationsGenerated(nextCampaign.response.variations, { channelCode, goalSlug, voiceSlug });
            }
          }
        } else if (nextCampaign.response.matrix) {
          // This is the initial cached campaign data, clear variations so RightSidebar shows campaignData.matrix
          if (currentStoryId !== null && currentStoryId !== undefined) {
            // Story mode - clear variations to show campaignData.matrix
            if (onStoryVariationsGenerated) {
              onStoryVariationsGenerated(null);
            }
          } else {
            // URL mode - clear variations
            if (onVariationsGenerated) {
              onVariationsGenerated(null);
            }
          }
        }
      }
    }
  };

  // Check if undo is available for current combination
  const canUndo = () => {
    const campaignsForCombination = getCampaignsForCurrentCombination();
    if (campaignsForCombination.length <= 1) {
      return false;
    }

    const data = currentStoryId !== null && currentStoryId !== undefined ? getCurrentStoryData() : getCurrentUrlData();
    const currentCombinationIndex = campaignsForCombination.findIndex(entry => {
      const historyEntry = data.history[data.currentIndex];
      return entry === historyEntry;
    });

    return currentCombinationIndex > 0;
  };

  // Check if redo is available for current combination
  const canRedo = () => {
    const campaignsForCombination = getCampaignsForCurrentCombination();
    if (campaignsForCombination.length <= 1) {
      return false;
    }

    const data = currentStoryId !== null && currentStoryId !== undefined ? getCurrentStoryData() : getCurrentUrlData();
    const currentCombinationIndex = campaignsForCombination.findIndex(entry => {
      const historyEntry = data.history[data.currentIndex];
      return entry === historyEntry;
    });

    return currentCombinationIndex < campaignsForCombination.length - 1;
  };

  // Count campaigns for the current combination (channel + goal + voice)
  const getCampaignsForCurrentCombination = () => {
    const data = currentStoryId !== null && currentStoryId !== undefined ? getCurrentStoryData() : getCurrentUrlData();
    const currentSettings = {
      socialChannel: activeSocialChannel,
      actionButton: activeActionButton,
      characteristic: activeCharacteristic
    };

    // Filter history entries that match the current combination
    const matchingCampaigns = data.history.filter(entry => {
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
    // BUT: Don't reset if we're currently restoring settings from a previous campaign
    if (chunkFactsData && !isRestoringSettingsRef.current) {
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

          if (setUrlCampaignHistory) {
            setUrlCampaignHistory(cleanedHistory);
          }
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
            <div className="campaign-buttons-container">
              <button
                className={`create-btn ${!isCreateCampaignEnabled() ? 'disabled' : ''} ${(() => {
                  const isInStoryMode = currentStoryId !== null && currentStoryId !== undefined;
                  const data = isInStoryMode ? getCurrentStoryData() : getCurrentUrlData();
                  const isNewSession = isInStoryMode ? isNewStorySession : isNewUrlSession;
                  const shouldSlideLeft = showUndoRedo && !isNewSession && data.history.length > 1;
                  return shouldSlideLeft ? 'slide-left' : '';
                })()}`}
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
              // 2. NOT in a new session (story or URL depending on mode)
              // 3. Current combination (channel + goal + voice) has multiple campaigns
              const isInStoryMode = currentStoryId !== null && currentStoryId !== undefined;
              const isNewSession = isInStoryMode ? isNewStorySession : isNewUrlSession;
              const campaignsForCombination = getCampaignsForCurrentCombination();
              const shouldShowButtons = showUndoRedo && !isNewSession && campaignsForCombination.length > 1;
              return shouldShowButtons;
            })() && (
              <div className="undo-redo-buttons">
                <button
                  className={`undo-btn ${!canUndo() ? 'disabled' : ''}`}
                  onClick={handleUndo}
                  disabled={!canUndo()}
                  title={(() => {
                    const isInStoryMode = currentStoryId !== null && currentStoryId !== undefined;
                    const data = isInStoryMode ? getCurrentStoryData() : getCurrentUrlData();
                    const campaignsForCombination = getCampaignsForCurrentCombination();
                    const currentCombinationIndex = campaignsForCombination.findIndex(entry => {
                      const historyEntry = data.history[data.currentIndex];
                      return entry === historyEntry;
                    });
                    return `Previous (${currentCombinationIndex + 1}/${campaignsForCombination.length})`;
                  })()}
                >
                  ←
                </button>

                {canRedo() && (
                  <button
                    className="redo-btn"
                    onClick={handleRedo}
                    title={(() => {
                      const isInStoryMode = currentStoryId !== null && currentStoryId !== undefined;
                      const data = isInStoryMode ? getCurrentStoryData() : getCurrentUrlData();
                      const campaignsForCombination = getCampaignsForCurrentCombination();
                      const currentCombinationIndex = campaignsForCombination.findIndex(entry => {
                        const historyEntry = data.history[data.currentIndex];
                        return entry === historyEntry;
                      });
                      return `Next (${currentCombinationIndex + 2}/${campaignsForCombination.length})`;
                    })()}
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
