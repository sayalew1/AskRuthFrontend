import React, { useState, useEffect } from 'react';
import './Sidebar.css';
import shareButtonIcon from '../assets/shareButton.png';

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

  // Fetch campaigns from API
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/askruth/feed/');
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

  // Get unique categories from campaigns
  const getCategories = () => {
    const uniqueCategories = new Set(['All']);
    campaigns.forEach(campaign => {
      if (campaign.causes && campaign.causes.length > 0) {
        uniqueCategories.add(campaign.causes[0].name);
      }
    });
    return Array.from(uniqueCategories).map((name, index) => ({
      name,
      active: index === activeCategory
    }));
  };

  const categories = getCategories();

  const handleCategoryClick = (index: number) => {
    setActiveCategory(index);
  };

  // Filter campaigns based on active category
  const getFilteredCampaigns = () => {
    if (activeCategory === 0) return campaigns; // 'All' category
    const selectedCategory = categories[activeCategory]?.name;
    return campaigns.filter(campaign =>
      campaign.causes && campaign.causes.length > 0 &&
      campaign.causes[0].name === selectedCategory
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

  // Function to get category icon
  const getCategoryIcon = (categoryName: string) => {
    if (!categoryName) return null;

    try {
      // Convert category name to lowercase and replace spaces with hyphens
      const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
      return new URL(`../assets/categories/${categorySlug}.svg`, import.meta.url).href;
    } catch (error) {
      console.log(`Failed to load category icon for: "${categoryName}"`);
      return null;
    }
  };

  const handleShareClick = (campaignTitle: string) => {
    // Handle share functionality
  };

  const handleCampaignCardClick = (campaignId: number) => {
    if (onStoryCardClick) {
      onStoryCardClick(campaignId);
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
    title: campaign.jurisdictions && campaign.jurisdictions.length > 0 ? campaign.jurisdictions[0].name : 'Unknown State', // Use state name as title
    subtitle: campaign.causes && campaign.causes.length > 0 ? campaign.causes[0].name : '',
    description: campaign.summary ? campaign.summary.substring(0, 200) + (campaign.summary.length > 200 ? '...' : '') : '',
    image: campaign.hero_image_url || 'https://via.placeholder.com/86x86',
    category: campaign.causes && campaign.causes.length > 0 ? campaign.causes[0].name : '',
    categoryIcon: campaign.causes && campaign.causes.length > 0 ? getCategoryIcon(campaign.causes[0].name) : null,
    bgColor: '#8b4513',
    icon: '🏛',
    hasLargeImage: false, // All campaigns are small cards now
    stateIcon: campaign.jurisdictions && campaign.jurisdictions.length > 0 ? getStateIcon(campaign.jurisdictions[0].name) : null,
    stateName: campaign.jurisdictions && campaign.jurisdictions.length > 0 ? campaign.jurisdictions[0].name : '',
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

      <div className="campaigns">
        {loading ? (
          <div className="loading-message">Loading campaigns...</div>
        ) : error ? (
          <div className="error-message">Error: {error}</div>
        ) : (
          <>
            {/* US Horoscope - Only shown when "All" category is selected */}
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

            {/* Dynamic campaigns from API */}
            {transformedCampaigns.length === 0 ? (
              <div className="no-campaigns">No campaigns found</div>
            ) : (
              transformedCampaigns.map((campaign) => (
          <div
            key={campaign.id}
            className={`campaign-card ${campaign.hasLargeImage ? 'large-card' : 'small-card'} ${!campaign.hasLargeImage ? 'state-card' : ''}`}
            onClick={() => handleCampaignCardClick(campaign.id)}
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
                {console.log('Rendering small campaign:', campaign.title)}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShareClick(campaign.title);
                  }}
                  style={{
                    position: 'absolute',
                    top: '0px',
                    right: '8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px',
                    cursor: 'pointer',
                    zIndex: 999,
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
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
                <div className="campaign-header">
                  <div className="campaign-icon" style={{
                    backgroundColor: campaign.stateIcon ? 'transparent' : campaign.bgColor,
                    border: campaign.stateIcon ? 'none' : undefined,
                    borderRadius: campaign.stateIcon ? '0' : undefined,
                    padding: campaign.stateIcon ? '0' : undefined
                  }}>
                    {campaign.stateIcon ? (
                      <img src={campaign.stateIcon} alt={campaign.title} className="state-icon" style={{width: '24px', height: '24px'}} />
                    ) : (
                      <span>{campaign.icon}</span>
                    )}
                  </div>
                  <div className="campaign-info">
                    <h4>{campaign.title}</h4>
                    {campaign.subtitle && <p>{campaign.subtitle}</p>}
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
                          style={{width: '50px', height: '50px', marginRight: '12px', flexShrink: 0}}
                        />
                      )}
                      {campaign.description && (
                        <p className="description-text">{campaign.description.length > 100 ? campaign.description.substring(0, 100) + '...' : campaign.description}</p>
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
