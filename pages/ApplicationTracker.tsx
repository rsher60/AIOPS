import { useState, FormEvent, useEffect } from 'react';
import { useAuth, SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { UserButton } from '@clerk/nextjs';
import Image from 'next/image';

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

interface Application {
    id: string;
    company_name: string;
    position: string;
    application_date: string;
    status: string;
    notes: string;
    created_at: string;
}

function ApplicationTrackerForm() {
    const { getToken } = useAuth();

    // Form state
    const [companyName, setCompanyName] = useState('');
    const [position, setPosition] = useState('');
    const [applicationDate, setApplicationDate] = useState<Date | null>(new Date());
    const [status, setStatus] = useState('applied');
    const [notes, setNotes] = useState('');

    // Table state
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingApplications, setLoadingApplications] = useState(false);

    // Edit modal state
    const [editingApp, setEditingApp] = useState<Application | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Fetch applications on component mount
    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        setLoadingApplications(true);
        try {
            const jwt = await getToken();
            if (!jwt) {
                console.error('No authentication token');
                return;
            }

            const response = await fetch('/api/applications', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${jwt}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setApplications(data.applications || []);
            } else {
                console.error('Failed to fetch applications:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoadingApplications(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const jwt = await getToken();
            if (!jwt) {
                alert('Authentication required');
                setLoading(false);
                return;
            }

            const formData = {
                company_name: companyName,
                position: position,
                application_date: applicationDate?.toISOString().slice(0, 10) || '',
                status: status,
                notes: notes,
            };

            const response = await fetch('/api/applications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                // Clear form
                setCompanyName('');
                setPosition('');
                setApplicationDate(new Date());
                setStatus('applied');
                setNotes('');

                // Refresh applications list
                await fetchApplications();
                alert('Application added successfully!');
            } else {
                const errorData = await response.json();
                alert(`Failed to add application: ${errorData.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error submitting application:', error);
            alert('Failed to submit application. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (appId: string) => {
        if (!confirm('Are you sure you want to delete this application?')) {
            return;
        }

        try {
            const jwt = await getToken();
            if (!jwt) return;

            const response = await fetch(`/api/applications/${appId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${jwt}`,
                },
            });

            if (response.ok) {
                await fetchApplications();
                alert('Application deleted successfully!');
            } else {
                const errorData = await response.json();
                alert(`Failed to delete: ${errorData.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting application:', error);
            alert('Failed to delete application.');
        }
    };

    const handleEdit = (app: Application) => {
        setEditingApp(app);
        setShowEditModal(true);
    };

    const handleUpdateSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingApp) return;

        try {
            const jwt = await getToken();
            if (!jwt) return;

            const response = await fetch(`/api/applications/${editingApp.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`,
                },
                body: JSON.stringify({
                    company_name: editingApp.company_name,
                    position: editingApp.position,
                    application_date: editingApp.application_date,
                    status: editingApp.status,
                    notes: editingApp.notes,
                }),
            });

            if (response.ok) {
                setShowEditModal(false);
                setEditingApp(null);
                await fetchApplications();
                alert('Application updated successfully!');
            } else {
                const errorData = await response.json();
                alert(`Failed to update: ${errorData.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating application:', error);
            alert('Failed to update application.');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'applied':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'interviewing':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'offered':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    // Export applications to CSV
    const exportApplications = async () => {
        try {
            if (applications.length === 0) {
                alert('No applications to export');
                return;
            }

            const filename = `job_applications_${new Date().toISOString().split('T')[0]}.csv`;

            // Create CSV header
            const headers = ['Company Name', 'Position', 'Date Applied', 'Status', 'Notes'];

            // Escape CSV values (handle commas, quotes, and newlines)
            const escapeCSV = (value: string) => {
                if (!value) return '';
                // If value contains comma, quote, or newline, wrap in quotes and escape existing quotes
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            };

            // Create CSV rows
            const rows = applications.map(app => [
                escapeCSV(app.company_name),
                escapeCSV(app.position),
                escapeCSV(app.application_date),
                escapeCSV(app.status),
                escapeCSV(app.notes || '')
            ]);

            // Combine header and rows
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting applications:', error);
            alert('Error generating CSV file. Please try again.');
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - Form */}
                <div className="lg:col-span-1">
                    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-[#0D2833] rounded-xl shadow-lg p-8 border border-[#D4F1F4] dark:border-[#1A4D5E] sticky top-8">
                        <h2 className="text-2xl font-semibold text-[#023047] dark:text-[#E0F4F5] mb-4">
                            Add New Application
                        </h2>

                        <div className="space-y-2">
                            <label htmlFor="company" className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                Company Name
                            </label>
                            <input
                                id="company"
                                type="text"
                                required
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent dark:bg-[#0A1E29] dark:text-[#E0F4F5] bg-[#F8FCFD]"
                                placeholder="e.g., Google"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="position" className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                Position
                            </label>
                            <input
                                id="position"
                                type="text"
                                required
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent dark:bg-[#0A1E29] dark:text-[#E0F4F5] bg-[#F8FCFD]"
                                placeholder="e.g., Senior Software Engineer"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="date" className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                Application Date
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
                            <label htmlFor="status" className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                Status
                            </label>
                            <select
                                id="status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent dark:bg-[#0A1E29] dark:text-[#E0F4F5] bg-[#F8FCFD]"
                            >
                                <option value="applied">Applied</option>
                                <option value="interviewing">Interviewing</option>
                                <option value="offered">Offered</option>
                                <option value="rejected">Rejected</option>
                                <option value="withdrawn">Withdrawn</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="notes" className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                Notes
                            </label>
                            <textarea
                                id="notes"
                                rows={4}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent dark:bg-[#0A1E29] dark:text-[#E0F4F5] bg-[#F8FCFD]"
                                placeholder="Recruiter name, interview dates, etc."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] hover:from-[#1B6B8F] hover:to-[#e8956f] disabled:from-[#e8b59a] disabled:to-[#f0cdb0] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                        >
                            {loading ? 'Adding...' : 'Add Application'}
                        </button>
                    </form>
                </div>

                {/* Right Panel - Table */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-[#0D2833] rounded-xl shadow-lg border border-[#D4F1F4] dark:border-[#1A4D5E] overflow-hidden">
                        <div className="px-8 py-6 border-b border-[#D4F1F4] dark:border-[#1A4D5E] flex justify-between items-center">
                            <h2 className="text-2xl font-semibold text-[#023047] dark:text-[#E0F4F5]">
                                My Applications
                            </h2>
                            {applications.length > 0 && (
                                <button
                                    onClick={exportApplications}
                                    className="flex items-center gap-2 bg-[#52B788] hover:bg-[#40916C] text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Export to CSV
                                </button>
                            )}
                        </div>

                        {loadingApplications ? (
                            <div className="p-8 text-center">
                                <p className="text-[#5A8A9F] dark:text-[#7FA8B8]">Loading applications...</p>
                            </div>
                        ) : applications.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-[#5A8A9F] dark:text-[#7FA8B8]">No applications yet. Add your first application using the form!</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[#F0F8FA] dark:bg-[#0A1E29]">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[#023047] dark:text-[#E0F4F5] uppercase tracking-wider">
                                                Company
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[#023047] dark:text-[#E0F4F5] uppercase tracking-wider">
                                                Position
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[#023047] dark:text-[#E0F4F5] uppercase tracking-wider">
                                                Date Applied
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[#023047] dark:text-[#E0F4F5] uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[#023047] dark:text-[#E0F4F5] uppercase tracking-wider">
                                                Notes
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[#023047] dark:text-[#E0F4F5] uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#D4F1F4] dark:divide-[#1A4D5E]">
                                        {applications.map((app) => (
                                            <tr key={app.id} className="hover:bg-[#F8FCFD] dark:hover:bg-[#0A1E29] transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-[#023047] dark:text-[#E0F4F5]">
                                                        {app.company_name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-[#023047] dark:text-[#E0F4F5]">
                                                        {app.position}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-[#5A8A9F] dark:text-[#7FA8B8]">
                                                        {app.application_date}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(app.status)}`}>
                                                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-[#5A8A9F] dark:text-[#7FA8B8] max-w-xs truncate">
                                                        {app.notes || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEdit(app)}
                                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(app.id)}
                                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && editingApp && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#0D2833] rounded-xl shadow-2xl p-8 max-w-md w-full border border-[#D4F1F4] dark:border-[#1A4D5E]">
                        <h3 className="text-2xl font-bold text-[#023047] dark:text-[#E0F4F5] mb-6">
                            Edit Application
                        </h3>
                        <form onSubmit={handleUpdateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5] mb-2">
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editingApp.company_name}
                                    onChange={(e) => setEditingApp({ ...editingApp, company_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] dark:bg-[#0A1E29] dark:text-[#E0F4F5]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5] mb-2">
                                    Position
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editingApp.position}
                                    onChange={(e) => setEditingApp({ ...editingApp, position: e.target.value })}
                                    className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] dark:bg-[#0A1E29] dark:text-[#E0F4F5]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5] mb-2">
                                    Application Date
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={editingApp.application_date}
                                    onChange={(e) => setEditingApp({ ...editingApp, application_date: e.target.value })}
                                    className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] dark:bg-[#0A1E29] dark:text-[#E0F4F5]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5] mb-2">
                                    Status
                                </label>
                                <select
                                    value={editingApp.status}
                                    onChange={(e) => setEditingApp({ ...editingApp, status: e.target.value })}
                                    className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] dark:bg-[#0A1E29] dark:text-[#E0F4F5]"
                                >
                                    <option value="applied">Applied</option>
                                    <option value="interviewing">Interviewing</option>
                                    <option value="offered">Offered</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="withdrawn">Withdrawn</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#023047] dark:text-[#E0F4F5] mb-2">
                                    Notes
                                </label>
                                <textarea
                                    rows={3}
                                    value={editingApp.notes}
                                    onChange={(e) => setEditingApp({ ...editingApp, notes: e.target.value })}
                                    className="w-full px-4 py-2 border border-[#D4F1F4] dark:border-[#1A4D5E] rounded-lg focus:ring-2 focus:ring-[#2E86AB] dark:bg-[#0A1E29] dark:text-[#E0F4F5]"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] hover:from-[#1B6B8F] hover:to-[#e8956f] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                                >
                                    Update
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingApp(null);
                                    }}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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

export default function ApplicationTracker() {
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
                            Application Tracker
                        </Link>

                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                    </div>
                </header>

                <ApplicationTrackerForm />
            </div>
        </>
    );
}
