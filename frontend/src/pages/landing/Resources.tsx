import React from 'react';
import { motion } from 'framer-motion';
import AnimatedSection from '../../components/landing/AnimatedSection';

function Resources() {
  return (
    <div className="bg-gradient-to-br from-rightPanelBg via-white to-rightPanelBg py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-extrabold text-darkBlue sm:text-5xl">Resources</h1>
          <p className="mt-4 text-xl text-gray-600">
            Research and insights about AI in healthcare
          </p>
        </motion.div>

        <AnimatedSection className="mt-16">
          <div className="grid gap-8">
            {/* Resource 1 */}
            <motion.div
              className="bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-shadow duration-300"
              whileHover={{ y: -5 }}
            >
              <div className="px-8 py-10">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-rightPanelBg flex items-center justify-center">
                    <svg className="h-6 w-6 text-darkBlue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-darkBlue">Nature Study (2025)</h3>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p className="leading-relaxed">
                    "LLM AI assistance improve(s) physician management reasoning compared to conventional resources." - Gho, et al., Nature (2025)
                  </p>
                  <p className="leading-relaxed">
                    "... decision support—even in a task as complex as management reasoning—represents a promising application of LLMs…" - Gho, et al., Nature (2025)
                  </p>
                </div>
                <div className="mt-6">
                  <a 
                    href="https://www.nature.com/articles/s41591-024-03456-y" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-darkBlue hover:text-yellow font-medium flex items-center"
                  >
                    Read
                    <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Resource 2 */}
            <motion.div
              className="bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-shadow duration-300"
              whileHover={{ y: -5 }}
            >
              <div className="px-8 py-10">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-rightPanelBg flex items-center justify-center">
                    <svg className="h-6 w-6 text-darkBlue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-darkBlue">Yale Medicine (2025)</h3>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p className="leading-relaxed">
                    "Two significant barriers currently prevent the widespread adoption of LLMs in clinical settings: reliability and transparency." - Xie, Yale (2025)
                  </p>
                </div>
                <div className="mt-6">
                  <a 
                    href="https://medicine.yale.edu/news-article/advancing-clinical-decision-support-with-reliable-transparent-large-language-models/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-darkBlue hover:text-yellow font-medium flex items-center"
                  >
                    Read
                    <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Resource 3 */}
            <motion.div
              className="bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-shadow duration-300"
              whileHover={{ y: -5 }}
            >
              <div className="px-8 py-10">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-rightPanelBg flex items-center justify-center">
                    <svg className="h-6 w-6 text-darkBlue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-darkBlue">Nature Article (2025)</h3>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p className="leading-relaxed">
                    "The addition of large language models (LLM) into healthcare operations, including electronic health record (EHR) systems represents a transformative level of adoption and integration, changing how enterprise systems interact with algorithms" - Comeau, et al., Nature (2025)
                  </p>
                </div>
                <div className="mt-6">
                  <a 
                    href="https://www.nature.com/articles/s41746-025-01443-2" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-darkBlue hover:text-yellow font-medium flex items-center"
                  >
                    Read
                    <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Resource 4 */}
            <motion.div
              className="bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-shadow duration-300"
              whileHover={{ y: -5 }}
            >
              <div className="px-8 py-10">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-rightPanelBg flex items-center justify-center">
                    <svg className="h-6 w-6 text-darkBlue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-darkBlue">Prompt Engineering & AI Institute</h3>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p className="leading-relaxed">
                    "The lack of transparency into LLM decision-making means any biases, errors or flaws in their judgment can go undetected and unchecked. Without visibility into their reasoning, there is limited ability to identify problems or inconsistencies in how LLMs analyze information and arrive at conclusions." - Ramlochlan, Prompt Engineering & AI Institute
                  </p>
                </div>
                <div className="mt-6">
                  <a 
                    href="https://promptengineering.org/the-black-box-problem-opaque-inner-workings-of-large-language-models/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-darkBlue hover:text-yellow font-medium flex items-center"
                  >
                    Read
                    <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Resource 5 */}
            <motion.div
              className="bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-shadow duration-300"
              whileHover={{ y: -5 }}
            >
              <div className="px-8 py-10">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-rightPanelBg flex items-center justify-center">
                    <svg className="h-6 w-6 text-darkBlue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-darkBlue">Forbes (2024)</h3>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p className="leading-relaxed">
                    "In a field where mistakes can have significant consequences, transparent AI allows healthcare providers to quickly identify errors and incorrect recommendations… Transparency in AI systems within healthcare is also pivotal in eliminating bias and ensuring equitable care" - Forbes (2024)
                  </p>
                </div>
                <div className="mt-6">
                  <a 
                    href="https://www.forbes.com/councils/forbestechcouncil/2023/12/05/transparent-ai-in-healthcare-transforming-the-industry-for-the-better/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-darkBlue hover:text-yellow font-medium flex items-center"
                  >
                    Read
                    <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Resource 6 */}
            <motion.div
              className="bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-shadow duration-300"
              whileHover={{ y: -5 }}
            >
              <div className="px-8 py-10">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-rightPanelBg flex items-center justify-center">
                    <svg className="h-6 w-6 text-darkBlue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-darkBlue">McKinsey & Company (2025)</h3>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p className="leading-relaxed">
                    "Respondents across subsectors said gen AI's greatest source of potential could be in improving administrative efficiency and clinical productivity." - McKinsey & Company (2025)
                  </p>
                  <p className="leading-relaxed">
                    "64 percent reported that they anticipated or had already quantified positive ROI, suggesting high expectations for gen AI technology." - McKinsey & Company (2025)
                  </p>
                  <p className="leading-relaxed">
                    "AI, traditional machine learning, and deep learning are projected to result in net savings of up to $360 billion in healthcare spending." - McKinsey & Company
                  </p>
                </div>
                <div className="mt-6">
                  <a 
                    href="https://www.mckinsey.com/featured-insights/quote-of-the-day/june-18-2024" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-darkBlue hover:text-yellow font-medium flex items-center"
                  >
                    Read
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