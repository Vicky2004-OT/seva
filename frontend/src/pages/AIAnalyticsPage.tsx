import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { aiAPI } from '../services/api'
import { InsightType, UserRole } from '../types'
import { 
  CpuChipIcon,
  SparklesIcon,
  DocumentTextIcon,
  TrashIcon,
  PlusIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export function AIAnalyticsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedSurvey, setSelectedSurvey] = useState('')
  const [query, setQuery] = useState('')
  const [isQuerying, setIsQuerying] = useState(false)
  const [queryResult, setQueryResult] = useState('')

  const { data: surveys } = useQuery({
    queryKey: ['surveys-for-ai'],
    queryFn: () => aiAPI.getInsights(''),
    enabled: user?.role === UserRole.ADMIN || user?.role === UserRole.ANALYST
  })

  const queryMutation = useMutation({
    mutationFn: aiAPI.query,
    onSuccess: (data) => {
      setQueryResult(data.response)
      setIsQuerying(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Query failed')
      setIsQuerying(false)
    }
  })

  const generateInsightMutation = useMutation({
    mutationFn: aiAPI.generateInsight,
    onSuccess: () => {
      toast.success('Insight generated successfully!')
      queryClient.invalidateQueries(['insights', selectedSurvey])
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to generate insight')
    }
  })

  const handleQuery = () => {
    if (!query.trim()) return
    
    setIsQuerying(true)
    queryMutation.mutate({
      query,
      ...(selectedSurvey && { surveyId: selectedSurvey })
    })
  }

  const insightTypes = [
    { value: InsightType.TREND, label: 'Trend Analysis', description: 'Identify trends over time' },
    { value: InsightType.ANOMALY, label: 'Anomaly Detection', description: 'Find unusual patterns' },
    { value: InsightType.PATTERN, label: 'Pattern Analysis', description: 'Discover correlations' },
    { value: InsightType.PREDICTION, label: 'Predictions', description: 'Forecast future trends' },
    { value: InsightType.SUMMARY, label: 'Summary', description: 'Generate comprehensive summary' },
    { value: InsightType.RECOMMENDATION, label: 'Recommendations', description: 'Get actionable insights' }
  ]

  if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.ANALYST) {
    return (
      <div className="text-center py-12">
        <CpuChipIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Restricted</h3>
        <p className="mt-1 text-sm text-gray-500">
          AI Analytics is only available to Administrators and Data Analysts.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">AI Analytics</h1>
        <p className="mt-1 text-sm text-gray-600">
          Generate powerful insights from your humanitarian data using AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Natural Language Query */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2 text-primary-600" />
              Natural Language Query
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ask questions about your data
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={4}
                className="input"
                placeholder="e.g., What are the main trends in survey responses? Which regions need the most attention?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Survey (Optional)
              </label>
              <select
                value={selectedSurvey}
                onChange={(e) => setSelectedSurvey(e.target.value)}
                className="input"
              >
                <option value="">All Surveys</option>
                {/* This would be populated with actual surveys */}
              </select>
            </div>

            <button
              onClick={handleQuery}
              disabled={!query.trim() || isQuerying}
              className="btn-primary w-full"
            >
              {isQuerying ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </div>
              ) : (
                'Analyze Data'
              )}
            </button>

            {queryResult && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">AI Response:</h4>
                <p className="text-sm text-blue-800 whitespace-pre-wrap">{queryResult}</p>
              </div>
            )}
          </div>
        </div>

        {/* Generate Insights */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <CpuChipIcon className="h-5 w-5 mr-2 text-primary-600" />
              Generate Insights
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Survey
              </label>
              <select
                value={selectedSurvey}
                onChange={(e) => setSelectedSurvey(e.target.value)}
                className="input"
              >
                <option value="">Choose a survey...</option>
                {/* This would be populated with actual surveys */}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Insight Type
              </label>
              <div className="grid grid-cols-1 gap-2">
                {insightTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      if (!selectedSurvey) {
                        toast.error('Please select a survey first')
                        return
                      }
                      generateInsightMutation.mutate({
                        surveyId: selectedSurvey,
                        type: type.value
                      })
                    }}
                    disabled={!selectedSurvey || generateInsightMutation.isLoading}
                    className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{type.label}</p>
                        <p className="text-xs text-gray-500">{type.description}</p>
                      </div>
                      <PlusIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Insights */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-primary-600" />
            Recent AI Insights
          </h3>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No insights yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Generate your first AI insight to see it here.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
