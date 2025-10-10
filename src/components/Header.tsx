import React from 'react';
import './Header.css';
import logo from '../assets/logo.png';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <img src={logo} alt="Ask Ruth Logo" className="logo-image" />
          <span className="logo-text">ASK RUTH</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
