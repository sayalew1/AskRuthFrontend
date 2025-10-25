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
  const [isLoadingStory, setIsLoadingStory] = useState<boolean>(false);
  const [shouldActivateStoryTab, setShouldActivateStoryTab] = useState<boolean>(false);

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
    setVariations(variationsData);
  };

  const handleUrlChanged = (url: string) => {
    setCurrentUrl(url);
    setSearchText(url); // Update search bar when URL changes
    // Clear variations immediately when a new URL is being processed
    setVariations(null);
    // Clear story data when a new URL is entered
    setStoryData(null);
    setStoryTitle('');
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
    try {
      // Set the story title if provided
      if (title) {
        setStoryTitle(title);
      }

      // Fetch story evidence data from v2 API
      const response = await fetch(`/api/v2/askruth/story/${storyId}/evidence/`);
      if (response.ok) {
        const data: StoryData = await response.json();
        setStoryData(data);

        // Clear existing facts data when loading a new story
        setStoryFacts([]);
        setChunkFacts([]);
        setChunkFactsData(null);

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
        />
        <RightSidebar variations={variations} />
      </div>
    </div>
  );
}

export default App;
