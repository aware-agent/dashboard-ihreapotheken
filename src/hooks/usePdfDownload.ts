import { useState } from 'react';
import { resultsApi } from '@/api/results';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/hooks/useLocale';

export function usePdfDownload() {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  const { t } = useLocale();

  const downloadPdf = async (resultId: string, filename?: string) => {
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      const blob = await resultsApi.getPdf(resultId);
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = filename || `blood-test-results-${resultId}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: t('toast.downloadStarted'),
        description: t('toast.pdfBeingDownloaded'),
      });
    } catch (error) {
      console.error('Failed to download PDF:', error);
      toast({
        title: t('errors.downloadFailed'),
        description: t('errors.unableToDownloadPdf'),
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return { downloadPdf, isDownloading };
}