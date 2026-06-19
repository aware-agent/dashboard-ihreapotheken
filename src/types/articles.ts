export interface Article {
  id: string;
  url: string;
  title: string;
  image: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  language: string;
  healthZones: string[];
  knownBiomarkers: string[];
}

export interface ArticlesResponse {
  articles: Article[];
}
