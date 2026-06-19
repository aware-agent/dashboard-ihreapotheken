import { usePageTrackerStore } from "react-page-tracker";

export const usePageTracking = () => {
  return usePageTrackerStore((state) => ({
    pageIndex: state.pageIndex,
    referrer: state.referrer,
    isFirstPage: state.isFirstPage,
    isLastPage: state.isLastPage,
    pageEvent: state.pageEvent,
    pageHistory: state.pageHistory,
    pageHistoryLength: state.pageHistoryLength,
  }));
};
