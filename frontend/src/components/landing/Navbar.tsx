import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src="/favicon/android-chrome-192x192.png" alt="Medhastra Logo" className="h-8 w-8" />
              <span className="ml-2 text-xl font-bold text-darkBlue">Medhastra AI</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-darkText hover:text-yellow">Home</Link>
            <Link to="/resources" className="text-darkText hover:text-yellow">Resources</Link>
            <Link to="/about" className="text-darkText hover:text-yellow">About Us</Link>
            <Link to="/contact" className="text-darkText hover:text-yellow">Contact</Link>
            <a
              href="https://forms.google.com/your-form-url"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-darkBlue text-white px-4 py-2 rounded-md hover:bg-yellow hover:text-darkBlue transition"
            >
              Request Demo
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-darkText hover:text-yellow"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link to="/" className="block px-3 py-2 text-darkText hover:text-yellow">Home</Link>
            <Link to="/resources" className="block px-3 py-2 text-darkText hover:text-yellow">Resources</Link>
            <Link to="/about" className="block px-3 py-2 text-darkText hover:text-yellow">About Us</Link>
            <Link to="/contact" className="block px-3 py-2 text-darkText hover:text-yellow">Contact</Link>
            <a
              href="https://forms.google.com/your-form-url"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full mt-4 text-center bg-darkBlue text-white px-4 py-2 rounded-md hover:bg-yellow hover:text-darkBlue transition"
            >
              Request Demo
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;