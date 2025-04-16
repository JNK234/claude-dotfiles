import React from 'react';
import { motion } from 'framer-motion';
import AnimatedSection from '../../components/landing/AnimatedSection';

function About() {
  return (
    <div className="bg-gradient-to-br from-rightPanelBg via-white to-rightPanelBg py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-extrabold text-darkBlue sm:text-5xl">About Us</h1>
          <p className="mt-4 text-xl text-gray-600">
            Transforming healthcare through transparent AI
          </p>
        </motion.div>

        <AnimatedSection className="mt-20">
          <h2 className="text-3xl font-bold text-darkBlue mb-12 text-center">Our Team</h2>
          <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3">
            {/* Team Member 1 */}
            <motion.div
              className="text-center"
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative">
                <div className="relative w-48 h-48 mx-auto">
                  <img
                    className="absolute inset-0 w-full h-full rounded-full object-cover"
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60"
                    alt="Team member"
                  />
                  <div className="absolute inset-0 rounded-full bg-darkBlue mix-blend-multiply opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-xl font-semibold text-darkBlue">Dr. Sarah Johnson</h3>
                <p className="text-darkBlue font-medium">Chief Medical Officer</p>
                <p className="mt-2 text-gray-500">MD, PhD in Medical AI</p>
              </div>
            </motion.div>

            {/* Team Member 2 */}
            <motion.div
              className="text-center"
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative">
                <div className="relative w-48 h-48 mx-auto">
                  <img
                    className="absolute inset-0 w-full h-full rounded-full object-cover"
                    src="https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60"
                    alt="Team member"
                  />
                  <div className="absolute inset-0 rounded-full bg-darkBlue mix-blend-multiply opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-xl font-semibold text-darkBlue">Michael Chen</h3>
                <p className="text-darkBlue font-medium">Chief Technology Officer</p>
                <p className="mt-2 text-gray-500">MS in Computer Science</p>
              </div>
            </motion.div>

            {/* Team Member 3 */}
            <motion.div
              className="text-center"
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative">
                <div className="relative w-48 h-48 mx-auto">
                  <img
                    className="absolute inset-0 w-full h-full rounded-full object-cover"
                    src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60"
                    alt="Team member"
                  />
                  <div className="absolute inset-0 rounded-full bg-darkBlue mix-blend-multiply opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-xl font-semibold text-darkBlue">Dr. James Wilson</h3>
                <p className="text-darkBlue font-medium">Head of Research</p>
                <p className="mt-2 text-gray-500">PhD in Machine Learning</p>
              </div>
            </motion.div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="mt-20">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-8 py-12">
              <h2 className="text-3xl font-bold text-darkBlue mb-8 text-center">Our Story</h2>
              <div className="prose prose-lg mx-auto text-gray-500">
                <p className="leading-relaxed">
                  Founded by a team of doctor-engineers, Medhastra AI was born from the vision to make
                  clinical reasoning transparent and accessible. Our unique combination of medical expertise
                  and technical innovation allows us to create solutions that truly understand and support
                  healthcare professionals in their daily work.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}

export default About;