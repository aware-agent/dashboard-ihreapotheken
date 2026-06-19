// Biomarker info within health zone
export interface HealthZoneBiomarker {
  code: string;
  name: string;
  unit: string;
  biomarkerIcon: string | null;
}

// About section for health zone
export interface HealthZoneAbout {
  description: string;
  title: string;
  image: string | null;
  url: string | null;
}

// Health tip item
export interface HealthTipItem {
  id: string;
  title: string;
  description: string;
  image: string | null;
}

// Health tip for a zone
export interface HealthTip {
  id: string;
  title: string;
  healthZoneId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  language: string;
  healthTipItems: HealthTipItem[];
}

// Related article
export interface RelatedArticle {
  id: string;
  image: string | null;
  title: string;
  url: string;
  language: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

// Health zone from API
export interface HealthZone {
  id: string;
  name: string;
  icon: string | null;
  about: HealthZoneAbout;
  description: string;
  knownBiomarkers: HealthZoneBiomarker[];
  healthTip: HealthTip | null;
  relatedArticles: RelatedArticle[];
}

// Health zones API response
export interface HealthZonesResponse {
  healthZones: HealthZone[];
}
