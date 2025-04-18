import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  number: string;
  label: React.ReactNode;
  delay?: number;
}

function StatCard({ number, label, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
      whileHover={{ y: -5 }}
    >
      <motion.span
        className="block text-4xl font-bold text-darkBlue mb-4"
        initial={{ scale: 0.5 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: delay + 0.2 }}
      >
        {number}
      </motion.span>
      <div className="text-gray-600">{label}</div>
    </motion.div>
  );
}

export default StatCard;