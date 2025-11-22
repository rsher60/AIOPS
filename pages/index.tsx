"use client"

import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#faf8f5] to-[#f5ede5] dark:from-[#2a1f1f] dark:to-[#1f1616]">
      <div className="container mx-auto px-4 py-12">
        {/* Navigation */}
        <nav className="flex justify-between items-center mb-12">
          <h1 className="text-2xl font-bold text-[#3d2e2e] dark:text-[#f5e6d3]">
            ResumeGenerator Pro
          </h1>
          <div>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-[#d97757] hover:bg-[#c5643f] text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-4">
                <Link
                  href="/product"
                  className="bg-[#d97757] hover:bg-[#c5643f] text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  Go to App
                </Link>
                <UserButton showName={true} />
              </div>
            </SignedIn>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="text-center py-16">
          <h4 className="text-4xl font-bold bg-gradient-to-r from-[#d97757] to-[#f4a261] bg-clip-text text-transparent mb-6">
            Transform Your Career
            <br />
            Generate Resume for your next Job at Lightning Speed!!
          </h4>
          <p className="text-xl text-[#8b7665] dark:text-[#b8a394] mb-12 max-w-2xl mx-auto">
            AI-powered assistant that generates resumes, cover letters, and follow-up emails
          </p>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#d97757] to-[#f4a261] rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white dark:bg-[#342828] p-6 rounded-xl shadow-lg border border-[#e8d5c4] dark:border-[#4a3933] backdrop-blur-sm">
                <div className="text-3xl mb-4">📋</div>
                <h3 className="text-lg font-semibold mb-2 text-[#3d2e2e] dark:text-[#f5e6d3]">Professional Summaries</h3>
                <p className="text-[#8b7665] dark:text-[#b8a394] text-sm">
                  Generate comprehensive technical resumes tailored to your job applications
                </p>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#8fbc8f] to-[#9ec99e] rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white dark:bg-[#342828] p-6 rounded-xl shadow-lg border border-[#e8d5c4] dark:border-[#4a3933] backdrop-blur-sm">
                <div className="text-3xl mb-4">✅</div>
                <h3 className="text-lg font-semibold mb-2 text-[#3d2e2e] dark:text-[#f5e6d3]">Action Items</h3>
                <p className="text-[#8b7665] dark:text-[#b8a394] text-sm">
                  Clear next steps and follow-up actions for every interview
                </p>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#e8b59a] to-[#d97757] rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white dark:bg-[#342828] p-6 rounded-xl shadow-lg border border-[#e8d5c4] dark:border-[#4a3933] backdrop-blur-sm">
                <div className="text-3xl mb-4">📧</div>
                <h3 className="text-lg font-semibold mb-2 text-[#3d2e2e] dark:text-[#f5e6d3]">Get in your Email</h3>
                <p className="text-[#8b7665] dark:text-[#b8a394] text-sm">
                  Draft clear, patient-friendly email communications automatically
                </p>
              </div>
            </div>
          </div>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-gradient-to-r from-[#d97757] to-[#f4a261] hover:from-[#c5643f] hover:to-[#e8956f] text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                Start Free Trial
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/product">
              <button className="bg-gradient-to-r from-[#d97757] to-[#f4a261] hover:from-[#c5643f] hover:to-[#e8956f] text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                Open Consultation Assistant
              </button>
            </Link>
          </SignedIn>
        </div>

        {/* Trust Indicators */}
        <div className="text-center text-sm text-[#8b7665] dark:text-[#b8a394]">
          <p>HIPAA Compliant • Secure • Professional</p>
        </div>
      </div>
    </main>
  );
}