import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { UserButton } from '@clerk/nextjs';

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

    return (
        <div className="container mx-auto px-4 py-12 max-w-7xl">
            <h1 className="text-4xl font-bold text-[#023047] dark:text-[#E0F4F5] mb-8">
                Application Tracker
            </h1>

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
                            className="w-full bg-gradient-to-r from-[#2E86AB] to-[#4A9EBF] hover:from-[#1B6B8F] hover:to-[#3A8CB0] disabled:from-[#7DC4C8] disabled:to-[#A8D5D8] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                        >
                            {loading ? 'Adding...' : 'Add Application'}
                        </button>
                    </form>
                </div>

                {/* Right Panel - Table */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-[#0D2833] rounded-xl shadow-lg border border-[#D4F1F4] dark:border-[#1A4D5E] overflow-hidden">
                        <div className="px-8 py-6 border-b border-[#D4F1F4] dark:border-[#1A4D5E]">
                            <h2 className="text-2xl font-semibold text-[#023047] dark:text-[#E0F4F5]">
                                My Applications
                            </h2>
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
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ApplicationTracker() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-[#F0F8FA] to-[#E8F4F5] dark:from-[#0A1E29] dark:to-[#071821]">
            {/* User Menu in Top Right */}
            <div className="absolute top-4 right-4">
                <UserButton showName={true} />
            </div>

            <ApplicationTrackerForm />
        </main>
    );
}
