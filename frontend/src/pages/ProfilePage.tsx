import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth'
import { UserIcon, EnvelopeIcon, BuildingOfficeIcon, PhoneIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      organization: user?.organization || '',
      phone: user?.phone || ''
    }
  })

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    try {
      await updateProfile(data)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Profile Information</h3>
          
          <div className="flex items-center mb-6">
            <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
              <UserIcon className="h-12 w-12 text-primary-600" />
            </div>
            <div className="ml-6">
              <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
              <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('name', { 
                      required: 'Name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters'
                      }
                    })}
                    type="text"
                    className="input pl-10"
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-error-600">{errors.name.message as string}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    disabled
                    className="input pl-10 bg-gray-50"
                    placeholder="Enter your email"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
              </div>

              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                  Organization
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('organization')}
                    type="text"
                    className="input pl-10"
                    placeholder="Enter your organization"
                  />
                </div>
                {errors.organization && (
                  <p className="mt-1 text-sm text-error-600">{errors.organization.message as string}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="input pl-10"
                    placeholder="Enter your phone number"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-error-600">{errors.phone.message as string}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => reset()}
                className="btn-secondary mr-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
