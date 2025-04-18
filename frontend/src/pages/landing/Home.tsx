import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Clock, Heart, FileText, ArrowRight, Play } from 'lucide-react';
import AnimatedSection from '../../components/landing/AnimatedSection';
import InteractiveFeature from '../../components/landing/InteractiveFeature';
import StatCard from '../../components/landing/StatCard';

function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative min-h-screen bg-gradient-to-br from-rightPanelBg via-white to-rightPanelBg overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pt-20 pb-8 sm:pt-24 sm:pb-16 md:pt-32 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="sm:text-center lg:text-left"
              >
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <motion.span
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="block"
                  >
                    Clinical reasoning
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="block text-yellow"
                  >
                    Made visible
                  </motion.span>
                </h1>
                {/* Removed tagline paragraph */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="mt-8 sm:flex sm:justify-center lg:justify-start"
                >
                  <div className="rounded-md shadow">
                    <a
                      href="https://docs.google.com/forms/d/e/1FAIpQLSellcZloYxQbSz_0wyD3brhTmOYmpGqBCJ01E0SvVdXG0f33w/viewform?usp=sharing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-darkBlue hover:bg-yellow hover:text-darkBlue md:py-4 md:text-lg md:px-10"
                    >
                      Request Demo
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </a>
                  </div>
                </motion.div>
              </motion.div>
            </main>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-2/5"
        >
          <img
            className="h-48 w-full object-cover object-left-center sm:h-64 md:h-80 lg:w-full lg:h-full rounded-bl-3xl shadow-2xl"
            src="/doc_md_front.jpeg"
            alt="Doctor using computer"
          />
        </motion.div>
      </div>

      {/* Video Demo Section */}
      <AnimatedSection className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-darkBlue">How it works</h2>
            <p className="mt-4 text-xl text-gray-600">Watch our platform in action</p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative aspect-video rounded-2xl overflow-hidden shadow-xl"
          >
            {/* Replaced <video> with <iframe> for YouTube embed */}
            <iframe
              className="absolute top-0 left-0 w-full h-full" // Use absolute positioning to fill the container
              src="https://www.youtube.com/embed/2_0bCuOKeHc" // YouTube embed URL
              title="Medhastra AI Demo Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Challenges Section */}
      <AnimatedSection className="py-20 bg-gradient-to-br from-rightPanelBg via-white to-rightPanelBg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-extrabold text-center mb-12 text-darkBlue"
          >
            Current Challenges
          </motion.h2>

          {/* Healthcare Challenges */}
          <div className="mb-16">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl font-semibold text-center mb-8 text-darkBlue"
            >
              In Healthcare
            </motion.h3>
            <div className="bg-gradient-to-r from-darkBlue to-darkBlue rounded-2xl shadow-xl overflow-hidden">
              {/* Changed ul to grid layout for columns */}
              <div className="px-8 py-12 bg-opacity-90 backdrop-blur-lg">
                <div className="max-w-3xl mx-auto">
                  {/* Applied grid layout: 1 column on small screens, 3 on medium+ - Increased gap */}
                  <ul className="grid grid-cols-1 md:grid-cols-3 gap-12 text-white"> {/* Increased gap to 12 */}
                    <motion.li
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="text-center" // Removed flex, added text-center
                    >
                      {/* Icon moved above text */}
                      <div className="flex justify-center mb-4"> {/* Centered icon */}
                        <svg className="h-10 w-10 text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor"> {/* Increased icon size */}
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-xl mb-2">Physician Burnout</h3>
                        <p className="text-gray-200 text-lg">
                          62% of doctors report burnout symptoms
                          <span className="block text-sm mt-1 text-gray-300">Mayo Clinic (2022)</span>
                        </p>
                      </div>
                    </motion.li>

                    <motion.li
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                      className="text-center" // Removed flex, added text-center
                    >
                      {/* Icon moved above text */}
                       <div className="flex justify-center mb-4"> {/* Centered icon */}
                        <svg className="h-10 w-10 text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor"> {/* Increased icon size */}
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-xl mb-2">Extended Wait Times</h3>
                        <p className="text-gray-200 text-lg">
                          Critical barrier to healthcare access
                          <span className="block text-sm mt-1 text-gray-300">Inquiry (2020)</span>
                        </p>
                      </div>
                    </motion.li>

                    <motion.li
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 }}
                      className="text-center" // Removed flex, added text-center
                    >
                       {/* Icon moved above text */}
                       <div className="flex justify-center mb-4"> {/* Centered icon */}
                        <svg className="h-10 w-10 text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor"> {/* Increased icon size */}
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-xl mb-2">Financial Impact</h3>
                        <p className="text-gray-200 text-lg">
                          $4.6B+ losses from inefficiencies
                          <span className="block text-sm mt-1 text-gray-300">Annals of Internal Medicine (2019)</span>
                        </p>
                      </div>
                    </motion.li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* AI/LLM Challenges */}
          <div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl font-semibold text-center mb-8 text-darkBlue"
            >
              In AI/LLM Healthcare Solutions
            </motion.h3>
            <div className="bg-gradient-to-r from-darkBlue to-darkBlue rounded-2xl shadow-xl overflow-hidden">
              {/* Changed ul to grid layout for columns */}
              <div className="px-8 py-12 bg-opacity-90 backdrop-blur-lg">
                <div className="max-w-3xl mx-auto">
                  {/* Applied grid layout: 1 column on small screens, 2 on medium+ - Increased gap */}
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-12 text-white"> {/* Increased gap to 12 */}
                    <motion.li
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="text-center" // Removed flex, added text-center
                    >
                      {/* Icon moved above text */}
                      <div className="flex justify-center mb-4"> {/* Centered icon */}
                        <svg className="h-10 w-10 text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor"> {/* Increased icon size */}
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-xl mb-2">Transparency Challenge</h3>
                        <p className="text-gray-200 text-lg">
                          Most AI systems operate as black boxes, making it difficult for physicians to trust and validate their decisions
                        </p>
                      </div>
                    </motion.li>

                    <motion.li
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                      className="text-center" // Removed flex, added text-center
                    >
                      {/* Icon moved above text */}
                      <div className="flex justify-center mb-4"> {/* Centered icon */}
                        <svg className="h-10 w-10 text-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor"> {/* Increased icon size */}
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-xl mb-2">Control & Accountability</h3>
                        <p className="text-gray-200 text-lg">
                          Limited physician oversight in current AI solutions reduces trust and adoption
                        </p>
                      </div>
                    </motion.li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Features Section */}
      <AnimatedSection className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-extrabold text-center mb-16 text-darkBlue"
          >
            Key Features
          </motion.h2>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <InteractiveFeature
              icon={<Brain className="h-12 w-12" />}
              title="Transparent Reasoning"
              description="Clear insights into AI decision-making process"
              details="Maps clinical pathways, highlights supporting evidence, and performs counterfactual analysis ensuring transparency to build trust."
              className="p-10"
            />
            <InteractiveFeature
              icon={<FileText className="h-12 w-12" />}
              title="Documentation"
              description="Automated generation of clinical documentation"
              details="Summarizes encounter and generates physician note, decreasing physician burden."
              className="p-10"
            />
            <InteractiveFeature
              icon={<Clock className="h-12 w-12" />}
              title="Real-time Support"
              description="Instant diagnostic assistance"
              details="Get immediate support during patient consultations with real-time analysis and suggestions based on current symptoms and medical history."
              className="p-10"
            />
            <InteractiveFeature
              icon={<Heart className="h-12 w-12" />}
              title="Physician Controlled & Expertly Designed"
              description="Physician-designed step-by-step approval ensures complete oversight"
              details="Every step of the process is guided by the provider—ensuring clinical oversight, safety, and precision from start to finish."
              className="p-10"
            />
          </div>
        </div>
      </AnimatedSection>

      {/* Stats Section */}
      <div className="py-20 bg-gradient-to-br from-rightPanelBg via-white to-rightPanelBg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <StatCard 
              number="100%" 
              label={
                <div>
                  {/* Combined main text into one span, removed block/size/margin classes */}
                  <span className="inline">Physicians Need Diagnostic Help Monthly</span>
                  {/* Kept parenthesis separate with its styling, added space and made inline */}
                  <span className="inline-block text-xs text-gray-500 ml-1">(43% daily, 29% weekly)</span>
                </div>
              }
              delay={0}
            />
            <StatCard 
              number="#1" 
              label={
                <div>
                  {/* Combined text into one span, removed block/size/margin classes */}
                  <span className="inline">Most Important Feature Transparent Reasoning</span>
                </div>
              }
              delay={0.2}
            />
            <StatCard 
              number="93%" 
              label={
                <div>
                  {/* Combined text into one span, removed block/size/margin classes */}
                  <span className="inline">Physicians Find Value In AI-Assisted Review</span>
                </div>
              }
              delay={0.4}
            />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-sm text-gray-500 mt-8 italic"
          >
            *Based on internal physician survey data
          </motion.p>
        </div>
      </div>

      {/* Benefits Section */}
      <AnimatedSection className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-extrabold text-center mb-16 text-darkBlue"
          >
            Key Benefits
          </motion.h2>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <motion.div
              className="text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              whileHover={{ y: -5 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-darkBlue">For Patients</h3>
              <p className="text-gray-600">Faster access to care, shorter wait times</p>
            </motion.div>
            <motion.div
              className="text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              whileHover={{ y: -5 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-darkBlue">For Physicians</h3>
              <p className="text-gray-600">Reduced administrative burden, diagnostic support</p>
            </motion.div>
            <motion.div
              className="text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              whileHover={{ y: -5 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-darkBlue">For Health Systems</h3>
              <p className="text-gray-600">Increased throughput, quality improvement, cost savings</p>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* Final CTA Section */}
      <AnimatedSection className="py-20 bg-gradient-to-br from-rightPanelBg via-white to-rightPanelBg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-extrabold mb-8 text-darkBlue">Ready to Transform Your Practice?</h2>
            <motion.a
              href="https://docs.google.com/forms/d/e/1FAIpQLSellcZloYxQbSz_0wyD3brhTmOYmpGqBCJ01E0SvVdXG0f33w/viewform?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-darkBlue hover:bg-yellow hover:text-darkBlue md:py-4 md:text-lg md:px-10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Request Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </motion.a>
          </motion.div>
        </div>
      </AnimatedSection>
    </div>
  );
}

export default Home;
