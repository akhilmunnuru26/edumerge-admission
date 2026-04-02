import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applicantAPI } from '../services/api';

export default function Applicants() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: applicants, isLoading } = useQuery({
    queryKey: ['applicants'],
    queryFn: async () => (await applicantAPI.getApplicants()).data,
  });

  const createMutation = useMutation({
    mutationFn: applicantAPI.createApplicant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
      setShowForm(false);
      alert('Applicant created successfully!');
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      full_name: formData.get('full_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      date_of_birth: formData.get('date_of_birth'),
      gender: formData.get('gender'),
      category: formData.get('category'),
      allotment_number: formData.get('allotment_number') || undefined,
      qualifying_exam: formData.get('qualifying_exam') || undefined,
      marks_obtained: formData.get('marks_obtained') ? Number(formData.get('marks_obtained')) : undefined,
      entry_type: formData.get('entry_type'),
      quota_type: formData.get('quota_type'),
      admission_mode: formData.get('admission_mode'),
      address: formData.get('address') || undefined,
      parent_name: formData.get('parent_name') || undefined,
      parent_phone: formData.get('parent_phone') || undefined,
    });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Applicants</h2>
          <p className="text-gray-500">Manage student applications</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : '+ New Applicant'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create Applicant</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name *</label>
              <input type="text" name="full_name" required placeholder='Enter Full Name' className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input type="email" name="email" required placeholder='Enter Email' className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone *</label>
              <input type="tel" name="phone" required placeholder='Enter Phone Number' className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
              <input type="date" name="date_of_birth" required placeholder='Enter Date of Birth' className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender *</label>
              <select name="gender" required className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category *</label>
              <select name="category" required className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <option value="GM">GM</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="OBC">OBC</option>
                <option value="EWS">EWS</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Qualifying Exam</label>
              <input type="text" name="qualifying_exam" placeholder="KCET" className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Marks Obtained</label>
              <input type="number" step="0.01" name="marks_obtained" placeholder="95.5" className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Entry Type *</label>
              <select name="entry_type" required className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <option value="Regular">Regular</option>
                <option value="Lateral">Lateral</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quota Type *</label>
              <select name="quota_type" required className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <option value="KCET">KCET</option>
                <option value="COMEDK">COMEDK</option>
                <option value="Management">Management</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Admission Mode *</label>
              <select name="admission_mode" required className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <option value="Government">Government</option>
                <option value="Management">Management</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Allotment Number</label>
              <input type="text" name="allotment_number" placeholder="KCET2026001234" className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea name="address" rows={2} className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Parent Name</label>
              <input type="text" name="parent_name" placeholder='Enter Parent Name' className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Parent Phone Number</label>
              <input type="tel" name="parent_phone" placeholder='Enter Parent Phone Number' className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={createMutation.isPending} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400">
                {createMutation.isPending ? 'Creating...' : 'Create Applicant'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quota</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applicants?.applicants?.map((applicant: any) => (
              <tr key={applicant.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{applicant.full_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{applicant.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{applicant.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{applicant.quota_type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{applicant.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}