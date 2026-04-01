import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { admissionAPI, applicantAPI, masterAPI } from '../services/api';

export default function Admissions() {
  const queryClient = useQueryClient();
  const [selectedApplicant, setSelectedApplicant] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedQuota, setSelectedQuota] = useState('');

  const { data: applicants } = useQuery({
    queryKey: ['applicants'],
    queryFn: async () => (await applicantAPI.getApplicants()).data,
  });

  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => (await masterAPI.getPrograms()).data,
  });

  const { data: quotas } = useQuery({
    queryKey: ['quotas', selectedProgram],
    queryFn: async () => (await masterAPI.getQuotas(Number(selectedProgram))).data,
    enabled: !!selectedProgram,
  });

  const { data: admissions, isLoading } = useQuery({
    queryKey: ['admissions'],
    queryFn: async () => (await admissionAPI.getAdmissions()).data,
  });

  const allocateMutation = useMutation({
    mutationFn: admissionAPI.allocateSeat,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      queryClient.invalidateQueries({ queryKey: ['quotas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      alert(`✅ Seat allocated successfully!\n\nAdmission Number: ${data.data.admission.admission_number}`);
      setSelectedApplicant('');
      setSelectedProgram('');
      setSelectedQuota('');
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || error.message;
      if (errorMsg.includes('Quota full') || error.response?.data?.code === 'QUOTA_FULL') {
        alert('❌ QUOTA FULL\n\nCannot allocate seat - selected quota has no remaining seats.');
      } else if (errorMsg.includes('already has an admission')) {
        alert('❌ DUPLICATE ADMISSION\n\nThis applicant already has an admission.');
      } else {
        alert(`❌ Error: ${errorMsg}`);
      }
    },
  });

  const handleAllocate = () => {
    if (!selectedApplicant || !selectedProgram || !selectedQuota) {
      alert('Please select applicant, program, and quota');
      return;
    }

    const quota = quotas?.quotas?.find((q: any) => q.id === Number(selectedQuota));
    if (quota && quota.remaining_seats === 0) {
      alert('⚠️ WARNING: This quota has no remaining seats!\n\nAllocation will fail.');
    }

    allocateMutation.mutate({
      applicant_id: Number(selectedApplicant),
      program_id: Number(selectedProgram),
      quota_id: Number(selectedQuota),
    });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Seat Allocation</h2>
        <p className="text-gray-500">Allocate seats to applicants with quota enforcement</p>
      </div>

      {/* Allocation Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Allocate Seat</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Applicant</label>
            <select
              value={selectedApplicant}
              onChange={(e) => setSelectedApplicant(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Choose applicant...</option>
              {applicants?.applicants?.map((app: any) => (
                <option key={app.id} value={app.id}>
                  {app.full_name} ({app.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Program</label>
            <select
              value={selectedProgram}
              onChange={(e) => {
                setSelectedProgram(e.target.value);
                setSelectedQuota('');
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Choose program...</option>
              {programs?.programs?.map((prog: any) => (
                <option key={prog.id} value={prog.id}>
                  {prog.name} ({prog.total_intake} seats)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Quota</label>
            <select
              value={selectedQuota}
              onChange={(e) => setSelectedQuota(e.target.value)}
              disabled={!selectedProgram}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              <option value="">Choose quota...</option>
              {quotas?.quotas?.map((quota: any) => (
                <option key={quota.id} value={quota.id}>
                  {quota.quota_type} - {quota.remaining_seats}/{quota.allocated_seats} available
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedQuota && quotas?.quotas && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            {(() => {
              const quota = quotas.quotas.find((q: any) => q.id === Number(selectedQuota));
              return (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Selected: {quota?.quota_type} Quota
                    </p>
                    <p className="text-sm text-blue-700">
                      Seats: {quota?.seats_filled}/{quota?.allocated_seats} filled | {quota?.remaining_seats} remaining
                    </p>
                  </div>
                  {quota?.remaining_seats === 0 && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      QUOTA FULL
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        <button
          onClick={handleAllocate}
          disabled={allocateMutation.isPending || !selectedApplicant || !selectedProgram || !selectedQuota}
          className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {allocateMutation.isPending ? 'Allocating...' : 'Allocate Seat'}
        </button>
      </div>

      {/* Admissions List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Admissions</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission No.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quota</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {admissions?.admissions?.map((admission: any) => (
              <tr key={admission.admission_number} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                  {admission.admission_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admission.full_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{admission.program_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{admission.quota_type}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    admission.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                    admission.status === 'Provisional' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {admission.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    admission.fee_status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {admission.fee_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}