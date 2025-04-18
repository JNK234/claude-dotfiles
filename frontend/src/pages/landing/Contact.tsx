import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, Linkedin, Instagram, Send } from 'lucide-react';
import AnimatedSection from '../../components/landing/AnimatedSection';
import ApiService from '../../services/ApiService'; // Import ApiService

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TEMPORARY FIX: Deactivate message sending by returning early.
    console.log("Contact form submission temporarily disabled.");
    // Optionally, provide user feedback that submission is disabled
    // setSubmitError("Message sending is temporarily disabled."); 
    return; 

    // Original logic below is now unreachable
    setIsSubmitting(true);
    setSubmitSuccess(false); // Reset success state
    setSubmitError('');

    try {
      // Create an instance of ApiService
      const apiService = new ApiService(); 
      // Use the instance to send the data to the backend
      const response = await apiService.post('/contact', formData); 

      // Check if the response is okay (status code 2xx)
      // ApiService might throw an error for non-2xx responses, 
      // but we double-check here or rely on ApiService's error handling.
      // Assuming ApiService handles non-2xx by throwing an error.

      console.log('Form submitted successfully:', response); // Log the response from backend
      setSubmitSuccess(true);
      setFormData({ // Clear the form on success
        name: '',
        email: '',
        subject: '',
        message: ''
      });

    } catch (error: any) {
      // Handle errors from ApiService or network issues
      console.error('Error submitting contact form:', error);
      // Provide a user-friendly error message
      // Check if the error object has response data (e.g., from validation errors)
      if (error.response && error.response.data && error.response.data.detail) {
        // Handle specific validation errors if backend provides them
        // For now, using a generic message based on status or a default
        if (error.response.status === 422) {
           setSubmitError('Please check your input. Ensure the email is valid and all fields are filled correctly.');
        } else if (error.response.status === 500) {
           setSubmitError('There was a server error. Please try again later.');
        } else {
           setSubmitError(`An error occurred: ${error.response.data.detail || 'Please try again.'}`);
        }
      } else {
        // Generic network or other error
        setSubmitError('Could not connect to the server. Please check your internet connection and try again.');
      }
      setSubmitSuccess(false); // Ensure success state is false on error
    } finally {
      setIsSubmitting(false); // Ensure spinner stops regardless of outcome
    }
  };

  return (
    <div className="bg-gradient-to-br from-rightPanelBg via-white to-rightPanelBg min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-extrabold text-darkBlue sm:text-5xl">Get in Touch</h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions about Medhastra AI? We'd love to hear from you. Reach out to our team and we'll get back to you as soon as possible.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <AnimatedSection className="bg-white rounded-2xl shadow-xl p-8 order-2 lg:order-1">
            <h2 className="text-2xl font-bold text-darkBlue mb-6">Send Us a Message</h2>
            
            {submitSuccess ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-green-50 border border-green-200 text-green-700 px-6 py-8 rounded-lg mb-6 text-center"
              >
                <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
                <p>Your message has been sent successfully. We'll get back to you shortly.</p>
                <button 
                  onClick={() => setSubmitSuccess(false)}
                  className="mt-4 px-4 py-2 bg-darkBlue text-white rounded-md hover:bg-yellow hover:text-darkBlue transition-colors"
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {submitError}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow focus:border-yellow transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow focus:border-yellow transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow focus:border-yellow transition-colors"
                    placeholder="How can we help you?"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow focus:border-yellow transition-colors"
                    placeholder="Tell us what you need..."
                  ></textarea>
                </div>
                
                <div>
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    // Ensure button is visible: dark blue background, white text
                    className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-darkBlue hover:bg-yellow hover:text-darkBlue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        {/* Ensure icon is white */}
                        <Send className="mr-2 h-5 w-5 text-white" /> 
                        Send Message
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            )}
          </AnimatedSection>

          {/* Contact Information */}
          <AnimatedSection className="order-1 lg:order-2">
            <div className="bg-darkBlue text-white rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-yellow bg-opacity-20 p-3 rounded-full">
                    <Mail className="h-6 w-6 text-yellow" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-yellow">Email</h3>
                    <p className="mt-1">
                      <a href="mailto:medhastra@gmail.com" className="hover:text-yellow transition-colors">
                        medhastra@gmail.com
                      </a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-yellow bg-opacity-20 p-3 rounded-full">
                    <Phone className="h-6 w-6 text-yellow" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-yellow">Phone</h3>
                    <p className="mt-1">
                      <a href="tel:+14407230268" className="hover:text-yellow transition-colors">
                        +1 (440) 723-0268
                      </a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-yellow bg-opacity-20 p-3 rounded-full">
                    <MapPin className="h-6 w-6 text-yellow" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-yellow">Location</h3>
                    <p className="mt-1">
                      Chicago, Illinois<br />
                      United States
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-10">
                <h3 className="text-lg font-medium text-yellow mb-4">Connect With Us</h3>
                <div className="flex space-x-4">
                  <a 
                    href="https://www.linkedin.com/company/medhastra-ai/about/?viewAsMember=true" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    // Explicitly set icon color to white
                    className="bg-white bg-opacity-10 p-3 rounded-full hover:bg-yellow hover:text-darkBlue transition-colors"
                  >
                    <Linkedin className="h-5 w-5 text-white" /> {/* Set text-white directly */}
                  </a>
                  <a 
                    href="https://www.instagram.com/medhastra/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                     // Explicitly set icon color to white
                    className="bg-white bg-opacity-10 p-3 rounded-full hover:bg-yellow hover:text-darkBlue transition-colors"
                  >
                    <Instagram className="h-5 w-5 text-white" /> {/* Set text-white directly */}
                  </a>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-darkBlue mb-6">Schedule a Demo</h2>
              <p className="text-gray-600 mb-6">
                Interested in seeing Medhastra AI in action? Schedule a personalized demo with our team to see how we can transform your clinical practice.
              </p>
              <motion.a
                href="https://docs.google.com/forms/d/e/1FAIpQLSellcZloYxQbSz_0wyD3brhTmOYmpGqBCJ01E0SvVdXG0f33w/viewform?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-darkBlue hover:bg-yellow hover:text-darkBlue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Request Demo
              </motion.a>
            </div>
          </AnimatedSection>
        </div>
        
        {/* 
        // FAQ Section - Temporarily commented out
        <AnimatedSection className="mt-20">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-darkBlue mb-8 text-center">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-darkBlue mb-3">How does Medhastra AI work?</h3>
                <p className="text-gray-600">
                  Medhastra AI uses advanced natural language processing and machine learning to analyze patient data, provide diagnostic suggestions, and generate clinical documentation while making its reasoning transparent to physicians.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-darkBlue mb-3">Is Medhastra HIPAA compliant?</h3>
                <p className="text-gray-600">
                  Yes, Medhastra is fully HIPAA compliant. We implement industry-leading security measures to ensure all patient data is protected according to healthcare privacy standards.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-darkBlue mb-3">How long does implementation take?</h3>
                <p className="text-gray-600">
                  Implementation typically takes 2-4 weeks, depending on your existing systems. Our team works closely with your IT department to ensure a smooth integration process.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-darkBlue mb-3">Can Medhastra integrate with our EHR?</h3>
                <p className="text-gray-600">
                  Yes, Medhastra is designed to integrate with major EHR systems including Epic, Cerner, Allscripts, and more. We provide API connections and custom integration solutions.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>
        */}
        
        {/* 
        // Map Section - Temporarily commented out
        <AnimatedSection className="mt-20">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="aspect-video w-full">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d100939.98555098464!2d-122.50764017948551!3d37.75781499657613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80859a6d00690021%3A0x4a501367f076adff!2sSan%20Francisco%2C%20CA!5e0!3m2!1sen!2sus!4v1623252076831!5m2!1sen!2sus" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy"
                title="Medhastra Location"
              ></iframe>
            </div>
          </div>
        </AnimatedSection>
        */}
      </div>
    </div>
  );
}

export default Contact;
