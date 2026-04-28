export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export enum UserRole {
  ADMIN = 'admin',
  ANALYST = 'analyst',
  NGO = 'ngo',
  FIELD_WORKER = 'field_worker'
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  organization?: string;
  questions: SurveyQuestion[];
  responses: SurveyResponse[];
  status: SurveyStatus;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  expiresAt?: Date;
  isOfflineCapable: boolean;
  targetAudience?: string[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  order: number;
}

export enum QuestionType {
  TEXT = 'text',
  NUMBER = 'number',
  EMAIL = 'email',
  PHONE = 'phone',
  DATE = 'date',
  TIME = 'time',
  MULTIPLE_CHOICE = 'multiple_choice',
  CHECKBOX = 'checkbox',
  RATING = 'rating',
  LOCATION = 'location',
  PHOTO = 'photo',
  FILE = 'file'
}

export enum SurveyStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
  ARCHIVED = 'archived'
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  respondentId: string;
  answers: SurveyAnswer[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  deviceInfo?: {
    userAgent: string;
    platform: string;
    offlineMode: boolean;
  };
  submittedAt: Date;
  syncedAt?: Date;
  isOffline: boolean;
}

export interface SurveyAnswer {
  questionId: string;
  value: any;
  type: QuestionType;
  timestamp: Date;
}

export interface AIInsight {
  id: string;
  surveyId: string;
  type: InsightType;
  title: string;
  description: string;
  confidence: number;
  data: any;
  generatedAt: Date;
  createdBy: string;
}

export enum InsightType {
  TREND = 'trend',
  ANOMALY = 'anomaly',
  PATTERN = 'pattern',
  PREDICTION = 'prediction',
  SUMMARY = 'summary',
  RECOMMENDATION = 'recommendation'
}

export interface AnalyticsStats {
  totalSurveys: number;
  totalResponses: number;
  activeUsers: number;
  organizationsCount: number;
  recentActivity: ActivityItem[];
  responseRate: number;
  avgCompletionTime: number;
  topRegions: RegionStats[];
}

export interface ActivityItem {
  id: string;
  type: 'survey_created' | 'response_submitted' | 'user_registered' | 'insight_generated';
  description: string;
  timestamp: Date;
  userId: string;
  metadata?: any;
}

export interface RegionStats {
  region: string;
  responseCount: number;
  percentage: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  organization?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
