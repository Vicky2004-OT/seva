import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { surveysAPI } from '../services/api'
import { QuestionType, UserRole } from '../types'
import { 
  PlusIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export function CreateSurveyPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      questions: [
        {
          type: QuestionType.TEXT,
          title: '',
          description: '',
          required: false,
          order: 0
        }
      ],
      isOfflineCapable: true
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions'
  })

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    try {
      const surveyData = {
        ...data,
        questions: data.questions.map((q: any, index: number) => ({
          ...q,
          order: index
        }))
      }
      
      await surveysAPI.createSurvey(surveyData)
      toast.success('Survey created successfully!')
      navigate('/surveys')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create survey')
    } finally {
      setIsLoading(false)
    }
  }

  const addQuestion = () => {
    append({
      type: QuestionType.TEXT,
      title: '',
      description: '',
      required: false,
      order: fields.length
    })
  }

  const questionTypes = [
    { value: QuestionType.TEXT, label: 'Short Text' },
    { value: QuestionType.NUMBER, label: 'Number' },
    { value: QuestionType.EMAIL, label: 'Email' },
    { value: QuestionType.PHONE, label: 'Phone' },
    { value: QuestionType.DATE, label: 'Date' },
    { value: QuestionType.TIME, label: 'Time' },
    { value: QuestionType.MULTIPLE_CHOICE, label: 'Multiple Choice' },
    { value: QuestionType.CHECKBOX, label: 'Checkbox' },
    { value: QuestionType.RATING, label: 'Rating' },
    { value: QuestionType.LOCATION, label: 'Location' },
    { value: QuestionType.PHOTO, label: 'Photo' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Create New Survey</h3>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Survey Details */}
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Survey Title *
                </label>
                <input
                  {...register('title', { 
                    required: 'Title is required',
                    minLength: {
                      value: 3,
                      message: 'Title must be at least 3 characters'
                    }
                  })}
                  type="text"
                  className="input mt-1"
                  placeholder="Enter survey title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-error-600">{errors.title.message as string}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="input mt-1"
                  placeholder="Describe the purpose of this survey"
                />
              </div>

              {user?.role === UserRole.NGO && (
                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                    Organization
                  </label>
                  <input
                    {...register('organization')}
                    type="text"
                    className="input mt-1"
                    defaultValue={user.organization}
                    placeholder="Organization name"
                  />
                </div>
              )}
            </div>

            {/* Questions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-900">Questions</h4>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="btn-secondary"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Question
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-700">Question {index + 1}</span>
                          <select
                            {...register(`questions.${index}.type`)}
                            className="input text-sm w-48"
                          >
                            {questionTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <input
                          {...register(`questions.${index}.title`, { 
                            required: 'Question title is required'
                          })}
                          type="text"
                          className="input"
                          placeholder="Enter question text"
                        />
                      </div>

                      <div>
                        <textarea
                          {...register(`questions.${index}.description`)}
                          rows={2}
                          className="input"
                          placeholder="Additional description (optional)"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          {...register(`questions.${index}.required`)}
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          Required question
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/surveys')}
                className="btn-secondary"
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
                    Creating...
                  </div>
                ) : (
                  'Create Survey'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
