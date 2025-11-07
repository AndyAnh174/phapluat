import axios, { AxiosError, AxiosInstance } from 'axios';

// In development, server doesn't have /api prefix
// In production with reverse proxy, use /api prefix
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      // Don't show alert on homepage to avoid spam
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      if (currentPath !== '/' && !currentPath.startsWith('/auth/callback')) {
        console.error('Không thể kết nối đến server. Vui lòng kiểm tra server có đang chạy không.');
      }
    }
    
    if (error.response?.status === 401) {
      // Clear token on unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        
        // Only redirect to login if we're on a protected route (admin dashboard)
        // Don't redirect if we're on the homepage or public pages
        const currentPath = window.location.pathname;
        const protectedRoutes = ['/login/dashboard', '/student/exam'];
        const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));
        
        if (isProtectedRoute) {
          window.location.href = '/login';
        }
        // For public pages, just clear the token and let the page continue
      }
    }
    return Promise.reject(error);
  }
);

// Types
export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  accessToken: string;
  admin: {
    username: string;
    role: string;
  };
}

export interface StudentProfile {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export interface ExamSet {
  _id: string;
  name: string;
  description: string;
  durationMinutes: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  _id: string;
  examSetId: string;
  content: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: string;
  order: number;
  createdAt?: string;
}

export interface ExamStatus {
  isActive: boolean;
  exam?: {
    examSetId: string;
    name: string;
    durationMinutes: number;
    activatedAt: string;
    startDate?: string;
    endDate?: string;
  };
  activeExam?: {
    examSetId: string;
    examSet: ExamSet;
    activatedAt: string;
    startDate?: string;
    endDate?: string;
  };
}

export interface ExamSession {
  sessionId: string;
  examSetId: string;
  questions: Omit<Question, 'correctAnswer'>[];
  startedAt: string;
  durationMinutes: number;
}

export interface SubmitExamRequest {
  sessionId: string;
  answers: {
    questionId: string;
    selectedAnswer: string;
  }[];
}

export interface ExamResult {
  sessionId: string;
  examSetId: string;
  examSet?: ExamSet;
  user?: {
    name?: string;
    email?: string;
  };
  score: number;
  totalQuestions: number;
  percentage: number;
  startedAt: string;
  submittedAt: string;
  answers: {
    questionId: string;
    question: Question;
    selectedAnswer: string;
    isCorrect: boolean;
  }[];
}

export interface Book {
  _id: string;
  title: string;
  subtitle?: string;
  description: string;
  coverImageUrl?: string;
  quote?: string;
  author: string;
  publishedAt: string;
  isPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth API
export const authAPI = {
  adminLogin: async (data: AdminLoginRequest): Promise<AdminLoginResponse> => {
    const response = await apiClient.post<AdminLoginResponse>('/auth/admin/login', data);
    return response.data;
  },

  getAdminProfile: async () => {
    const response = await apiClient.get('/auth/admin/me');
    return response.data;
  },

  getStudentProfile: async (): Promise<StudentProfile> => {
    const response = await apiClient.get<StudentProfile>('/auth/student/me');
    return response.data;
  },
};

// Exam Sets API
export const examSetsAPI = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<ExamSet>> => {
    const response = await apiClient.get<PaginatedResponse<ExamSet>>('/admin/exam-sets', {
      params: { page, limit },
    });
    return response.data;
  },

  getById: async (id: string): Promise<ExamSet> => {
    const response = await apiClient.get<ExamSet>(`/admin/exam-sets/${id}`);
    return response.data;
  },

  create: async (data: { name: string; description: string; durationMinutes: number }): Promise<ExamSet> => {
    const response = await apiClient.post<ExamSet>('/admin/exam-sets', data);
    return response.data;
  },

  update: async (id: string, data: Partial<ExamSet>): Promise<ExamSet> => {
    const response = await apiClient.patch<ExamSet>(`/admin/exam-sets/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/exam-sets/${id}`);
  },

  duplicate: async (id: string): Promise<ExamSet> => {
    const response = await apiClient.post<ExamSet>(`/admin/exam-sets/${id}/duplicate`);
    return response.data;
  },
};

// Questions API
export const questionsAPI = {
  getAll: async (examSetId: string): Promise<Question[]> => {
    const response = await apiClient.get<Question[]>(`/admin/exam-sets/${examSetId}/questions`);
    return response.data;
  },

  getById: async (id: string): Promise<Question> => {
    const response = await apiClient.get<Question>(`/admin/questions/${id}`);
    return response.data;
  },

  create: async (examSetId: string, data: Omit<Question, '_id' | 'examSetId' | 'createdAt'>): Promise<Question> => {
    const response = await apiClient.post<Question>(`/admin/exam-sets/${examSetId}/questions`, data);
    return response.data;
  },

  bulkCreate: async (examSetId: string, questions: Omit<Question, '_id' | 'examSetId' | 'createdAt'>[]): Promise<Question[]> => {
    const response = await apiClient.post<Question[]>(`/admin/exam-sets/${examSetId}/questions/bulk`, { questions });
    return response.data;
  },

  update: async (id: string, data: Partial<Question>): Promise<Question> => {
    const response = await apiClient.patch<Question>(`/admin/questions/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/questions/${id}`);
  },
};

// Exam API
export const examAPI = {
  getStatus: async (): Promise<ExamStatus> => {
    const response = await apiClient.get<ExamStatus>('/student/exam/status');
    return response.data;
  },

  getAdminStatus: async (): Promise<ExamStatus> => {
    const response = await apiClient.get<ExamStatus>('/admin/exam/status');
    return response.data;
  },

  activate: async (examSetId: string, startDate?: string, endDate?: string): Promise<void> => {
    await apiClient.post('/admin/exam/activate', { examSetId, startDate, endDate });
  },

  deactivate: async (): Promise<void> => {
    await apiClient.post('/admin/exam/deactivate');
  },

  start: async (): Promise<ExamSession> => {
    const response = await apiClient.post<ExamSession>('/student/exam/start');
    return response.data;
  },

  submit: async (data: SubmitExamRequest): Promise<{ sessionId: string; score: number; totalQuestions: number; percentage: number; submittedAt: string }> => {
    const response = await apiClient.post('/student/exam/submit', data);
    return response.data;
  },

  getResult: async (sessionId: string): Promise<ExamResult> => {
    const response = await apiClient.get<ExamResult>(`/student/exam/result/${sessionId}`);
    return response.data;
  },
};

// Results API
export const resultsAPI = {
  getAll: async (examSetId?: string, page = 1, limit = 10): Promise<PaginatedResponse<ExamResult>> => {
    const response = await apiClient.get('/admin/results', {
      params: { examSetId, page, limit },
    });
    return response.data;
  },

  getById: async (sessionId: string): Promise<ExamResult> => {
    const response = await apiClient.get<ExamResult>(`/admin/results/${sessionId}`);
    return response.data;
  },

  reset: async (sessionId: string): Promise<void> => {
    await apiClient.post(`/admin/results/${sessionId}/reset`);
  },

  exportJSON: async (examSetId?: string): Promise<ExamResult[]> => {
    const response = await apiClient.get('/admin/results/export/json', {
      params: { examSetId },
    });
    return response.data;
  },

  exportCSV: async (examSetId?: string): Promise<Blob> => {
    const response = await apiClient.get('/admin/results/export/csv', {
      params: { examSetId },
      responseType: 'blob',
    });
    return response.data;
  },
};

// Books API
export const booksAPI = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Book>> => {
    const response = await apiClient.get<PaginatedResponse<Book>>('/books', {
      params: { page, limit },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Book> => {
    const response = await apiClient.get<Book>(`/books/${id}`);
    return response.data;
  },

  getAllAdmin: async (params?: { author?: string; year?: number; isPublic?: boolean; page?: number; limit?: number }): Promise<PaginatedResponse<Book>> => {
    const response = await apiClient.get<PaginatedResponse<Book>>('/admin/books', { params });
    return response.data;
  },

  getByIdAdmin: async (id: string): Promise<Book> => {
    const response = await apiClient.get<Book>(`/admin/books/${id}`);
    return response.data;
  },

  create: async (data: Omit<Book, '_id' | 'createdAt' | 'updatedAt'>): Promise<Book> => {
    const response = await apiClient.post<Book>('/admin/books', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Book>): Promise<Book> => {
    const response = await apiClient.patch<Book>(`/admin/books/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/books/${id}`);
  },
};

export default apiClient;

