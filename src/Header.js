import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './styles.css';
const Header = () => {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => setOpen(!open);

  const closeMenu = () => setOpen(false);

  return (
    <header className="header">
      <div className="logo">
        <img src="/logo.png" alt="La MERIENDA" className="logo-image" />
      </div>
      <nav>
        <ul className="nav-menu">
          <li className="dropdown">
            <button onClick={toggleMenu} className="dropbtn">
              Menu
            </button>
            {open && (
              <ul className="dropdown-content" onClick={closeMenu}>
                <li><Link to="/">Caisse</Link></li>
                <li><Link to="/login">Login</Link></li>
              </ul>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
