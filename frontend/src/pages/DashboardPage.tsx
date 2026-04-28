import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { analyticsAPI } from '../services/api'
import { 
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

export function DashboardPage() {
  const { user } = useAuth()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
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
      icon: ClipboardDocumentListIcon,
      color: 'bg-blue-500',
      href: '/surveys'
    },
    {
      name: 'Total Responses',
      value: stats?.totalResponses || 0,
      icon: DocumentTextIcon,
      color: 'bg-green-500',
      href: '/analytics'
    },
    {
      name: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: UserGroupIcon,
      color: 'bg-purple-500',
      href: user?.role === 'admin' ? '/users' : '#'
    },
    {
      name: 'Organizations',
      value: stats?.organizationsCount || 0,
      icon: ChartBarIcon,
      color: 'bg-orange-500',
      href: '#'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back, {user?.name}! Here's what's happening with your humanitarian data.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="group block p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-md ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-500 truncate">{stat.name}</dd>
                </dl>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
          
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="flow-root">
              <ul className="-mb-8">
                {stats.recentActivity.slice(0, 5).map((activity, index) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {index !== stats.recentActivity.slice(0, 5).length - 1 && (
                        <div className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" />
                      )}
                      <div className="relative flex items-start space-x-3">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center ring-8 ring-white">
                            <ClockIcon className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-900">{activity.description}</p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <span className="capitalize">{activity.type.replace('_', ' ')}</span>
                          </div>
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
                Get started by creating a survey or analyzing data.
              </p>
              <div className="mt-6">
                <Link
                  to="/surveys/create"
                  className="btn-primary"
                >
                  Create Survey
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <ArrowTrendingUpIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Response Rate</h3>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.responseRate ? `${stats.responseRate.toFixed(1)}%` : '0%'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <ClipboardDocumentListIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Draft Surveys</h3>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.surveyStats?.draft || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">AI Insights</h3>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalInsights || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
