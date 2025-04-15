import React from 'react';
import { motion } from 'framer-motion';
import AnimatedSection from '../../components/landing/AnimatedSection';

function Resources() {
  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">Resources</h1>
          <p className="mt-4 text-xl text-gray-600">
            Research and insights about AI in healthcare
          </p>
        </motion.div>

        <AnimatedSection className="mt-16">
          <div className="grid gap-8">
            {/* McKinsey Reference */}
            <motion.div
              className="bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-shadow duration-300"
              whileHover={{ y: -5 }}
            >
              <div className="px-8 py-10">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-gray-900">McKinsey Healthcare AI Report</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  According to McKinsey's latest healthcare AI analysis, transparent clinical reasoning
                  systems address the top 3 needs in healthcare AI implementation.
                </p>
                <div className="mt-6">
                  <a href="#" className="text-indigo-600 hover:text-indigo-500 font-medium flex items-center">
                    Read More
                    <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Research Paper */}
            <motion.div
              className="bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-shadow duration-300"
              whileHover={{ y: -5 }}
            >
              <div className="px-8 py-10">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-gray-900">
                    The Impact of AI on Clinical Decision Making
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  A comprehensive study published in the Journal of Medical AI showing how transparent
                  AI systems improve physician confidence and decision-making accuracy.
                </p>
                <div className="mt-6">
                  <a href="#" className="text-indigo-600 hover:text-indigo-500 font-medium flex items-center">
                    Read More
                    <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Survey Results */}
            <motion.div
              className="bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-shadow duration-300"
              whileHover={{ y: -5 }}
            >
              <div className="px-8 py-10">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24"stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-gray-900">Physician AI Preferences Survey</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Our survey of 500+ physicians revealed that transparent reasoning is the most
                  desired feature in clinical AI systems, with 92% rating it as "very important."
                </p>
                <div className="mt-6">
                  <a href="#" className="text-indigo-600 hover:text-indigo-500 font-medium flex items-center">
                    Read More
                    <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}

export default Resources;