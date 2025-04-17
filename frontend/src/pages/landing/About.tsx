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
          <h1 className="text-4xl font-extrabold text-darkBlue sm:text-5xl">Our Story</h1>
        </motion.div>

        <AnimatedSection className="mt-20">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-16">
            <div className="px-8 py-12">
              <h3 className="text-2xl font-bold text-darkBlue mb-6">A Global Perspective at the Intersection of Medicine and Engineering</h3>
              <div className="prose prose-lg mx-auto text-gray-600">
                <p className="leading-relaxed">
                  Medhastra began where many great innovations do—at the intersection of diverse perspectives
                  and shared purpose.
                </p>
                <p className="leading-relaxed">
                  Our founders bring together a rich blend of professional expertise across the world. One began
                  their career as an engineer at Boeing, developing complex systems where precision and safety
                  are non-negotiable. Another is a practicing internal medicine physician with firsthand experience
                  navigating the complexities of patient care and chronic disease management. The third is a
                  surgery resident, combining clinical insight with a passion for hands-on, high-stakes
                  decision-making. Together, our varied backgrounds drive a shared vision for transforming
                  healthcare delivery.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-16">
            <div className="px-8 py-12">
              <h3 className="text-2xl font-bold text-darkBlue mb-6">From Class Project to Healthcare Innovation</h3>
              <div className="prose prose-lg mx-auto text-gray-600">
                <p className="leading-relaxed">
                  We initially connected through a project focused on identifying reasoning flaws in large language
                  models, drawn together by our complementary skills and shared work ethic. What began as an
                  academic exercise quickly evolved as we recognized a critical gap: while many companies were
                  building AI for healthcare, few were creating solutions that truly understood and supported the
                  physician's reasoning process.
                </p>
                <p className="leading-relaxed">
                  Our conversations moved beyond the classroom as we shared our frustrations with existing
                  tools. The physicians described the cognitive burden of documentation and diagnosis with
                  inadequate support. Our engineer saw parallels to how systems thinking had transformed
                  aviation safety and efficiency.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-8 py-12">
              <h3 className="text-2xl font-bold text-darkBlue mb-6">Building What Physicians Actually Need</h3>
              <div className="prose prose-lg mx-auto text-gray-600">
                <p className="leading-relaxed">
                  The more we talked, the clearer our vision became. We didn't want to create just another
                  medical reference tool or black-box algorithm. We wanted to build something that thought like a
                  doctor but worked at digital speed—a true clinical reasoning partner that would reduce
                  administrative burden while preserving the physician's central role in healthcare.
                </p>
                <p className="leading-relaxed">
                  Medhastra was born from this vision: an AI assistant built by doctor-engineers who understand
                  both the science of medicine and the art of engineering. Our diverse backgrounds give us a
                  unique ability to bridge clinical needs with technical possibilities, creating solutions that work in
                  the real world of healthcare.
                </p>
                <p className="leading-relaxed">
                  Today, we're bringing that vision to life with a team that has expanded but remains true to our
                  founding principle: AI should enhance rather than replace the physician's role, making
                  healthcare more efficient, accessible, and effective for everyone.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>

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
      </div>
    </div>
  );
}

export default About;