import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import {
  AnalyticsSummary,
  TrendData,
  TopSellingItem,
} from '../../api/analytics';

// Register fonts
Font.register({
  family: 'Helvetica',
  src: 'https://fonts.gstatic.com/s/opensans/v18/mem8YaGs126MiZpBA-UFVZ0bf8pkAg.woff2',
});

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #e53e3e',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 5,
  },
  reportDate: {
    fontSize: 10,
    color: '#a0aec0',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 12,
    borderBottom: '1 solid #e2e8f0',
    paddingBottom: 5,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryCard: {
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    padding: 15,
    width: '48%',
    border: '1 solid #e2e8f0',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  trendContainer: {
    marginBottom: 20,
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 10,
  },
  trendPeriod: {
    fontSize: 10,
    color: '#718096',
    marginBottom: 8,
  },
  chartPlaceholder: {
    backgroundColor: '#f7fafc',
    border: '1 solid #e2e8f0',
    borderRadius: 6,
    padding: 20,
    textAlign: 'center',
    marginBottom: 10,
  },
  chartText: {
    fontSize: 12,
    color: '#718096',
  },
  simpleChart: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f7fafc',
    borderRadius: 6,
    border: '1 solid #e2e8f0',
  },
  chartTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  chartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 8,
    color: '#4a5568',
    width: 60,
  },
  barContainer: {
    flex: 1,
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginRight: 8,
    position: 'relative',
  },
  barFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 2,
  },
  barValue: {
    fontSize: 8,
    color: '#2d3748',
    minWidth: 40,
  },
  dataTable: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#edf2f7',
    padding: 8,
    borderBottom: '1 solid #cbd5e0',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #e2e8f0',
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2d3748',
    flex: 1,
  },
  tableCellText: {
    fontSize: 9,
    color: '#4a5568',
    flex: 1,
  },
  itemsList: {
    marginTop: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f7fafc',
    marginBottom: 5,
    borderRadius: 4,
    border: '1 solid #e2e8f0',
  },
  itemName: {
    fontSize: 11,
    color: '#2d3748',
    flex: 2,
  },
  itemQuantity: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#e53e3e',
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTop: '1 solid #e2e8f0',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#a0aec0',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 10,
    right: 40,
    fontSize: 8,
    color: '#a0aec0',
  },
});

interface AnalyticsReportProps {
  summary: AnalyticsSummary;
  revenueTrend: TrendData[];
  ordersTrend: TrendData[];
  topSellingItems: TopSellingItem[];
  revenuePeriod: string;
  ordersPeriod: string;
  generatedAt: Date;
}

const AnalyticsReport: React.FC<AnalyticsReportProps> = ({
  summary,
  revenueTrend,
  ordersTrend,
  topSellingItems,
  revenuePeriod,
  ordersPeriod,
  generatedAt,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  const formatTrendDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
    }).format(date);
  };

  const createSimpleChart = (
    data: TrendData[],
    title: string,
    color: string,
    isRevenue: boolean = false
  ) => {
    if (data.length === 0) return null;

    const maxValue = Math.max(...data.map((item) => item.value));
    const chartData = data.slice(0, 8); // Show only first 8 items for space

    return (
      <View style={styles.simpleChart}>
        <Text style={styles.chartTitle}>{title}</Text>
        {chartData.map((item, index) => {
          const barWidth = (item.value / maxValue) * 100;
          return (
            <View key={index} style={styles.chartBar}>
              <Text style={styles.barLabel}>{formatTrendDate(item.date)}</Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${barWidth}%`, backgroundColor: color },
                  ]}
                />
              </View>
              <Text style={styles.barValue}>
                {isRevenue
                  ? formatCurrency(item.value)
                  : item.value.toLocaleString()}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Wings Restaurant Analytics Report</Text>
          <Text style={styles.subtitle}>Business Performance Dashboard</Text>
          <Text style={styles.reportDate}>
            Generated on {formatDate(generatedAt)}
          </Text>
        </View>
        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Revenue</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(summary.totalRevenue)}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Orders</Text>
              <Text style={styles.summaryValue}>
                {summary.totalOrders.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>{' '}
        {/* Revenue Trend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Trend Analysis</Text>
          <View style={styles.trendContainer}>
            <Text style={styles.trendPeriod}>
              Period:{' '}
              {revenuePeriod.charAt(0).toUpperCase() + revenuePeriod.slice(1)}
            </Text>
            {revenueTrend.length > 0 ? (
              createSimpleChart(revenueTrend, 'Revenue Trend', '#f97316', true)
            ) : (
              <View style={styles.chartPlaceholder}>
                <Text style={styles.chartText}>No revenue data available</Text>
              </View>
            )}
            {revenueTrend.length > 0 && (
              <View style={styles.dataTable}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderText}>Date</Text>
                  <Text style={styles.tableHeaderText}>Revenue</Text>
                </View>
                {revenueTrend.slice(0, 10).map((item, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={styles.tableCellText}>
                      {formatTrendDate(item.date)}
                    </Text>
                    <Text style={styles.tableCellText}>
                      {formatCurrency(item.value)}
                    </Text>
                  </View>
                ))}
                {revenueTrend.length > 10 && (
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCellText}>
                      ... and {revenueTrend.length - 10} more entries
                    </Text>
                    <Text style={styles.tableCellText}></Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>{' '}
        {/* Orders Trend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orders Trend Analysis</Text>
          <View style={styles.trendContainer}>
            <Text style={styles.trendPeriod}>
              Period:{' '}
              {ordersPeriod.charAt(0).toUpperCase() + ordersPeriod.slice(1)}
            </Text>
            {ordersTrend.length > 0 ? (
              createSimpleChart(ordersTrend, 'Orders Trend', '#3b82f6', false)
            ) : (
              <View style={styles.chartPlaceholder}>
                <Text style={styles.chartText}>No orders data available</Text>
              </View>
            )}
            {ordersTrend.length > 0 && (
              <View style={styles.dataTable}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderText}>Date</Text>
                  <Text style={styles.tableHeaderText}>Orders</Text>
                </View>
                {ordersTrend.slice(0, 10).map((item, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={styles.tableCellText}>
                      {formatTrendDate(item.date)}
                    </Text>
                    <Text style={styles.tableCellText}>
                      {item.value.toLocaleString()}
                    </Text>
                  </View>
                ))}
                {ordersTrend.length > 10 && (
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCellText}>
                      ... and {ordersTrend.length - 10} more entries
                    </Text>
                    <Text style={styles.tableCellText}></Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
        {/* Top Selling Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Selling Items</Text>
          <View style={styles.itemsList}>
            {topSellingItems.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>
                  {index + 1}. {item.name}
                </Text>
                <Text style={styles.itemQuantity}>{item.quantity} sold</Text>
              </View>
            ))}
          </View>
        </View>
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Wings Restaurant - Analytics Report | Confidential Business Data
          </Text>
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};

export default AnalyticsReport;
