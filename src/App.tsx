import React from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import RightSidebar from './components/RightSidebar';
import './App.css';

function App() {
  return (
    <div className="app">
      <Header />
      <SearchBar />
      <div className="app-body">
        <Sidebar />
        <MainContent />
        <RightSidebar />
      </div>
    </div>
  );
}

export default App;
