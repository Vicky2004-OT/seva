import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { usersAPI } from '../services/api'
import { User, UserRole } from '../types'
import { 
  UserGroupIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export function UsersPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', page, search, roleFilter],
    queryFn: () => usersAPI.getUsers({ 
      page, 
      limit: 10,
      ...(search && { search }),
      ...(roleFilter && { role: roleFilter })
    })
  })

  const toggleUserMutation = useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: 'activate' | 'deactivate' }) => 
      action === 'activate' ? usersAPI.activateUser(userId) : usersAPI.deactivateUser(userId),
    onSuccess: () => {
      toast.success(`User ${action}d successfully!`)
      queryClient.invalidateQueries(['users'])
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || `Failed to ${action} user`)
    }
  })

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-red-100 text-red-800'
      case UserRole.ANALYST:
        return 'bg-purple-100 text-purple-800'
      case UserRole.NGO:
        return 'bg-blue-100 text-blue-800'
      case UserRole.FIELD_WORKER:
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircleIcon className="h-5 w-5 text-green-500" />
    ) : (
      <XCircleIcon className="h-5 w-5 text-red-500" />
    )
  }

  if (user?.role !== UserRole.ADMIN) {
    return (
      <div className="text-center py-12">
        <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Restricted</h3>
        <p className="mt-1 text-sm text-gray-500">
          User management is only available to administrators.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage user accounts and permissions for the SevaSync platform.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
                placeholder="Search users..."
              />
            </div>
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input text-sm w-40"
          >
            <option value="">All Roles</option>
            <option value={UserRole.ADMIN}>Administrator</option>
            <option value={UserRole.ANALYST}>Data Analyst</option>
            <option value={UserRole.NGO}>NGO Staff</option>
            <option value={UserRole.FIELD_WORKER}>Field Worker</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {usersData?.data && usersData.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersData.data.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{userItem.name}</div>
                        <div className="text-sm text-gray-500">{userItem.email}</div>
                        {userItem.phone && (
                          <div className="text-xs text-gray-400">{userItem.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(userItem.role)}`}>
                        {userItem.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {userItem.organization || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(userItem.isActive)}
                        <span className="ml-2 text-sm text-gray-900">
                          {userItem.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {userItem.lastLogin 
                        ? new Date(userItem.lastLogin).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-gray-600 hover:text-gray-900" title="Edit">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to ${userItem.isActive ? 'deactivate' : 'activate'} this user?`)) {
                              toggleUserMutation.mutate({
                                userId: userItem.id,
                                action: userItem.isActive ? 'deactivate' : 'activate'
                              })
                            }
                          }}
                          className={`${userItem.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                          title={userItem.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {userItem.isActive ? (
                            <XCircleIcon className="h-4 w-4" />
                          ) : (
                            <CheckCircleIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search || roleFilter ? 'Try adjusting your filters' : 'No users have been registered yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {usersData?.pagination && usersData.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((usersData.pagination.page - 1) * usersData.pagination.limit) + 1} to{' '}
            {Math.min(usersData.pagination.page * usersData.pagination.limit, usersData.pagination.total)} of{' '}
            {usersData.pagination.total} results
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
              Page {usersData.pagination.page} of {usersData.pagination.pages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === usersData.pagination.pages}
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
