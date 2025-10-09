import React from 'react';
import './MainContent.css';

const MainContent: React.FC = () => {
  const tabs = ['Story Facts', 'Related Facts & Data', 'Sources'];
  const [activeTab, setActiveTab] = React.useState(0);

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

  return (
    <div className="main-content">
      <div className="content-header">
        <h1>Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero</h1>
      </div>

      <div className="tabs">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`tab ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="content-body">
        <div className="main-text">
          <h2>Nulla consequat massa quis enim.</h2>
          <ul>
            <li>Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu.</li>
            <li>In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo.</li>
            <li>Nullam dictum felis eu pede mollis pretium.</li>
          </ul>
          <button className="show-more-btn">Show More</button>
        </div>

        <div className="divider"></div>

        <div className="social-section">
          <h3>Social Media Channel</h3>
          <div className="social-channels">
            {socialChannels.map((channel, index) => (
              <button
                key={index}
                className={`channel-btn ${channel.active ? 'active' : ''}`}
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
                className="action-btn"
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
              <span key={index} className="characteristic-tag">{tag}</span>
            ))}
          </div>
        </div>

        <div className="create-campaign">
          <button className="create-btn">Create Campaign ✨</button>
        </div>
      </div>
    </div>
  );
};

export default MainContent;
