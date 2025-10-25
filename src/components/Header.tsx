import React from 'react';
import './Header.css';
import logo from '../assets/logo.svg';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <img src={logo} alt="Ask Ruth Logo" className="logo-image" />
        </div>
      </div>
    </header>
  );
};

export default Header;
