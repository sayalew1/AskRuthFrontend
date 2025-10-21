import React, { useState, useEffect } from 'react';
import './Sidebar.css';
import shareButtonIcon from '../assets/shareButton.png';
import CorruptionImg from '../assets/categories/Corruption.jpg';
import EconomyImg from '../assets/categories/Economy.jpg';
import ImmigrationImg from '../assets/categories/Immigration.jpg';
import WomensRightsImg from '../assets/categories/WomensRights.jpg';

// Interface definitions
interface Cause {
  name: string;
  slug: string;
}

interface Topic {
  name: string;
  slug: string;
}

interface Jurisdiction {
  name: string;
  code: string;
}

interface PrimaryArticle {
  id: number;
  url: string;
  headline: string;
  publisher: string;
  published_at: string | null;
  image_url: string;
}

interface Campaign {
  id: number;
  public_id: string;
  title: string;
  summary: string;
  hero_image_url: string;
  published_at: string;
  causes: Cause[];
  topics: Topic[];
  jurisdictions: Jurisdiction[];
  primary_article: PrimaryArticle;
  facts_count: number;
  campaign_id: number;
}

interface ApiResponse {
  count: number;
  offset: number;
  limit: number;
  results: Campaign[];
}

interface SidebarProps {
  onStoryCardClick?: (storyId: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onStoryCardClick }) => {
  const [activeCategory, setActiveCategory] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);

  // Fetch campaigns from API
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v2/askruth/feed');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ApiResponse = await response.json();
        setCampaigns(data.results);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch campaigns');
        console.error('Error fetching campaigns:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  // Get unique categories from campaigns (using causes)
  const getCategories = () => {
    const uniqueCategories = new Set();
    campaigns.forEach(campaign => {
      if (campaign.cause && campaign.cause.name) {
        uniqueCategories.add(campaign.cause.name);
      }
    });

    // Convert to array and sort alphabetically
    const allCategories = Array.from(uniqueCategories).sort();

    // Create final order with explicit positioning
    const finalCategories = ['All'];

    // Add all other categories
    allCategories.forEach(category => {
      finalCategories.push(category);
    });

    return finalCategories.map((name, index) => ({
      name,
      active: index === activeCategory
    }));
  };

  const categories = getCategories();

  const handleCategoryClick = (index: number) => {
    setActiveCategory(index);
  };

  // Filter campaigns based on active category (using causes)
  const getFilteredCampaigns = () => {
    if (activeCategory === 0) return campaigns; // 'All' category
    const selectedCategory = categories[activeCategory]?.name;
    return campaigns.filter(campaign =>
      campaign.cause && campaign.cause.name === selectedCategory
    );
  };

  // Function to get state icon using dynamic import
  const getStateIcon = (stateName: string) => {
    if (!stateName) return null;

    try {
      // Use dynamic import with explicit path
      return new URL(`../assets/states/${stateName}.svg`, import.meta.url).href;
    } catch (error) {
      console.log(`Failed to load state icon for: "${stateName}"`);
      return null;
    }
  };

  // Function to get category icon - loads images from assets/categories for causes
  const getCategoryIcon = (categoryName: string) => {
    if (!categoryName) return null;

    // Normalize the category name by removing all types of apostrophes, quotes, and spaces
    const normalizedName = categoryName
      .replace(/[\u0027\u2018\u2019\u201C\u201D\s]/g, ''); // Remove all apostrophes, quotes, and spaces

    // Map cause names to imported image files
    const causeImageMap: { [key: string]: string } = {
      'Corruption': CorruptionImg,
      'Economy': EconomyImg,
      'Immigration': ImmigrationImg,
      'WomensRights': WomensRightsImg
    };

    // Check if it's a cause (has image)
    const iconUrl = causeImageMap[normalizedName];

    return iconUrl || null;
  };

  const handleShareClick = (campaignTitle: string) => {
    // Handle share functionality
  };

  const handleCampaignCardClick = (campaignId: number, title?: string) => {
    setSelectedCampaignId(campaignId);
    if (onStoryCardClick) {
      onStoryCardClick(campaignId, title);
    }
  };

  // Get current date in MM/DD/YYYY format
  const getCurrentDate = () => {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const year = now.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Get filtered campaigns first, then transform them
  const filteredCampaigns = getFilteredCampaigns();

  // Transform filtered API campaigns to match the expected format - all as small cards
  const transformedCampaigns = filteredCampaigns.map((campaign, index) => ({
    id: campaign.id,
    title: campaign.cause && campaign.cause.name ? campaign.cause.name : 'Unknown Cause', // Use cause name as category title
    actualTitle: campaign.title || 'No Title', // Use actual campaign title for display
    subtitle: '',
    description: campaign.summary ? campaign.summary.substring(0, 200) + (campaign.summary.length > 200 ? '...' : '') : '',
    image: campaign.hero_image_url || 'https://via.placeholder.com/86x86',
    category: campaign.cause && campaign.cause.name ? campaign.cause.name : '',
    categoryIcon: campaign.cause && campaign.cause.name ? getCategoryIcon(campaign.cause.name) : null,
    bgColor: '#8b4513',
    icon: '🏛',
    hasLargeImage: false, // All campaigns are small cards now
    stateIcon: campaign.cause && campaign.cause.name ? getCategoryIcon(campaign.cause.name) : null,
    stateName: campaign.cause && campaign.cause.name ? campaign.cause.name : '',
    published_at: campaign.published_at
  }));

  return (
    <div className="sidebar">
      <div className="categories">
        {categories.map((category, index) => (
          <button
            key={index}
            className={`category-btn ${activeCategory === index ? 'active' : ''}`}
            data-category={category.name}
            onClick={() => handleCategoryClick(index)}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* US Horoscope - Only shown when "All" category is selected - NOT scrollable */}
      {activeCategory === 0 && (
        <div className="campaign-card large-card">
          <div className="large-campaign">
            <div className="campaign-header">
              <div className="campaign-icon" style={{ backgroundColor: '#4a90e2' }}>
                <span>🇺🇸</span>
              </div>
              <div className="campaign-info">
                <h4>US Horoscope</h4>
                <p>National Political Climate</p>
              </div>
            </div>
            <div className="campaign-description">
              <p>Stay informed about the current political climate and key issues affecting the nation.</p>
            </div>
            <div className="campaign-date">
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}

      <div className="campaigns">
        {loading ? (
          <div className="simple-loading-overlay">
            <div className="simple-spinner"></div>
          </div>
        ) : error ? (
          <div className="error-message">Error: {error}</div>
        ) : (
          <>
            {/* Dynamic campaigns from API */}
            {transformedCampaigns.length === 0 ? (
              <div className="no-campaigns">No campaigns found</div>
            ) : (
              transformedCampaigns.map((campaign) => (
          <div
            key={campaign.id}
            className={`campaign-card ${campaign.hasLargeImage ? 'large-card' : 'small-card'} ${!campaign.hasLargeImage ? 'state-card' : ''} ${selectedCampaignId === campaign.id ? 'active' : ''}`}
            onClick={() => handleCampaignCardClick(campaign.id, campaign.actualTitle)}
            style={{ cursor: 'pointer' }}
          >
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
                  <button
                    className="share-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareClick(campaign.title);
                    }}
                  >
                    <img src={shareButtonIcon} alt="Share" className="share-icon" />
                  </button>
                </div>
                <div className="campaign-image-container">
                  <img src={campaign.image} alt={campaign.title} className={`campaign-image ${campaign.title === 'United States Horoscope' ? 'horoscope-image' : ''}`} />
                  {campaign.category && (
                    <div className="campaign-category-overlay">{campaign.category}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="small-campaign" style={{position: 'relative'}}>
                <div className="campaign-header">
                  <div className="campaign-info" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 12px', marginBottom: '0'}}>
                    {campaign.category && <p style={{margin: '0', flex: '1', fontWeight: '600', fontSize: '14px', color: '#4C433B'}}>{campaign.category}</p>}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareClick(campaign.title);
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px',
                        cursor: 'pointer',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {shareButtonIcon ? (
                        <img src={shareButtonIcon} alt="Share" style={{width: '14px', height: '14px'}} />
                      ) : (
                        '📤'
                      )}
                    </button>
                  </div>
                </div>
                <div className="small-campaign-content">
                  <div className="campaign-description">
                    <div className="description-with-icon">
                      {campaign.categoryIcon && (
                        <img
                          src={campaign.categoryIcon}
                          alt={`${campaign.category} icon`}
                          className="category-icon"
                          style={{
                            width: '72px',
                            height: '72px',
                            marginRight: '12px',
                            flexShrink: 0,
                            borderRadius: '6px',
                            objectFit: campaign.category.includes('Women') ? 'contain' : 'cover',
                            padding: campaign.category.includes('Women') ? '4px' : '0',
                            backgroundColor: campaign.category.includes('Women') ? '#f9f9f9' : 'transparent'
                          }}
                          onError={(e) => {
                            console.log(`Image failed to load: ${campaign.categoryIcon}`);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      {campaign.actualTitle && (
                        <p className="description-text">{campaign.actualTitle}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
