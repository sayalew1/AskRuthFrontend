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

  const handleStoryCardClick = async (storyId: number) => {
    setIsLoadingStory(true);
    try {
      const response = await fetch(`/api/askruth/story/${storyId}`);
      if (response.ok) {
        const data: StoryData = await response.json();
        setStoryData(data);

        // Clear existing facts data when loading a new story
        setStoryFacts([]);
        setChunkFacts([]);
        setChunkFactsReady(false);
        setChunkFactsData(null);

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
        <Sidebar onStoryCardClick={handleStoryCardClick} />
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
