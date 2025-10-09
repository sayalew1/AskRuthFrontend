import React from 'react';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <div className="logo-icon">R</div>
          <span className="logo-text">ASK RUTH</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
