import { useState, useRef } from 'react';
import { useAuth, SignedIn } from '@clerk/nextjs';
import Link from 'next/link';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { UserButton } from '@clerk/nextjs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

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

function MessageRewriterForm() {
    const { getToken } = useAuth();

    // Form state
    const [originalMessage, setOriginalMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [formalityLevel, setFormalityLevel] = useState(3);
    const [recipientType, setRecipientType] = useState('');
    const [additionalContext, setAdditionalContext] = useState('');
    const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');

    // Output state
    const [variation1, setVariation1] = useState('');
    const [variation2, setVariation2] = useState('');
    const [variation3, setVariation3] = useState('');
    const [loading, setLoading] = useState(false);

    // Connection management
    const controllerRef = useRef<AbortController | null>(null);
    const isConnectingRef = useRef(false);

    const messageTypes = [
        { id: 'referral', label: 'Referral Request', icon: '🙏', description: 'Ask for employee referral' },
        { id: 'cold_outreach', label: 'Cold Outreach', icon: '💼', description: 'First contact with recruiter' },
        { id: 'follow_up', label: 'Follow-Up', icon: '✉️', description: 'Check on application status' },
        { id: 'thank_you', label: 'Thank You', icon: '🎉', description: 'Post-interview gratitude' },
        { id: 'networking', label: 'Networking', icon: '🤝', description: 'Build professional connections' },
        { id: 'negotiation', label: 'Negotiation', icon: '💰', description: 'Discuss offer terms' },
        { id: 'offer_acceptance', label: 'Offer Acceptance', icon: '✅', description: 'Accept job offer' },
        { id: 'general', label: 'General Rewrite', icon: '🔄', description: 'Improve any message' },
    ];

    const recipientTypes = [
        { id: 'recruiter', label: 'Recruiter', icon: '👔' },
        { id: 'hiring_manager', label: 'Hiring Manager', icon: '💼' },
        { id: 'employee', label: 'Employee', icon: '👨‍💼' },
        { id: 'peer', label: 'Peer', icon: '🤝' },
    ];

    const formalityLabels = [
        { level: 1, label: 'Casual', emoji: '😊' },
        { level: 2, label: 'Friendly Pro', emoji: '👋' },
        { level: 3, label: 'Professional', emoji: '💼' },
        { level: 4, label: 'Formal', emoji: '🎩' },
        { level: 5, label: 'Very Formal', emoji: '📜' },
    ];

    const connectWithFreshToken = async (formData: {
        original_message: string;
        message_type: string;
        formality_level: number;
        recipient_type: string;
        additional_context: string;
        model: string;
    }) => {
        if (isConnectingRef.current) return;
        isConnectingRef.current = true;

        try {
            if (controllerRef.current) {
                controllerRef.current.abort();
            }
            controllerRef.current = new AbortController();

            const jwt = await getToken();
            if (!jwt) {
                alert('Authentication required');
                setLoading(false);
                isConnectingRef.current = false;
                return;
            }

            let buffer = '';

            await fetchEventSource('/api/rewrite-message', {
                signal: controllerRef.current.signal,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify(formData),
                onmessage(ev) {
                    buffer += ev.data;

                    // Split on delimiter
                    const parts = buffer.split('---VARIATION_SEPARATOR---');

                    if (parts.length >= 1) setVariation1(parts[0].trim());
                    if (parts.length >= 2) setVariation2(parts[1].trim());
                    if (parts.length >= 3) setVariation3(parts[2].trim());
                },
                onerror(err) {
                    console.error('SSE error:', err);
                    isConnectingRef.current = false;

                    if (err instanceof Response && err.status === 403) {
                        setTimeout(() => connectWithFreshToken(formData), 1000);
                        return;
                    }

                    setLoading(false);
                },
                onopen: async (response) => {
                    if (response.ok) {
                        isConnectingRef.current = false;
                    } else if (response.status === 403) {
                        isConnectingRef.current = false;
                        setTimeout(() => connectWithFreshToken(formData), 1000);
                        throw new Error('Token expired, reconnecting');
                    } else {
                        isConnectingRef.current = false;
                        throw new Error(`HTTP error ${response.status}`);
                    }
                },
                onclose() {
                    console.log('SSE connection closed');
                    setLoading(false);
                    isConnectingRef.current = false;
                },
            });
        } catch (error) {
            console.error('Connection error:', error);
            setLoading(false);
            isConnectingRef.current = false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!originalMessage.trim()) {
            alert('Please enter your message');
            return;
        }

        if (!messageType) {
            alert('Please select a message type');
            return;
        }

        if (!recipientType) {
            alert('Please select a recipient type');
            return;
        }

        setLoading(true);
        setVariation1('');
        setVariation2('');
        setVariation3('');

        const formData = {
            original_message: originalMessage,
            message_type: messageType,
            formality_level: formalityLevel,
            recipient_type: recipientType,
            additional_context: additionalContext,
            model: selectedModel,
        };

        await connectWithFreshToken(formData);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const charCount = originalMessage.length;
    const charLimit = 500;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F0F8FA] via-[#E8F4F5] to-[#D4F1F4] dark:from-[#071821] dark:via-[#0A1E29] dark:to-[#0D2833]">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Panel - Form */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-[#0D2833] rounded-2xl shadow-2xl p-8 border border-[#D4F1F4] dark:border-[#1A4D5E]">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Original Message */}
                                <div>
                                    <label className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5] mb-2">
                                        Your Message
                                    </label>
                                    <textarea
                                        value={originalMessage}
                                        onChange={(e) => {
                                            if (e.target.value.length <= charLimit) {
                                                setOriginalMessage(e.target.value);
                                            }
                                        }}
                                        placeholder="Enter your message here..."
                                        className="w-full px-4 py-3 border-2 border-[#D4F1F4] dark:border-[#1A4D5E] rounded-xl bg-white dark:bg-[#071821] text-[#023047] dark:text-[#E0F4F5] focus:outline-none focus:ring-2 focus:ring-[#2E86AB] transition-all resize-none"
                                        rows={6}
                                    />
                                    <div className={`text-sm text-right mt-1 ${charCount > charLimit * 0.9 ? 'text-red-500' : 'text-[#5A8A9F] dark:text-[#7FA8B8]'}`}>
                                        {charCount} / {charLimit}
                                    </div>
                                </div>

                                {/* Message Type Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5] mb-3">
                                        Message Type
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {messageTypes.map((type) => (
                                            <div key={type.id} className="relative group">
                                                <button
                                                    type="button"
                                                    onClick={() => setMessageType(type.id)}
                                                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                                                        messageType === type.id
                                                            ? 'border-[#2E86AB] bg-[#E8F4F5] dark:bg-[#0A1E29] shadow-lg'
                                                            : 'border-[#D4F1F4] dark:border-[#1A4D5E] hover:border-[#2E86AB] hover:shadow-md'
                                                    }`}
                                                >
                                                    <div className="text-sm font-semibold text-[#023047] dark:text-[#E0F4F5]">{type.label}</div>
                                                    <div className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8] mt-1">{type.description}</div>
                                                </button>
                                                {type.id === 'negotiation' && (
                                                    <a
                                                        href="https://www.levels.fyi/?tab=levels"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-1"
                                                    >
                                                        <div className="bg-gradient-to-r from-[#2E86AB] to-[#06A77D] text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg hover:shadow-xl whitespace-nowrap flex items-center gap-1">
                                                            <span>Check levels.fyi</span>
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                        </div>
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Formality Level Slider */}
                                <div>
                                    <label className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5] mb-3">
                                        Formality Level
                                    </label>
                                    <div className="space-y-3">
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            value={formalityLevel}
                                            onChange={(e) => setFormalityLevel(parseInt(e.target.value))}
                                            className="w-full h-2 bg-[#D4F1F4] dark:bg-[#1A4D5E] rounded-lg appearance-none cursor-pointer accent-[#2E86AB]"
                                        />
                                        <div className="flex justify-between items-center">
                                            {formalityLabels.map((item) => (
                                                <div
                                                    key={item.level}
                                                    className={`text-center ${
                                                        formalityLevel === item.level
                                                            ? 'scale-110 font-bold'
                                                            : 'opacity-50'
                                                    } transition-all`}
                                                >
                                                    <div className="text-xs text-[#023047] dark:text-[#E0F4F5]">{item.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Recipient Type */}
                                <div>
                                    <label className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5] mb-3">
                                        Recipient Type
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {recipientTypes.map((type) => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => setRecipientType(type.id)}
                                                className={`p-4 rounded-xl border-2 transition-all ${
                                                    recipientType === type.id
                                                        ? 'border-[#2E86AB] bg-[#E8F4F5] dark:bg-[#0A1E29] shadow-lg'
                                                        : 'border-[#D4F1F4] dark:border-[#1A4D5E] hover:border-[#2E86AB] hover:shadow-md'
                                                }`}
                                            >
                                                <div className="text-sm font-semibold text-[#023047] dark:text-[#E0F4F5]">{type.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Additional Context */}
                                <div>
                                    <label className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5] mb-2">
                                        Additional Context <span className="text-[#5A8A9F]">(Optional)</span>
                                    </label>
                                    <textarea
                                        value={additionalContext}
                                        onChange={(e) => setAdditionalContext(e.target.value)}
                                        placeholder="Include information like the recipient's name, company, or specific points to mention which would help your message stand out."
                                        className="w-full px-4 py-3 border-2 border-[#D4F1F4] dark:border-[#1A4D5E] rounded-xl bg-white dark:bg-[#071821] text-[#023047] dark:text-[#E0F4F5] focus:outline-none focus:ring-2 focus:ring-[#2E86AB] transition-all resize-none"
                                        rows={3}
                                    />
                                </div>

                                {/* Model Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5] mb-2">
                                        AI Model
                                    </label>
                                    <select
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-[#D4F1F4] dark:border-[#1A4D5E] rounded-xl bg-white dark:bg-[#071821] text-[#023047] dark:text-[#E0F4F5] focus:outline-none focus:ring-2 focus:ring-[#2E86AB] transition-all"
                                    >
                                        <option value="gpt-4o-mini">GPT-4o Mini (Fast)</option>
                                        <option value="grok-beta">Grok Beta</option>
                                        <option value="llama-3.1-70b-versatile">Llama 3.1 70B</option>
                                    </select>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] hover:from-[#1B6B8F] hover:to-[#e8956f] disabled:from-[#e8b59a] disabled:to-[#f0cdb0] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                                >
                                    {loading ? 'Generating...' : 'Generate Variations'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Panel - Output */}
                    <div className="space-y-6">
                        {variation1 || variation2 || variation3 ? (
                            <>
                                {/* Variation 1 */}
                                {variation1 && (
                                    <div className="bg-white dark:bg-[#0D2833] rounded-2xl shadow-2xl p-8 border border-[#D4F1F4] dark:border-[#1A4D5E]">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold text-[#023047] dark:text-[#E0F4F5]">Variation 1: Concise</h3>
                                            <button
                                                onClick={() => copyToClipboard(variation1)}
                                                className="px-4 py-2 bg-[#2E86AB] text-white rounded-lg hover:bg-[#06A77D] transition-all"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                        <div className="prose prose-stone dark:prose-invert max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                                {variation1}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}

                                {/* Variation 2 */}
                                {variation2 && (
                                    <div className="bg-white dark:bg-[#0D2833] rounded-2xl shadow-2xl p-8 border border-[#D4F1F4] dark:border-[#1A4D5E]">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold text-[#023047] dark:text-[#E0F4F5]">Variation 2: Balanced</h3>
                                            <button
                                                onClick={() => copyToClipboard(variation2)}
                                                className="px-4 py-2 bg-[#2E86AB] text-white rounded-lg hover:bg-[#06A77D] transition-all"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                        <div className="prose prose-stone dark:prose-invert max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                                {variation2}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}

                                {/* Variation 3 */}
                                {variation3 && (
                                    <div className="bg-white dark:bg-[#0D2833] rounded-2xl shadow-2xl p-8 border border-[#D4F1F4] dark:border-[#1A4D5E]">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold text-[#023047] dark:text-[#E0F4F5]">Variation 3: Personable</h3>
                                            <button
                                                onClick={() => copyToClipboard(variation3)}
                                                className="px-4 py-2 bg-[#2E86AB] text-white rounded-lg hover:bg-[#06A77D] transition-all"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                        <div className="prose prose-stone dark:prose-invert max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                                {variation3}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="bg-white dark:bg-[#0D2833] rounded-2xl shadow-2xl p-12 border border-[#D4F1F4] dark:border-[#1A4D5E] min-h-96 flex items-center justify-center">
                                <div className="text-center">
                                    <h3 className="text-2xl font-bold text-[#023047] dark:text-[#E0F4F5] mb-2">
                                        Ready to Polish Your Message
                                    </h3>
                                    <p className="text-[#5A8A9F] dark:text-[#7FA8B8]">
                                        Fill out the form to generate 3 professional variations
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MessageRewriter() {
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

    return (
        <>
            <SidePanel isOpen={isSidePanelOpen} onClose={() => setIsSidePanelOpen(false)} />

            <div className="min-h-screen bg-gradient-to-br from-[#F0F8FA] via-[#E8F4F5] to-[#D4F1F4] dark:from-[#071821] dark:via-[#0A1E29] dark:to-[#0D2833]">
                {/* Header */}
                <header className="bg-white/80 dark:bg-[#0D2833]/80 backdrop-blur-md shadow-lg border-b border-[#D4F1F4] dark:border-[#1A4D5E] sticky top-0 z-50">
                    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                        <button
                            onClick={() => setIsSidePanelOpen(true)}
                            className="p-2 hover:bg-[#F0F8FA] dark:hover:bg-[#0A1E29] rounded-lg transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#023047] dark:text-[#E0F4F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-[#2E86AB] to-[#06A77D] bg-clip-text text-transparent">
                            Message Rewriter
                        </Link>

                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                    </div>
                </header>

                <MessageRewriterForm />
            </div>
        </>
    );
}
