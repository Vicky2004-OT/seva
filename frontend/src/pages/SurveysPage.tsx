import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { surveysAPI } from '../services/api'
import { Survey, SurveyStatus, UserRole } from '../types'
import { 
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

export function SurveysPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data: surveysData, isLoading } = useQuery({
    queryKey: ['surveys', page, statusFilter],
    queryFn: () => surveysAPI.getSurveys({ 
      page, 
      limit: 10, 
      ...(statusFilter && { status: statusFilter })
    })
  })

  const getStatusIcon = (status: SurveyStatus) => {
    switch (status) {
      case SurveyStatus.PUBLISHED:
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case SurveyStatus.DRAFT:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case SurveyStatus.CLOSED:
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: SurveyStatus) => {
    switch (status) {
      case SurveyStatus.PUBLISHED:
        return 'bg-green-100 text-green-800'
      case SurveyStatus.DRAFT:
        return 'bg-yellow-100 text-yellow-800'
      case SurveyStatus.CLOSED:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const canManageSurvey = (survey: Survey) => {
    return user?.role === UserRole.ADMIN || 
           user?.role === UserRole.ANALYST || 
           (user?.role === UserRole.NGO && survey.organization === user.organization)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Surveys</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and monitor your humanitarian data collection surveys.
          </p>
        </div>
        
        {user?.role !== UserRole.FIELD_WORKER && (
          <Link to="/surveys/create" className="btn-primary">
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Survey
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input text-sm w-40"
          >
            <option value="">All Surveys</option>
            <option value={SurveyStatus.DRAFT}>Draft</option>
            <option value={SurveyStatus.PUBLISHED}>Published</option>
            <option value={SurveyStatus.CLOSED}>Closed</option>
          </select>
        </div>
      </div>

      {/* Surveys List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {surveysData?.data && surveysData.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Survey
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {surveysData.data.map((survey) => (
                  <tr key={survey.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{survey.title}</div>
                        <div className="text-sm text-gray-500">{survey.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(survey.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(survey.status)}`}>
                          {survey.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {survey.responses.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(survey.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/surveys/${survey.id}`}
                          className="text-primary-600 hover:text-primary-900"
                          title="View"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        
                        {canManageSurvey(survey) && (
                          <>
                            <Link
                              to={`/surveys/${survey.id}/edit`}
                              className="text-gray-600 hover:text-gray-900"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                            
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this survey?')) {
                                  surveysAPI.deleteSurvey(survey.id)
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No surveys found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {statusFilter ? 'Try changing your filters' : 'Get started by creating your first survey.'}
            </p>
            {user?.role !== UserRole.FIELD_WORKER && !statusFilter && (
              <div className="mt-6">
                <Link to="/surveys/create" className="btn-primary">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Survey
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {surveysData?.pagination && surveysData.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((surveysData.pagination.page - 1) * surveysData.pagination.limit) + 1} to{' '}
            {Math.min(surveysData.pagination.page * surveysData.pagination.limit, surveysData.pagination.total)} of{' '}
            {surveysData.pagination.total} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="btn-outline px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {surveysData.pagination.page} of {surveysData.pagination.pages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === surveysData.pagination.pages}
              className="btn-outline px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
