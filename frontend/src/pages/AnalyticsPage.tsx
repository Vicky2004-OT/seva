import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsAPI } from '../services/api'
import { 
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d')

  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics-stats', timeRange],
    queryFn: analyticsAPI.getStats
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const statCards = [
    {
      name: 'Total Surveys',
      value: stats?.totalSurveys || 0,
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      name: 'Total Responses',
      value: stats?.totalResponses || 0,
      icon: ChartBarIcon,
      color: 'bg-green-500',
      change: '+23%'
    },
    {
      name: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: UserGroupIcon,
      color: 'bg-purple-500',
      change: '+8%'
    },
    {
      name: 'Organizations',
      value: stats?.organizationsCount || 0,
      icon: BuildingOfficeIcon,
      color: 'bg-orange-500',
      change: '+5%'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-600">
          Monitor and analyze your humanitarian data collection performance.
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input text-sm w-40"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-md ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-500">{stat.name}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
              <span className="ml-1 text-sm text-green-600">{stat.change}</span>
              <span className="ml-1 text-sm text-gray-500">from last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Rate Chart */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Response Rate</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600">
                {stats?.responseRate ? `${stats.responseRate.toFixed(1)}%` : '0%'}
              </div>
              <p className="text-sm text-gray-500 mt-2">Average response rate</p>
            </div>
          </div>
        </div>

        {/* Survey Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Survey Status</h3>
          <div className="space-y-3">
            {stats?.surveyStats && Object.entries(stats.surveyStats).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-3 ${
                    status === 'published' ? 'bg-green-500' :
                    status === 'draft' ? 'bg-yellow-500' :
                    status === 'closed' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="text-sm text-gray-700 capitalize">{status}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
          
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="flow-root">
              <ul className="-mb-8">
                {stats.recentActivity.slice(0, 10).map((activity, index) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {index !== stats.recentActivity.slice(0, 10).length - 1 && (
                        <div className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" />
                      )}
                      <div className="relative flex items-start space-x-3">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center ring-8 ring-white">
                            <ChartBarIcon className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5">
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start creating surveys and collecting data to see activity here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
