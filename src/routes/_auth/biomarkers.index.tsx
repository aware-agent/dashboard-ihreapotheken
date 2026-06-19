import { createFileRoute, redirect } from '@tanstack/react-router';

// Redirect /biomarkers to /history?tab=biomarkers
export const Route = createFileRoute('/_auth/biomarkers/')({
  beforeLoad: async () => {
    throw redirect({
      to: '/history',
      search: {
        tab: 'biomarkers',
      },
    });
  },
});
