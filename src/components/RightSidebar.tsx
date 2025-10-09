import React, { useState } from 'react';
import './RightSidebar.css';

const RightSidebar: React.FC = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const images = [
    { id: 1, src: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&h=200&fit=crop&crop=center', alt: 'Polar bears on ice' },
    { id: 2, src: 'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=300&h=200&fit=crop&crop=center', alt: 'Supreme Court building' },
    { id: 3, src: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=300&h=200&fit=crop&crop=center', alt: 'Person with protest sign' }
  ];

  return (
    <div className="right-sidebar">
      {/* Top Action Buttons */}
      <div className="top-actions">
        <div className="left-buttons">
          <button className="action-button primary">Campaign Suggestion</button>
          <button className="action-button secondary">Other Options</button>
        </div>
        <div className="right-buttons">
          <button className="action-button icon">↻</button>
          <button className="action-button secondary">Undo</button>
        </div>
      </div>
      {/* Image Carousel */}
      <div className="image-carousel">
        <div className="carousel-container">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`carousel-slide ${index === currentImageIndex ? 'active' : ''}`}
            >
              <img src={image.src} alt={image.alt} />
              <button className="copy-btn">📋</button>
            </div>
          ))}
        </div>
        <div className="carousel-dots">
          {images.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentImageIndex ? 'active' : ''}`}
              onClick={() => setCurrentImageIndex(index)}
            />
          ))}
        </div>
      </div>

      {/* Text Content */}
      <div className="text-content">
        <p>
          {currentTextIndex === 0 && "Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id. ❤️"}
          {currentTextIndex === 1 && "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes. 😊"}
          {currentTextIndex === 2 && "Maecenas nec odio et ante tincidunt tempus. Donec vitae sapien ut libero venenatis faucibus. 😊"}
        </p>
      </div>

      {/* Additional Text Content */}
      <div className="additional-text-content">
        <p>
          Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id. ❤️
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes. 😊
        </p>
        <p>
          Maecenas nec odio et ante tincidunt tempus. Donec vitae sapien ut libero venenatis faucibus. 😊
        </p>
      </div>

      {/* Bottom Pagination */}
      <div className="bottom-pagination">
        <div className="pagination-dots">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              className={`dot ${index === currentTextIndex ? 'active' : ''}`}
              onClick={() => setCurrentTextIndex(index)}
            />
          ))}
        </div>
        <button className="bottom-copy-btn">📋</button>
      </div>
    </div>
  );
};

export default RightSidebar;
