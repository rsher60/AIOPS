import { useState, FormEvent, useRef, useEffect } from 'react';
import { useAuth, SignedIn } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { UserButton } from '@clerk/nextjs';

// Side Panel Component
function SidePanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onClose} />}
            <div className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-[#0D2833] shadow-2xl z-[101] transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-6 border-b border-[#D4F1F4] dark:border-[#1A4D5E]">
                        <h2 className="text-2xl font-bold text-[#023047] dark:text-[#E0F4F5]">Menu</h2>
                        <button onClick={onClose} className="p-2 hover:bg-[#F0F8FA] dark:hover:bg-[#0A1E29] rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    </div>
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
                        <Link href="/ApplicationTracker" className="flex items-center gap-4 p-4 mb-2 rounded-lg hover:bg-[#F0F8FA] dark:hover:bg-[#0A1E29] transition-all group" onClick={onClose}>
                            <div className="w-12 h-12 bg-gradient-to-br from-[#06A77D] to-[#2E86AB] rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📊</div>
                            <div>
                                <h3 className="font-semibold text-[#023047] dark:text-[#E0F4F5]">Application Tracker</h3>
                                <p className="text-sm text-[#5A8A9F] dark:text-[#7FA8B8]">Track your applications</p>
                            </div>
                        </Link>
                        <Link href="/CompanyResearch" className="flex items-center gap-4 p-4 mb-2 rounded-lg bg-[#F0F8FA] dark:bg-[#0A1E29] transition-all group" onClick={onClose}>
                            <div className="w-12 h-12 bg-gradient-to-br from-[#E63946] to-[#F4A261] rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🔍</div>
                            <div>
                                <h3 className="font-semibold text-[#023047] dark:text-[#E0F4F5]">Company Research</h3>
                                <p className="text-sm text-[#5A8A9F] dark:text-[#7FA8B8]">Research companies</p>
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
                </div>
            </div>
        </>
    );
}

function CompanyResearchForm() {
    const { getToken } = useAuth();
    const router = useRouter();

    // Form state
    const [companyName, setCompanyName] = useState('');
    const [targetRole, setTargetRole] = useState('');
    const [researchFocus, setResearchFocus] = useState('');
    const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');

    // Streaming state
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);

    // Connection management
    const controllerRef = useRef<AbortController | null>(null);
    const isConnectingRef = useRef(false);

    // Pre-fill form from URL query parameters (from Application Tracker)
    useEffect(() => {
        if (router.isReady) {
            const { company, role } = router.query;
            if (company && typeof company === 'string') {
                setCompanyName(company);
            }
            if (role && typeof role === 'string') {
                setTargetRole(role);
            }
        }
    }, [router.isReady, router.query]);

    const connectWithFreshToken = async (formData: {
        company_name: string;
        target_role?: string;
        research_focus?: string;
        model: string;
    }) => {
        if (isConnectingRef.current) return;
        isConnectingRef.current = true;

        try {
            // Abort any existing connection
            if (controllerRef.current) {
                controllerRef.current.abort();
            }
            controllerRef.current = new AbortController();

            const jwt = await getToken();
            if (!jwt) {
                setOutput('Authentication required');
                setLoading(false);
                isConnectingRef.current = false;
                return;
            }

            console.log('Connecting with fresh token...');

            let buffer = '';

            await fetchEventSource('/api/company-research', {
                signal: controllerRef.current.signal,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify(formData),
                onmessage(ev) {
                    console.log('Received message:', ev.data);
                    buffer += ev.data;
                    setOutput(buffer);
                },
                onerror(err) {
                    console.error('SSE onerror called:', err);
                    isConnectingRef.current = false;

                    // Handle 403 errors by reconnecting with fresh token
                    if (err instanceof Response && err.status === 403) {
                        console.log('Token expired in onerror, reconnecting...');
                        setOutput('Refreshing connection...');
                        setTimeout(() => connectWithFreshToken(formData), 1000);
                        return;
                    }

                    console.log('Non-403 error, letting fetchEventSource handle it');
                    setLoading(false);
                },
                onopen: async (response) => {
                    console.log('SSE onopen called, status:', response.status);

                    if (response.ok) {
                        console.log('SSE connection opened successfully');
                        isConnectingRef.current = false;
                    } else if (response.status === 403) {
                        console.log('403 detected in onopen, triggering reconnect');
                        isConnectingRef.current = false;
                        // Manually trigger reconnect for 403
                        setOutput('Refreshing connection...');
                        setTimeout(() => connectWithFreshToken(formData), 1000);
                        throw new Error('Authentication failed - triggering reconnect');
                    } else {
                        console.log('Non-403 error in onopen:', response.status);
                        isConnectingRef.current = false;
                        setLoading(false);
                        throw new Error(`HTTP ${response.status}`);
                    }
                },
                onclose() {
                    console.log('SSE connection closed');
                    isConnectingRef.current = false;
                    setLoading(false);
                }
            });
        } catch (error) {
            console.error('Failed to connect:', error);
            isConnectingRef.current = false;

            // Only show connection failed if not manually aborted
            if (!controllerRef.current?.signal.aborted) {
                // If it's a network error, try to reconnect a few times
                if (error instanceof TypeError || (error instanceof Error && error.message?.includes('fetch'))) {
                    console.log('Network error, retrying...');
                    setTimeout(() => connectWithFreshToken(formData), 2000);
                } else {
                    setOutput('Connection failed. Please refresh the page.');
                    setLoading(false);
                }
            }
        }
    };

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setOutput('');
        setLoading(true);

        // Prepare form data
        const formData: {
            company_name: string;
            target_role?: string;
            research_focus?: string;
            model: string;
        } = {
            company_name: companyName,
            model: selectedModel,
        };

        // Add optional fields if provided
        if (targetRole.trim()) {
            formData.target_role = targetRole;
        }
        if (researchFocus.trim()) {
            formData.research_focus = researchFocus;
        }

        // Start connection with fresh token
        await connectWithFreshToken(formData);
    }

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            if (controllerRef.current) {
                controllerRef.current.abort();
            }
        };
    }, []);

    // Download research as docx file
    const downloadResearch = async () => {
        try {
            const filename = `company_research_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;

            // Dynamically import docx and file-saver for client-side generation
            const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
            const fileSaver = await import('file-saver');
            const saveAs = fileSaver.default || fileSaver.saveAs;

            // Parse markdown and create document sections
            const sections: InstanceType<typeof Paragraph>[] = [];
            const lines = output.split('\n');

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                if (!line) {
                    sections.push(new Paragraph({ text: '' }));
                    continue;
                }

                // H1 headers
                if (line.startsWith('# ')) {
                    sections.push(
                        new Paragraph({
                            text: line.replace('# ', ''),
                            heading: HeadingLevel.HEADING_1,
                            spacing: { before: 240, after: 120 },
                        })
                    );
                }
                // H2 headers
                else if (line.startsWith('## ')) {
                    sections.push(
                        new Paragraph({
                            text: line.replace('## ', ''),
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 200, after: 100 },
                        })
                    );
                }
                // H3 headers
                else if (line.startsWith('### ')) {
                    sections.push(
                        new Paragraph({
                            text: line.replace('### ', ''),
                            heading: HeadingLevel.HEADING_3,
                            spacing: { before: 160, after: 80 },
                        })
                    );
                }
                // Bullet points
                else if (line.startsWith('- ') || line.startsWith('* ')) {
                    const cleanText = line.replace(/^[-*]\s+/, '');
                    sections.push(
                        new Paragraph({
                            text: cleanText,
                            bullet: { level: 0 },
                            spacing: { before: 60, after: 60 },
                        })
                    );
                }
                // Regular text with bold/italic support
                else {
                    const children: InstanceType<typeof TextRun>[] = [];
                    const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

                    for (const part of parts) {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            children.push(new TextRun({ text: part.slice(2, -2), bold: true }));
                        } else if (part.startsWith('*') && part.endsWith('*')) {
                            children.push(new TextRun({ text: part.slice(1, -1), italics: true }));
                        } else if (part.startsWith('`') && part.endsWith('`')) {
                            children.push(new TextRun({ text: part.slice(1, -1), font: 'Courier New' }));
                        } else if (part) {
                            children.push(new TextRun({ text: part }));
                        }
                    }

                    sections.push(
                        new Paragraph({
                            children: children.length > 0 ? children : [new TextRun({ text: line })],
                            spacing: { before: 60, after: 60 },
                        })
                    );
                }
            }

            // Create the document
            const doc = new Document({
                sections: [
                    {
                        properties: {},
                        children: sections,
                    },
                ],
            });

            // Generate blob and download
            const blob = await Packer.toBlob(doc);
            saveAs(blob, filename);
        } catch (error) {
            console.error('Error downloading DOCX:', error);
            alert('Error generating DOCX file. Please try again.');
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Panel - Form */}
                <div className="lg:sticky lg:top-8 h-fit">
                    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-[#0D2833] rounded-xl shadow-lg p-8 border border-[#D4F1F4] dark:border-[#1A4D5E]">
                        {/* Company Research Header */}
                       

                        <div className="space-y-2">
                            <label htmlFor="company" className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                Company Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="company"
                                type="text"
                                required
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent dark:bg-[#0A1E29] dark:text-[#E0F4F5] bg-[#F8FCFD]"
                                placeholder="e.g., Google, Stripe, Airbnb"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="role" className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                Target Role <span className="text-[#5A8A9F] dark:text-[#7FA8B8]">(optional)</span>
                            </label>
                            <input
                                id="role"
                                type="text"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent dark:bg-[#0A1E29] dark:text-[#E0F4F5] bg-[#F8FCFD]"
                                placeholder="e.g., Senior Software Engineer, Product Manager"
                            />
                            <p className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8]">
                                Add a role for personalized interview tips
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="model" className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                AI Model
                            </label>
                            <select
                                id="model"
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent dark:bg-[#0A1E29] dark:text-[#E0F4F5] bg-[#F8FCFD]"
                            >
                                <option value="gpt-4o-mini">GPT-4o Mini (OpenAI)</option>
                                <option value="grok-beta">Grok Beta (xAI)</option>
                                <option value="llama-70b">Llama 3.1 70B Instruct (Hugging Face)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="focus" className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                Research Focus <span className="text-[#5A8A9F] dark:text-[#7FA8B8]">(optional)</span>
                            </label>
                            <textarea
                                id="focus"
                                rows={4}
                                value={researchFocus}
                                onChange={(e) => setResearchFocus(e.target.value)}
                                className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent dark:bg-[#0A1E29] dark:text-[#E0F4F5] bg-[#F8FCFD]"
                                placeholder="e.g., Recent product launches, company culture, engineering team structure, competitor comparison..."
                            />
                            <p className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8]">
                                Specify areas you want to learn more about
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] hover:from-[#1B6B8F] hover:to-[#e8956f] disabled:from-[#e8b59a] disabled:to-[#f0cdb0] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                        >
                            {loading ? 'Researching Company...' : 'Research Company'}
                        </button>

                        {/* Quick Tips */}
                        <div className="mt-4 p-4 bg-[#EDF7F9] dark:bg-[#0A1E29] rounded-lg border border-[#D4F1F4] dark:border-[#1A4D5E]">
                            <h4 className="font-semibold text-[#023047] dark:text-[#E0F4F5] text-sm mb-2">💡 Pro Tips</h4>
                            <ul className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8] space-y-1">
                                <li>• Add your target role for interview-specific insights</li>
                                <li>• Use research to prepare thoughtful questions</li>
                                <li>• Reference recent company news in your interview</li>
                            </ul>
                        </div>
                    </form>
                </div>

                {/* Right Panel - Output */}
                <div className="lg:min-h-screen">
                    {output ? (
                        <section className="bg-[#F8FCFD] dark:bg-[#0D2833] rounded-xl shadow-lg p-8 h-full border border-[#D4F1F4] dark:border-[#1A4D5E]">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-semibold text-[#023047] dark:text-[#E0F4F5]">
                                    Research: {companyName}
                                </h2>
                                {!loading && (
                                    <button
                                        onClick={downloadResearch}
                                        className="flex items-center gap-2 bg-[#52B788] hover:bg-[#40916C] text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download
                                    </button>
                                )}
                            </div>
                            <div className="markdown-content prose prose-stone dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                    {output}
                                </ReactMarkdown>
                            </div>
                        </section>
                    ) : (
                        <div className="bg-[#F8FCFD] dark:bg-[#0D2833] rounded-xl shadow-lg p-8 h-full flex flex-col items-center justify-center border border-[#D4F1F4] dark:border-[#1A4D5E]">
                            <div className="text-center max-w-md">
                                <div className="w-20 h-20 bg-gradient-to-br from-[#E63946] to-[#F4A261] rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                                    🔍
                                </div>
                                <h3 className="text-xl font-semibold text-[#023047] dark:text-[#E0F4F5] mb-2">
                                    Research Any Company
                                </h3>
                                <p className="text-[#5A8A9F] dark:text-[#7FA8B8] mb-6">
                                    Enter a company name to get comprehensive research including company overview, culture, competitors, and interview preparation tips.
                                </p>
                                <div className="grid grid-cols-2 gap-3 text-left">
                                    <div className="bg-white dark:bg-[#0A1E29] p-3 rounded-lg border border-[#D4F1F4] dark:border-[#1A4D5E]">
                                        <span className="text-lg">🏢</span>
                                        <p className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8] mt-1">Company Overview</p>
                                    </div>
                                    <div className="bg-white dark:bg-[#0A1E29] p-3 rounded-lg border border-[#D4F1F4] dark:border-[#1A4D5E]">
                                        <span className="text-lg">💼</span>
                                        <p className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8] mt-1">Culture Insights</p>
                                    </div>
                                    <div className="bg-white dark:bg-[#0A1E29] p-3 rounded-lg border border-[#D4F1F4] dark:border-[#1A4D5E]">
                                        <span className="text-lg">⚔️</span>
                                        <p className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8] mt-1">Competitors</p>
                                    </div>
                                    <div className="bg-white dark:bg-[#0A1E29] p-3 rounded-lg border border-[#D4F1F4] dark:border-[#1A4D5E]">
                                        <span className="text-lg">🎯</span>
                                        <p className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8] mt-1">Interview Tips</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Image */}
            <div className="mt-16 flex justify-center pb-8">
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
        </div>
    );
}

export default function CompanyResearch() {
    const [sidePanelOpen, setSidePanelOpen] = useState(false);

    return (
        <>
            <SidePanel isOpen={sidePanelOpen} onClose={() => setSidePanelOpen(false)} />

            <div className="min-h-screen bg-gradient-to-br from-[#F0F8FA] to-[#E8F4F5] dark:from-[#0A1E29] dark:to-[#071821]">
                {/* Header */}
                <header className="bg-white/80 dark:bg-[#0D2833]/80 backdrop-blur-md shadow-lg border-b border-[#D4F1F4] dark:border-[#1A4D5E] sticky top-0 z-50">
                    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                        <button
                            onClick={() => setSidePanelOpen(true)}
                            className="p-2 hover:bg-[#F0F8FA] dark:hover:bg-[#0A1E29] rounded-lg transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#023047] dark:text-[#E0F4F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-[#2E86AB] to-[#06A77D] bg-clip-text text-transparent">
                            Company Research
                        </Link>

                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                    </div>
                </header>

                <CompanyResearchForm />
            </div>
        </>
    );
}
