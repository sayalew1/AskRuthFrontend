import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState(0);

  const categories = [
    { name: 'All', active: true },
    { name: "Women's Rights", active: false },
    { name: 'Immigration', active: false },
    { name: 'Corruption', active: false },
    { name: 'Economy', active: false }
  ];

  const handleCategoryClick = (index: number) => {
    setActiveCategory(index);
  };

  const handleShareClick = (campaignTitle: string) => {
    // Handle share functionality
  };

  // Get current date in MM/DD/YYYY format
  const getCurrentDate = () => {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const year = now.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const campaigns = [
    {
      id: 1,
      title: 'United States Horoscope',
      subtitle: getCurrentDate(),
      image: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=300&h=200&fit=crop&crop=center',
      category: '',
      bgColor: '#0891b2',
      icon: '♋',
      hasLargeImage: true
    },
    {
      id: 2,
      title: 'Mississippi',
      subtitle: "Women's Rights",
      description: 'Phasellus viverra nulla ut metus varius viverra nulla ut laoreet.',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=60&h=60&fit=crop&crop=face',
      bgColor: '#8b4513',
      icon: '🏛',
      hasLargeImage: false
    },
    {
      id: 3,
      title: 'Ohio',
      subtitle: "Women's Rights",
      description: 'Carmen Cum sociis natoque penatibus et magnis dis parturient.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
      bgColor: '#8b4513',
      icon: '🏛',
      hasLargeImage: false
    }
  ];

  return (
    <div className="sidebar">
      <div className="categories">
        {categories.map((category, index) => (
          <button
            key={index}
            className={`category-btn ${activeCategory === index ? 'active' : ''}`}
            onClick={() => handleCategoryClick(index)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="campaigns">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className={`campaign-card ${campaign.hasLargeImage ? 'large-card' : 'small-card'} ${!campaign.hasLargeImage ? 'state-card' : ''}`}>
            {campaign.hasLargeImage ? (
              <div className="large-campaign">
                <div className="campaign-header">
                  <div className="campaign-icon" style={{ backgroundColor: campaign.bgColor }}>
                    <span>{campaign.icon}</span>
                  </div>
                  <div className="campaign-info">
                    <h4>{campaign.title}</h4>
                    {campaign.subtitle && <p>{campaign.subtitle}</p>}
                  </div>
                  <button className="share-btn" onClick={() => handleShareClick(campaign.title)}>↗</button>
                </div>
                <div className="campaign-image-container">
                  <img src={campaign.image} alt={campaign.title} className={`campaign-image ${campaign.title === 'United States Horoscope' ? 'horoscope-image' : ''}`} />
                  {campaign.category && (
                    <div className="campaign-category-overlay">{campaign.category}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="small-campaign">
                <div className="campaign-header">
                  <div className="campaign-icon" style={{ backgroundColor: campaign.bgColor }}>
                    <span>{campaign.icon}</span>
                  </div>
                  <div className="campaign-info">
                    <h4>{campaign.title}</h4>
                    {campaign.subtitle && <p>{campaign.subtitle}</p>}
                  </div>
                  <button className="share-btn" onClick={() => handleShareClick(campaign.title)}>↗</button>
                </div>
                <div className="small-campaign-content">
                  <img src={campaign.image} alt={campaign.title} className="small-campaign-image" />
                  <div className="campaign-description">
                    {campaign.description && (
                      <p className="description-text">{campaign.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
