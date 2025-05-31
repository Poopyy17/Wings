import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { useState } from 'react';
import { toast } from 'sonner';
import AnalyticsReport from '../components/pdf/AnalyticsReport';
import { AnalyticsSummary, TrendData, TopSellingItem } from '../api/analytics';

interface ExportData {
  summary: AnalyticsSummary;
  revenueTrend: TrendData[];
  ordersTrend: TrendData[];
  topSellingItems: TopSellingItem[];
  revenuePeriod: string;
  ordersPeriod: string;
}

export const useAnalyticsPDFExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async (data: ExportData) => {
    setIsExporting(true);

    try {
      // Create the PDF document
      const doc = React.createElement(AnalyticsReport, {
        ...data,
        generatedAt: new Date(),
      });

      // Generate the PDF blob
      const blob = await pdf(doc).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS format
      link.download = `wings-analytics-report-${dateStr}-${timeStr}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      toast.success('Analytics report exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export analytics report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToPDF,
    isExporting,
  };
};
