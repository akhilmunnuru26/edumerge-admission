import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { masterAPI } from '../services/api';

export default function Masters() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'institution' | 'campus' | 'department' | 'program' | 'quota'>('program');

  // Queries
  const { data: institutions } = useQuery({
    queryKey: ['institutions'],
    queryFn: async () => (await masterAPI.getInstitutions()).data,
  });

  const { data: campuses } = useQuery({
    queryKey: ['campuses'],
    queryFn: async () => (await masterAPI.getCampuses()).data,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await masterAPI.getDepartments()).data,
  });

  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => (await masterAPI.getPrograms()).data,
  });

  const { data: quotas } = useQuery({
    queryKey: ['quotas'],
    queryFn: async () => (await masterAPI.getQuotas()).data,
  });

  // Mutations
  const createProgramMutation = useMutation({
    mutationFn: masterAPI.createProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      alert('Program created successfully!');
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    },
  });

  const createQuotaMutation = useMutation({
    mutationFn: masterAPI.createQuota,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotas'] });
      alert('Quota created successfully!');
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    },
  });

  const handleProgramSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createProgramMutation.mutate({
      department_id: Number(formData.get('department_id')),
      name: formData.get('name'),
      code: formData.get('code'),
      course_type: formData.get('course_type'),
      entry_type: formData.get('entry_type'),
      admission_mode: formData.get('admission_mode'),
      academic_year: formData.get('academic_year'),
      total_intake: Number(formData.get('total_intake')),
    });
    e.currentTarget.reset();
  };

  const handleQuotaSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createQuotaMutation.mutate({
      program_id: Number(formData.get('program_id')),
      quota_type: formData.get('quota_type'),
      allocated_seats: Number(formData.get('allocated_seats')),
      is_supernumerary: formData.get('is_supernumerary') === 'on',
    });
    e.currentTarget.reset();
  };

  console.log('Institutions:', institutions);
  console.log('Campuses:', campuses);
  console.log('Departments:', departments);
  console.log('Programs:', programs);
  console.log('Quotas:', quotas);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Master Setup</h2>
        <p className="text-gray-500">Configure institutions, programs, and quotas</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['program', 'quota'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Program Form */}
      {activeTab === 'program' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create Program</h3>
            <form onSubmit={handleProgramSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <select
                  name="department_id"
                  required
                  className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select Department</option>
                  {departments?.departments?.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Program Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Computer Science Engineering"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Program Code</label>
                <input
                  type="text"
                  name="code"
                  required
                  className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="CSE"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Course Type</label>
                  <select
                    name="course_type"
                    required
                    className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="UG">UG</option>
                    <option value="PG">PG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Entry Type</label>
                  <select
                    name="entry_type"
                    required
                    className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Lateral">Lateral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Admission Mode</label>
                <select
                  name="admission_mode"
                  required
                  className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="Government">Government</option>
                  <option value="Management">Management</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                  <input
                    type="text"
                    name="academic_year"
                    required
                    defaultValue="2026"
                    className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Intake</label>
                  <input
                    type="number"
                    name="total_intake"
                    required
                    className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createProgramMutation.isPending}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {createProgramMutation.isPending ? 'Creating...' : 'Create Program'}
              </button>
            </form>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Existing Programs</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {programs?.programs?.map((program: any) => (
                <div key={program.id} className="border rounded-lg p-3">
                  <p className="font-medium text-gray-900">{program.name}</p>
                  <p className="text-sm text-gray-500">
                    {program.code} | {program.course_type} | Intake: {program.total_intake}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quota Form */}
      {activeTab === 'quota' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create Quota</h3>
            <form onSubmit={handleQuotaSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Program</label>
                <select
                  name="program_id"
                  required
                  className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select Program</option>
                  {programs?.programs?.map((program: any) => (
                    <option key={program.id} value={program.id}>
                      {program.name} ({program.total_intake} seats)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Quota Type</label>
                <select
                  name="quota_type"
                  required
                  className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="KCET">KCET</option>
                  <option value="COMEDK">COMEDK</option>
                  <option value="Management">Management</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Allocated Seats</label>
                <input
                  type="number"
                  name="allocated_seats"
                  required
                  className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="50"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_supernumerary"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Supernumerary Seats</label>
              </div>

              <button
                type="submit"
                disabled={createQuotaMutation.isPending}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {createQuotaMutation.isPending ? 'Creating...' : 'Create Quota'}
              </button>
            </form>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Existing Quotas</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {quotas?.quotas?.map((quota: any) => (
                <div key={quota.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{quota.quota_type}</p>
                      <p className="text-sm text-gray-500">{quota.program_name}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {quota.seats_filled}/{quota.allocated_seats}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

