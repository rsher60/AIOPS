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

function ResumeGenerationForm() {
    const { getToken } = useAuth();

    // Form state
    const [applicantName, setApplicantName] = useState('');
    const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
    const [applicationDate, setApplicationDate] = useState<Date | null>(new Date());
    const [roleAppliedFor, setRoleAppliedFor] = useState('');
    const [YourPhoneNumber, setYourPhoneNumber] = useState('');
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [linkedinFile, setLinkedinFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [linkedinDragActive, setLinkedinDragActive] = useState(false);
    const [additionalNotes, setAdditionalNotes] = useState('');

    // Streaming state
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);
    const [resumeContent, setResumeContent] = useState('');
    const [aiChanges, setAiChanges] = useState('');
    const [showAiChanges, setShowAiChanges] = useState(false);

    // Connection management
    const controllerRef = useRef<AbortController | null>(null);
    const isConnectingRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const linkedinFileInputRef = useRef<HTMLInputElement | null>(null);

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
            if (file.type === 'application/pdf') {
                setLinkedinFile(file);
            } else {
                alert('Please upload a PDF file');
            }
        }
    };

    // Handle LinkedIn file input change
    const handleLinkedinFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type === 'application/pdf') {
                setLinkedinFile(file);
            } else {
                alert('Please upload a PDF file');
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
        phone_number: string;
        resume_pdf?: string;
        resume_filename?: string;
        linkedin_profile_pdf?: string;
        linkedin_profile_filename?: string;
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

                    // Check if delimiter exists in buffer
                    const delimiterIndex = buffer.indexOf('---AI_ENHANCEMENTS_START---');

                    if (delimiterIndex !== -1) {
                        // Split into resume and AI changes
                        const resume = buffer.substring(0, delimiterIndex).trim();
                        const changes = buffer.substring(delimiterIndex + '---AI_ENHANCEMENTS_START---'.length).trim();

                        setResumeContent(resume);
                        setAiChanges(changes);
                        setShowAiChanges(true);
                    } else {
                        // Delimiter not found yet, all content is resume
                        setResumeContent(buffer);
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
        setResumeContent('');
        setAiChanges('');
        setShowAiChanges(false);
        setLoading(true);

        // Prepare form data
        const formData: {
            applicant_name: string;
            application_date: string;
            role_applied_for: string;
            phone_number: string;
            resume_pdf?: string;
            resume_filename?: string;
            linkedin_profile_pdf?: string;
            linkedin_profile_filename?: string;
            additional_notes: string;
            model: string;
        } = {
            applicant_name: applicantName,
            application_date: applicationDate?.toISOString().slice(0, 10) || '',
            role_applied_for: roleAppliedFor,
            phone_number: YourPhoneNumber,
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

        // Add LinkedIn PDF if uploaded
        if (linkedinFile) {
            try {
                const base64 = await fileToBase64(linkedinFile);
                formData.linkedin_profile_pdf = base64;
                formData.linkedin_profile_filename = linkedinFile.name;
            } catch (error) {
                console.error('Error reading LinkedIn PDF file:', error);
                setOutput('Error reading LinkedIn PDF file. Please try again.');
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

    return (
        <div className="container mx-auto px-4 py-12 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Panel - Form */}
                <div className="lg:sticky lg:top-8 h-fit">
                    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-[#0D2833] rounded-xl shadow-lg p-8 border border-[#D4F1F4] dark:border-[#1A4D5E]">
                        <div className="space-y-2">
                            <label htmlFor="applicant" className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                Applicant Name
                            </label>
                            <input
                                id="applicant"
                                type="text"
                                required
                                value={applicantName}
                                onChange={(e) => setApplicantName(e.target.value)}
                                className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent dark:bg-[#0A1E29] dark:text-[#E0F4F5] bg-[#F8FCFD]"
                                placeholder="Enter your full name"
                            />
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
                            <label htmlFor="date" className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                Date of Application
                            </label>
                            <DatePicker
                                id="date"
                                selected={applicationDate}
                                onChange={(d: Date | null) => setApplicationDate(d)}
                                dateFormat="yyyy-MM-dd"
                                placeholderText="Select date"
                                required
                                className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent dark:bg-[#0A1E29] dark:text-[#E0F4F5] bg-[#F8FCFD]"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="role" className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                Role Applied For
                            </label>
                            <input
                                id="role"
                                type="text"
                                required
                                value={roleAppliedFor}
                                onChange={(e) => setRoleAppliedFor(e.target.value)}
                                className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent dark:bg-[#0A1E29] dark:text-[#E0F4F5] bg-[#F8FCFD]"
                                placeholder="e.g., Senior Software Engineer"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="phone" className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                Your Phone Number
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                required
                                value={YourPhoneNumber}
                                onChange={(e) => setYourPhoneNumber(e.target.value)}
                                className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent dark:bg-[#0A1E29] dark:text-[#E0F4F5] bg-[#F8FCFD]"
                                placeholder="e.g., +1 (555) 123-4567"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                Upload Resume (PDF)
                            </label>
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
                                    dragActive
                                        ? 'border-[#2E86AB] bg-[#EDF7F9] dark:bg-[#023047]'
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
                                            PDF files only
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                Upload LinkedIn Profile (PDF) - Optional
                            </label>
                            <p className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8] mb-2">
                                Export your LinkedIn profile as PDF for additional context
                            </p>
                            <div
                                onDragEnter={handleLinkedinDrag}
                                onDragLeave={handleLinkedinDrag}
                                onDragOver={handleLinkedinDrag}
                                onDrop={handleLinkedinDrop}
                                className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
                                    linkedinDragActive
                                        ? 'border-[#0077B5] bg-[#E8F4F9] dark:bg-[#023047]'
                                        : 'border-[#D4F1F4] dark:border-[#1A4D5E] bg-[#F8FCFD] dark:bg-[#0A1E29]'
                                }`}
                            >
                                <input
                                    ref={linkedinFileInputRef}
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleLinkedinFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                {linkedinFile ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <svg className="w-8 h-8 text-[#0077B5]" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                            </svg>
                                            <div>
                                                <p className="text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                                    {linkedinFile.name}
                                                </p>
                                                <p className="text-xs text-[#5A8A9F] dark:text-[#7FA8B8]">
                                                    {(linkedinFile.size / 1024).toFixed(2)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeLinkedinFile}
                                            className="text-[#0077B5] hover:text-[#005582] transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <svg className="mx-auto h-12 w-12 text-[#0077B5]" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                        </svg>
                                        <p className="mt-2 text-sm text-[#023047] dark:text-[#E0F4F5]">
                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="mt-1 text-xs text-[#5A8A9F] dark:text-[#7FA8B8]">
                                            LinkedIn PDF export (optional)
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="notes" className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                Additional Notes from Applicant
                            </label>
                            <textarea
                                id="notes"
                                rows={8}
                                value={additionalNotes}
                                onChange={(e) => setAdditionalNotes(e.target.value)}
                                className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent dark:bg-[#0A1E29] dark:text-[#E0F4F5] bg-[#F8FCFD]"
                                placeholder="Any additional information, skills, achievements, or special requirements..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] hover:from-[#1B6B8F] hover:to-[#e8956f] disabled:from-[#e8b59a] disabled:to-[#f0cdb0] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                        >
                            {loading ? 'Generating Resume...' : 'Generate Resume'}
                        </button>
                    </form>
                </div>

                {/* Right Panel - Output */}
                <div className="lg:min-h-screen">
                    {output ? (
                        <>
                        <section className="bg-[#F8FCFD] dark:bg-[#0D2833] rounded-xl shadow-lg p-8 border border-[#D4F1F4] dark:border-[#1A4D5E]">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-semibold text-[#023047] dark:text-[#E0F4F5]">
                                    Generated Resume
                                </h2>
                                {!loading && (
                                    <button
                                        onClick={downloadResume}
                                        className="flex items-center gap-2 bg-[#52B788] hover:bg-[#40916C] text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download
                                    </button>
                                )}
                            </div>
                            <div className="markdown-content prose prose-stone dark:prose-invert max-w-none break-words overflow-x-auto">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkBreaks]}
                                    components={{
                                        pre: ({ ...props }) => (
                                            <pre className="overflow-x-auto whitespace-pre-wrap break-words" {...props} />
                                        ),
                                        code: ({ className, children, ...props }) => {
                                            const isInline = !className;
                                            return isInline ? (
                                                <code className="break-words" {...props}>{children}</code>
                                            ) : (
                                                <code className={`block overflow-x-auto whitespace-pre-wrap break-words ${className}`} {...props}>{children}</code>
                                            );
                                        },
                                        p: ({ ...props }) => (
                                            <p className="break-words overflow-wrap-anywhere" {...props} />
                                        ),
                                        a: ({ ...props }) => (
                                            <a className="break-all" {...props} />
                                        )
                                    }}
                                >
                                    {resumeContent}
                                </ReactMarkdown>
                            </div>
                        </section>

                        {/* AI Changes Expandable Panel */}
                        {aiChanges && (
                            <div className="mt-6 bg-white dark:bg-[#0D2833] rounded-xl shadow-lg border border-[#D4F1F4] dark:border-[#1A4D5E] overflow-hidden">
                                <button
                                    onClick={() => setShowAiChanges(!showAiChanges)}
                                    className="w-full px-8 py-4 flex items-center justify-between hover:bg-[#F8FCFD] dark:hover:bg-[#0A1E29] transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">✨</span>
                                        <h3 className="text-xl font-semibold text-[#023047] dark:text-[#E0F4F5]">
                                            AI Enhancements
                                        </h3>
                                    </div>
                                    <svg
                                        className={`w-6 h-6 text-[#2E86AB] transform transition-transform ${
                                            showAiChanges ? 'rotate-180' : ''
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {showAiChanges && (
                                    <div className="px-8 py-6 border-t border-[#D4F1F4] dark:border-[#1A4D5E]">
                                        <div className="markdown-content prose prose-stone dark:prose-invert max-w-none">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm, remarkBreaks]}
                                                components={{
                                                    p: ({ ...props }) => (
                                                        <p className="break-words overflow-wrap-anywhere text-[#5A8A9F] dark:text-[#7FA8B8]" {...props} />
                                                    ),
                                                    ul: ({ ...props }) => (
                                                        <ul className="space-y-2 list-disc list-inside" {...props} />
                                                    ),
                                                    li: ({ ...props }) => (
                                                        <li className="text-[#023047] dark:text-[#E0F4F5]" {...props} />
                                                    ),
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
                    ) : (
                        <div className="bg-[#F8FCFD] dark:bg-[#0D2833] rounded-xl shadow-lg p-8 min-h-96 flex items-center justify-center border border-[#D4F1F4] dark:border-[#1A4D5E]">
                            <p className="text-[#5A8A9F] dark:text-[#7FA8B8] text-center">
                                Fill out the form and click &quot;Generate Resume&quot; to see your results here
                            </p>
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

export default function Product() {
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