import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface InteractiveFeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  details: string;
}

function InteractiveFeature({ icon, title, description, details }: InteractiveFeatureProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      className={`bg-white p-6 rounded-lg shadow-lg transition-all duration-300 cursor-pointer
        ${isExpanded ? 'scale-105 shadow-xl' : 'hover:shadow-md'}`}
      onClick={() => setIsExpanded(!isExpanded)}
      whileHover={{ scale: isExpanded ? 1 : 1.02 }}
      layout
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <motion.div
            className="text-indigo-600"
            animate={{ rotate: isExpanded ? 360 : 0 }}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.div>
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="mt-2 text-gray-500">{description}</p>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: isExpanded ? 'auto' : 0,
              opacity: isExpanded ? 1 : 0
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="mt-4 text-sm text-gray-600">{details}</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default InteractiveFeature;