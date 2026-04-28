import axios, { AxiosResponse } from 'axios'
import toast from 'react-hot-toast'
import { 
  ApiResponse, 
  AuthResponse, 
  LoginCredentials, 
  RegisterData, 
  User,
  Survey,
  PaginatedResponse,
  CreateSurveyData,
  AnalyticsStats,
  AIQueryRequest,
  AIQueryResponse,
  AIInsight,
  GenerateInsightRequest
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response
  },
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred'
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    
    toast.error(message)
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials)
    return response.data.data!
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data)
    return response.data.data!
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/profile')
    return response.data.data!
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>('/auth/profile', data)
    return response.data.data!
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await api.put('/auth/change-password', data)
  },
}

// Surveys API
export const surveysAPI = {
  getSurveys: async (params?: { 
    page?: number; 
    limit?: number; 
    status?: string; 
    role?: string 
  }): Promise<PaginatedResponse<Survey>> => {
    const response = await api.get<ApiResponse<Survey[]>>('/surveys', { params })
    return response.data as PaginatedResponse<Survey>
  },

  getSurvey: async (id: string): Promise<Survey> => {
    const response = await api.get<ApiResponse<Survey>>(`/surveys/${id}`)
    return response.data.data!
  },

  createSurvey: async (data: CreateSurveyData): Promise<Survey> => {
    const response = await api.post<ApiResponse<Survey>>('/surveys', data)
    return response.data.data!
  },

  updateSurvey: async (id: string, data: CreateSurveyData): Promise<Survey> => {
    const response = await api.put<ApiResponse<Survey>>(`/surveys/${id}`, data)
    return response.data.data!
  },

  publishSurvey: async (id: string): Promise<void> => {
    await api.post(`/surveys/${id}/publish`)
  },

  closeSurvey: async (id: string): Promise<void> => {
    await api.post(`/surveys/${id}/close`)
  },

  deleteSurvey: async (id: string): Promise<void> => {
    await api.delete(`/surveys/${id}`)
  },
}

// Analytics API
export const analyticsAPI = {
  getStats: async (): Promise<AnalyticsStats> => {
    const response = await api.get<ApiResponse<AnalyticsStats>>('/stats')
    return response.data.data!
  },

  getSurveyStats: async (id: string): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/stats/survey/${id}`)
    return response.data.data!
  },

  getUserStats: async (id: string): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/stats/user/${id}`)
    return response.data.data!
  },
}

// AI Analytics API
export const aiAPI = {
  query: async (data: AIQueryRequest): Promise<AIQueryResponse> => {
    const response = await api.post<ApiResponse<AIQueryResponse>>('/ai/query', data)
    return response.data.data!
  },

  generateInsight: async (data: GenerateInsightRequest): Promise<AIInsight> => {
    const response = await api.post<ApiResponse<AIInsight>>('/ai/insights', data)
    return response.data.data!
  },

  getInsights: async (surveyId: string): Promise<AIInsight[]> => {
    const response = await api.get<ApiResponse<AIInsight[]>>(`/ai/insights/${surveyId}`)
    return response.data.data!
  },

  deleteInsight: async (id: string): Promise<void> => {
    await api.delete(`/ai/insights/${id}`)
  },
}

// Users API
export const usersAPI = {
  getUsers: async (params?: { 
    page?: number; 
    limit?: number; 
    role?: string; 
    organization?: string 
  }): Promise<PaginatedResponse<User>> => {
    const response = await api.get<ApiResponse<User[]>>('/users', { params })
    return response.data as PaginatedResponse<User>
  },

  getUser: async (id: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`)
    return response.data.data!
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data)
    return response.data.data!
  },

  deactivateUser: async (id: string): Promise<void> => {
    await api.post(`/users/${id}/deactivate`)
  },

  activateUser: async (id: string): Promise<void> => {
    await api.post(`/users/${id}/activate`)
  },
}

export default api
