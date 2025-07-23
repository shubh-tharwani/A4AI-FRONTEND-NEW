import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  SparklesIcon,
  ChartBarIcon,
  UsersIcon,
  ArrowRightIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate('/login');
  };

  const handleSignUp = () => {
    navigate('/register');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const features = [
    {
      icon: SparklesIcon,
      title: "AI-Powered Learning",
      description: "Personalized learning paths driven by advanced AI algorithms"
    },
    {
      icon: ChartBarIcon,
      title: "Real-time Analytics",
      description: "Track student progress with comprehensive performance insights"
    },
    {
      icon: UsersIcon,
      title: "Collaborative Platform",
      description: "Connect teachers and students in an engaging digital environment"
    }
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 }
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 relative overflow-hidden font-display">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-pink-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Navigation Header */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 container mx-auto px-6 py-6"
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-300">
              <AcademicCapIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">A4AI Learning</h1>
              <p className="text-white/80 text-sm hidden sm:block">Empowering Education</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-white/90 hover:text-white transition-colors duration-300 font-medium"
            >
              Home
            </Link>
            <Link
              to="#features"
              className="text-white/90 hover:text-white transition-colors duration-300 font-medium"
            >
              Features
            </Link>
            <Link
              to="#contact"
              className="text-white/90 hover:text-white transition-colors duration-300 font-medium"
            >
              Contact
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignIn}
              className="px-6 py-2.5 bg-white/10 backdrop-blur-sm text-white font-medium rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              Sign In
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignUp}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Sign Up
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-white/90 hover:text-white transition-colors"
          >
            {isMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"
          >
            <div className="p-6 space-y-4">
              <Link
                to="/"
                className="block text-white/90 hover:text-white transition-colors duration-300 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="#features"
                className="block text-white/90 hover:text-white transition-colors duration-300 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                to="#contact"
                className="block text-white/90 hover:text-white transition-colors duration-300 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <div className="pt-4 border-t border-white/20 space-y-3">
                <button
                  onClick={handleSignIn}
                  className="w-full px-6 py-2.5 bg-white/10 backdrop-blur-sm text-white font-medium rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
                >
                  Sign In
                </button>
                <button
                  onClick={handleSignUp}
                  className="w-full px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Hero Section */}
      <motion.main
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="relative z-10 container mx-auto px-6 py-20 lg:py-32"
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Hero Content */}
          <div className="text-center lg:text-left">
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Empowering{' '}
                <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Teachers
                </span>
                ,{' '}
                <br className="hidden lg:block" />
                Engaging{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                  Students
                </span>
              </h1>
              <p className="text-xl lg:text-2xl text-white/90 mb-8 leading-relaxed">
                AI-powered tools to transform learning experiences and unlock every student's potential.
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSignUp}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-semibold rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Get Started Free</span>
                <ArrowRightIcon className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSignIn}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white text-lg font-semibold rounded-2xl border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all duration-300"
              >
                Sign In
              </motion.button>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <p className="text-white/70 text-sm mb-4">Trusted by educators worldwide</p>
              <div className="flex justify-center lg:justify-start items-center space-x-6">
                <div className="text-white/90">
                  <div className="text-2xl font-bold">10K+</div>
                  <div className="text-sm text-white/70">Teachers</div>
                </div>
                <div className="w-px h-8 bg-white/30"></div>
                <div className="text-white/90">
                  <div className="text-2xl font-bold">100K+</div>
                  <div className="text-sm text-white/70">Students</div>
                </div>
                <div className="w-px h-8 bg-white/30"></div>
                <div className="text-white/90">
                  <div className="text-2xl font-bold">50+</div>
                  <div className="text-sm text-white/70">Countries</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Hero Illustration */}
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
              <div className="aspect-square bg-gradient-to-br from-white/20 to-white/5 rounded-2xl flex items-center justify-center">
                {/* Educational SVG Illustration */}
                <svg
                  viewBox="0 0 400 400"
                  className="w-full h-full text-white/80"
                  fill="currentColor"
                >
                  {/* Laptop Base */}
                  <rect x="80" y="220" width="240" height="120" rx="12" className="fill-white/20" />
                  <rect x="90" y="230" width="220" height="90" rx="8" className="fill-white/40" />
                  
                  {/* Laptop Screen */}
                  <rect x="100" y="240" width="200" height="70" rx="4" className="fill-indigo-400/60" />
                  
                  {/* Screen Content - Chart */}
                  <rect x="110" y="250" width="60" height="8" rx="2" className="fill-white/80" />
                  <rect x="110" y="262" width="40" height="4" rx="1" className="fill-white/60" />
                  <rect x="110" y="270" width="80" height="4" rx="1" className="fill-white/60" />
                  
                  {/* Chart Bars */}
                  <rect x="200" y="285" width="8" height="20" className="fill-purple-300" />
                  <rect x="212" y="275" width="8" height="30" className="fill-pink-300" />
                  <rect x="224" y="280" width="8" height="25" className="fill-cyan-300" />
                  <rect x="236" y="270" width="8" height="35" className="fill-purple-300" />
                  
                  {/* Floating Elements */}
                  <circle cx="150" cy="180" r="20" className="fill-pink-400/60" />
                  <text x="150" y="185" textAnchor="middle" className="fill-white text-sm font-bold">AI</text>
                  
                  <circle cx="250" cy="160" r="16" className="fill-cyan-400/60" />
                  <text x="250" y="165" textAnchor="middle" className="fill-white text-xs font-bold">📊</text>
                  
                  <circle cx="320" cy="190" r="14" className="fill-purple-400/60" />
                  <text x="320" y="195" textAnchor="middle" className="fill-white text-xs font-bold">📚</text>
                  
                  {/* Connection Lines */}
                  <line x1="150" y1="200" x2="200" y2="240" stroke="currentColor" strokeWidth="2" className="opacity-40" strokeDasharray="4,4" />
                  <line x1="250" y1="176" x2="220" y2="240" stroke="currentColor" strokeWidth="2" className="opacity-40" strokeDasharray="4,4" />
                  <line x1="320" y1="204" x2="280" y2="240" stroke="currentColor" strokeWidth="2" className="opacity-40" strokeDasharray="4,4" />
                  
                  {/* Brain Icon */}
                  <path d="M200 80 C220 70, 240 70, 260 80 C270 90, 270 110, 260 120 C240 130, 220 130, 200 120 C190 110, 190 90, 200 80 Z" className="fill-pink-400/80" />
                  <circle cx="210" cy="95" r="3" className="fill-white" />
                  <circle cx="230" cy="95" r="3" className="fill-white" />
                  <circle cx="250" cy="95" r="3" className="fill-white" />
                  <path d="M205 110 Q220 115, 235 110" stroke="white" strokeWidth="2" fill="none" />
                </svg>
              </div>
              
              {/* Floating Cards */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg"
              >
                98% Success Rate
              </motion.div>
              
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                className="absolute -bottom-4 -left-4 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg"
              >
                AI-Powered
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.main>

      {/* Features Section */}
      <motion.section
        id="features"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative z-10 container mx-auto px-6 py-20"
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Why Choose A4AI Learning?
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Experience the future of education with our cutting-edge AI technology designed for modern classrooms.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
              <p className="text-white/80 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative z-10 container mx-auto px-6 py-20"
      >
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 p-12 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Education?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of educators who are already using A4AI Learning to create engaging, personalized learning experiences.
          </p>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSignUp}
            className="px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-semibold rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 inline-flex items-center space-x-3"
          >
            <span>Start Your Free Trial</span>
            <ArrowRightIcon className="w-6 h-6" />
          </motion.button>
        </div>
      </motion.section>

      {/* Footer */}
      <footer id="contact" className="relative z-10 container mx-auto px-6 py-12 border-t border-white/20">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center ring-1 ring-white/20">
              <AcademicCapIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">A4AI Learning</h3>
          </div>
          <p className="text-white/60 mb-6">
            Empowering the next generation of learners with AI-driven education technology.
          </p>
          <div className="flex justify-center space-x-8 text-white/60">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/support" className="hover:text-white transition-colors">Support</Link>
          </div>
          <p className="text-white/40 text-sm mt-6">
            © 2025 A4AI Learning. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
