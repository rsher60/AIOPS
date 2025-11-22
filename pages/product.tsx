import { useState, FormEvent, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { UserButton } from '@clerk/nextjs';

function ResumeGenerationForm() {
    const { getToken } = useAuth();

    // Form state
    const [applicantName, setApplicantName] = useState('');
    const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
    const [applicationDate, setApplicationDate] = useState<Date | null>(new Date());
    const [roleAppliedFor, setRoleAppliedFor] = useState('');
    const [YourPhoneNumber, setYourPhoneNumber] = useState('');
    const [additionalNotes, setAdditionalNotes] = useState('');

    // Streaming state
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);

    // Connection management
    const controllerRef = useRef<AbortController | null>(null);
    const isConnectingRef = useRef(false);

    const connectWithFreshToken = async (formData: {
        applicant_name: string;
        application_date: string;
        role_applied_for: string;
        phone_number: string;
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

            await fetchEventSource('/api/consultation', {
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
        const formData = {
            applicant_name: applicantName,
            application_date: applicationDate?.toISOString().slice(0, 10) || '',
            role_applied_for: roleAppliedFor,
            phone_number: YourPhoneNumber,
            additional_notes: additionalNotes,
            model: selectedModel,
        };

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

    // Download resume as markdown file
    const downloadResume = () => {
        const blob = new Blob([output], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `resume_${applicantName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="container mx-auto px-4 py-12 max-w-7xl">
            <h1 className="text-4xl font-bold text-[#3d2e2e] dark:text-[#f5e6d3] mb-8">
                Resume Application
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Panel - Form */}
                <div className="lg:sticky lg:top-8 h-fit">
                    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-[#342828] rounded-xl shadow-lg p-8 border border-[#e8d5c4] dark:border-[#4a3933]">
                        <div className="space-y-2">
                            <label htmlFor="applicant" className="block text-sm font-medium text-[#3d2e2e] dark:text-[#f5e6d3]">
                                Applicant Name
                            </label>
                            <input
                                id="applicant"
                                type="text"
                                required
                                value={applicantName}
                                onChange={(e) => setApplicantName(e.target.value)}
                                className="w-full px-4 py-2 border border-[#e8d5c4] dark:border-[#4a3933] rounded-lg focus:ring-2 focus:ring-[#d97757] focus:border-transparent dark:bg-[#2a1f1f] dark:text-[#f5e6d3] bg-[#fefdfb]"
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="model" className="block text-sm font-medium text-[#3d2e2e] dark:text-[#f5e6d3]">
                                AI Model
                            </label>
                            <select
                                id="model"
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full px-4 py-2 border border-[#e8d5c4] dark:border-[#4a3933] rounded-lg focus:ring-2 focus:ring-[#d97757] focus:border-transparent dark:bg-[#2a1f1f] dark:text-[#f5e6d3] bg-[#fefdfb]"
                            >
                                <option value="gpt-4o-mini">GPT-4o Mini (OpenAI)</option>
                                <option value="grok-beta">Grok Beta (xAI)</option>
                                <option value="llama-70b">Llama 3.1 70B Instruct (Hugging Face)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="date" className="block text-sm font-medium text-[#3d2e2e] dark:text-[#f5e6d3]">
                                Date of Application
                            </label>
                            <DatePicker
                                id="date"
                                selected={applicationDate}
                                onChange={(d: Date | null) => setApplicationDate(d)}
                                dateFormat="yyyy-MM-dd"
                                placeholderText="Select date"
                                required
                                className="w-full px-4 py-2 border border-[#e8d5c4] dark:border-[#4a3933] rounded-lg focus:ring-2 focus:ring-[#d97757] focus:border-transparent dark:bg-[#2a1f1f] dark:text-[#f5e6d3] bg-[#fefdfb]"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="role" className="block text-sm font-medium text-[#3d2e2e] dark:text-[#f5e6d3]">
                                Role Applied For
                            </label>
                            <input
                                id="role"
                                type="text"
                                required
                                value={roleAppliedFor}
                                onChange={(e) => setRoleAppliedFor(e.target.value)}
                                className="w-full px-4 py-2 border border-[#e8d5c4] dark:border-[#4a3933] rounded-lg focus:ring-2 focus:ring-[#d97757] focus:border-transparent dark:bg-[#2a1f1f] dark:text-[#f5e6d3] bg-[#fefdfb]"
                                placeholder="e.g., Senior Software Engineer"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="phone" className="block text-sm font-medium text-[#3d2e2e] dark:text-[#f5e6d3]">
                                Your Phone Number
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                required
                                value={YourPhoneNumber}
                                onChange={(e) => setYourPhoneNumber(e.target.value)}
                                className="w-full px-4 py-2 border border-[#e8d5c4] dark:border-[#4a3933] rounded-lg focus:ring-2 focus:ring-[#d97757] focus:border-transparent dark:bg-[#2a1f1f] dark:text-[#f5e6d3] bg-[#fefdfb]"
                                placeholder="e.g., +1 (555) 123-4567"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="notes" className="block text-sm font-medium text-[#3d2e2e] dark:text-[#f5e6d3]">
                                Additional Notes from Applicant
                            </label>
                            <textarea
                                id="notes"
                                rows={8}
                                value={additionalNotes}
                                onChange={(e) => setAdditionalNotes(e.target.value)}
                                className="w-full px-4 py-2 border border-[#e8d5c4] dark:border-[#4a3933] rounded-lg focus:ring-2 focus:ring-[#d97757] focus:border-transparent dark:bg-[#2a1f1f] dark:text-[#f5e6d3] bg-[#fefdfb]"
                                placeholder="Any additional information, skills, achievements, or special requirements..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#d97757] to-[#f4a261] hover:from-[#c5643f] hover:to-[#e8956f] disabled:from-[#e8b59a] disabled:to-[#f0cdb0] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                        >
                            {loading ? 'Generating Resume...' : 'Generate Resume'}
                        </button>
                    </form>
                </div>

                {/* Right Panel - Output */}
                <div className="lg:min-h-screen">
                    {output ? (
                        <section className="bg-[#fefdfb] dark:bg-[#342828] rounded-xl shadow-lg p-8 h-full border border-[#e8d5c4] dark:border-[#4a3933]">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-semibold text-[#3d2e2e] dark:text-[#f5e6d3]">
                                    Generated Resume
                                </h2>
                                {!loading && (
                                    <button
                                        onClick={downloadResume}
                                        className="flex items-center gap-2 bg-[#8fbc8f] hover:bg-[#7aa67a] text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
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
                        <div className="bg-[#fefdfb] dark:bg-[#342828] rounded-xl shadow-lg p-8 h-full flex items-center justify-center border border-[#e8d5c4] dark:border-[#4a3933]">
                            <p className="text-[#8b7665] dark:text-[#b8a394] text-center">
                                Fill out the form and click &quot;Generate Resume&quot; to see your results here
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Product() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-[#faf8f5] to-[#f5ede5] dark:from-[#2a1f1f] dark:to-[#1f1616]">
            {/* User Menu in Top Right */}
            <div className="absolute top-4 right-4">
                <UserButton showName={true} />
            </div>

            <ResumeGenerationForm />
        </main>
    );
}