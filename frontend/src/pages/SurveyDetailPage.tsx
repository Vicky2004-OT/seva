import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { surveysAPI } from '../services/api'
import { Survey, UserRole, SurveyStatus } from '../types'
import { 
  ArrowLeftIcon,
  PencilIcon,
  EyeIcon,
  ChartBarIcon,
  ShareIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

export function SurveyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: survey, isLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: () => surveysAPI.getSurvey(id!),
    enabled: !!id
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Survey not found</h3>
        <p className="mt-2 text-sm text-gray-500">
          The survey you're looking for doesn't exist or you don't have permission to view it.
        </p>
      </div>
    )
  }

  const canEdit = user?.role === UserRole.ADMIN || 
                 user?.role === UserRole.ANALYST || 
                 (user?.role === UserRole.NGO && survey.organization === user.organization)

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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/surveys')}
          className="btn-secondary mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Surveys
        </button>
        
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
                <p className="mt-2 text-gray-600">{survey.description}</p>
                
                <div className="mt-4 flex items-center space-x-4">
                  <div className="flex items-center">
                    {getStatusIcon(survey.status)}
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(survey.status)}`}>
                      {survey.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Created: {format(new Date(survey.createdAt), 'MMM d, yyyy')}
                  </div>
                  
                  {survey.publishedAt && (
                    <div className="text-sm text-gray-500">
                      Published: {format(new Date(survey.publishedAt), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-2 ml-6">
                {survey.status === SurveyStatus.PUBLISHED && (
                  <button className="btn-secondary">
                    <ShareIcon className="h-4 w-4 mr-2" />
                    Share
                  </button>
                )}
                
                <button className="btn-secondary">
                  <EyeIcon className="h-4 w-4 mr-2" />
                  View Responses
                </button>
                
                <button className="btn-secondary">
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                  Analytics
                </button>
                
                {canEdit && (
                  <button 
                    onClick={() => navigate(`/surveys/${survey.id}/edit`)}
                    className="btn-primary"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Survey Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Questions */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Questions ({survey.questions.length})</h2>
            </div>
            <div className="p-6 space-y-6">
              {survey.questions.map((question, index) => (
                <div key={question.id} className="border-l-4 border-gray-200 pl-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {index + 1}. {question.title}
                      </h3>
                      {question.description && (
                        <p className="mt-1 text-sm text-gray-600">{question.description}</p>
                      )}
                    </div>
                    <div className="ml-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                        {question.type.replace('_', ' ')}
                      </span>
                      {question.required && (
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                          Required
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {question.options && question.options.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center">
                          <div className="h-4 w-4 rounded border border-gray-300 mr-2"></div>
                          <span className="text-sm text-gray-700">{option}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistics */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Statistics</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total Responses</p>
                <p className="text-2xl font-bold text-gray-900">{survey.responses.length}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Questions</p>
                <p className="text-2xl font-bold text-gray-900">{survey.questions.length}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-lg font-semibold capitalize">{survey.status}</p>
              </div>
            </div>
          </div>

          {/* Settings */}
          {canEdit && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Survey Settings</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Offline Capable</span>
                  <div className={`h-6 w-11 rounded-full ${
                    survey.isOfflineCapable ? 'bg-green-500' : 'bg-gray-200'
                  } relative`}>
                    <div className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full transition-transform ${
                      survey.isOfflineCapable ? 'translate-x-5' : 'translate-x-0'
                    }`}></div>
                  </div>
                </div>
                
                {survey.organization && (
                  <div>
                    <p className="text-sm text-gray-500">Organization</p>
                    <p className="text-sm font-medium text-gray-900">{survey.organization}</p>
                  </div>
                )}
                
                {survey.expiresAt && (
                  <div>
                    <p className="text-sm text-gray-500">Expires</p>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(survey.expiresAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
