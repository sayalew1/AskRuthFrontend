import React, { useState } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import RightSidebar from './components/RightSidebar';
import './App.css';

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

interface CampaignData {
  matrix: {
    general_audience: {
      [socialMediaChannel: string]: {
        [goal: string]: {
          [voice: string]: {
            opening_paragraph: string[];
            core_message: string[];
            supporting_evidence: string[];
            emotional_appeal: string[];
            call_to_action: string[];
          };
        };
      };
    };
  };
}

function App() {
  const [storyFacts, setStoryFacts] = useState<string[]>([]);
  const [chunkFacts, setChunkFacts] = useState<string[]>([]);
  const [chunkFactsReady, setChunkFactsReady] = useState<boolean>(false);
  const [chunkFactsData, setChunkFactsData] = useState<any>(null);
  // Story mode state
  const [storyVariations, setStoryVariations] = useState<any>(null);
  const [storyVariationsForCombination, setStoryVariationsForCombination] = useState<{ channelCode: string; goalSlug: string; voiceSlug: string } | null>(null);
  const [storySelectedButtons, setStorySelectedButtons] = useState<{ channelCode: string; goalSlug: string; voiceSlug: string } | null>(null);

  // URL mode state
  const [urlVariations, setUrlVariations] = useState<any>(null);
  const [urlVariationsForCombination, setUrlVariationsForCombination] = useState<{ channelCode: string; goalSlug: string; voiceSlug: string } | null>(null);
  const [urlSelectedButtons, setUrlSelectedButtons] = useState<{ channelCode: string; goalSlug: string; voiceSlug: string } | null>(null);

  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [goButtonClicked, setGoButtonClicked] = useState<boolean>(false);
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [storyTitle, setStoryTitle] = useState<string>('');
  const [campaignFilters, setCampaignFilters] = useState<any>(null);
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
  const [isLoadingStory, setIsLoadingStory] = useState<boolean>(false);
  const [shouldActivateStoryTab, setShouldActivateStoryTab] = useState<boolean>(false);
  const [campaignDataCache, setCampaignDataCache] = useState<{ [storyId: number]: CampaignData }>({});
  const [storyDataCache, setStoryDataCache] = useState<{ [storyId: number]: StoryData }>({});
  const [factsForCampaignCache, setFactsForCampaignCache] = useState<{ [storyId: number]: { url_facts: string[]; rag_facts: { facts: string[] } } }>({});
  const [currentFactsForCampaign, setCurrentFactsForCampaign] = useState<{ url_facts: string[]; rag_facts: { facts: string[] } } | null>(null);
  const [currentStoryId, setCurrentStoryId] = useState<number | null>(null);
  const [shouldResetSidebarSelection, setShouldResetSidebarSelection] = useState(false);
  const prevStoryIdRef = React.useRef<number | null>(null);

  // Handle story-to-URL transition to reset sidebar selection
  React.useEffect(() => {
    if (prevStoryIdRef.current !== null && currentStoryId === null) {
      // Transitioning from story to URL mode
      setShouldResetSidebarSelection(true);
      // Reset the flag after a short delay
      setTimeout(() => setShouldResetSidebarSelection(false), 100);
    }
    prevStoryIdRef.current = currentStoryId;
  }, [currentStoryId]);

  // When switching to story mode, update the campaign data for the currently selected button combination
  React.useEffect(() => {
    if (currentStoryId !== null && storySelectedButtons && campaignDataCache[currentStoryId]) {
      // We're in story mode with a story selected and campaign data cached
      // Update the campaign data to show the data for the currently selected button combination
      setCampaignData(campaignDataCache[currentStoryId]);
    }
  }, [currentStoryId, storySelectedButtons, campaignDataCache]);

  // Track campaign history per URL (lifted from MainContent)
  const [urlCampaignHistory, setUrlCampaignHistory] = useState<{
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

  // Track URL data (facts, related facts, sources) per URL
  const [urlDataCache, setUrlDataCache] = useState<{
    [url: string]: {
      storyFacts: string[];
      chunkFacts: string[];
      chunkFactsData: any;
      chunkFactsReady: boolean;
    }
  }>({});

  // Helper function to create facts object for campaign generation and cache it
  const createAndCacheFactsForCampaign = (storyId: number, storyData: StoryData) => {
    const url_facts = storyData.facts?.map(fact => fact.text) || [];
    const rag_facts = {
      facts: storyData.related_facts?.map(fact => fact.text) || []
    };
    const factsObj = { url_facts, rag_facts };

    // Cache the facts for this story
    setFactsForCampaignCache(prev => ({
      ...prev,
      [storyId]: factsObj
    }));

    // Set as current facts
    setCurrentFactsForCampaign(factsObj);

    return factsObj;
  };

  const handleFactsExtracted = (response: ApiResponse & { url?: string }) => {
    if (response.ok && response.facts) {
      if (response.facts.length > 0) {
        setStoryFacts(response.facts);
      }
      // Reset chunk facts state when new story facts are received
      setChunkFacts([]);
      setChunkFactsReady(false);
      setChunkFactsData(null);

      // Cache URL data when facts are extracted - use URL from response
      const urlToCache = response.url || currentUrl;
      if (urlToCache) {
        setUrlDataCache(prev => ({
          ...prev,
          [urlToCache]: {
            storyFacts: response.facts || [],
            chunkFacts: [],
            chunkFactsData: null,
            chunkFactsReady: false
          }
        }));
      }
    }
  };

  const handleChunkFactsReady = (facts: string[], fullData: any) => {
    setChunkFacts(facts);
    setChunkFactsReady(true);
    setChunkFactsData(fullData);

    // Update URL data cache with chunk facts - use URL from fullData
    const urlToCache = fullData?.url || fullData?.original_url || currentUrl;
    const storyFactsToCache = fullData?.storyFacts || storyFacts;
    if (urlToCache) {
      setUrlDataCache(prev => ({
        ...prev,
        [urlToCache]: {
          storyFacts: storyFactsToCache,
          chunkFacts: facts,
          chunkFactsData: fullData,
          chunkFactsReady: true
        }
      }));
    }
  };

  // STORY MODE ONLY - Handle variations generated for story campaigns
  const handleStoryVariationsGenerated = (variationsData: any, combinationInfo?: any) => {
    if (currentStoryId !== null) {
      // STORY MODE ONLY
      if (variationsData === null) {
        // Don't clear variations for story mode - let RightSidebar show campaignData
        setStoryVariations(null);
        setStoryVariationsForCombination(null);
      } else {
        setStoryVariations(variationsData);
        if (combinationInfo) {
          setStoryVariationsForCombination(combinationInfo);
        } else if (storySelectedButtons) {
          setStoryVariationsForCombination(storySelectedButtons);
        }
      }
    }
  };

  // URL MODE ONLY - Handle variations generated for URL campaigns
  const handleVariationsGenerated = (variationsData: any, combinationInfo?: any) => {
    // URL MODE ONLY
    if (variationsData === null) {
      setUrlVariations(null);
      setUrlVariationsForCombination(null);
      setCampaignData(null);
    } else {
      setUrlVariations(variationsData);
      if (combinationInfo) {
        setUrlVariationsForCombination(combinationInfo);
      } else if (urlSelectedButtons) {
        setUrlVariationsForCombination(urlSelectedButtons);
      }
      setCampaignData(null);
    }
  };

  const handleButtonSelectionChange = (channelCode: string, goalSlug: string, voiceSlug: string) => {
    if (currentStoryId !== null) {
      // STORY MODE
      setStorySelectedButtons({ channelCode, goalSlug, voiceSlug });
      if (campaignDataCache[currentStoryId]) {
        setCampaignData(campaignDataCache[currentStoryId]);
      }
    } else {
      // URL MODE
      setUrlSelectedButtons({ channelCode, goalSlug, voiceSlug });
      // Don't clear variations here - let the button click handler manage them
    }
  };

  const handleCampaignDataUpdate = (newCampaignData: CampaignData | null) => {
    setCampaignData(newCampaignData);
  };

  const handleUrlChanged = (url: string) => {
    setCurrentUrl(url);
    setSearchText(url); // Update search bar when URL changes
    // Clear URL variations immediately when a new URL is being processed
    setUrlVariations(null);
    setUrlVariationsForCombination(null);
    setUrlSelectedButtons(null);
    // Clear story data when a new URL is entered
    setStoryData(null);
    setStoryTitle('');
    setCampaignData(null);
    // Clear current story ID to switch from story mode to URL mode
    setCurrentStoryId(null);
    // Clear story facts to reset the middle component
    setStoryFacts([]);
    // Clear chunk facts and related data
    setChunkFacts([]);
    setChunkFactsReady(false);
  };

  const handleUrlSwitch = (url: string) => {
    setCurrentUrl(url);
    setSearchText(url); // Update search bar when URL is switched

    // Clear story context to switch from story mode to URL mode
    setCurrentStoryId(null);
    setStoryData(null);
    setStoryTitle('');
    setCampaignData(null);

    // IMPORTANT: Clear URL variations so the URL effect can restore them from history
    setUrlVariations(null);
    setUrlVariationsForCombination(null);
    setUrlSelectedButtons(null);

    // Restore URL data from cache
    const cachedUrlData = urlDataCache[url];
    if (cachedUrlData) {
      setStoryFacts(cachedUrlData.storyFacts);
      setChunkFacts(cachedUrlData.chunkFacts);
      setChunkFactsData(cachedUrlData.chunkFactsData);
      setChunkFactsReady(cachedUrlData.chunkFactsReady);
    }
  };

  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
  };

  const handleGoButtonClicked = () => {
    // Unselect any story when GO button is clicked
    setCurrentStoryId(null);
    setGoButtonClicked(true);
    // Reset the flag after a short delay to allow MainContent to react
    setTimeout(() => setGoButtonClicked(false), 100);
  };

  const handleHoroscopeClick = () => {
    // Clear all story-related data when horoscope is clicked
    setCurrentStoryId(null);
    setStoryData(null);
    setStoryTitle('');
    setStoryFacts([]);
    setChunkFacts([]);
    setChunkFactsData(null);
    setChunkFactsReady(false);
    setCampaignData(null);
    setStoryVariations(null);
    setStoryVariationsForCombination(null);
    setStorySelectedButtons(null);

    // Clear all URL-related data when horoscope is clicked
    setCurrentUrl('');
    setSearchText('');
    setUrlVariations(null);
    setUrlVariationsForCombination(null);
    setUrlSelectedButtons(null);
  };

  // Fetch campaign filters on component mount
  React.useEffect(() => {
    const fetchCampaignFilters = async () => {
      try {
        const response = await fetch('/api/v2/askruth/campaign-filters/');
        if (response.ok) {
          const data = await response.json();

          // Filter channels to only show: text (Plain Text), instagram, facebook, bluesky in that order
          if (data.channels) {
            const allowedChannels = ['text', 'instagram', 'facebook', 'bluesky'];
            const filteredChannels = allowedChannels
              .map(name => data.channels.find((ch: any) => ch.name.toLowerCase() === name))
              .filter((ch: any) => ch !== undefined);
            data.channels = filteredChannels;
          }

          // Reorder goals to put "spread-the-word" first
          if (data.goals && Array.isArray(data.goals)) {
            const spreadTheWordGoal = data.goals.find((g: any) => g.slug === 'spread-the-word');
            if (spreadTheWordGoal) {
              const otherGoals = data.goals.filter((g: any) => g.slug !== 'spread-the-word');
              data.goals = [spreadTheWordGoal, ...otherGoals];
            }
          }

          // Add code property to channels for easy access
          if (data.channels) {
            data.channels = data.channels.map((ch: any) => ({
              ...ch,
              code: ch.code
            }));
          }

          // Add slug property to goals for easy access
          if (data.goals) {
            data.goals = data.goals.map((g: any) => ({
              ...g,
              slug: g.slug
            }));
          }

          // Add slug property to voices for easy access
          if (data.voices) {
            data.voices = data.voices.map((v: any) => ({
              ...v,
              slug: v.slug
            }));
          }

          setCampaignFilters(data);
        } else {
          console.error('Failed to fetch campaign filters:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching campaign filters:', error);
      }
    };

    fetchCampaignFilters();
  }, []);

  const handleStoryCardClick = async (storyId: number, title?: string) => {
    setIsLoadingStory(true);
    setCurrentStoryId(storyId);

    // Clear search bar and URL when story is clicked
    setSearchText('');
    setCurrentUrl(''); // Unselect any URL in the dropdown

    // Check if data is already cached
    const isStoryDataCached = storyDataCache[storyId] !== undefined;
    const isCampaignDataCached = campaignDataCache[storyId] !== undefined;

    // Clear all data immediately before fetching new story
    setStoryData(null);
    setStoryFacts([]);
    setChunkFacts([]);
    setChunkFactsData(null);
    setChunkFactsReady(false);
    setCampaignData(null);
    setStoryVariations(null);
    setStoryVariationsForCombination(null);
    setStorySelectedButtons(null);

    try {
      // Set the story title if provided
      if (title) {
        setStoryTitle(title);
      }

      // Use cached story evidence data if available, otherwise fetch from API
      if (isStoryDataCached) {
        // Use cached story data - no API call
        const data = storyDataCache[storyId];
        setStoryData(data);

        // Extract story facts text
        if (data.facts && data.facts.length > 0) {
          const factsText = data.facts.map(fact => fact.text);
          setStoryFacts(factsText);
        }

        // Use cached facts if available, otherwise create and cache them
        if (factsForCampaignCache[storyId]) {
          setCurrentFactsForCampaign(factsForCampaignCache[storyId]);
        } else {
          createAndCacheFactsForCampaign(storyId, data);
        }

        // Set chunkFactsReady to true if related_facts exist
        if (data.related_facts && data.related_facts.length > 0) {
          setChunkFactsReady(true);
          // Extract related facts text for chunkFacts
          const relatedFactsText = data.related_facts.map(fact => fact.text);
          setChunkFacts(relatedFactsText);
        } else {
          setChunkFactsReady(false);
        }

        // Trigger Story Facts tab activation
        setShouldActivateStoryTab(true);
      } else {
        // Fetch story evidence data from v2 API
        const response = await fetch(`/api/v2/askruth/story/${storyId}/evidence/`);
        if (response.ok) {
          const data: StoryData = await response.json();
          setStoryData(data);

          // Cache the story data
          setStoryDataCache(prev => ({
            ...prev,
            [storyId]: data
          }));

          // Extract story facts text
          if (data.facts && data.facts.length > 0) {
            const factsText = data.facts.map(fact => fact.text);
            setStoryFacts(factsText);
          }

          // Create and cache facts object for campaign generation
          createAndCacheFactsForCampaign(storyId, data);

          // Set chunkFactsReady to true if related_facts exist
          if (data.related_facts && data.related_facts.length > 0) {
            setChunkFactsReady(true);
            // Extract related facts text for chunkFacts
            const relatedFactsText = data.related_facts.map(fact => fact.text);
            setChunkFacts(relatedFactsText);
          } else {
            setChunkFactsReady(false);
          }

          // Trigger Story Facts tab activation
          setShouldActivateStoryTab(true);
        } else {
          console.error('Failed to fetch story data:', response.statusText);
        }
      }

      // Use cached campaign data if available, otherwise fetch from API
      if (isCampaignDataCached) {
        // Use cached campaign data - no API call
        setCampaignData(campaignDataCache[storyId]);
      } else {
        // Fetch from API and cache it
        const campaignResponse = await fetch(`/api/v2/askruth/story/${storyId}/campaign/`);
        if (campaignResponse.ok) {
          const campaignDataResponse: CampaignData = await campaignResponse.json();
          setCampaignData(campaignDataResponse);
          // Cache the campaign data
          setCampaignDataCache(prev => ({
            ...prev,
            [storyId]: campaignDataResponse
          }));
        } else {
          console.error('Failed to fetch campaign data:', campaignResponse.statusText);
        }
      }
    } catch (error) {
      console.error('Error fetching story data:', error);
    } finally {
      setIsLoadingStory(false);
    }
  };

  return (
    <div className="app">
      <Header />
      <SearchBar
        onFactsExtracted={handleFactsExtracted}
        onChunkFactsReady={handleChunkFactsReady}
        onUrlChanged={handleUrlChanged}
        searchText={searchText}
        onSearchTextChange={handleSearchTextChange}
        onGoButtonClicked={handleGoButtonClicked}
        urlCampaignHistory={urlCampaignHistory}
        currentUrl={currentUrl}
        onUrlSwitch={handleUrlSwitch}
        urlDataCache={urlDataCache}
      />
      <div className="app-body">
        <Sidebar onStoryCardClick={handleStoryCardClick} onHoroscopeClick={handleHoroscopeClick} resetSelection={goButtonClicked || shouldResetSidebarSelection} />
        <MainContent
          storyFacts={storyFacts}
          chunkFacts={chunkFacts}
          chunkFactsReady={chunkFactsReady}
          chunkFactsData={chunkFactsData}
          onVariationsGenerated={handleVariationsGenerated}
          onStoryVariationsGenerated={handleStoryVariationsGenerated}
          currentUrl={currentUrl}
          goButtonClicked={goButtonClicked}
          storyData={storyData}
          storyTitle={storyTitle}
          campaignFilters={campaignFilters}
          isLoadingStory={isLoadingStory}
          shouldActivateStoryTab={shouldActivateStoryTab}
          onStoryTabActivated={() => setShouldActivateStoryTab(false)}
          onButtonSelectionChange={handleButtonSelectionChange}
          onCampaignDataUpdate={handleCampaignDataUpdate}
          campaignData={campaignData}
          currentFactsForCampaign={currentFactsForCampaign}
          currentStoryId={currentStoryId}
          urlCampaignHistory={urlCampaignHistory}
          setUrlCampaignHistory={setUrlCampaignHistory}
        />
        <RightSidebar
          variations={currentStoryId !== null ? storyVariations : urlVariations}
          variationsForCombination={currentStoryId !== null ? storyVariationsForCombination : urlVariationsForCombination}
          campaignData={campaignData}
          campaignFilters={campaignFilters}
          selectedButtons={currentStoryId !== null ? storySelectedButtons : urlSelectedButtons}
        />
      </div>
    </div>
  );
}

export default App;
