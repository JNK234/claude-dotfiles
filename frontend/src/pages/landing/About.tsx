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

        {/* Team Section Moved Here */}
        <AnimatedSection className="mt-20">
          <h2 className="text-3xl font-bold text-darkBlue mb-12 text-center">Our Team</h2>
          {/* Team Section Documentation:
              - Component: Displays team members in a responsive grid.
              - Data Flow: Team member data (name, title, description, image) is hardcoded here. Could be fetched from an API in the future.
              - Styling: Uses Tailwind CSS for layout and styling. Framer Motion for hover animations.
              - Images: Sourced from the /public directory. Ensure images are optimized. Placeholder used for members without photos.
              - Integration: Part of the About page, showcasing the founding team.
              - Future Extensions: Could be refactored into a reusable TeamMemberCard component. Data could be managed via state or fetched dynamically.
          */}
          <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3">
            {/* Narashima Karthik */}
             <motion.div
               className="text-center group" // Added group for potential hover effects on children
               whileHover={{ y: -10 }}
               transition={{ duration: 0.3 }}
             >
               <div className="relative">
                  {/* Consistent approach: Using img tag with object-cover like others. Added bg-gray-200 */}
                 <div
                   className="relative w-56 h-56 mx-auto overflow-hidden rounded-full shadow-lg bg-gray-200"
                   // Removed inline style for background image
                 >
                  {/* Added img tag for consistency. Changed object-cover to object-contain */}
                  <img
                    className="absolute inset-0 w-full h-full object-contain rounded-full"
                    src="/Karthik.png" // Corrected filename
                    alt="Narasimha Karthik"
                   />
                   {/* Optional overlay effect on hover */}
                   <div className="absolute inset-0 rounded-full bg-darkBlue mix-blend-multiply opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                 </div>
               </div>
               <div className="mt-6">
                <h3 className="text-xl font-semibold text-darkBlue">Narasimha Karthik</h3>
                <p className="text-darkBlue font-medium">CTO, Co-founder</p>
                {/* <p className="mt-2 text-gray-500">Brief description or credentials</p> */}
              </div>
            </motion.div>

            {/* Paola Barrios */}
            <motion.div
              className="text-center group"
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative">
                 {/* Increased size from w-48 h-48 to w-56 h-56 to prevent image cropping. Added bg-gray-200. Changed object-cover to object-contain */}
                <div className="relative w-56 h-56 mx-auto overflow-hidden rounded-full shadow-lg bg-gray-200">
                  <img
                    className="absolute inset-0 w-full h-full object-contain rounded-full" // Changed object-cover to object-contain
                    src="/Paola.png" // Corrected filename
                    alt="Paola Barrios"
                  />
                  <div className="absolute inset-0 rounded-full bg-darkBlue mix-blend-multiply opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-xl font-semibold text-darkBlue">Paola Barrios, MD, MS</h3>
                <p className="text-darkBlue font-medium">Clinical Lead, Co-Founder</p>
                {/* <p className="mt-2 text-gray-500">MD, MS</p> */}
              </div>
            </motion.div>

            {/* Joanne Mathew */}
            <motion.div
              className="text-center group"
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative">
                 {/* Increased size from w-48 h-48 to w-56 h-56 to prevent image cropping. Added bg-gray-200. Changed object-cover to object-contain */}
                <div className="relative w-56 h-56 mx-auto overflow-hidden rounded-full shadow-lg bg-gray-200">
                  {/* Replaced placeholder SVG with actual image */}
                  <img
                    className="absolute inset-0 w-full h-full object-contain rounded-full" // Changed object-cover to object-contain
                    src="/Joanne.png" // Corrected filename
                    alt="Joanne Mathew"
                  />
                  <div className="absolute inset-0 rounded-full bg-darkBlue mix-blend-multiply opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-xl font-semibold text-darkBlue">Joanne Mathew, MD</h3>
                <p className="text-darkBlue font-medium">Clinical Lead, Co-Founder</p>
                {/* <p className="mt-2 text-gray-500">MD</p> */}
              </div>
            </motion.div>
          </div>
        </AnimatedSection>
        {/* End Moved Team Section */}

        {/* Start Original Story Section */}
        <AnimatedSection className="mt-20">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-16">
            <div className="px-8 py-12">
              {/* Added flex layout and Globe icon */}
              <h3 className="text-2xl font-bold text-darkBlue mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span>A Global Perspective at the Intersection of Medicine and Engineering</span>
              </h3>
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

          {/* Changed background to light gray for visual separation */}
          <div className="bg-gray-50 rounded-2xl shadow-xl overflow-hidden mb-16">
            <div className="px-8 py-12">
              {/* Added flex layout and Lightbulb icon */}
              <h3 className="text-2xl font-bold text-darkBlue mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>From Class Project to Healthcare Innovation</span>
              </h3>
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
              {/* Added flex layout and User Group icon */}
              <h3 className="text-2xl font-bold text-darkBlue mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Building What Physicians Actually Need</span>
              </h3>
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

        {/* This entire section has been moved up */}
      </div>
    </div>
  );
}

export default About;
