import { useState, FormEvent, useRef, useEffect } from 'react';
import { useAuth, SignedIn } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { UserButton } from '@clerk/nextjs';

// ─── Resume/AI-enhancements buffer parsing ────────────────────────────────────

function stripCodeFences(text: string): string {
    return text
        .replace(/^```[a-zA-Z]*\n?/, '')   // opening fence
        .replace(/\n?```\s*$/, '');          // closing fence
}

// Remove any stray marker keywords that should never appear in the resume body
function stripMarkerKeywords(text: string): string {
    return text
        .replace(/---AI_ENHANCEMENTS_START---/g, '')
        // covers _AI_ENHANCEMENT_SUMMARY__, __AI_ENHANCEMENTS_SUMMARY__, 4. _AI_ENHANCEMENT_SUMMARY__, etc.
        .replace(/(?:\d+\.\s*)?_+AI_ENHANCEMENTS?_SUMMARY_+/gi, '')
        .trim();
}

// Regex covering all known delimiter variants
const DELIMITER_REGEX = /---AI_ENHANCEMENTS_START---|(?:\d+\.\s*)?_+AI_ENHANCEMENTS?_SUMMARY_+/i;

function parseResumeBuffer(buffer: string): { resume: string; changes: string; found: boolean } {
    const match = DELIMITER_REGEX.exec(buffer);
    if (match && match.index !== undefined) {
        return {
            resume: stripMarkerKeywords(stripCodeFences(buffer.substring(0, match.index).trim())),
            changes: stripCodeFences(buffer.substring(match.index + match[0].length).trim()),
            found: true,
        };
    }
    return {
        resume: stripMarkerKeywords(stripCodeFences(buffer)),
        changes: '',
        found: false,
    };
}

// ─── ATS scoring types ────────────────────────────────────────────────────────

// ATS scoring types
type ATSCategory = { score: number; max: number; label: string; feedback: string };
type ATSRedFlag = { type: string; severity: 'high' | 'medium' | 'low'; message: string };
type ATSScoreResult = {
    overall_score: number;
    score_label: string;
    has_job_description: boolean;
    categories: Record<string, ATSCategory>;
    red_flags: ATSRedFlag[];
    top_improvements: string[];
    scoring_note: string | null;
};

type WorkflowStep = 'form' | 'scoring' | 'scored' | 'generating' | 'complete';

function scoreColor(score: number, max: number): string {
    if (max === 0) return 'bg-gray-300 dark:bg-gray-600';
    const pct = score / max;
    if (pct >= 0.9) return 'bg-blue-500';
    if (pct >= 0.75) return 'bg-emerald-500';
    if (pct >= 0.6) return 'bg-yellow-400';
    return 'bg-red-400';
}

function overallColor(score: number): string {
    if (score >= 90) return 'text-blue-600 dark:text-blue-400';
    if (score >= 75) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
}

function severityBadge(severity: 'high' | 'medium' | 'low'): string {
    if (severity === 'high') return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
    if (severity === 'medium') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
}

function ATSScoreCard({ result, title }: { result: ATSScoreResult; title: string }) {
    const [expanded, setExpanded] = useState(false);
    const categoryOrder = ['keyword_matching', 'work_experience', 'formatting', 'skills', 'contact_info', 'education', 'length_consistency'];

    return (
        <div className="bg-white dark:bg-[#0D2833] rounded-xl shadow-lg border border-[#D4F1F4] dark:border-[#1A4D5E] overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#F8FCFD] dark:hover:bg-[#0A1E29] transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className={`text-4xl font-bold ${overallColor(result.overall_score)}`}>
                        {result.overall_score}
                        <span className="text-lg font-normal text-[#5A8A9F] dark:text-[#7FA8B8]">/100</span>
                    </div>
                    <div className="text-left">
                        <div className="font-semibold text-[#023047] dark:text-[#E0F4F5]">{title}</div>
                        <div className={`text-sm font-medium ${overallColor(result.overall_score)}`}>{result.score_label}</div>
                    </div>
                </div>
                <svg className={`w-5 h-5 text-[#2E86AB] transform transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {expanded && (
                <div className="px-6 pb-6 border-t border-[#D4F1F4] dark:border-[#1A4D5E] space-y-5 pt-4">
                    {result.scoring_note && (
                        <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                            {result.scoring_note}
                        </div>
                    )}

                    {/* Category breakdown */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-[#023047] dark:text-[#E0F4F5]">Category Breakdown</h4>
                        {categoryOrder.map((key) => {
                            const cat = result.categories[key];
                            if (!cat) return null;
                            const isNA = cat.max === 0;
                            return (
                                <div key={key}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-[#023047] dark:text-[#E0F4F5] font-medium">{cat.label}</span>
                                        <span className="text-[#5A8A9F] dark:text-[#7FA8B8]">
                                            {isNA ? 'N/A' : `${cat.score}/${cat.max}`}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        {!isNA && (
                                            <div
                                                className={`h-2 rounded-full ${scoreColor(cat.score, cat.max)}`}
                                                style={{ width: `${(cat.score / cat.max) * 100}%` }}
                                            />
                                        )}
                                    </div>
                                    <p className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8] mt-1">{cat.feedback}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Red flags */}
                    {result.red_flags.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-[#023047] dark:text-[#E0F4F5]">Red Flags ({result.red_flags.length})</h4>
                            {result.red_flags.map((flag, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs">
                                    <span className={`px-2 py-0.5 rounded font-semibold uppercase tracking-wide shrink-0 ${severityBadge(flag.severity)}`}>
                                        {flag.severity}
                                    </span>
                                    <span className="text-[#5A8A9F] dark:text-[#7FA8B8]">{flag.message}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Top improvements */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-[#023047] dark:text-[#E0F4F5]">Top Improvements</h4>
                        <ol className="space-y-1 list-decimal list-inside">
                            {result.top_improvements.map((item, i) => (
                                <li key={i} className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8]">{item}</li>
                            ))}
                        </ol>
                    </div>
                </div>
            )}
        </div>
    );
}

function ATSScoreSummaryCompact({ original, generated, isLoading }: { original: ATSScoreResult; generated: ATSScoreResult | null; isLoading: boolean }) {
    const [expanded, setExpanded] = useState(false);

    if (!generated) {
        return (
            <div className="bg-white dark:bg-[#0D2833] rounded-xl border border-[#D4F1F4] dark:border-[#1A4D5E] px-4 py-3 flex items-center gap-3 flex-wrap">
                <span className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8]">ATS Score:</span>
                <span className={`font-bold text-sm ${overallColor(original.overall_score)}`}>{original.overall_score}</span>
                <span className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8]">({original.score_label})</span>
                <span className="text-[#5A8A9F]">→</span>
                {isLoading && <span className="text-xs text-[#2E86AB] animate-pulse">Re-scoring optimized resume...</span>}
            </div>
        );
    }

    const delta = generated.overall_score - original.overall_score;
    const deltaColor = delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
    const stripBg = delta >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';

    return (
        <div className={`rounded-xl border overflow-hidden ${stripBg}`}>
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8]">ATS Score:</span>
                    <span className={`font-semibold ${overallColor(original.overall_score)}`}>{original.overall_score}</span>
                    <span className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8]">({original.score_label})</span>
                    <span className="text-[#5A8A9F] dark:text-[#7FA8B8]">→</span>
                    <span className={`font-bold ${overallColor(generated.overall_score)}`}>{generated.overall_score}</span>
                    <span className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8]">({generated.score_label})</span>
                    <span className={`font-bold ${deltaColor}`}>{delta >= 0 ? '+' : ''}{delta} pts</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8]">{expanded ? 'Hide' : 'Details'}</span>
                    <svg className={`w-4 h-4 text-[#5A8A9F] dark:text-[#7FA8B8] transform transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>
            {expanded && (
                <div className="border-t border-current/10 p-4 space-y-3 bg-white/50 dark:bg-black/20">
                    <ATSScoreCard result={original} title="Original Resume Score" />
                    <ATSScoreCard result={generated} title="Optimized Resume Score" />
                </div>
            )}
        </div>
    );
}

// Side Panel Component
function SidePanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onClose} />}
            <div className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-[#0D2833] shadow-2xl z-[101] transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-6 border-b border-[#D4F1F4] dark:border-[#1A4D5E]">
                        <Link href="/" onClick={onClose} className="text-2xl font-bold text-[#023047] dark:text-[#E0F4F5] hover:text-[#2E86AB] dark:hover:text-[#4A9EBF] transition-colors">Back to Home</Link>
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
                        <Link href="/CompanyResearch" className="flex items-center gap-4 p-4 mb-2 rounded-lg hover:bg-[#F0F8FA] dark:hover:bg-[#0A1E29] transition-all group" onClick={onClose}>
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
                    </nav>
                </div>
            </div>
        </>
    );
}

function ResumeGenerationForm() {
    const { getToken } = useAuth();

    // Form state
    const [applicantName, setApplicantName] = useState('');
    const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
    const [applicationDate, setApplicationDate] = useState<Date | null>(new Date());
    const [roleAppliedFor, setRoleAppliedFor] = useState('');
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [linkedinFile, setLinkedinFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [linkedinDragActive, setLinkedinDragActive] = useState(false);
    const [jobDescription, setJobDescription] = useState('');
    const [additionalNotes, setAdditionalNotes] = useState('');

    // Streaming state
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);
    const [resumeContent, setResumeContent] = useState('');
    const [aiChanges, setAiChanges] = useState('');
    const [showAiChanges, setShowAiChanges] = useState(false);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    // ATS scoring state
    const [atsScoreOriginal, setAtsScoreOriginal] = useState<ATSScoreResult | null>(null);
    const [atsScoreGenerated, setAtsScoreGenerated] = useState<ATSScoreResult | null>(null);
    const [atsLoading, setAtsLoading] = useState(false);
    const [atsError, setAtsError] = useState<string | null>(null);
    const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('form');

    // Connection management
    const controllerRef = useRef<AbortController | null>(null);
    const isConnectingRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const linkedinFileInputRef = useRef<HTMLInputElement | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formDataRef = useRef<any>(null);
    // Tracks the latest SSE buffer so onclose can do a final parse
    const bufferRef = useRef('');

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

    const isValidResumeFile = (file: File) => {
        const validTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        const ext = file.name.split('.').pop()?.toLowerCase();
        return validTypes.includes(file.type) || ext === 'doc' || ext === 'docx' || ext === 'pdf';
    };

    // Handle file drop
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (isValidResumeFile(file)) {
                setResumeFile(file);
            } else {
                alert('Please upload a PDF, DOC, or DOCX file');
            }
        }
    };

    // Handle file input change
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (isValidResumeFile(file)) {
                setResumeFile(file);
            } else {
                alert('Please upload a PDF, DOC, or DOCX file');
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

    // Handle LinkedIn file drag events
    const handleLinkedinDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setLinkedinDragActive(true);
        } else if (e.type === 'dragleave') {
            setLinkedinDragActive(false);
        }
    };

    // Handle LinkedIn file drop
    const handleLinkedinDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setLinkedinDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (isValidResumeFile(file)) {
                setLinkedinFile(file);
            } else {
                alert('Please upload a PDF, DOC, or DOCX file');
            }
        }
    };

    // Handle LinkedIn file input change
    const handleLinkedinFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (isValidResumeFile(file)) {
                setLinkedinFile(file);
            } else {
                alert('Please upload a PDF, DOC, or DOCX file');
            }
        }
    };

    // Remove uploaded LinkedIn file
    const removeLinkedinFile = () => {
        setLinkedinFile(null);
        if (linkedinFileInputRef.current) {
            linkedinFileInputRef.current.value = '';
        }
    };

    const connectWithFreshToken = async (formData: {
        applicant_name: string;
        application_date: string;
        role_applied_for: string;
        resume_pdf?: string;
        resume_filename?: string;
        linkedin_profile_pdf?: string;
        linkedin_profile_filename?: string;
        job_description?: string;
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
            bufferRef.current = '';

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
                    bufferRef.current = buffer;

                    const parsed = parseResumeBuffer(buffer);
                    setResumeContent(parsed.resume);
                    if (parsed.found) {
                        setAiChanges(parsed.changes);
                        setShowAiChanges(true);
                    }
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
                    // Final parse: guarantees the split is applied even if the delimiter
                    // arrived in the very last SSE chunk (onmessage may have run before the
                    // buffer was fully flushed on some model responses).
                    const parsed = parseResumeBuffer(bufferRef.current);
                    setResumeContent(parsed.resume);
                    if (parsed.found) {
                        setAiChanges(parsed.changes);
                        setShowAiChanges(true);
                    }
                    setWorkflowStep('complete');
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

    const callAtsScore = async (payload: object): Promise<ATSScoreResult> => {
        const jwt = await getToken();
        if (!jwt) throw new Error('Authentication required');
        const res = await fetch('/api/ats-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({})) as { detail?: string };
            throw new Error(err.detail || `ATS score failed: ${res.status}`);
        }
        return res.json();
    };

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        // Reset all state for a fresh run
        setOutput('');
        setResumeContent('');
        setAiChanges('');
        setShowAiChanges(false);
        setAtsScoreOriginal(null);
        setAtsScoreGenerated(null);
        setAtsError(null);
        setWorkflowStep('form');

        if (!resumeFile) {
            alert('Please upload your resume PDF to enable ATS scoring.');
            return;
        }

        // Prepare form data (read files once and cache in ref)
        const formData: {
            applicant_name: string;
            application_date: string;
            role_applied_for: string;
            resume_pdf?: string;
            resume_filename?: string;
            linkedin_profile_pdf?: string;
            linkedin_profile_filename?: string;
            job_description?: string;
            additional_notes: string;
            model: string;
        } = {
            applicant_name: applicantName,
            application_date: applicationDate?.toISOString().slice(0, 10) || '',
            role_applied_for: roleAppliedFor,
            job_description: jobDescription || undefined,
            additional_notes: additionalNotes,
            model: selectedModel,
        };

        // Add resume PDF
        try {
            const base64 = await fileToBase64(resumeFile);
            formData.resume_pdf = base64;
            formData.resume_filename = resumeFile.name;
        } catch (error) {
            console.error('Error reading PDF file:', error);
            alert('Error reading PDF file. Please try again.');
            return;
        }

        // Add LinkedIn PDF if uploaded
        if (linkedinFile) {
            try {
                const base64 = await fileToBase64(linkedinFile);
                formData.linkedin_profile_pdf = base64;
                formData.linkedin_profile_filename = linkedinFile.name;
            } catch (error) {
                console.error('Error reading LinkedIn PDF file:', error);
                alert('Error reading LinkedIn PDF file. Please try again.');
                return;
            }
        }

        // Cache formData for Phase B (generate button)
        formDataRef.current = formData;

        // Phase A: Score the original resume
        setWorkflowStep('scoring');
        setAtsLoading(true);
        try {
            const result = await callAtsScore({
                resume_pdf: formData.resume_pdf,
                resume_filename: formData.resume_filename,
                linkedin_profile_pdf: formData.linkedin_profile_pdf,
                linkedin_filename: formData.linkedin_profile_filename,
                job_description: formData.job_description,
                role_applied_for: formData.role_applied_for,
            });
            setAtsScoreOriginal(result);
        } catch (err) {
            console.error('ATS scoring failed:', err);
            setAtsError('ATS scoring unavailable — you can still generate your resume.');
        } finally {
            setAtsLoading(false);
            setWorkflowStep('scored');
        }
    }

    async function handleGenerate() {
        if (!formDataRef.current) return;
        setWorkflowStep('generating');
        setLoading(true);
        await connectWithFreshToken(formDataRef.current);
    }

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            if (controllerRef.current) {
                controllerRef.current.abort();
            }
        };
    }, []);

    // Phase C: Re-score generated resume after SSE completes
    useEffect(() => {
        if (workflowStep === 'complete' && resumeContent && !atsScoreGenerated) {
            setAtsLoading(true);
            callAtsScore({
                resume_text: resumeContent,
                job_description: jobDescription || undefined,
                role_applied_for: roleAppliedFor || undefined,
            })
                .then(setAtsScoreGenerated)
                .catch((err: Error) => setAtsError(`Re-scoring failed: ${err.message}`))
                .finally(() => setAtsLoading(false));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workflowStep, resumeContent]);

    // Download resume as docx file
    const downloadResume = async () => {
        try {
            const filename = `resume_${applicantName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;

            // Dynamically import docx and file-saver for client-side generation
            const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
            const fileSaver = await import('file-saver');
            const saveAs = fileSaver.default || fileSaver.saveAs;

            // Parse markdown and create document sections
            const sections: InstanceType<typeof Paragraph>[] = [];
            const lines = resumeContent.split('\n');

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

    // Compact summary shown when past the initial form step
    const isPostForm = workflowStep === 'scored' || workflowStep === 'generating' || workflowStep === 'complete';

    return (
        <div className="container mx-auto px-4 py-12 max-w-7xl">
            <div className={`grid grid-cols-1 gap-6 transition-all duration-500 ${workflowStep !== 'form' ? 'lg:grid-cols-[380px_1fr]' : 'lg:grid-cols-2'}`}>
                {/* Left Panel - Form */}
                <div className="lg:sticky lg:top-8 h-fit">
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0D2833] rounded-xl shadow-lg border border-[#D4F1F4] dark:border-[#1A4D5E] overflow-hidden">

                        {/* Form header */}
                        <div className="px-6 py-5 border-b border-[#D4F1F4] dark:border-[#1A4D5E] bg-gradient-to-r from-[#2E86AB]/10 to-[#4A9EBF]/5 dark:from-[#2E86AB]/20 dark:to-transparent">
                            <h2 className="text-lg font-semibold text-[#023047] dark:text-[#E0F4F5]">Resume Generator</h2>
                            <p className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8] mt-0.5">Optimize your resume with AI</p>
                        </div>

                        <div className="p-6 space-y-5">

                            {/* Compact summary pill shown post-scoring */}
                            {isPostForm && (roleAppliedFor || applicantName) && (
                                <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-[#F0F8FA] dark:bg-[#0A1E29] rounded-lg border border-[#D4F1F4] dark:border-[#1A4D5E] text-xs text-[#5A8A9F] dark:text-[#7FA8B8]">
                                    {roleAppliedFor && (
                                        <span className="font-medium text-[#023047] dark:text-[#E0F4F5]">{roleAppliedFor}</span>
                                    )}
                                    {roleAppliedFor && applicantName && <span className="opacity-40">·</span>}
                                    {applicantName && <span>{applicantName}</span>}
                                    {resumeFile && <span className="opacity-40">·</span>}
                                    {resumeFile && <span className="truncate max-w-[120px]">{resumeFile.name}</span>}
                                </div>
                            )}

                            {/* Primary fields — always visible */}
                            <div className="space-y-2">
                                <label htmlFor="role" className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                    Role Applied For *
                                </label>
                                <input
                                    id="role"
                                    type="text"
                                    required
                                    value={roleAppliedFor}
                                    onChange={(e) => setRoleAppliedFor(e.target.value)}
                                    className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent dark:bg-[#0A1E29] dark:text-[#E0F4F5] bg-[#F8FCFD] text-sm"
                                    placeholder="e.g., Senior Software Engineer"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="applicant" className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                    Applicant Name *
                                </label>
                                <input
                                    id="applicant"
                                    type="text"
                                    required
                                    value={applicantName}
                                    onChange={(e) => setApplicantName(e.target.value)}
                                    className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent dark:bg-[#0A1E29] dark:text-[#E0F4F5] bg-[#F8FCFD] text-sm"
                                    placeholder="Enter your full name"
                                />
                            </div>

                            {/* Documents — compact side-by-side upload zones */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                    Documents
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Resume upload */}
                                    <div
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        className={`relative border-2 border-dashed rounded-lg p-3 transition-all cursor-pointer ${
                                            dragActive
                                                ? 'border-[#2E86AB] bg-[#EDF7F9] dark:bg-[#023047]'
                                                : 'border-[#D4F1F4] dark:border-[#1A4D5E] bg-[#F8FCFD] dark:bg-[#0A1E29]'
                                        }`}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        {resumeFile ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <svg className="w-8 h-8 text-[#2E86AB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-xs font-medium text-[#023047] dark:text-[#E0F4F5] truncate w-full text-center">{resumeFile.name}</p>
                                                <button
                                                    type="button"
                                                    onClick={removeFile}
                                                    className="text-[#2E86AB] hover:text-[#1B6B8F] transition-colors text-xs underline"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <svg className="mx-auto h-8 w-8 text-[#5A8A9F] dark:text-[#7FA8B8]" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <p className="mt-1 text-xs font-semibold text-[#023047] dark:text-[#E0F4F5]">Resume *</p>
                                                <p className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8]">PDF, DOC, DOCX</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* LinkedIn upload */}
                                    <div
                                        onDragEnter={handleLinkedinDrag}
                                        onDragLeave={handleLinkedinDrag}
                                        onDragOver={handleLinkedinDrag}
                                        onDrop={handleLinkedinDrop}
                                        className={`relative border-2 border-dashed rounded-lg p-3 transition-all cursor-pointer ${
                                            linkedinDragActive
                                                ? 'border-[#0077B5] bg-[#E8F4F9] dark:bg-[#023047]'
                                                : 'border-[#D4F1F4] dark:border-[#1A4D5E] bg-[#F8FCFD] dark:bg-[#0A1E29]'
                                        }`}
                                    >
                                        <input
                                            ref={linkedinFileInputRef}
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={handleLinkedinFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        {linkedinFile ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <svg className="w-8 h-8 text-[#0077B5]" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                                </svg>
                                                <p className="text-xs font-medium text-[#023047] dark:text-[#E0F4F5] truncate w-full text-center">{linkedinFile.name}</p>
                                                <button
                                                    type="button"
                                                    onClick={removeLinkedinFile}
                                                    className="text-[#0077B5] hover:text-[#005582] transition-colors text-xs underline"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <svg className="mx-auto h-8 w-8 text-[#0077B5]" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                                </svg>
                                                <p className="mt-1 text-xs font-semibold text-[#023047] dark:text-[#E0F4F5]">LinkedIn PDF</p>
                                                <p className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8]">Optional</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Advanced Options collapsible */}
                            <div className="rounded-lg border border-[#D4F1F4] dark:border-[#1A4D5E] overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                                    className="w-full px-4 py-3 flex items-center justify-between bg-[#F8FCFD] dark:bg-[#0A1E29] hover:bg-[#EDF7F9] dark:hover:bg-[#0D2833] transition-colors"
                                >
                                    <span className="text-sm font-medium text-[#5A8A9F] dark:text-[#7FA8B8]">Advanced Options</span>
                                    <svg
                                        className={`w-4 h-4 text-[#5A8A9F] dark:text-[#7FA8B8] transform transition-transform duration-200 ${showAdvancedOptions ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {showAdvancedOptions && (
                                    <div className="px-4 py-4 space-y-4 border-t border-[#D4F1F4] dark:border-[#1A4D5E]">
                                        {/* AI Model + Date in a 2-col grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label htmlFor="model" className="block text-xs font-medium text-[#023047] dark:text-[#E0F4F5]">
                                                    AI Model
                                                </label>
                                                <select
                                                    id="model"
                                                    value={selectedModel}
                                                    onChange={(e) => setSelectedModel(e.target.value)}
                                                    className="w-full px-3 py-1.5 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent dark:bg-[#0A1E29] dark:text-[#E0F4F5] bg-[#F8FCFD] text-xs"
                                                >
                                                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                                                    <option value="grok-beta">Grok Beta</option>
                                                    <option value="llama-70b">Llama 3.1 70B</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label htmlFor="date" className="block text-xs font-medium text-[#023047] dark:text-[#E0F4F5]">
                                                    Application Date
                                                </label>
                                                <DatePicker
                                                    id="date"
                                                    selected={applicationDate}
                                                    onChange={(d: Date | null) => setApplicationDate(d)}
                                                    dateFormat="yyyy-MM-dd"
                                                    placeholderText="Select date"
                                                    required
                                                    className="w-full px-3 py-1.5 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent dark:bg-[#0A1E29] dark:text-[#E0F4F5] bg-[#F8FCFD] text-xs"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label htmlFor="jobDescription" className="block text-xs font-medium text-[#023047] dark:text-[#E0F4F5]">
                                                Job Description <span className="text-[#5A8A9F] dark:text-[#7FA8B8] font-normal">(Optional)</span>
                                            </label>
                                            <p className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8]">
                                                Paste the job posting to tailor your resume
                                            </p>
                                            <textarea
                                                id="jobDescription"
                                                rows={4}
                                                value={jobDescription}
                                                onChange={(e) => setJobDescription(e.target.value)}
                                                className="w-full px-3 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent dark:bg-[#0A1E29] dark:text-[#E0F4F5] bg-[#F8FCFD] text-xs"
                                                placeholder="Paste the full job description here..."
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label htmlFor="notes" className="block text-xs font-medium text-[#023047] dark:text-[#E0F4F5]">
                                                Additional Notes
                                            </label>
                                            <textarea
                                                id="notes"
                                                rows={4}
                                                value={additionalNotes}
                                                onChange={(e) => setAdditionalNotes(e.target.value)}
                                                className="w-full px-3 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent dark:bg-[#0A1E29] dark:text-[#E0F4F5] bg-[#F8FCFD] text-xs"
                                                placeholder="Any additional skills, achievements, or requirements..."
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* CTA Buttons */}
                            {workflowStep === 'form' && (
                                <button
                                    type="submit"
                                    disabled={atsLoading}
                                    className="w-full bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] hover:from-[#1B6B8F] hover:to-[#e8956f] disabled:from-[#e8b59a] disabled:to-[#f0cdb0] disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                                >
                                    Analyze &amp; Score My Resume
                                </button>
                            )}

                            {workflowStep === 'scoring' && (
                                <div className="w-full py-3 px-6 rounded-lg bg-[#F0F8FA] dark:bg-[#0A1E29] border border-[#D4F1F4] dark:border-[#1A4D5E] text-center text-[#2E86AB] font-medium text-sm animate-pulse">
                                    Analyzing your resume...
                                </div>
                            )}

                            {workflowStep === 'scored' && (
                                <button
                                    type="submit"
                                    className="w-full border border-[#2E86AB] text-[#2E86AB] dark:text-[#4A9EBF] font-medium py-2 px-6 rounded-lg hover:bg-[#F0F8FA] dark:hover:bg-[#0A1E29] transition-colors text-sm"
                                >
                                    Re-analyze with different inputs
                                </button>
                            )}

                            {(workflowStep === 'generating' || workflowStep === 'complete') && (
                                <div className="w-full py-3 px-6 rounded-lg bg-[#F0F8FA] dark:bg-[#0A1E29] border border-[#D4F1F4] dark:border-[#1A4D5E] text-center text-[#2E86AB] font-medium text-sm">
                                    {loading ? 'Generating optimized resume...' : atsLoading ? 'Re-scoring optimized resume...' : 'Done!'}
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                {/* Right Panel - Output */}
                <div className="space-y-4">

                    {/* ATS error banner */}
                    {atsError && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-300 flex justify-between items-center">
                            <span>{atsError}</span>
                            <button onClick={() => setAtsError(null)} className="ml-4 text-amber-500 hover:text-amber-700">✕</button>
                        </div>
                    )}

                    {/* ── FORM state: placeholder ── */}
                    {workflowStep === 'form' && (
                        <div className="bg-[#F8FCFD] dark:bg-[#0D2833] rounded-xl shadow-lg p-8 min-h-96 flex flex-col items-center justify-center border border-[#D4F1F4] dark:border-[#1A4D5E] gap-3">
                            <svg className="w-12 h-12 text-[#D4F1F4] dark:text-[#1A4D5E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-[#5A8A9F] dark:text-[#7FA8B8] text-center text-sm">
                                Upload your resume and click &quot;Analyze &amp; Score My Resume&quot; to get started
                            </p>
                        </div>
                    )}

                    {/* ── SCORING state: spinner ── */}
                    {workflowStep === 'scoring' && (
                        <div className="bg-[#F8FCFD] dark:bg-[#0D2833] rounded-xl shadow-lg p-12 flex flex-col items-center justify-center gap-4 border border-[#D4F1F4] dark:border-[#1A4D5E]">
                            <div className="w-12 h-12 border-4 border-[#D4F1F4] dark:border-[#1A4D5E] border-t-[#2E86AB] rounded-full animate-spin" />
                            <p className="text-[#2E86AB] font-medium">Analyzing your resume for ATS compatibility...</p>
                            <p className="text-sm text-[#5A8A9F] dark:text-[#7FA8B8]">This usually takes 10–20 seconds</p>
                        </div>
                    )}

                    {/* ── SCORED state: score card + generate button ── */}
                    {workflowStep === 'scored' && atsScoreOriginal && (
                        <>
                            <ATSScoreCard result={atsScoreOriginal} title="Original Resume Score" />
                            <div className="bg-white dark:bg-[#0D2833] rounded-xl shadow-lg border border-[#D4F1F4] dark:border-[#1A4D5E] px-6 py-5">
                                <p className="text-sm font-semibold text-[#023047] dark:text-[#E0F4F5] mb-1">Score ready — let&apos;s optimize!</p>
                                <p className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8] mb-4">Generate an AI-enhanced version of your resume tailored to the role.</p>
                                <button
                                    type="button"
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-[#52B788] to-[#06A77D] hover:from-[#40916C] hover:to-[#05835E] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                                >
                                    Generate Optimized Resume
                                </button>
                            </div>
                        </>
                    )}

                    {/* ── GENERATING state: original score (collapsed) + spinner + streaming output ── */}
                    {workflowStep === 'generating' && (
                        <>
                            {atsScoreOriginal && (
                                <ATSScoreCard result={atsScoreOriginal} title="Original Resume Score" />
                            )}
                            {!output && (
                                <div className="bg-[#F8FCFD] dark:bg-[#0D2833] rounded-xl border border-[#D4F1F4] dark:border-[#1A4D5E] px-6 py-10 flex flex-col items-center gap-4">
                                    <div className="flex gap-2">
                                        <span className="w-2.5 h-2.5 bg-[#2E86AB] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2.5 h-2.5 bg-[#2E86AB] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2.5 h-2.5 bg-[#2E86AB] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <p className="text-sm font-medium text-[#2E86AB]">Generating your optimized resume...</p>
                                    <p className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8]">This may take up to a minute</p>
                                </div>
                            )}
                            {output && (
                                <section className="bg-[#F8FCFD] dark:bg-[#0D2833] rounded-xl shadow-lg p-8 border border-[#D4F1F4] dark:border-[#1A4D5E]">
                                    <h2 className="text-2xl font-semibold text-[#023047] dark:text-[#E0F4F5] mb-6">Generated Resume</h2>
                                    <div className="markdown-content prose prose-stone dark:prose-invert max-w-none break-words overflow-x-auto">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm, remarkBreaks]}
                                            components={{
                                                pre: ({ ...props }) => <pre className="overflow-x-auto whitespace-pre-wrap break-words" {...props} />,
                                                code: ({ className, children, ...props }) => {
                                                    const isInline = !className;
                                                    return isInline ? (
                                                        <code className="break-words" {...props}>{children}</code>
                                                    ) : (
                                                        <code className={`block overflow-x-auto whitespace-pre-wrap break-words ${className}`} {...props}>{children}</code>
                                                    );
                                                },
                                                p: ({ ...props }) => <p className="break-words overflow-wrap-anywhere" {...props} />,
                                                a: ({ ...props }) => <a className="break-all" {...props} />,
                                            }}
                                        >
                                            {resumeContent}
                                        </ReactMarkdown>
                                    </div>
                                </section>
                            )}
                        </>
                    )}

                    {/* ── COMPLETE state: compact score strip + resume + AI changes ── */}
                    {workflowStep === 'complete' && (
                        <>
                            {/* Single compact score comparison bar — collapsed by default */}
                            {atsScoreOriginal && (
                                <ATSScoreSummaryCompact
                                    original={atsScoreOriginal}
                                    generated={atsScoreGenerated}
                                    isLoading={atsLoading}
                                />
                            )}

                            {/* Resume — front and center */}
                            {output && (
                                <section className="bg-[#F8FCFD] dark:bg-[#0D2833] rounded-xl shadow-lg p-8 border border-[#D4F1F4] dark:border-[#1A4D5E]">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-2xl font-semibold text-[#023047] dark:text-[#E0F4F5]">Generated Resume</h2>
                                        <button
                                            onClick={downloadResume}
                                            className="flex items-center gap-2 bg-[#52B788] hover:bg-[#40916C] text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Download
                                        </button>
                                    </div>
                                    <div className="markdown-content prose prose-stone dark:prose-invert max-w-none break-words overflow-x-auto">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm, remarkBreaks]}
                                            components={{
                                                pre: ({ ...props }) => <pre className="overflow-x-auto whitespace-pre-wrap break-words" {...props} />,
                                                code: ({ className, children, ...props }) => {
                                                    const isInline = !className;
                                                    return isInline ? (
                                                        <code className="break-words" {...props}>{children}</code>
                                                    ) : (
                                                        <code className={`block overflow-x-auto whitespace-pre-wrap break-words ${className}`} {...props}>{children}</code>
                                                    );
                                                },
                                                p: ({ ...props }) => <p className="break-words overflow-wrap-anywhere" {...props} />,
                                                a: ({ ...props }) => <a className="break-all" {...props} />,
                                            }}
                                        >
                                            {resumeContent}
                                        </ReactMarkdown>
                                    </div>
                                </section>
                            )}

                            {/* AI Changes Expandable Panel */}
                            {aiChanges && (
                                <div className="bg-white dark:bg-[#0D2833] rounded-xl shadow-lg border border-[#D4F1F4] dark:border-[#1A4D5E] overflow-hidden">
                                    <button
                                        onClick={() => setShowAiChanges(!showAiChanges)}
                                        className="w-full px-8 py-4 flex items-center justify-between hover:bg-[#F8FCFD] dark:hover:bg-[#0A1E29] transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">✨</span>
                                            <h3 className="text-xl font-semibold text-[#023047] dark:text-[#E0F4F5]">AI Enhancements</h3>
                                        </div>
                                        <svg className={`w-6 h-6 text-[#2E86AB] transform transition-transform ${showAiChanges ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {showAiChanges && (
                                        <div className="px-8 py-6 border-t border-[#D4F1F4] dark:border-[#1A4D5E]">
                                            <div className="markdown-content prose prose-stone dark:prose-invert max-w-none">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm, remarkBreaks]}
                                                    components={{
                                                        p: ({ ...props }) => <p className="break-words overflow-wrap-anywhere text-[#5A8A9F] dark:text-[#7FA8B8]" {...props} />,
                                                        ul: ({ ...props }) => <ul className="space-y-2 list-disc list-inside" {...props} />,
                                                        li: ({ ...props }) => <li className="text-[#023047] dark:text-[#E0F4F5]" {...props} />,
                                                    }}
                                                >
                                                    {aiChanges}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
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

export default function Product() {
    const [sidePanelOpen, setSidePanelOpen] = useState(false);

    return (
        <>
            <SidePanel isOpen={sidePanelOpen} onClose={() => setSidePanelOpen(false)} />

            <div className="min-h-screen bg-gradient-to-br from-[#F0F8FA] to-[#E8F4F5] dark:from-[#0A1E29] dark:to-[#071821]">
                {/* Header */}
                <header className="bg-white/80 dark:bg-[#0D2833]/80 backdrop-blur-md shadow-lg border-b border-[#D4F1F4] dark:border-[#1A4D5E] sticky top-0 z-50">
                    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                        <Link href="/" className="text-lg font-semibold text-[#023047] dark:text-[#E0F4F5] hover:text-[#2E86AB] dark:hover:text-[#4A9EBF] transition-colors px-3 py-2 rounded-lg hover:bg-[#F0F8FA] dark:hover:bg-[#0A1E29]">
                            Home
                        </Link>

                        <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-[#2E86AB] to-[#06A77D] bg-clip-text text-transparent">
                            Resume Application
                        </Link>

                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                    </div>
                </header>

                <ResumeGenerationForm />
            </div>
        </>
    );
}