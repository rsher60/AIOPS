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
              <Link href="/CompanyResearch" className="flex items-center gap-4 p-4 mb-2 rounded-lg hover:bg-[#F0F8FA] dark:hover:bg-[#0A1E29] transition-all group" onClick={onClose}>
                <div className="w-12 h-12 bg-gradient-to-br from-[#E63946] to-[#F4A261] rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🔍</div>
                <div>
                    <h3 className="font-semibold text-[#023047] dark:text-[#E0F4F5]">Company Research</h3>
                    <p className="text-sm text-[#5A8A9F] dark:text-[#7FA8B8]">Research companies</p>
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

  const features = [
    {
      icon: "📋",
      title: "AI Resume Generation",
      shortDescription: "Professional, ATS-optimized resumes tailored to any role",
      fullDescription: "Generate professional, ATS-optimized resumes tailored to specific roles using GPT-4o-mini, Grok, or Llama AI models with real-time streaming",
      color: "from-[#2E86AB] to-[#4A9EBF]"
    },
    {
      icon: "🗺️",
      title: "Career Roadmap Planning",
      shortDescription: "Personalized month-by-month career transition plans",
      fullDescription: "Get personalized month-by-month career transition plans with learning resources, project ideas, and interview preparation strategies",
      color: "from-[#52B788] to-[#74C69D]"
    },
    {
      icon: "📊",
      title: "Application Tracking",
      shortDescription: "Track every application, status, and note in one place",
      fullDescription: "Organize and track all your job applications with status updates and notes in one centralized dashboard backed by AWS S3",
      color: "from-[#06A77D] to-[#2E86AB]"
    },
    {
      icon: "🔍",
      title: "Company Research",
      shortDescription: "Deep AI research on any company before your interview",
      fullDescription: "Get comprehensive intelligence on company culture, interview process, recent news, and compensation — powered by live web search and AI synthesis",
      color: "from-[#E63946] to-[#F4A261]"
    },
    {
      icon: "✍️",
      title: "Message Rewriter",
      shortDescription: "Polish cold outreaches, follow-ups, and negotiations",
      fullDescription: "Rewrite any professional message — referral requests, cold outreach, salary negotiations — into 3 distinct variations tuned to your formality level and recipient",
      color: "from-[#9B59B6] to-[#BB6BD9]"
    },
  ];

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

          {/* Features — donut visual */}
          <div className="max-w-5xl mx-auto mb-16 relative">
            <a
              href="https://resumegenapp.s3.amazonaws.com/resumegen-userguide.mp4"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute -top-2 right-0 bg-gradient-to-r from-[#52B788] to-[#74C69D] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer z-20"
            >
              ✨ See it in action
            </a>

       
              {/* Desktop: hub-and-spoke */}
              <div className="hidden md:block relative w-full max-w-[875px] mx-auto" style={{ aspectRatio: '1' }}>
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 560 560" fill="none">
                  <circle cx="280" cy="280" r="192" stroke="#5A8A9F" strokeWidth="1.5" strokeDasharray="5 6" />
                  <circle cx="280" cy="280" r="88" stroke="#5A8A9F" strokeWidth="1.5" strokeDasharray="5 6" />
                  {features.map((_, i) => {
                    const a = ((-90 + i * 72) * Math.PI) / 180;
                    return (
                      <line
                        key={i}
                        x1="280" y1="280"
                        x2={280 + 192 * Math.cos(a)}
                        y2={280 + 192 * Math.sin(a)}
                        stroke="#5A8A9F" strokeWidth="1.5"
                      />
                    );
                  })}
                </svg>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] rounded-full bg-gradient-to-br from-[#2E86AB] to-[#06A77D] flex flex-col items-center justify-center text-white shadow-xl z-10">
                  <div className="text-2xl mb-1">🚀</div>
                  <div className="text-[11px] font-bold text-center leading-tight px-2">Your Career<br />Assistant</div>
                </div>

                {/* Orbit wrapper — rotates all icons; each icon counter-rotates to stay upright */}
                <div className="absolute inset-0" style={{ animation: 'donut-orbit 28s linear infinite' }}>
                  {features.map((feature, index) => {
                    const a = ((-90 + index * 72) * Math.PI) / 180;
                    const rIcon = 192;
                    const xIconPct = ((280 + rIcon * Math.cos(a)) / 560) * 100;
                    const yIconPct = ((280 + rIcon * Math.sin(a)) / 560) * 100;
                    return (
                      <div
                        key={index}
                        className="absolute z-10 group"
                        style={{ left: `${xIconPct}%`, top: `${yIconPct}%`, animation: 'donut-counter 28s linear infinite' }}
                      >
                        <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-4xl shadow-lg transition-transform duration-200 group-hover:scale-[1.15] cursor-default`}>
                          {feature.icon}
                        </div>
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#023047] dark:bg-[#E0F4F5] text-white dark:text-[#023047] text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
                          {feature.title}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile: simple list */}
              <div className="md:hidden space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-white dark:bg-[#0D2833] rounded-xl border border-[#D4F1F4] dark:border-[#1A4D5E] shadow-sm">
                    <div className={`w-10 h-10 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center text-lg flex-shrink-0`}>
                      {feature.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm text-[#023047] dark:text-[#E0F4F5]">{feature.title}</div>
                      <div className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8] mt-0.5">{feature.shortDescription}</div>
                    </div>
                  </div>
                ))}
              </div>
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
            <SignedOut>
              <div className="flex flex-col sm:flex-row gap-4">
                <SignInButton mode="modal">
                  <button className="bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] hover:from-[#1B6B8F] hover:to-[#3A8CB0] text-white font-bold py-3 px-8 rounded-xl transition-all transform hover:scale-105 shadow-xl">
                    Get Started Free →
                  </button>
                </SignInButton>
                <a
                  href="https://resumegenapp.s3.amazonaws.com/resumegen-userguide.mp4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-[#2E86AB] dark:border-[#4A9EBF] text-[#2E86AB] dark:text-[#4A9EBF] font-bold py-3 px-8 rounded-xl transition-all transform hover:scale-105 hover:bg-[#2E86AB] hover:text-white text-center"
                >
                  Watch Demo
                </a>
              </div>
            </SignedOut>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] bg-clip-text text-transparent mb-8">
            How It Works
          </h2>

          <div className="grid md:grid-cols-4 gap-6 pt-4">
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

        @keyframes donut-orbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @keyframes donut-counter {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(-360deg); }
        }
      `}</style>
    </main>
    </>
  );
}
