import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  RotateCcw,
  Loader2,
  Clock,
  ExternalLink,
} from "lucide-react";
import uploadIcon from "@/assets/upload-icon.svg";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PageLayout } from "@/components/PageLayout";
import {
  uploadFile,
  createScan,
  getScanStatus,
  getUserScans,
  isValidFileType,
  SUPPORTED_EXTENSIONS,
  Scan,
  ScanFile,
} from "@/api/files";
import { useUserProfile } from "@/hooks/useUser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/hooks/useLocale";
import { formatShortDate } from "@/lib/dateUtils";
import { UploadsInfo } from "@/components/uploads/UploadsInfo";

interface UploadingFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "processing" | "success" | "error";
  progress: number;
  error?: string;
  scanId?: string;
}

interface ScanWithFiles extends Scan {
  files?: ScanFile[];
}

const POLL_INTERVAL = 3000;
const MAX_POLL_ATTEMPTS = 3;
const ITEMS_PER_PAGE = 12;

export default function Uploads() {
  const { t, locale } = useLocale();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const { toast } = useToast();
  const pollIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { data: user } = useUserProfile();
  const queryClient = useQueryClient();

  // Fetch user's scans
  const {
    data: scans = [],
    isLoading: scansLoading,
    refetch: refetchScans,
  } = useQuery({
    queryKey: ["scans", user?.id],
    queryFn: () => getUserScans(user!.id),
    enabled: !!user?.id,
    staleTime: 30000,
  });

  // Store scan files for display
  const [scanFilesMap, setScanFilesMap] = useState<Record<string, ScanFile[]>>(
    {},
  );

  // Combine uploading files and existing scans (moved up for use in effects)
  const allScans = scans.filter((s) => !s.deleted);

  // Fetch files for each scan
  useEffect(() => {
    const fetchScanFiles = async () => {
      for (const scan of scans) {
        if (!scanFilesMap[scan.id]) {
          try {
            const status = await getScanStatus(scan.id);
            if (status.files?.length > 0) {
              setScanFilesMap((prev) => ({ ...prev, [scan.id]: status.files }));
            }
          } catch (error) {
            console.error(`Failed to fetch files for scan ${scan.id}:`, error);
          }
        }
      }
    };
    if (scans.length > 0) {
      fetchScanFiles();
    }
  }, [scans]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      pollIntervalsRef.current.forEach((interval) => clearInterval(interval));
    };
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < allScans.length) {
          setDisplayCount((prev) =>
            Math.min(prev + ITEMS_PER_PAGE, allScans.length),
          );
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [displayCount, allScans.length]);

  // Reset display count when scans change significantly
  useEffect(() => {
    if (scans.length > 0 && displayCount > scans.length) {
      setDisplayCount(Math.max(ITEMS_PER_PAGE, scans.length));
    }
  }, [scans.length]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        handleFiles(selectedFiles);
      }
    },
    [],
  );

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      const isValid = isValidFileType(file);
      if (!isValid) {
        toast({
          title: t("uploads.invalidFileType"),
          description: `${file.name} ${t("uploads.notSupported")} ${SUPPORTED_EXTENSIONS.join(", ")}.`,
          variant: "destructive",
        });
      }
      return isValid;
    });

    const files: UploadingFile[] = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "pending",
      progress: 0,
    }));

    setUploadingFiles((prev) => [...files, ...prev]);

    files.forEach((uploadedFile) => {
      performUpload(uploadedFile.id, uploadedFile.file);
    });
  };

  const startPolling = (fileId: string, scanId: string) => {
    let errorAttempts = 0;
    let pollAttempts = 0;
    const MAX_POLL_ATTEMPTS_TOTAL = 60;

    const stopPolling = (fileId: string) => {
      const interval = pollIntervalsRef.current.get(fileId);
      if (interval) {
        clearInterval(interval);
        pollIntervalsRef.current.delete(fileId);
      }
    };

    const poll = async () => {
      pollAttempts++;

      if (pollAttempts >= MAX_POLL_ATTEMPTS_TOTAL) {
        stopPolling(fileId);
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "error" as const,
                  error: "Processing timed out",
                }
              : f,
          ),
        );
        toast({
          title: t("uploads.processingTimedOut"),
          description: t("uploads.fileTakingTooLong"),
          variant: "destructive",
        });
        return;
      }

      try {
        const statusResponse = await getScanStatus(scanId);
        errorAttempts = 0;

        const scanFiles = statusResponse.files;

        if (
          Array.isArray(scanFiles) &&
          scanFiles.length > 0 &&
          scanFiles[0].imageUrl
        ) {
          stopPolling(fileId);

          // Remove from uploading list and refetch scans
          setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
          refetchScans();

          toast({
            title: t("uploads.uploadReceived"),
            description: t("uploads.resultsWillAppear"),
          });
        }
      } catch (error) {
        errorAttempts++;
        console.error(
          `Error polling scan status (attempt ${errorAttempts}/${MAX_POLL_ATTEMPTS}):`,
          error,
        );

        if (errorAttempts >= MAX_POLL_ATTEMPTS) {
          stopPolling(fileId);

          const errorMessage =
            error instanceof Error
              ? error.message
              : "Unable to check processing status";
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? { ...f, status: "error" as const, error: errorMessage }
                : f,
            ),
          );

          toast({
            title: t("uploads.processingCheckFailed"),
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL);
    pollIntervalsRef.current.set(fileId, interval);
    poll();
  };

  const performUpload = async (fileId: string, file: File) => {
    setUploadingFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: "uploading" as const } : f,
      ),
    );

    try {
      const uploadResponse = await uploadFile(file, (progress) => {
        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress } : f)),
        );
      });

      const uploadedFileId = uploadResponse.files?.[0];

      if (!uploadedFileId) {
        throw new Error("No file ID returned from upload");
      }

      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, status: "processing" as const, progress: 100 }
            : f,
        ),
      );

      toast({
        title: t("uploads.uploadComplete"),
        description: `${file.name} ${t("uploads.processingFile")}`,
      });

      const scanResponse = await createScan([uploadedFileId]);
      const scanId = scanResponse.id;

      if (!scanId) {
        throw new Error("No scan ID returned");
      }

      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, scanId } : f)),
      );

      startPolling(fileId, scanId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "error" as const,
                progress: 0,
                error: errorMessage,
              }
            : f,
        ),
      );

      toast({
        title: t("uploads.uploadFailed"),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const retryUpload = (fileId: string) => {
    if (pollIntervalsRef.current.has(fileId)) {
      clearInterval(pollIntervalsRef.current.get(fileId));
      pollIntervalsRef.current.delete(fileId);
    }

    const fileToRetry = uploadingFiles.find((f) => f.id === fileId);
    if (fileToRetry) {
      performUpload(fileId, fileToRetry.file);
    }
  };

  const removeUploadingFile = (fileId: string) => {
    if (pollIntervalsRef.current.has(fileId)) {
      clearInterval(pollIntervalsRef.current.get(fileId));
      pollIntervalsRef.current.delete(fileId);
    }
    setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const getStatusBadge = (status: Scan["status"]) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-hm-optimal50 text-hm-optimal200 caption-sm">
            <CheckCircle className="h-3 w-3" />
            {t("uploads.completed")}
          </span>
        );
      case "SENT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary caption-sm">
            <Clock className="h-3 w-3" />
            {t("uploads.processing")}
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-hm-highlow50 text-hm-highlow200 caption-sm">
            <AlertCircle className="h-3 w-3" />
            {t("uploads.failed")}
          </span>
        );
    }
  };

  // Prepare visible scans for infinite scroll
  const visibleScans = allScans.slice(0, displayCount);
  const hasMoreScans = displayCount < allScans.length;

  return (
    <PageLayout title={t("uploads.title")} subtitle={t("uploads.subtitle")}>
      <div className="flex items-center justify-end">
        <UploadsInfo />
      </div>
      {/* Upload zone */}
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center p-12 cursor-pointer transition-all border border-dashed rounded-xl bg-white",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50",
        )}
      >
        <input
          type="file"
          accept=".pdf,.png,.jpeg,.jpg,application/pdf,image/png,image/jpeg"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        <div
          className={cn(
            "p-4 rounded-2xl mb-4 transition-colors",
            isDragOver ? "bg-primary/10" : "bg-[#E2F2FF]",
          )}
        >
          <img src={uploadIcon} alt="Upload" className="h-10 w-10" />
        </div>
        <p className="caption-lg text-foreground mb-1">
          {isDragOver ? t("uploads.dropFilesHere") : t("uploads.dragAndDrop")}
        </p>
        <p className="body-sm text-muted-foreground mb-4">
          {t("uploads.orClickBrowse")}
        </p>
        <Button
          className="bg-foreground text-background hover:bg-foreground/90 rounded-lg px-6"
          onClick={() =>
            (
              document.querySelector('input[type="file"]') as HTMLInputElement
            )?.click()
          }
        >
          {t("uploads.selectFiles")}
        </Button>
      </label>

      {/* Supported Formats - under upload zone */}
      <div className="flex flex-wrap items-center gap-4 text-muted-foreground body-sm">
        <span className="flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-hm-optimal200" />
          {t("uploads.pdfFiles")}
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-hm-optimal200" />
          {t("uploads.images")}
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-hm-optimal200" />
          {t("uploads.multipleFiles")}
        </span>
      </div>

      {/* Uploaded Files Section */}
      {(uploadingFiles.length > 0 || allScans.length > 0 || scansLoading) && (
        <div className="space-y-4">
          <h2 className="title-sm text-foreground">
            {t("uploads.yourUploads")}
          </h2>

          {scansLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {/* Uploading files as cards */}
            {uploadingFiles.map((file) => (
              <Card
                key={file.id}
                className="bg-white border border-[#b8e094] rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5"
              >
                <CardContent className="p-0">
                  <div className="aspect-[3/4] bg-bg-sodium flex flex-col items-center justify-center relative">
                    {file.status === "error" ? (
                      <AlertCircle className="h-8 w-8 text-hm-highlow200" />
                    ) : file.status === "uploading" ||
                      file.status === "processing" ? (
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    ) : (
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    )}

                    {/* Progress overlay */}
                    {file.status === "uploading" && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-border">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    )}

                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background"
                      onClick={() => removeUploadingFile(file.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>

                    {/* Retry button for errors */}
                    {file.status === "error" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-2 right-2 h-7 w-7 bg-background/80 hover:bg-background"
                        onClick={() => retryUpload(file.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="caption-sm text-foreground truncate">
                      {file.file.name}
                    </p>
                    <p className="caption-sm text-muted-foreground">
                      {file.status === "uploading" &&
                        `${t("uploads.uploading")} ${Math.round(file.progress)}%`}
                      {file.status === "processing" && t("uploads.processing")}
                      {file.status === "error" && t("uploads.failed")}
                      {file.status === "pending" && t("uploads.waiting")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Existing scans as aesthetic PDF cards */}
            {visibleScans.map((scan) => {
              const files = scanFilesMap[scan.id];
              const thumbnail = files?.[0]?.thumbnailUrl;
              const imageUrl = files?.[0]?.imageUrl;
              const isProcessing = scan.status === "SENT";
              const isFailed = scan.status === "FAILED";
              const isCompleted = scan.status === "COMPLETED";

              return (
                <Card
                  key={scan.id}
                  className="relative overflow-hidden group bg-white border border-[#b8e094] rounded-xl transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5"
                >
                  <CardContent className="p-0">
                    {/* Document preview area */}
                    <div className="relative aspect-[4/5] bg-gradient-to-br from-muted/30 to-muted/50 flex items-center justify-center overflow-hidden">
                      {/* Background pattern */}
                      <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M0 0h10v10H0zM10 10h10v10H10z'/%3E%3C/g%3E%3C/svg%3E")`,
                          backgroundSize: "8px 8px",
                        }}
                      />

                      {/* Thumbnail or placeholder */}
                      {thumbnail ? (
                        <div className="relative w-[70%] aspect-[3/4] rounded-lg overflow-hidden shadow-xl border border-white/20 bg-white transform group-hover:scale-[1.02] transition-transform duration-300">
                          <img
                            src={thumbnail}
                            alt="Document preview"
                            className="w-full h-full object-cover"
                          />
                          {/* Shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div
                            className={cn(
                              "w-16 h-16 rounded-2xl flex items-center justify-center",
                              isProcessing
                                ? "bg-primary/10"
                                : isFailed
                                  ? "bg-destructive/10"
                                  : "bg-muted",
                            )}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-7 w-7 text-primary animate-spin" />
                            ) : isFailed ? (
                              <AlertCircle className="h-7 w-7 text-destructive" />
                            ) : (
                              <FileText className="h-7 w-7 text-muted-foreground" />
                            )}
                          </div>
                          {isProcessing && (
                            <span className="caption-sm text-primary font-medium">
                              {t("uploads.processing")}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Hover overlay for completed scans */}
                      {imageUrl && (
                        <a
                          href={imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300"
                        >
                          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <ExternalLink className="h-5 w-5 text-white" />
                          </div>
                          <span className="text-white caption-sm font-medium">
                            View Original
                          </span>
                        </a>
                      )}
                    </div>

                    {/* Info footer */}
                    <div className="p-3 border-t border-border/30 bg-card">
                      <div className="flex items-center justify-between gap-2">
                        {getStatusBadge(scan.status)}
                        <span className="caption-sm text-muted-foreground">
                          {formatShortDate(scan.createdAt, locale)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Infinite scroll sentinel & load more */}
          {hasMoreScans && (
            <div
              ref={loadMoreRef}
              className="flex flex-col items-center justify-center py-6 gap-3"
            >
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
              <p className="caption-sm text-muted-foreground">
                Showing {visibleScans.length} of {allScans.length} uploads
              </p>
            </div>
          )}
        </div>
      )}
    </PageLayout>
  );
}
