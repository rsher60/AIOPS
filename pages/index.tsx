"use client"

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

// Side Panel Component
function SidePanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] transition-opacity"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-[#0D2833] shadow-2xl z-[101] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
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

          <SignedIn>
            <nav className="flex-1 overflow-y-auto p-4">
              <Link href="/resume" className="flex items-center gap-4 p-4 mb-2 rounded-lg hover:bg-[#F0F8FA] dark:hover:bg-[#0A1E29] transition-all group" onClick={onClose}>
                <div className="w-12 h-12 bg-gradient-to-br from-[#2E86AB] to-[#4A9EBF] rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📋</div>
                <div>
                  <h3 className="font-semibold text-[#023047] dark:text-[#E0F4F5]">Resume Generator</h3>
                  <p className="text-sm text-[#5A8A9F] dark:text-[#7FA8B8]">Create professional resumes</p>
                </div>
              </Link>

              <Link href="/Roadmap" className="flex items-center gap-4 p-4 mb-2 rounded-lg hover:bg-[#F0F8FA] dark:hover:bg-[#0A1E29] transition-all group" onClick={onClose}>
                <div className="w-12 h-12 bg-gradient-to-br from-[#52B788] to-[#74C69D] rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🗺️</div>
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

              <Link href="/ApplicationTracker" className="flex items-center gap-4 p-4 mb-2 rounded-lg hover:bg-[#F0F8FA] dark:hover:bg-[#0A1E29] transition-all group" onClick={onClose}>
                <div className="w-12 h-12 bg-gradient-to-br from-[#06A77D] to-[#2E86AB] rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📊</div>
                <div>
                  <h3 className="font-semibold text-[#023047] dark:text-[#E0F4F5]">Application Tracker</h3>
                  <p className="text-sm text-[#5A8A9F] dark:text-[#7FA8B8]">Track your applications</p>
                </div>
              </Link>

              <Link href="/MessageRewriter" className="flex items-center gap-4 p-4 mb-2 rounded-lg hover:bg-[#F0F8FA] dark:hover:bg-[#0A1E29] transition-all group" onClick={onClose}>
                <div className="w-12 h-12 bg-gradient-to-br from-[#9B59B6] to-[#BB6BD9] rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">✍️</div>
                <div>
                  <h3 className="font-semibold text-[#023047] dark:text-[#E0F4F5]">Message Rewriter</h3>
                  <p className="text-sm text-[#5A8A9F] dark:text-[#7FA8B8]">Polish professional messages</p>
                </div>
              </Link>

              <Link href="/" className="flex items-center gap-4 p-4 mb-2 rounded-lg hover:bg-[#F0F8FA] dark:hover:bg-[#0A1E29] transition-all group" onClick={onClose}>
                <div className="w-12 h-12 bg-gradient-to-br from-[#FFB703] to-[#FB8500] rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🏠</div>
                <div>
                  <h3 className="font-semibold text-[#023047] dark:text-[#E0F4F5]">Home</h3>
                  <p className="text-sm text-[#5A8A9F] dark:text-[#7FA8B8]">Back to landing page</p>
                </div>
              </Link>
            </nav>
          </SignedIn>

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

const features = [
  {
    icon: "📋",
    title: "AI Resume Generator",
    description: "ATS-optimized resumes tailored to any job description in seconds — not hours.",
    color: "from-[#2E86AB] to-[#4A9EBF]",
    href: "/resume",
  },
  {
    icon: "🗺️",
    title: "Career Roadmap",
    description: "Month-by-month plans with learning resources to reach your target role.",
    color: "from-[#52B788] to-[#74C69D]",
    href: "/Roadmap",
  },
  {
    icon: "🔍",
    title: "Company Research",
    description: "Deep AI research on culture, interviews, and compensation before you walk in.",
    color: "from-[#E63946] to-[#F4A261]",
    href: "/CompanyResearch",
  },
  {
    icon: "📊",
    title: "Application Tracker",
    description: "Every application, status, and note in one organized dashboard.",
    color: "from-[#06A77D] to-[#2E86AB]",
    href: "/ApplicationTracker",
  },
  {
    icon: "✍️",
    title: "Message Rewriter",
    description: "Turn cold outreach and follow-ups into messages that actually get replies.",
    color: "from-[#9B59B6] to-[#BB6BD9]",
    href: "/MessageRewriter",
  },
];

const testimonials = [
  {
    quote: "I landed 3 interviews in 2 weeks after using the AI resume tool. The tailoring to each job description is genuinely impressive.",
    name: "Alex M.",
    role: "Software Engineer",
    avatar: "AM",
    color: "from-[#2E86AB] to-[#4A9EBF]",
  },
  {
    quote: "The career roadmap gave me a clear month-by-month plan to pivot from marketing into product. Went from lost to focused in one session.",
    name: "Sarah K.",
    role: "Product Manager",
    avatar: "SK",
    color: "from-[#52B788] to-[#74C69D]",
  },
  {
    quote: "Walking into interviews with deep company research made a huge difference. I knew things the interviewers didn't expect me to know.",
    name: "James T.",
    role: "Data Analyst",
    avatar: "JT",
    color: "from-[#9B59B6] to-[#BB6BD9]",
  },
];

export default function Home() {
  const [sidePanelOpen, setSidePanelOpen] = useState(false);;

  return (
    <>
      <Head>
        <title>ResumeGenerator Pro — Land Your Dream Job Faster</title>
        <meta name="description" content="AI-tailored resumes, career roadmaps, and company research. Everything you need to go from application to offer, faster." />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-[#F0F8FA] to-[#E8F4F5] dark:from-[#0A1E29] dark:to-[#071821] overflow-x-hidden">

        {/* Subtle background blobs — fixed, pointer-events-none so they never block clicks */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div
            className="absolute w-[700px] h-[700px] bg-gradient-to-r from-[#2E86AB]/12 to-[#4A9EBF]/12 rounded-full blur-3xl"
            style={{ top: '-15%', left: '-10%', animation: 'blob 14s infinite ease-in-out' }}
          />
          <div
            className="absolute w-[500px] h-[500px] bg-gradient-to-r from-[#52B788]/10 to-[#74C69D]/10 rounded-full blur-3xl"
            style={{ bottom: '5%', right: '-5%', animation: 'blob 16s infinite ease-in-out 4s' }}
          />
        </div>

        <SidePanel isOpen={sidePanelOpen} onClose={() => setSidePanelOpen(false)} />

        {/* Sticky sign-in for signed-out visitors */}
        <SignedOut>
          <div className="fixed top-4 right-6 z-50">
            <SignInButton mode="modal">
              <button className="bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] hover:from-[#1B6B8F] hover:to-[#3A8CB0] text-white font-semibold py-2.5 px-6 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all text-sm">
                Sign In
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <div className="relative z-10">

          {/* ── NAV ── */}
          <nav className="container mx-auto px-6 pt-8 pb-4 flex justify-between items-center animate-fade-down">
            <button
              onClick={() => setSidePanelOpen(true)}
              className="flex items-center gap-2 bg-white/80 dark:bg-[#0D2833]/80 backdrop-blur-sm border border-[#D4F1F4] dark:border-[#1A4D5E] text-[#023047] dark:text-[#E0F4F5] font-medium py-2 px-4 rounded-lg transition-all shadow-sm hover:shadow-md hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="hidden sm:inline text-sm">Menu</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-[#023047] dark:text-[#E0F4F5]">ResumeGenerator Pro</span>
              <span className="bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow">
                Early Access
              </span>
            </div>

            <SignedIn>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <div className="w-20" />
            </SignedOut>
          </nav>

          {/* ── HERO ── */}
          <section className="container mx-auto px-6 pt-10 pb-20 animate-fade-up">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

              {/* Left: copy */}
              <div className="flex-1 text-center lg:text-left max-w-xl mx-auto lg:mx-0">
                <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-[#0D2833]/70 border border-[#D4F1F4] dark:border-[#1A4D5E] px-4 py-2 rounded-full text-sm text-[#2E86AB] font-semibold mb-6 backdrop-blur-sm">
                  <span className="w-2 h-2 bg-[#52B788] rounded-full animate-pulse" />
                  AI-Powered Career Tools
                </div>

                <h1 className="text-5xl md:text-6xl font-extrabold text-[#023047] dark:text-[#E0F4F5] leading-tight mb-6">
                  Land Your{' '}
                  <span className="bg-gradient-to-r from-[#2E86AB] to-[#52B788] bg-clip-text text-transparent">
                    Dream Job
                  </span>
                  {' '}3x Faster
                </h1>

                <p className="text-lg text-[#5A8A9F] dark:text-[#7FA8B8] mb-10 leading-relaxed">
                  AI-tailored resumes, career roadmaps, and company research — everything you need to go from application to offer, faster than ever.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-6">
                  <SignedIn>
                    <Link href="/resume">
                      <button className="bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] hover:from-[#1B6B8F] hover:to-[#3A8CB0] text-white font-bold py-4 px-8 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all text-base w-full sm:w-auto">
                        Build My Resume →
                      </button>
                    </Link>
                    <Link href="/Roadmap">
                      <button className="border-2 border-[#2E86AB] dark:border-[#4A9EBF] text-[#2E86AB] dark:text-[#4A9EBF] font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 hover:bg-[#2E86AB] hover:text-white text-base w-full sm:w-auto">
                        Map My Next Move
                      </button>
                    </Link>
                  </SignedIn>
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] hover:from-[#1B6B8F] hover:to-[#3A8CB0] text-white font-bold py-4 px-8 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all text-base w-full sm:w-auto">
                        Build My Resume Free →
                      </button>
                    </SignInButton>
                    <a
                      href="https://resumegenapp.s3.amazonaws.com/resumegen-userguide.mp4"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-2 border-[#2E86AB] dark:border-[#4A9EBF] text-[#2E86AB] dark:text-[#4A9EBF] font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 hover:bg-[#2E86AB] hover:text-white text-center text-base w-full sm:w-auto"
                    >
                      Watch Demo
                    </a>
                  </SignedOut>
                </div>

                <p className="text-sm text-[#5A8A9F] dark:text-[#7FA8B8]">
                  Free to start · No credit card required
                </p>
              </div>

              {/* Right: mock resume preview */}
              <div className="flex-1 flex justify-center lg:justify-end w-full">
                <div className="relative">
                  {/* Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2E86AB]/25 to-[#52B788]/25 rounded-3xl blur-2xl scale-110" />

                  <div className="relative bg-white dark:bg-[#0D2833] rounded-2xl shadow-2xl p-7 w-[320px] md:w-[390px] border border-[#D4F1F4] dark:border-[#1A4D5E]">
                    {/* AI badge */}
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-[#2E86AB] to-[#52B788] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      AI Generated
                    </div>

                    {/* Resume header */}
                    <div className="mb-5">
                      <div className="h-5 w-44 bg-[#023047] dark:bg-[#E0F4F5] rounded mb-2" />
                      <div className="h-3 w-32 bg-[#2E86AB]/50 rounded mb-4" />
                      <div className="flex gap-3 flex-wrap">
                        <div className="h-2.5 w-24 bg-[#D4F1F4] dark:bg-[#1A4D5E] rounded" />
                        <div className="h-2.5 w-20 bg-[#D4F1F4] dark:bg-[#1A4D5E] rounded" />
                        <div className="h-2.5 w-16 bg-[#D4F1F4] dark:bg-[#1A4D5E] rounded" />
                      </div>
                    </div>

                    <div className="border-t border-[#D4F1F4] dark:border-[#1A4D5E] pt-4 mb-5">
                      <div className="h-3 w-24 bg-[#2E86AB] rounded mb-3" />
                      <div className="space-y-2">
                        <div className="h-2 w-full bg-[#E8F4F5] dark:bg-[#1A4D5E] rounded" />
                        <div className="h-2 w-5/6 bg-[#E8F4F5] dark:bg-[#1A4D5E] rounded" />
                        <div className="h-2 w-4/6 bg-[#E8F4F5] dark:bg-[#1A4D5E] rounded" />
                      </div>
                    </div>

                    <div className="border-t border-[#D4F1F4] dark:border-[#1A4D5E] pt-4 mb-5">
                      <div className="h-3 w-28 bg-[#2E86AB] rounded mb-3" />
                      {[{ w: 36, lines: [true, true] }, { w: 28, lines: [true, false] }].map((job, i) => (
                        <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#52B788] mt-1.5 flex-shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className={`h-2.5 w-${job.w} bg-[#023047]/20 dark:bg-[#E0F4F5]/20 rounded`} />
                            <div className="h-2 w-full bg-[#E8F4F5] dark:bg-[#1A4D5E] rounded" />
                            {job.lines[1] && <div className="h-2 w-5/6 bg-[#E8F4F5] dark:bg-[#1A4D5E] rounded" />}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-[#D4F1F4] dark:border-[#1A4D5E] pt-4">
                      <div className="h-3 w-16 bg-[#2E86AB] rounded mb-3" />
                      <div className="flex flex-wrap gap-2">
                        {['Python', 'React', 'SQL', 'AWS', 'TypeScript'].map((skill) => (
                          <span key={skill} className="text-xs bg-[#E8F4F5] dark:bg-[#1A4D5E] text-[#2E86AB] dark:text-[#4A9EBF] px-2.5 py-1 rounded-full font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Floating ATS badge */}
                  <div className="absolute -bottom-4 -left-4 bg-white dark:bg-[#0D2833] rounded-xl shadow-xl p-3 border border-[#D4F1F4] dark:border-[#1A4D5E] flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-[#52B788] to-[#74C69D] rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">✓</div>
                    <div>
                      <div className="text-xs font-bold text-[#023047] dark:text-[#E0F4F5]">ATS Optimized</div>
                      <div className="text-[10px] text-[#5A8A9F] dark:text-[#7FA8B8]">Score: 94 / 100</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── FEATURES ── */}
          <section className="bg-white/50 dark:bg-[#0D2833]/40 backdrop-blur-sm border-y border-[#D4F1F4] dark:border-[#1A4D5E] py-20">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-[#023047] dark:text-[#E0F4F5] mb-4">
                  Everything you need to get hired
                </h2>
                <p className="text-[#5A8A9F] dark:text-[#7FA8B8] max-w-xl mx-auto">
                  Five AI tools built around the full job search — from your first resume draft to your final negotiation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {features.map((feature, i) => (
                  <Link key={i} href={feature.href}>
                    <div className="group bg-white dark:bg-[#0D2833] rounded-xl p-6 border border-[#D4F1F4] dark:border-[#1A4D5E] hover:border-[#2E86AB] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                      <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                        {feature.icon}
                      </div>
                      <h3 className="font-bold text-[#023047] dark:text-[#E0F4F5] mb-2">{feature.title}</h3>
                      <p className="text-sm text-[#5A8A9F] dark:text-[#7FA8B8] leading-relaxed mb-4">{feature.description}</p>
                      <div className="text-[#2E86AB] text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                        Try it <span>→</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* ── HOW IT WORKS ── */}
          <section className="container mx-auto px-6 py-20">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-[#023047] dark:text-[#E0F4F5] mb-4">How it works</h2>
              <p className="text-[#5A8A9F] dark:text-[#7FA8B8]">Three steps. That&apos;s it.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                {
                  step: "01",
                  icon: "👤",
                  title: "Sign up free",
                  desc: "Create your account in seconds. No credit card, no commitment.",
                  color: "from-[#2E86AB] to-[#4A9EBF]",
                },
                {
                  step: "02",
                  icon: "🎯",
                  title: "Pick your tool",
                  desc: "Resume builder, career roadmap, company research, or tracker — start wherever you need most.",
                  color: "from-[#52B788] to-[#74C69D]",
                },
                {
                  step: "03",
                  icon: "📈",
                  title: "Land the job",
                  desc: "Get AI results in seconds. Export, track, and iterate until you have the offer in hand.",
                  color: "from-[#06A77D] to-[#2E86AB]",
                },
              ].map((item, i) => (
                <div key={i} className="relative group">
                  {i < 2 && (
                    <div className="hidden md:block absolute top-10 left-[calc(100%+1rem)] w-8 border-t-2 border-dashed border-[#D4F1F4] dark:border-[#1A4D5E] z-10" />
                  )}
                  <div className="bg-white/70 dark:bg-[#0D2833]/70 backdrop-blur-sm rounded-2xl p-8 border border-[#D4F1F4] dark:border-[#1A4D5E] hover:border-[#2E86AB] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center h-full">
                    <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5 group-hover:scale-110 transition-transform`}>
                      {item.icon}
                    </div>
                    <div className="text-[#2E86AB] font-mono text-sm font-bold mb-2">{item.step}</div>
                    <h3 className="font-bold text-lg text-[#023047] dark:text-[#E0F4F5] mb-3">{item.title}</h3>
                    <p className="text-sm text-[#5A8A9F] dark:text-[#7FA8B8] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── TESTIMONIALS ── */}
          <section className="bg-white/50 dark:bg-[#0D2833]/40 backdrop-blur-sm border-y border-[#D4F1F4] dark:border-[#1A4D5E] py-20">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-[#023047] dark:text-[#E0F4F5] mb-4">
                  Real results from real job seekers
                </h2>
                <p className="text-[#5A8A9F] dark:text-[#7FA8B8]">Early users sharing what worked for them.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {testimonials.map((t, i) => (
                  <div key={i} className="bg-white dark:bg-[#0D2833] rounded-2xl p-6 border border-[#D4F1F4] dark:border-[#1A4D5E] shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <svg key={j} className="w-4 h-4 text-[#FFB703]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-[#5A8A9F] dark:text-[#7FA8B8] text-sm leading-relaxed mb-6 italic flex-1">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${t.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {t.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[#023047] dark:text-[#E0F4F5]">{t.name}</div>
                        <div className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8]">{t.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FINAL CTA ── */}
          <section className="container mx-auto px-6 py-24 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#023047] dark:text-[#E0F4F5] mb-4 leading-tight">
              Ready to land your{' '}
              <span className="bg-gradient-to-r from-[#2E86AB] to-[#52B788] bg-clip-text text-transparent">
                dream job?
              </span>
            </h2>
            <p className="text-lg text-[#5A8A9F] dark:text-[#7FA8B8] mb-10 max-w-lg mx-auto">
              Join job seekers using AI to cut their search time in half. Free to start — no card required.
            </p>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] hover:from-[#1B6B8F] hover:to-[#3A8CB0] text-white font-bold py-5 px-12 rounded-2xl shadow-2xl hover:shadow-[0_20px_60px_rgba(46,134,171,0.35)] transform hover:scale-105 transition-all text-lg">
                  Build My Resume Free →
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/resume">
                <button className="bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] hover:from-[#1B6B8F] hover:to-[#3A8CB0] text-white font-bold py-5 px-12 rounded-2xl shadow-2xl hover:shadow-[0_20px_60px_rgba(46,134,171,0.35)] transform hover:scale-105 transition-all text-lg">
                  Build My Resume →
                </button>
              </Link>
            </SignedIn>
          </section>

          {/* ── FOOTER TRUST BAR ── */}
          <div className="container mx-auto px-6 pb-14 flex justify-center">
            <div className="inline-flex flex-wrap justify-center items-center gap-4 bg-white/50 dark:bg-[#0D2833]/50 backdrop-blur-md px-8 py-4 rounded-full border border-[#D4F1F4] dark:border-[#1A4D5E] shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#52B788] rounded-full animate-pulse" />
                <span className="text-sm font-medium text-[#5A8A9F] dark:text-[#7FA8B8]">Secure & Private</span>
              </div>
              <div className="w-px h-5 bg-[#D4F1F4] dark:bg-[#1A4D5E]" />
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#2E86AB] rounded-full animate-pulse" />
                <span className="text-sm font-medium text-[#5A8A9F] dark:text-[#7FA8B8]">Clerk Auth</span>
              </div>
              <div className="w-px h-5 bg-[#D4F1F4] dark:bg-[#1A4D5E]" />
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#06A77D] rounded-full animate-pulse" />
                <span className="text-sm font-medium text-[#5A8A9F] dark:text-[#7FA8B8]">GPT-4o Powered</span>
              </div>
              <div className="w-px h-5 bg-[#D4F1F4] dark:bg-[#1A4D5E]" />
              <span className="text-sm font-medium text-[#5A8A9F] dark:text-[#7FA8B8]">© 2025 ResumeGenerator Pro</span>
            </div>
          </div>

        </div>

        <style jsx>{`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -40px) scale(1.04); }
            66% { transform: translate(-20px, 20px) scale(0.96); }
          }
          @keyframes fadeDown {
            from { opacity: 0; transform: translateY(-16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(32px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          :global(.animate-fade-down) {
            animation: fadeDown 0.7s ease-out both;
          }
          :global(.animate-fade-up) {
            animation: fadeUp 1s ease-out 0.1s both;
          }
        `}</style>
      </main>
    </>
  );
}
