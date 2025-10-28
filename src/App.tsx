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
    charismatic: {
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
  const [variations, setVariations] = useState<any>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [goButtonClicked, setGoButtonClicked] = useState<boolean>(false);
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [storyTitle, setStoryTitle] = useState<string>('');
  const [campaignFilters, setCampaignFilters] = useState<any>(null);
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
  const [isLoadingStory, setIsLoadingStory] = useState<boolean>(false);
  const [shouldActivateStoryTab, setShouldActivateStoryTab] = useState<boolean>(false);
  const [selectedButtons, setSelectedButtons] = useState<{ channelCode: string; goalSlug: string; voiceSlug: string } | null>(null);
  const [campaignDataCache, setCampaignDataCache] = useState<{ [storyId: number]: CampaignData }>({});
  const [storyDataCache, setStoryDataCache] = useState<{ [storyId: number]: StoryData }>({});
  const [factsForCampaignCache, setFactsForCampaignCache] = useState<{ [storyId: number]: { url_facts: string[]; rag_facts: { facts: string[] } } }>({});
  const [currentFactsForCampaign, setCurrentFactsForCampaign] = useState<{ url_facts: string[]; rag_facts: { facts: string[] } } | null>(null);
  const [currentStoryId, setCurrentStoryId] = useState<number | null>(null);

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

  const handleFactsExtracted = (response: ApiResponse) => {
    if (response.ok && response.facts) {
      if (response.facts.length > 0) {
        setStoryFacts(response.facts);
      }
      // Reset chunk facts state when new story facts are received
      setChunkFacts([]);
      setChunkFactsReady(false);
      setChunkFactsData(null);
    }
  };

  const handleChunkFactsReady = (facts: string[], fullData: any) => {
    setChunkFacts(facts);
    setChunkFactsReady(true);
    setChunkFactsData(fullData);
  };

  const handleVariationsGenerated = (variationsData: any) => {
    if (variationsData === null) {
      // When variations are null, restore the cached campaign data
      if (currentStoryId !== null && campaignDataCache[currentStoryId]) {
        setCampaignData(campaignDataCache[currentStoryId]);
      }
      setVariations(null);
    } else {
      // When variations are generated, clear campaignData so RightSidebar shows the generated variations
      setVariations(variationsData);
      setCampaignData(null);
    }
  };

  const handleButtonSelectionChange = (channelCode: string, goalSlug: string, voiceSlug: string) => {
    setSelectedButtons({ channelCode, goalSlug, voiceSlug });

    // Restore cached campaign data when button selection changes
    // This allows the RightSidebar to show the cached campaign data for the selected combination
    if (currentStoryId !== null && campaignDataCache[currentStoryId]) {
      setCampaignData(campaignDataCache[currentStoryId]);
      setVariations(null); // Clear variations so cached campaign data is shown
    }
  };

  const handleUrlChanged = (url: string) => {
    setCurrentUrl(url);
    setSearchText(url); // Update search bar when URL changes
    // Clear variations immediately when a new URL is being processed
    setVariations(null);
    // Clear story data when a new URL is entered
    setStoryData(null);
    setStoryTitle('');
    setCampaignData(null);
  };

  const handleUrlSwitch = (url: string) => {
    setCurrentUrl(url);
    setSearchText(url); // Update search bar when URL is switched
  };

  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
  };

  const handleGoButtonClicked = () => {
    setGoButtonClicked(true);
    // Reset the flag after a short delay to allow MainContent to react
    setTimeout(() => setGoButtonClicked(false), 100);
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
    setVariations(null);
    setSelectedButtons(null);

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
      />
      <div className="app-body">
        <Sidebar onStoryCardClick={handleStoryCardClick} resetSelection={goButtonClicked} />
        <MainContent
          storyFacts={storyFacts}
          chunkFacts={chunkFacts}
          chunkFactsReady={chunkFactsReady}
          chunkFactsData={chunkFactsData}
          onVariationsGenerated={handleVariationsGenerated}
          currentUrl={currentUrl}
          onUrlSwitch={handleUrlSwitch}
          goButtonClicked={goButtonClicked}
          storyData={storyData}
          storyTitle={storyTitle}
          campaignFilters={campaignFilters}
          isLoadingStory={isLoadingStory}
          shouldActivateStoryTab={shouldActivateStoryTab}
          onStoryTabActivated={() => setShouldActivateStoryTab(false)}
          onButtonSelectionChange={handleButtonSelectionChange}
          campaignData={campaignData}
          currentFactsForCampaign={currentFactsForCampaign}
        />
        <RightSidebar
          variations={variations}
          campaignData={campaignData}
          campaignFilters={campaignFilters}
          selectedButtons={selectedButtons}
        />
      </div>
    </div>
  );
}

export default App;
