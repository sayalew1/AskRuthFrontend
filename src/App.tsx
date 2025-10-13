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

function App() {
  const [storyFacts, setStoryFacts] = useState<string[]>([]);
  const [chunkFacts, setChunkFacts] = useState<string[]>([]);
  const [chunkFactsReady, setChunkFactsReady] = useState<boolean>(false);
  const [chunkFactsData, setChunkFactsData] = useState<any>(null);
  const [variations, setVariations] = useState<any>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');

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

  return (
    <div className="app">
      <Header />
      <SearchBar
        onFactsExtracted={handleFactsExtracted}
        onChunkFactsReady={handleChunkFactsReady}
        onUrlChanged={handleUrlChanged}
        searchText={searchText}
        onSearchTextChange={handleSearchTextChange}
      />
      <div className="app-body">
        <Sidebar />
        <MainContent
          storyFacts={storyFacts}
          chunkFacts={chunkFacts}
          chunkFactsReady={chunkFactsReady}
          chunkFactsData={chunkFactsData}
          onVariationsGenerated={handleVariationsGenerated}
          currentUrl={currentUrl}
          onUrlSwitch={handleUrlSwitch}
        />
        <RightSidebar variations={variations} />
      </div>
    </div>
  );
}

export default App;
