import { useState, FormEvent, useRef, useEffect } from 'react';
import { useAuth, SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import 'react-datepicker/dist/react-datepicker.css';
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

function RoadmapGenerationForm() {
    const { getToken } = useAuth();

    // Form state
    const [currentJobTitle, setCurrentJobTitle] = useState('');
    const [targetRole, setTargetRole] = useState('');
    const [prepTimeMonths, setPrepTimeMonths] = useState<number>(3);
    const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [additionalNotes, setAdditionalNotes] = useState('');

    // Streaming state
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);

    // Connection management
    const controllerRef = useRef<AbortController | null>(null);
    const isConnectingRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Handle file drag events
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    // Handle file drop
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type === 'application/pdf') {
                setResumeFile(file);
            } else {
                alert('Please upload a PDF file');
            }
        }
    };

    // Handle file input change
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type === 'application/pdf') {
                setResumeFile(file);
            } else {
                alert('Please upload a PDF file');
            }
        }
    };

    // Remove uploaded file
    const removeFile = () => {
        setResumeFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const connectWithFreshToken = async (formData: {
        current_job_title: string;
        role_applied_for: string;
        time_to_prep_in_months: number;
        resume_pdf?: string;
        resume_filename?: string;
        additional_notes: string;
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

            await fetchEventSource('/api/roadmap_consultation', {
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

    // Convert file to base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                } else {
                    reject(new Error('Failed to read file'));
                }
            };
            reader.onerror = error => reject(error);
        });
    };

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setOutput('');
        setLoading(true);

        // Prepare form data
        const formData: {
            current_job_title: string;
            role_applied_for: string;
            time_to_prep_in_months: number;
            resume_pdf?: string;
            resume_filename?: string;
            additional_notes: string;
            model: string;
        } = {
            current_job_title: currentJobTitle,
            role_applied_for: targetRole,
            time_to_prep_in_months: prepTimeMonths,
            additional_notes: additionalNotes,
            model: selectedModel,
        };

        // Add resume PDF if uploaded
        if (resumeFile) {
            try {
                const base64 = await fileToBase64(resumeFile);
                formData.resume_pdf = base64;
                formData.resume_filename = resumeFile.name;
            } catch (error) {
                console.error('Error reading PDF file:', error);
                setOutput('Error reading PDF file. Please try again.');
                setLoading(false);
                return;
            }
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

    // Download roadmap as markdown file
    const downloadRoadmap = () => {
        const blob = new Blob([output], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `roadmap_${currentJobTitle.replace(/\s+/g, '_')}_to_${targetRole.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="container mx-auto px-4 py-12 max-w-7xl">
            <h1 className="text-4xl font-bold text-[#023047] dark:text-[#E0F4F5] mb-8 text-center">
                Career Transition Roadmap
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Panel - Form */}
                <div className="lg:sticky lg:top-8 h-fit">
                    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-[#0D2833] rounded-xl shadow-lg p-8 border border-[#D4F1F4] dark:border-[#1A4D5E]">
                        <div className="space-y-2">
                            <label htmlFor="current-role" className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                Current Role
                            </label>
                            <input
                                id="current-role"
                                type="text"
                                required
                                value={currentJobTitle}
                                onChange={(e) => setCurrentJobTitle(e.target.value)}
                                className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent dark:bg-[#0A1E29] dark:text-[#E0F4F5] bg-[#F8FCFD]"
                                placeholder="e.g., Junior Software Developer"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="target-role" className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                Target Role
                            </label>
                            <input
                                id="target-role"
                                type="text"
                                required
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent dark:bg-[#0A1E29] dark:text-[#E0F4F5] bg-[#F8FCFD]"
                                placeholder="e.g., Senior Software Engineer"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="prep-time" className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                Preparation Time (Months): {prepTimeMonths}
                            </label>
                            <input
                                id="prep-time"
                                type="range"
                                min="1"
                                max="24"
                                value={prepTimeMonths}
                                onChange={(e) => setPrepTimeMonths(Number(e.target.value))}
                                className="w-full h-2 bg-[#D4F1F4] dark:bg-[#1A4D5E] rounded-lg appearance-none cursor-pointer accent-[#2E86AB]"
                            />
                            <div className="flex justify-between text-xs text-[#5A8A9F] dark:text-[#7FA8B8]">
                                <span>1 month</span>
                                <span>24 months</span>
                            </div>
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
                            <label className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                Upload Current Resume (PDF) - Optional
                            </label>
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
                                    dragActive
                                        ? 'border-[#2E86AB] bg-[#fef3ee] dark:bg-[#023047]'
                                        : 'border-[#D4F1F4] dark:border-[#1A4D5E] bg-[#F8FCFD] dark:bg-[#0A1E29]'
                                }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                {resumeFile ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <svg className="w-8 h-8 text-[#2E86AB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            <div>
                                                <p className="text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                                    {resumeFile.name}
                                                </p>
                                                <p className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8]">
                                                    {(resumeFile.size / 1024).toFixed(2)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeFile}
                                            className="text-[#2E86AB] hover:text-[#1B6B8F] transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <svg className="mx-auto h-12 w-12 text-[#5A8A9F] dark:text-[#7FA8B8]" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <p className="mt-2 text-sm text-[#023047] dark:text-[#E0F4F5]">
                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="mt-1 text-xs text-[#5A8A9F] dark:text-[#7FA8B8]">
                                            PDF files only (optional)
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="notes" className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                Additional Information
                            </label>
                            <textarea
                                id="notes"
                                rows={6}
                                value={additionalNotes}
                                onChange={(e) => setAdditionalNotes(e.target.value)}
                                className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent dark:bg-[#0A1E29] dark:text-[#E0F4F5] bg-[#F8FCFD]"
                                placeholder="Mention any specific skills you want to learn, constraints, preferred learning style, or career goals..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] hover:from-[#1B6B8F] hover:to-[#e8956f] disabled:from-[#e8b59a] disabled:to-[#f0cdb0] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                        >
                            {loading ? 'Generating Roadmap...' : 'Generate Roadmap'}
                        </button>
                    </form>
                </div>

                {/* Right Panel - Output */}
                <div className="lg:min-h-screen">
                    {output ? (
                        <section className="bg-[#F8FCFD] dark:bg-[#0D2833] rounded-xl shadow-lg p-8 h-full border border-[#D4F1F4] dark:border-[#1A4D5E]">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-semibold text-[#023047] dark:text-[#E0F4F5]">
                                    Your Career Roadmap
                                </h2>
                                {!loading && (
                                    <button
                                        onClick={downloadRoadmap}
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
                        <div className="bg-[#F8FCFD] dark:bg-[#0D2833] rounded-xl shadow-lg p-8 h-full flex items-center justify-center border border-[#D4F1F4] dark:border-[#1A4D5E]">
                            <p className="text-[#5A8A9F] dark:text-[#7FA8B8] text-center">
                                Fill out the form and click &quot;Generate Roadmap&quot; to see your personalized career transition plan here
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Image */}
            <div className="mt-16 flex justify-center pb-8">
                <Image
                    src="/sbstack.jpg"
                    alt="SBStack"
                    width={800}
                    height={200}
                    className="rounded-lg shadow-lg"
                />
            </div>
        </div>
    );
}

export default function Roadmap() {
    const [sidePanelOpen, setSidePanelOpen] = useState(false);

    return (
        <main className="min-h-screen bg-gradient-to-br from-[#F0F8FA] to-[#E8F4F5] dark:from-[#0A1E29] dark:to-[#071821]">
            <SidePanel isOpen={sidePanelOpen} onClose={() => setSidePanelOpen(false)} />

            <button
                onClick={() => setSidePanelOpen(true)}
                className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-white dark:bg-[#0D2833] border-2 border-[#2E86AB] dark:border-[#4A9EBF] text-[#023047] dark:text-[#E0F4F5] font-medium py-2 px-4 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Menu</span>
            </button>

            <RoadmapGenerationForm />
        </main>
    );
}
