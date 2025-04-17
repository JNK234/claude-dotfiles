import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface InteractiveFeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  details: string;
  className?: string;
}

function InteractiveFeature({ icon, title, description, details, className = '' }: InteractiveFeatureProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      className={`bg-white p-8 rounded-lg shadow-lg transition-all duration-300 cursor-pointer
        ${isExpanded ? 'scale-105 shadow-xl' : 'hover:shadow-md'} ${className}`}
      onClick={() => setIsExpanded(!isExpanded)}
      whileHover={{ scale: isExpanded ? 1 : 1.02 }}
      layout
    >
      <div className="flex items-start space-x-6">
        <div className="flex-shrink-0">
          <motion.div
            className="text-darkBlue"
            animate={{ rotate: isExpanded ? 360 : 0 }}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.div>
        </div>
        <div className="flex-grow">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <p className="mt-3 text-gray-600 text-lg">{description}</p>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: isExpanded ? 'auto' : 0,
              opacity: isExpanded ? 1 : 0
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="mt-4 text-gray-600">{details}</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default InteractiveFeature;