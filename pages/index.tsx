"use client"

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export default function Home() {
  const [typedText, setTypedText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeFeature, setActiveFeature] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);

    return () => clearInterval(interval);
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
      description: "Generate professional, ATS-optimized resumes tailored to specific roles using GPT-4, Grok, or Llama AI models with real-time streaming",
      color: "from-[#2E86AB] to-[#4A9EBF]"
    },
    {
      icon: "🗺️",
      title: "Career Roadmap Planning",
      description: "Get personalized month-by-month career transition plans with learning resources, project ideas, and interview preparation strategies",
      color: "from-[#52B788] to-[#74C69D]"
    },
    {
      icon: "📊",
      title: "Application Tracking",
      description: "Organize and track all your job applications with status updates, notes, and follow-up reminders in one centralized dashboard",
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

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Navigation */}
        <nav className={`flex justify-between items-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <h1 className="text-2xl font-bold text-[#023047] dark:text-[#E0F4F5] hover:scale-105 transition-transform cursor-pointer">
            ResumeGenerator Pro
          </h1>
          <div className="flex items-center gap-6">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-[#2E86AB] hover:bg-[#1B6B8F] text-white font-medium py-2 px-6 rounded-lg transition-all shadow-md hover:shadow-xl hover:scale-105 transform">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton showName={true} />
              <div className="relative menu-container ml-2">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 bg-white dark:bg-[#0D2833] border-2 border-[#2E86AB] dark:border-[#4A9EBF] text-[#023047] dark:text-[#E0F4F5] font-medium py-2 px-4 rounded-lg transition-all shadow-md hover:shadow-xl hover:scale-105 transform"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Menu</span>
                </button>
                {showMenu && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-[#0D2833] border-2 border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg shadow-2xl overflow-hidden z-[9999]">
                    <a
                      href="/resume"
                      className="flex items-center gap-3 px-4 py-3 text-[#023047] dark:text-[#E0F4F5] hover:bg-[#F0F8FA] dark:hover:bg-[#0A1E29] transition-all border-b border-[#D4F1F4] dark:border-[#1A4D5E]"
                      style={{ textDecoration: 'none', display: 'flex', cursor: 'pointer' }}
                    >
                      <span className="text-2xl">📋</span>
                      <span className="font-medium">Resume Generator</span>
                    </a>
                    <a
                      href="/Roadmap"
                      className="flex items-center gap-3 px-4 py-3 text-[#023047] dark:text-[#E0F4F5] hover:bg-[#F0F8FA] dark:hover:bg-[#0A1E29] transition-all border-b border-[#D4F1F4] dark:border-[#1A4D5E]"
                      style={{ textDecoration: 'none', display: 'flex', cursor: 'pointer' }}
                    >
                      <span className="text-2xl">🗺️</span>
                      <span className="font-medium">Career Roadmap</span>
                    </a>
                    <a
                      href="/ApplicationTracker"
                      className="flex items-center gap-3 px-4 py-3 text-[#023047] dark:text-[#E0F4F5] hover:bg-[#F0F8FA] dark:hover:bg-[#0A1E29] transition-all"
                      style={{ textDecoration: 'none', display: 'flex', cursor: 'pointer' }}
                    >
                      <span className="text-2xl">📊</span>
                      <span className="font-medium">Application Tracker</span>
                    </a>
                  </div>
                )}
              </div>
            </SignedIn>
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
          <p className="text-2xl font-semibold text-[#023047] dark:text-[#E0F4F5] mb-6 animate-fade-in-up">
            Generate Resumes for your next Job at Lightning Speed
          </p>
          <p className="text-xl text-[#5A8A9F] dark:text-[#7FA8B8] mb-12 max-w-2xl mx-auto animate-fade-in-up animation-delay-300">
            AI-powered assistant that generates professional resumes, cover letters, and follow-up emails in seconds
          </p>

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
                <div className={`relative bg-white dark:bg-[#0D2833] p-8 rounded-2xl shadow-lg border-2 transition-all duration-300 hover:scale-105 transform ${
                  activeFeature === index
                    ? 'border-[#2E86AB] dark:border-[#4A9EBF] shadow-2xl scale-105'
                    : 'border-[#D4F1F4] dark:border-[#1A4D5E]'
                }`}>
                  <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-[#023047] dark:text-[#E0F4F5]">
                    {feature.title}
                  </h3>
                  <p className="text-[#5A8A9F] dark:text-[#7FA8B8]">
                    {feature.description}
                  </p>
                  <div className="mt-4 h-1 bg-gradient-to-r from-transparent via-[#2E86AB] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="group relative bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] hover:from-[#1B6B8F] hover:to-[#3A8CB0] text-white font-bold py-4 px-10 rounded-xl text-lg transition-all transform hover:scale-110 shadow-xl hover:shadow-2xl overflow-hidden">
                  <span className="relative z-10">Start Free Trial</span>
                  <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                </button>
              </SignInButton>
            </SignedOut>

            <button className="group border-2 border-[#2E86AB] dark:border-[#4A9EBF] text-[#2E86AB] dark:text-[#4A9EBF] font-bold py-4 px-10 rounded-xl text-lg transition-all transform hover:scale-105 hover:bg-[#2E86AB] hover:text-white shadow-lg hover:shadow-xl">
              Watch Demo
            </button>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] bg-clip-text text-transparent">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Sign Up", icon: "👤", desc: "Create your account with Clerk authentication" },
              { step: "2", title: "Choose Your Tool", icon: "🎯", desc: "Resume Generator, Career Roadmap, or Application Tracker" },
              { step: "3", title: "AI-Powered Results", icon: "🤖", desc: "Get instant AI-generated content tailored to your needs" },
              { step: "4", title: "Track & Succeed", icon: "📈", desc: "Manage applications and land your dream job" },
            ].map((item, index) => (
              <div
                key={index}
                className="relative group"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.15}s both`
                }}
              >
                <div className="bg-white/70 dark:bg-[#0D2833]/70 backdrop-blur-sm p-6 rounded-xl border border-[#D4F1F4] dark:border-[#1A4D5E] hover:border-[#2E86AB] transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                  <div className="text-6xl mb-4 text-center transform group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-[#2E86AB] to-[#4A9EBF] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-center mb-2 text-[#023047] dark:text-[#E0F4F5]">
                    {item.title}
                  </h3>
                  <p className="text-center text-[#5A8A9F] dark:text-[#7FA8B8] text-sm">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
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

        {/* Footer Image */}
        <div className="mt-16 flex justify-center">
          <Image
            src="/sbstack.jpg"
            alt="SBStack"
            width={800}
            height={200}
            className="rounded-lg shadow-lg"
          />
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
  );
}
