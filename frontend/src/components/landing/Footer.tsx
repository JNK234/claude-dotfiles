import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-white border-t">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          <Link to="/contact" className="text-gray-400 hover:text-gray-500">Contact</Link>
          <a href="https://linkedin.com" className="text-gray-400 hover:text-gray-500" target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          <a href="https://instagram.com" className="text-gray-400 hover:text-gray-500" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        </div>
        <div className="mt-8 md:mt-0 md:order-1">
          <p className="text-center text-base text-gray-400">
            &copy; 2025 Medhastra AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;