import { apiClient } from './client';
import { ArticlesResponse } from '@/types/articles';

export async function fetchArticles(): Promise<ArticlesResponse> {
  return apiClient.get<ArticlesResponse>('/v1/articles', true);
}
