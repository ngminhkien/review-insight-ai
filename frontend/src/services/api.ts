import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Review {
  id?: number;
  dataset_id?: number;
  review_id?: string;
  product_id?: string;
  product_type?: string;
  rating?: number;
  review_text: string;
  clean_text?: string;
  date?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  confidence?: number;
  aspects?: string | string[];
  priority?: 'low' | 'medium' | 'high';
  created_at?: string;
}

export interface Dataset {
  id: number;
  filename: string;
  total_reviews: number;
  status: 'pending' | 'success' | 'failed';
  error_message?: string;
  created_at: string;
}

export interface AnalyticsPayload {
  total_reviews: number;
  positive: number;
  neutral: number;
  negative: number;
  sentiment_distribution: Record<string, number>;
  priority_distribution: Record<string, number>;
  top_negative_aspects: Record<string, number>;
  top_positive_aspects: Record<string, number>;
  frequent_words_positive?: Record<string, number>;
  frequent_words_negative?: Record<string, number>;
  aspect_sentiment_breakdown?: Record<string, Record<string, number>>;
  aspect_word_stats?: Record<string, {
    positive: Record<string, number>;
    negative: Record<string, number>;
  }>;
  product_sentiments?: Record<string, Record<string, number>>;
}

export interface AnalysisReport {
  id: number;
  dataset_id: number;
  analytics: AnalyticsPayload;
  insights: string[];
  recommendations: string[];
  created_at: string;
  filename?: string;
  total_reviews?: number;
  status?: 'pending' | 'success' | 'failed';
  llm_advice?: LlmProductAdvice | null;
  llm_model?: string | null;
  llm_generated_at?: string | null;
}

export interface ProductAssessment {
  product_id: string;
  product_type?: string | null;
  overview: string;
  strengths: string[];
  issues: string[];
  recommendations: string[];
}

export interface LlmProductAdvice {
  executive_summary: string;
  key_findings: string[];
  product_assessments: ProductAssessment[];
  priority_actions: string[];
  limitations: string[];
}

export interface DashboardStats {
  total_reviews: number;
  sentiment_summary: { sentiment: string; count: number }[];
  rating_distribution: { rating: number; count: number }[];
}

export const apiService = {
  getHealth: async () => {
    const response = await client.get('/api/health');
    return response.data;
  },

  uploadCsv: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post('/api/reviews/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  analyzeSingle: async (payload: {
    review_text: string;
    product_id?: string;
    product_type?: string;
    rating?: number;
    date?: string;
    review_id?: string;
  }) => {
    const response = await client.post('/api/reviews/analyze-single', payload);
    return response.data;
  },

  listReviews: async (limit: number = 50) => {
    const response = await client.get<{ data: Review[] }>(`/api/reviews?limit=${limit}`);
    return response.data;
  },

  getReviewDetail: async (id: number) => {
    const response = await client.get<Review>(`/api/reviews/${id}`);
    return response.data;
  },

  getDashboard: async () => {
    const response = await client.get<DashboardStats>('/api/dashboard');
    return response.data;
  },

  getReport: async (id: number) => {
    const response = await client.get<AnalysisReport>(`/api/reports/${id}`);
    return response.data;
  },

  generateLlmAdvice: async (id: number, model?: string) => {
    const response = await client.post<{
      report_id: number;
      model: string;
      advice: LlmProductAdvice;
    }>(`/api/reports/${id}/generate-llm`, model ? { model } : {});
    return response.data;
  },
};
