import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  number: string;
  label: string;
  delay?: number;
}

function StatCard({ number, label, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      className="bg-white p-6 rounded-lg shadow-lg text-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <motion.div
        className="text-4xl font-bold text-indigo-600 mb-2"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: delay + 0.2 }}
      >
        {number}
      </motion.div>
      <p className="text-gray-600">{label}</p>
    </motion.div>
  );
}

export default StatCard;