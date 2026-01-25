"use client"

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

// Side Panel Component
function SidePanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Side Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-[#0D2833] shadow-2xl z-[101] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#D4F1F4] dark:border-[#1A4D5E]">
            <h2 className="text-2xl font-bold text-[#023047] dark:text-[#E0F4F5]">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F0F8FA] dark:hover:bg-[#0A1E29] rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#023047] dark:text-[#E0F4F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Profile Section */}
          <div className="p-6 border-b border-[#D4F1F4] dark:border-[#1A4D5E]">
            <SignedIn>
              <div className="flex items-center gap-4">
                <UserButton />
                <span className="text-[#023047] dark:text-[#E0F4F5] font-medium">My Account</span>
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="w-full bg-[#2E86AB] hover:bg-[#1B6B8F] text-white font-medium py-3 px-6 rounded-lg transition-all">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>

          {/* Navigation Links */}
          <SignedIn>
            <nav className="flex-1 overflow-y-auto p-4">
              <Link
                href="/resume"
                className="flex items-center gap-4 p-4 mb-2 rounded-lg hover:bg-[#F0F8FA] dark:hover:bg-[#0A1E29] transition-all group"
                onClick={onClose}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#2E86AB] to-[#4A9EBF] rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📋
                </div>
                <div>
                  <h3 className="font-semibold text-[#023047] dark:text-[#E0F4F5]">Resume Generator</h3>
                  <p className="text-sm text-[#5A8A9F] dark:text-[#7FA8B8]">Create professional resumes</p>
                </div>
              </Link>

              <Link
                href="/Roadmap"
                className="flex items-center gap-4 p-4 mb-2 rounded-lg hover:bg-[#F0F8FA] dark:hover:bg-[#0A1E29] transition-all group"
                onClick={onClose}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#52B788] to-[#74C69D] rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🗺️
                </div>
                <div>
                  <h3 className="font-semibold text-[#023047] dark:text-[#E0F4F5]">Career Roadmap</h3>
                  <p className="text-sm text-[#5A8A9F] dark:text-[#7FA8B8]">Plan your career path</p>
                </div>
              </Link>

              <Link
                href="/ApplicationTracker"
                className="flex items-center gap-4 p-4 mb-2 rounded-lg hover:bg-[#F0F8FA] dark:hover:bg-[#0A1E29] transition-all group"
                onClick={onClose}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#06A77D] to-[#2E86AB] rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📊
                </div>
                <div>
                  <h3 className="font-semibold text-[#023047] dark:text-[#E0F4F5]">Application Tracker</h3>
                  <p className="text-sm text-[#5A8A9F] dark:text-[#7FA8B8]">Track your applications</p>
                </div>
              </Link>

              <Link
                href="/MessageRewriter"
                className="flex items-center gap-4 p-4 mb-2 rounded-lg hover:bg-[#F0F8FA] dark:hover:bg-[#0A1E29] transition-all group"
                onClick={onClose}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#9B59B6] to-[#BB6BD9] rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  ✍️
                </div>
                <div>
                  <h3 className="font-semibold text-[#023047] dark:text-[#E0F4F5]">Message Rewriter</h3>
                  <p className="text-sm text-[#5A8A9F] dark:text-[#7FA8B8]">Polish professional messages</p>
                </div>
              </Link>

              <Link
                href="/"
                className="flex items-center gap-4 p-4 mb-2 rounded-lg hover:bg-[#F0F8FA] dark:hover:bg-[#0A1E29] transition-all group"
                onClick={onClose}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#FFB703] to-[#FB8500] rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🏠
                </div>
                <div>
                  <h3 className="font-semibold text-[#023047] dark:text-[#E0F4F5]">Home</h3>
                  <p className="text-sm text-[#5A8A9F] dark:text-[#7FA8B8]">Back to landing page</p>
                </div>
              </Link>
            </nav>
          </SignedIn>

          {/* Footer */}
          <div className="p-6 border-t border-[#D4F1F4] dark:border-[#1A4D5E]">
            <p className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8] text-center">
              © 2025 ResumeGenerator Pro
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Home() {
  const [typedText, setTypedText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const fullText = "Transform Your Career with AI";

  useEffect(() => {
    setIsMounted(true);
    setIsVisible(true);
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const stats = [
    { number: 100, label: "AI Generations", suffix: "+" },
    { number: 3, label: "AI Models", suffix: "" },
    { number: 50, label: "Active Users", suffix: "+" },
  ];

  const features = [
    {
      icon: "📋",
      title: "AI Resume Generation",
      shortDescription: "Professional, ATS-optimized resumes in seconds",
      fullDescription: "Generate professional, ATS-optimized resumes tailored to specific roles using GPT-4, Grok, or Llama AI models with real-time streaming",
      color: "from-[#2E86AB] to-[#4A9EBF]"
    },
    {
      icon: "🗺️",
      title: "Career Roadmap Planning",
      shortDescription: "Personalized career transition plans with resources",
      fullDescription: "Get personalized month-by-month career transition plans with learning resources, project ideas, and interview preparation strategies",
      color: "from-[#52B788] to-[#74C69D]"
    },
    {
      icon: "📊",
      title: "Application Tracking",
      shortDescription: "Track applications with status updates and reminders",
      fullDescription: "Organize and track all your job applications with status updates, notes, and follow-up reminders in one centralized dashboard",
      color: "from-[#06A77D] to-[#2E86AB]"
    },
  ];

  const [animatedStats, setAnimatedStats] = useState(stats.map(() => 0));

  useEffect(() => {
    stats.forEach((stat, index) => {
      let current = 0;
      const increment = stat.number / 50;
      const timer = setInterval(() => {
        current += increment;
        if (current >= stat.number) {
          current = stat.number;
          clearInterval(timer);
        }
        setAnimatedStats(prev => {
          const newStats = [...prev];
          newStats[index] = Math.floor(current);
          return newStats;
        });
      }, 30);
    });
  }, []);

  return (
    <>
      <Head>
        <title>ResumeGenerator Pro - Transform Your Career with AI</title>
        <meta name="description" content="AI-powered resume generation, career roadmaps, and application tracking to help you land your dream job" />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-[#F0F8FA] to-[#E8F4F5] dark:from-[#0A1E29] dark:to-[#071821] overflow-hidden relative">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-[#2E86AB]/20 to-[#4A9EBF]/20 rounded-full blur-3xl animate-blob"
          style={{
            top: '10%',
            left: '10%',
            animation: 'blob 7s infinite'
          }}
        />
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-[#52B788]/20 to-[#74C69D]/20 rounded-full blur-3xl animate-blob animation-delay-2000"
          style={{
            top: '50%',
            right: '10%',
            animation: 'blob 7s infinite 2s'
          }}
        />
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-[#06A77D]/20 to-[#2E86AB]/20 rounded-full blur-3xl animate-blob animation-delay-4000"
          style={{
            bottom: '10%',
            left: '50%',
            animation: 'blob 7s infinite 4s'
          }}
        />

        {/* Floating particles */}
        {isMounted && [...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-[#2E86AB]/30 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Interactive cursor glow */}
      <div
        className="absolute w-96 h-96 bg-gradient-to-r from-[#2E86AB]/10 to-[#4A9EBF]/10 rounded-full blur-3xl pointer-events-none transition-all duration-300"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
        }}
      />

      {/* Side Panel */}
      <SidePanel isOpen={sidePanelOpen} onClose={() => setSidePanelOpen(false)} />

      {/* Sticky Sign-In Button */}
      <SignedOut>
        <div className="fixed top-20 right-6 z-50">
          <SignInButton mode="modal">
            <button className="bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] hover:from-[#1B6B8F] hover:to-[#3A8CB0] text-white font-bold py-3 px-8 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all flex items-center gap-2">
              Start Free
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </SignInButton>
        </div>
      </SignedOut>

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Navigation */}
        <nav className={`flex justify-between items-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setSidePanelOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-[#0D2833] border-2 border-[#2E86AB] dark:border-[#4A9EBF] text-[#023047] dark:text-[#E0F4F5] font-medium py-2 px-4 rounded-lg transition-all shadow-md hover:shadow-xl hover:scale-105 transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>Menu</span>
          </button>

          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#023047] dark:text-[#E0F4F5] hover:scale-105 transition-transform cursor-pointer">
              ResumeGenerator Pro
            </h1>
            <span className="bg-gradient-to-r from-[#FFB703] to-[#FB8500] text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
              BETA
            </span>
          </div>
        </nav>

        {/* Hero Section */}
        <div className={`text-center py-16 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-5xl md:text-6xl font-bold mb-4 min-h-[4rem]">
            <span className="bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] bg-clip-text text-transparent animate-gradient">
              {typedText}
              <span className="animate-pulse">|</span>
            </span>
          </h2>
          <p className="text-xl text-[#5A8A9F] dark:text-[#7FA8B8] mb-8 max-w-2xl mx-auto animate-fade-in-up">
            Create professional resumes, plan your career, track applications—all powered by AI
          </p>

          {/* Visual Demo Section */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="relative bg-white/70 dark:bg-[#0D2833]/70 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-[#2E86AB] dark:border-[#4A9EBF] p-8 hover:shadow-3xl transition-all">
              <a
                href="https://resumegenapp.s3.amazonaws.com/resumegen-userguide.mp4"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute -top-4 -right-4 bg-gradient-to-r from-[#52B788] to-[#74C69D] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
              >
                ✨ See it in action
              </a>
              <div className="aspect-video bg-gradient-to-br from-[#E8F4F5] to-[#D4F1F4] dark:from-[#0A1E29] dark:to-[#071821] rounded-xl flex items-center justify-center border border-[#D4F1F4] dark:border-[#1A4D5E] overflow-hidden">
                <Image
                  src="/landingpage_visual.png"
                  alt="Watch Resume Generation in Real-Time"
                  width={1200}
                  height={675}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Animated Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white/50 dark:bg-[#0D2833]/50 backdrop-blur-md p-8 rounded-2xl border border-[#D4F1F4] dark:border-[#1A4D5E] shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 transform"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                }}
              >
                <div className="text-4xl font-bold bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] bg-clip-text text-transparent mb-2">
                  {animatedStats[index]}{stat.suffix}
                </div>
                <div className="text-sm text-[#5A8A9F] dark:text-[#7FA8B8] font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Features Grid with staggered animation */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`relative group transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{
                  transitionDelay: `${400 + index * 150}ms`
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-all duration-500 scale-95 group-hover:scale-100`}></div>
                <div className={`relative bg-white dark:bg-[#0D2833] p-8 rounded-2xl shadow-lg border-2 transition-all duration-300 ${
                  expandedFeature === index ? 'border-[#2E86AB] dark:border-[#4A9EBF] shadow-2xl' : 'border-[#D4F1F4] dark:border-[#1A4D5E] hover:scale-105 transform'
                }`}>
                  <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-[#023047] dark:text-[#E0F4F5]">
                    {feature.title}
                  </h3>
                  <p className="text-[#5A8A9F] dark:text-[#7FA8B8] mb-3">
                    {expandedFeature === index ? feature.fullDescription : feature.shortDescription}
                  </p>
                  <button
                    onClick={() => setExpandedFeature(expandedFeature === index ? null : index)}
                    className="text-[#2E86AB] dark:text-[#4A9EBF] text-sm font-semibold hover:underline flex items-center gap-1 transition-all"
                  >
                    {expandedFeature === index ? 'Show less' : 'Learn more'}
                    <svg
                      className={`w-4 h-4 transition-transform duration-300 ${expandedFeature === index ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="mt-4 h-1 bg-gradient-to-r from-transparent via-[#2E86AB] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <SignedIn>
              <div className="flex gap-4">
                <Link href="/resume">
                  <button className="bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] hover:from-[#1B6B8F] hover:to-[#3A8CB0] text-white font-bold py-3 px-8 rounded-xl transition-all transform hover:scale-105 shadow-xl">
                    Create Resume →
                  </button>
                </Link>
                <Link href="/Roadmap">
                  <button className="border-2 border-[#2E86AB] dark:border-[#4A9EBF] text-[#2E86AB] dark:text-[#4A9EBF] font-bold py-3 px-8 rounded-xl transition-all transform hover:scale-105 hover:bg-[#2E86AB] hover:text-white">
                    Plan Career
                  </button>
                </Link>
              </div>
            </SignedIn>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="w-full flex items-center justify-center gap-3 bg-white/50 dark:bg-[#0D2833]/50 backdrop-blur-md p-6 rounded-2xl border-2 border-[#D4F1F4] dark:border-[#1A4D5E] hover:border-[#2E86AB] dark:hover:border-[#4A9EBF] transition-all mb-6 group"
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] bg-clip-text text-transparent">
              How It Works
            </h2>
            <svg
              className={`w-6 h-6 text-[#2E86AB] dark:text-[#4A9EBF] transition-transform duration-300 ${showHowItWorks ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className={`grid md:grid-cols-4 gap-6 transition-all duration-500 pt-4 ${showHowItWorks ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
            {[
              { step: "1", title: "Sign Up", icon: "👤", desc: "Create your account with Clerk authentication" },
              { step: "2", title: "Choose Your Tool", icon: "🎯", desc: "Resume Generator, Career Roadmap, or Application Tracker" },
              { step: "3", title: "AI-Powered Results", icon: "🤖", desc: "Get instant AI-generated content tailored to your needs" },
              { step: "4", title: "Track & Succeed", icon: "📈", desc: "Manage applications and land your dream job" },
            ].map((item, index) => (
              <div
                key={index}
                className="relative group pt-4 pl-4"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.15}s both`
                }}
              >
                <div className="bg-white/70 dark:bg-[#0D2833]/70 backdrop-blur-sm p-4 rounded-xl border border-[#D4F1F4] dark:border-[#1A4D5E] hover:border-[#2E86AB] transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                  <div className="text-4xl mb-3 text-center transform group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <div className="absolute top-0 left-0 w-8 h-8 bg-gradient-to-br from-[#2E86AB] to-[#4A9EBF] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="text-base font-bold text-center mb-2 text-[#023047] dark:text-[#E0F4F5]">
                    {item.title}
                  </h3>
                  <p className="text-center text-[#5A8A9F] dark:text-[#7FA8B8] text-xs">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Image */}
        <div className="mb-8 flex justify-center">
          <a
            href="https://substack.com/@riddhimansherlekar1"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-transform hover:scale-105 duration-300"
          >
            <Image
              src="/sbstack.jpg"
              alt="SBStack"
              width={800}
              height={200}
              className="rounded-lg shadow-lg cursor-pointer"
            />
          </a>
        </div>

        {/* Trust Indicators */}
        <div className="text-center">
          <div className="inline-flex items-center gap-4 bg-white/50 dark:bg-[#0D2833]/50 backdrop-blur-md px-8 py-4 rounded-full border border-[#D4F1F4] dark:border-[#1A4D5E] shadow-lg">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#52B788] rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-[#5A8A9F] dark:text-[#7FA8B8]">Secure</span>
            </div>
            <div className="w-px h-6 bg-[#D4F1F4] dark:bg-[#1A4D5E]"></div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#2E86AB] rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-[#5A8A9F] dark:text-[#7FA8B8]">GDPR Compliant</span>
            </div>
            <div className="w-px h-6 bg-[#D4F1F4] dark:bg-[#1A4D5E]"></div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#06A77D] rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-[#5A8A9F] dark:text-[#7FA8B8]">Professional</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </main>
    </>
  );
}
