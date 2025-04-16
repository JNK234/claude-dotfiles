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
                    className="block text-darkBlue"
                  >
                    made visible
                  </motion.span>
                </h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0"
                >
                  Built like a doctor, thinks like a doctor, works with the doctor
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="mt-8 sm:flex sm:justify-center lg:justify-start"
                >
                  <div className="rounded-md shadow">
                    <a
                      href="https://forms.google.com/your-form-url"
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
          className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2"
        >
          <img
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full rounded-bl-3xl shadow-2xl"
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
            alt="Doctor using tablet"
          />
        </motion.div>
      </div>

      {/* Video Demo Section */}
      <AnimatedSection className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-darkBlue">See How It Works</h2>
            <p className="mt-4 text-xl text-gray-600">Watch our platform in action</p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative aspect-video rounded-2xl overflow-hidden shadow-xl"
          >
            <video
              className="w-full h-full object-cover"
              controls
              poster="your-video-thumbnail.jpg"
            >
              <source src="your-video-url.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Stats Section */}
      <div className="py-20 bg-gradient-to-b from-white to-rightPanelBg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <StatCard number="92%" label="Physician Satisfaction" delay={0} />
            <StatCard number="45min" label="Time Saved Per Case" delay={0.2} />
            <StatCard number="3x" label="Faster Diagnosis" delay={0.4} />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <AnimatedSection className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2">
            <InteractiveFeature
              icon={<Brain className="h-8 w-8" />}
              title="Transparent reasoning"
              description="Clear insights into AI decision-making process"
              details="Our AI system provides step-by-step explanations of its diagnostic reasoning, allowing doctors to understand and verify each conclusion."
            />
            <InteractiveFeature
              icon={<Clock className="h-8 w-8" />}
              title="Real-time support"
              description="Instant diagnostic assistance when you need it"
              details="Get immediate support during patient consultations with real-time analysis and suggestions based on current symptoms and medical history."
            />
            <InteractiveFeature
              icon={<FileText className="h-8 w-8" />}
              title="Documentation"
              description="Automated generation of clinical documentation"
              details="Reduce administrative burden with AI-powered documentation that captures and organizes clinical findings, decisions, and treatment plans."
            />
            <InteractiveFeature
              icon={<Heart className="h-8 w-8" />}
              title="Better Outcomes"
              description="Improved patient care and clinical efficiency"
              details="Achieve superior patient outcomes through more accurate diagnoses, faster treatment decisions, and reduced medical errors."
            />
          </div>
        </div>
      </AnimatedSection>

      {/* Benefits Section */}
      <AnimatedSection className="py-20 bg-gradient-to-br from-rightPanelBg via-white to-rightPanelBg">
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
              <p className="text-gray-600">Faster access to care, better outcomes</p>
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

      {/* Problem Statement Section */}
      <AnimatedSection className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-extrabold text-center mb-12 text-darkBlue"
          >
            The Challenge
          </motion.h2>
          <div className="bg-gradient-to-r from-darkBlue to-darkBlue rounded-2xl shadow-xl overflow-hidden">
            <div className="px-8 py-12 bg-opacity-90 backdrop-blur-lg">
              <div className="max-w-3xl mx-auto">
                <ul className="space-y-6 text-white text-lg">
                  <motion.li
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex items-center"
                  >
                    <div className="h-2 w-2 bg-white rounded-full mr-4"></div>
                    Healthcare systems face increasing wait times, physician burnout, and rising costs
                  </motion.li>
                  <motion.li
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center"
                  >
                    <div className="h-2 w-2 bg-white rounded-full mr-4"></div>
                    Clinical reasoning transparency is lacking in current systems
                  </motion.li>
                  <motion.li
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center"
                  >
                    <div className="h-2 w-2 bg-white rounded-full mr-4"></div>
                    Physicians consistently cite transparent reasoning as the most crucial feature in AI systems
                  </motion.li>
                </ul>
              </div>
            </div>
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
              href="https://forms.google.com/your-form-url"
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