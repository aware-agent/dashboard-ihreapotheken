import { API_BASE_URL } from '@/config/urls';

// Token getter type - will be imported from client
type TokenGetter = () => string | null;
let globalGetAccessToken: TokenGetter = () => null;

export function setFileUploadTokenGetter(getter: TokenGetter): void {
  globalGetAccessToken = getter;
}

export interface FileUploadResponse {
  files: string[];
}

export interface CreateScanRequest {
  fileIds: string[];
}

export interface CreateScanResponse {
  id: string;
  status: string;
  createdAt: string;
}

export interface ScanFile {
  imageUrl: string;
  thumbnailUrl: string;
}

export interface ScanStatusResponse {
  files: ScanFile[];
}

export interface Scan {
  id: string;
  status: 'SENT' | 'COMPLETED' | 'FAILED';
  error: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  resultId: string | null;
  deleted: boolean;
  externalAnalysisId: string | null;
  retrySendFile: number;
  retryGetReport: number;
}

export type ScansListResponse = Scan[];

export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<FileUploadResponse> {
  const token = globalGetAccessToken();

  const formData = new FormData();
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response: FileUploadResponse = JSON.parse(xhr.responseText);
          resolve(response);
        } catch {
          reject(new Error('Invalid response format'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.message || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    xhr.open('POST', `${API_BASE_URL}/v1/files`);

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.send(formData);
  });
}

export async function createScan(fileIds: string[]): Promise<CreateScanResponse> {
  const token = globalGetAccessToken();

  const response = await fetch(`${API_BASE_URL}/v1/scans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ fileIds }),
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to create scan: ${response.status}`);
    } catch (e) {
      if (e instanceof Error && e.message !== `Failed to create scan: ${response.status}`) {
        throw e;
      }
      throw new Error(`Failed to create scan: ${response.status}`);
    }
  }

  return response.json();
}

export async function getScanStatus(scanId: string): Promise<ScanStatusResponse> {
  const token = globalGetAccessToken();

  const response = await fetch(`${API_BASE_URL}/v1/scans/${scanId}/files`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get scan status: ${response.status}`);
  }

  return response.json();
}

export async function getUserScans(userId: string): Promise<ScansListResponse> {
  const token = globalGetAccessToken();

  const response = await fetch(`${API_BASE_URL}/v1/scans?userId=${userId}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get scans: ${response.status}`);
  }

  return response.json();
}

export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

export const SUPPORTED_EXTENSIONS = ['.pdf', '.png', '.jpeg', '.jpg'];

export function isValidFileType(file: File): boolean {
  const hasValidType = SUPPORTED_FILE_TYPES.includes(file.type);
  const hasValidExtension = SUPPORTED_EXTENSIONS.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  );
  return hasValidType || hasValidExtension;
}
