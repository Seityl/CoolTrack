import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Table,
  Spinner,
  Flex,
  Card,
  TextField,
  Select,
  Button,
  Badge,
  Separator,
  Grid,
  IconButton,
} from '@radix-ui/themes';
import { useFrappeGetCall } from 'frappe-react-sdk';
import { 
  FaHistory, 
  FaSyncAlt, 
  FaSearch, 
  FaDownload, 
  FaFilter,
  FaThermometerHalf,
  FaBolt,
  FaSignal,
  FaMapMarkerAlt,
  FaClock,
  FaExclamationTriangle,
  FaCheck,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaDatabase
} from 'react-icons/fa';

interface SensorRead {
  sensor_id: string | null;
  sensor_type: string;
  temperature: string;
  voltage: string;
  signal_strength: string;
  gateway_id: string | null;
  relay_id: string;
  sensor_rssi: string;
  timestamp: string;
}

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        backgroundColor: type === 'success' ? 'var(--green-9)' : type === 'error' ? 'var(--red-9)' : 'var(--blue-9)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        maxWidth: '300px',
        animation: 'slideIn 0.3s ease-out',
      }}>
        {type === 'success' ? (
          <FaCheck size={16} />
        ) : type === 'error' ? (
          <FaExclamationTriangle size={16} />
        ) : (
          <FaHistory size={16} />
        )}
        <Text size="2">{message}</Text>
      </div>
    </>
  );
};

const StatCard = ({ 
  title, 
  value, 
  icon, 
  color = "blue" 
}) => (
  <Card size={{ initial: "1", sm: "2" }} style={{ border: "1px solid var(--gray-6)" }}>
    <Flex align="center" gap={{ initial: "2", sm: "3" }}>
      <Box style={{ color: `var(--${color}-9)` }}>
        {icon}
      </Box>
      <Flex direction="column" gap="1" style={{ minWidth: 0, flex: 1 }}>
        <Text 
          size={{ initial: "1", sm: "2" }} 
          color="gray" 
          weight="medium"
          style={{
            fontSize: window.innerWidth < 768 ? "11px" : "14px",
            lineHeight: 1.3
          }}
        >
          {title}
        </Text>
        <Text 
          size={{ initial: "3", sm: "4" }} 
          weight="bold"
          style={{
            fontSize: window.innerWidth < 768 ? "14px" : "16px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
        >
          {value}
        </Text>
      </Flex>
    </Flex>
  </Card>
);

const MobileDataCard = ({ read, index }) => (
  <Card 
    size="2" 
    style={{ 
      border: "1px solid var(--gray-6)",
      marginBottom: "12px"
    }}
  >
    <Flex direction="column" gap="3" p="3">
      {/* Header Row */}
      <Flex justify="between" align="center">
        <Badge variant="soft" color="blue" size="1">
          {read.sensor_id || 'N/A'}
        </Badge>
      </Flex>
      
      {/* Main Data Grid */}
      <Grid columns="2" gap="2">
        <Flex align="center" gap="2">
          <FaThermometerHalf size={12} color="var(--orange-9)" />
          <Text size="1" weight="medium">{read.temperature}°C</Text>
        </Flex>
        <Flex align="center" gap="2">
          <FaBolt size={12} color="var(--yellow-9)" />
          <Text size="1">{read.voltage}V</Text>
        </Flex>
        <Flex align="center" gap="2">
          <FaSignal size={12} color="var(--green-9)" />
          <Text size="1">{read.signal_strength}</Text>
        </Flex>
        <Flex align="center" gap="2">
          <FaMapMarkerAlt size={12} color="var(--purple-9)" />
          <Text size="1">{read.gateway_id || 'N/A'}</Text>
        </Flex>
      </Grid>
      
      {/* Footer */}
      <Separator size="1" />
      <Flex justify="between" align="center">
        <Text size="1" color="gray">
          RSSI: {read.sensor_rssi}
        </Text>
        <Text size="1" color="gray">
          {new Date(read.timestamp).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </Flex>
    </Flex>
  </Card>
);

// Client-side table pagination component
const TablePaginationControls = ({ 
  totalItems, 
  pageIndex, 
  pageSize, 
  onPageChange, 
  onPageSizeChange 
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  const isMobile = window.innerWidth < 768;
  
  const getVisiblePages = () => {
    const current = pageIndex + 1;
    const total = totalPages;
    const delta = isMobile ? 1 : 2;
    
    const range = [];
    const rangeWithDots = [];
    
    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }
    
    if (current - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }
    
    rangeWithDots.push(...range);
    
    if (current + delta < total - 1) {
      rangeWithDots.push('...', total);
    } else if (total > 1) {
      rangeWithDots.push(total);
    }
    
    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <Flex justify="between" align="center" mt="4" p="4" style={{ borderTop: '1px solid var(--gray-5)' }}>
      <Flex align="center" gap="2">
        <Text size="2">Show:</Text>
        <Select.Root 
          value={pageSize.toString()} 
          onValueChange={(val) => onPageSizeChange(parseInt(val))}
          size="2"
        >
          <Select.Trigger style={{ minWidth: "80px" }} />
          <Select.Content>
            <Select.Item value="25">25</Select.Item>
            <Select.Item value="50">50</Select.Item>
            <Select.Item value="100">100</Select.Item>
            <Select.Item value="250">250</Select.Item>
            <Select.Item value="500">500</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>
      
      <Flex align="center" gap="2">
        <Button
          variant="soft"
          onClick={() => onPageChange(0)}
          disabled={pageIndex === 0}
          size="2"
        >
          <FaAngleDoubleLeft size={12} />
        </Button>
        
        <Button
          variant="soft"
          onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
          disabled={pageIndex === 0}
          size="2"
        >
          <FaChevronLeft size={12} />
        </Button>
        
        {getVisiblePages().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <Text size="2" color="gray" style={{ padding: '0 8px' }}>
                ...
              </Text>
            ) : (
              <Button
                variant={page === pageIndex + 1 ? "solid" : "soft"}
                onClick={() => onPageChange(page - 1)}
                size="2"
                style={{ 
                  minWidth: "36px",
                  fontWeight: page === pageIndex + 1 ? "bold" : "normal"
                }}
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}
        
        <Button
          variant="soft"
          onClick={() => onPageChange(Math.min(totalPages - 1, pageIndex + 1))}
          disabled={pageIndex >= totalPages - 1}
          size="2"
        >
          <FaChevronRight size={12} />
        </Button>
        
        <Button
          variant="soft"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={pageIndex >= totalPages - 1}
          size="2"
        >
          <FaAngleDoubleRight size={12} />
        </Button>
      </Flex>
      
      <Text size="2" color="gray">
        Page {pageIndex + 1} of {totalPages}
      </Text>
    </Flex>
  );
};

const HistoryPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState('sensor');
  const [selectedId, setSelectedId] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [toast, setToast] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Client-side table pagination state
  const [tablePagination, setTablePagination] = useState({
    pageIndex: 0,
    pageSize: 100,
  });

  // Mobile load more state
  const [mobileItemsToShow, setMobileItemsToShow] = useState(20);

  // Date picker states - default to last 24 hours
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return yesterday.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });

  // Auto-detect mobile and set appropriate view mode
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setViewMode('cards');
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

const apiFilters = useMemo(() => {
  const filters: any[] = [];

  // Date filters
  if (startDate) {
    filters.push(['timestamp', '>=', `${startDate} 00:00:00`]);
  }
  if (endDate) {
    filters.push(['timestamp', '<=', `${endDate} 23:59:59`]);
  }

  // ID filter based on selected type
  if (selectedId) {
    if (selectedType === 'sensor') {
      filters.push(['sensor_id', '=', selectedId]);
    } else {
      filters.push(['gateway_id', '=', selectedId]);
    }
  }

  return filters;
}, [startDate, endDate, selectedType, selectedId]);

  const {
    data,
    error,
    isLoading,
    mutate,
    isValidating,
  } = useFrappeGetCall('frappe.client.get_list', {
    doctype: 'Sensor Read',
    fields: [
      'sensor_id',
      'sensor_type',
      'temperature',
      'voltage',
      'signal_strength',
      'gateway_id',
      'relay_id',
      'sensor_rssi',
      'timestamp',
    ],
    filters: apiFilters,
    order_by: `${sortBy} ${sortOrder}`,
    limit_page_length: 999999,
    limit_start: 0,
  });

  const sensorReads = data && data.message ? data.message : [];

  const stats = useMemo(() => {
    const uniqueSensors = new Set(sensorReads.map(r => r.sensor_id).filter(Boolean)).size;
    const uniqueGateways = new Set(sensorReads.map(r => r.gateway_id).filter(Boolean)).size;

    return {
      totalRecords: sensorReads.length,
      uniqueSensors,
      uniqueGateways,
      currentPageRecords: sensorReads.length
    };
  }, [sensorReads]);

  // Get unique sensor and gateway IDs for dropdowns
  const uniqueIds = useMemo(() => {
    const sensors = Array.from(new Set(sensorReads.map(r => r.sensor_id).filter(Boolean)));
    const gateways = Array.from(new Set(sensorReads.map(r => r.gateway_id).filter(Boolean)));
    
    return {
      sensors,
      gateways
    };
  }, [sensorReads]);

  // Paginated table data for desktop view
  const paginatedTableData = useMemo(() => {
    const startIndex = tablePagination.pageIndex * tablePagination.pageSize;
    const endIndex = startIndex + tablePagination.pageSize;
    return sensorReads.slice(startIndex, endIndex);
  }, [sensorReads, tablePagination.pageIndex, tablePagination.pageSize]);

  // Mobile data for load more approach
  const mobileDisplayData = useMemo(() => {
    return sensorReads.slice(0, mobileItemsToShow);
  }, [sensorReads, mobileItemsToShow]);

  const handleTablePageChange = (pageIndex) => {
    setTablePagination(prev => ({ ...prev, pageIndex }));
  };

  const handleTablePageSizeChange = (pageSize) => {
    setTablePagination({ pageIndex: 0, pageSize });
  };

  const handleMobileLoadMore = () => {
    setMobileItemsToShow(prev => Math.min(prev + 20, sensorReads.length));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate();
      showToast('Data refreshed successfully', 'success');
    } catch (err) {
      showToast('Failed to refresh data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

const handleExportPDF = () => {
  const printWindow = window.open('', '_blank');
  
  // Format the sensor data for the table
  const tableRows = sensorReads.map((read, index) => `
    <tr ${index % 2 === 0 ? 'style="background-color: #f9f9f9;"' : ''}>
      <td style="text-align: center;">
        <span class="sensor-id">${read.sensor_id || 'N/A'}</span>
      </td>
      <td style="text-align: center;" class="temperature">${read.temperature}°C</td>
      <td style="text-align: center;">${read.voltage}V</td>
      <td style="text-align: center;">${read.signal_strength}</td>
      <td style="text-align: center;">
        <span class="gateway-id">${read.gateway_id || 'N/A'}</span>
      </td>
      <td style="text-align: center;">${read.sensor_rssi}</td>
      <td style="text-align: center;" class="timestamp">
        ${new Date(read.timestamp).toLocaleString()}
      </td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Sensor History Export - ${new Date().toLocaleDateString()}</title>
        <meta charset="UTF-8">
        <style>
          @media print {
            @page {
              size: letter;
              margin: 0.5in;
            }
            body {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
          }
          
          * {
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            margin: 0;
            padding: 15px;
            color: #333;
            background: white;
          }
          
          .header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            page-break-inside: avoid;
          }
          
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
          }
          
          .header .subtitle {
            font-size: 14px;
            color: #7f8c8d;
            margin: 8px 0;
            font-weight: 500;
          }
          
          .header .export-info {
            font-size: 10px;
            color: #95a5a6;
            margin-top: 10px;
          }
          
          .summary {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 10px;
            background-color: #ecf0f1;
            border-radius: 6px;
            border: 1px solid #bdc3c7;
            page-break-inside: avoid;
          }
          
          .summary-item {
            text-align: center;
            flex: 1;
            min-width: 120px;
            margin: 2px;
          }
          
          .summary-item .label {
            font-size: 10px;
            color: #7f8c8d;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 4px;
            letter-spacing: 0.5px;
          }
          
          .summary-item .value {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
          }
          
          .filters-info {
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            border: 1px solid #e9ecef;
            page-break-inside: avoid;
          }
          
          .filters-info h3 {
            margin: 0 0 8px 0;
            font-size: 12px;
            color: #495057;
            font-weight: bold;
          }
          
          .filter-item {
            display: inline-block;
            margin-right: 15px;
            font-size: 10px;
            color: #6c757d;
          }
          
          .table-container {
            width: 100%;
            overflow: visible;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 8px;
            background: white;
          }
          
          th, td {
            border: 1px solid #dee2e6;
            padding: 3px 2px;
            text-align: left;
            vertical-align: middle;
            word-wrap: break-word;
          }
          
          th {
            background-color: #e9ecef;
            font-weight: bold;
            font-size: 8px;
            text-transform: uppercase;
            color: #495057;
            text-align: center;
            letter-spacing: 0.3px;
          }
          
          .sensor-id, .gateway-id {
            background-color: #e3f2fd;
            border-radius: 2px;
            padding: 1px 3px;
            font-size: 7px;
            font-weight: bold;
            color: #1565c0;
            border: 1px solid #bbdefb;
            display: inline-block;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .gateway-id {
            background-color: #e8f5e8;
            color: #2e7d32;
            border-color: #c8e6c9;
          }
          
          .temperature {
            font-weight: bold;
            color: #d84315;
          }
          
          .timestamp {
            font-size: 7px;
            color: #6c757d;
          }
          
          .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #dee2e6;
            font-size: 9px;
            color: #6c757d;
            text-align: center;
            page-break-inside: avoid;
          }
          
          .page-info {
            text-align: right;
            font-size: 8px;
            color: #adb5bd;
            margin-bottom: 10px;
          }
          
          /* Prevent page breaks in table rows */
          tr {
            page-break-inside: avoid;
          }
          
          /* Ensure table headers repeat on each page */
          thead {
            display: table-header-group;
          }
          
          tbody {
            display: table-row-group;
          }
          
          /* Better table spacing for print */
          @media print {
            table {
              font-size: 7px;
            }
            
            th, td {
              padding: 2px 1px;
            }
            
            .sensor-id, .gateway-id {
              font-size: 6px;
              padding: 1px 2px;
            }
            
            .timestamp {
              font-size: 6px;
            }
            
            .summary {
              flex-direction: row;
              flex-wrap: wrap;
            }
            
            .summary-item {
              flex: 0 1 22%;
              min-width: 100px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SENSOR HISTORY REPORT</h1>
          <div class="subtitle">
            Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}
          </div>
          ${selectedId ? `
            <div class="subtitle">
              Filtered by ${selectedType === 'sensor' ? 'Sensor' : 'Gateway'} ID: "${selectedId}"
            </div>
          ` : ''}
        </div>

        <div class="filters-info">
          <h3>Report Configuration</h3>
          <span class="filter-item"><strong>Sort:</strong> ${sortBy === 'timestamp' ? 'Timestamp' : 'Sensor ID'}</span>
          <span class="filter-item"><strong>Order:</strong> ${sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Sensor ID</th>
                <th style="width: 10%;">Temp</th>
                <th style="width: 10%;">Volt</th>
                <th style="width: 12%;">Signal</th>
                <th style="width: 15%;">Gateway ID</th>
                <th style="width: 8%;">RSSI</th>
                <th style="width: 30%;">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #6c757d;">No data available</td></tr>'}
            </tbody>
          </table>
        </div>

        </div>
      </body>
    </html>
  `;
  
  if (!printWindow) {
    showToast('Unable to open print window. Please check your browser settings.', 'error');
    return;
  }
  
  try {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        
        // Close the window after printing (optional)
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }, 500);
    };
    
    // Fallback for browsers that don't fire onload
    setTimeout(() => {
      if (printWindow.document.readyState === 'complete') {
        printWindow.focus();
        printWindow.print();
      }
    }, 1000);
    
  } catch (error) {
    console.error('Print error:', error);
    showToast('Failed to generate PDF. Please try again.', 'error');
    printWindow.close();
  }
};

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast(null);
  };

  const handleDatePreset = (preset) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (preset) {
      case 'today':
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        setStartDate(yesterday.toISOString().split('T')[0]);
        setEndDate(yesterday.toISOString().split('T')[0]);
        break;
      case 'lastWeek':
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        setStartDate(lastWeek.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'lastMonth':
        const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        setStartDate(lastMonth.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'last3Months':
        const last3Months = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        setStartDate(last3Months.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
    }
  };

  // Reset mobile items when filters change
  useEffect(() => {
    setTablePagination(prev => ({ ...prev, pageIndex: 0 }));
    setMobileItemsToShow(20);
  }, [sortBy, sortOrder, startDate, endDate, selectedType, selectedId]);

  // Fetch data when dependencies change
  useEffect(() => {
    mutate();
  }, [sortBy, sortOrder, startDate, endDate, selectedType, selectedId]);

  if (isLoading && !data) {
    return (
      <Box style={{ background: "var(--gray-1)" }}>
        <Flex height="60vh" align="center" justify="center">
          <Flex direction="column" align="center" gap="4">
            <Spinner size="3" />
          </Flex>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box style={{ background: "var(--gray-1)" }}>
        <Flex height="60vh" align="center" justify="center" p="4">
          <Flex direction="column" align="center" gap="4" style={{ textAlign: "center" }}>
            <Text 
              size={{ initial: "3", sm: "4" }} 
              color="red" 
              weight="bold"
            >
              Error loading sensor reads
            </Text>
            <Text 
              size={{ initial: "2", sm: "3" }} 
              color="gray"
              style={{ maxWidth: "280px", lineHeight: 1.5 }}
            >
              {error.message}
            </Text>
            <Button 
              onClick={handleRefresh} 
              variant="soft"
              size={{ initial: "2", sm: "3" }}
            >
              <FaSyncAlt />
              Try Again
            </Button>
          </Flex>
        </Flex>
      </Box>
    );
  }

  return (
    <Box style={{ background: "var(--gray-1)" }}>
      {toast?.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={closeToast} 
        />
      )}

      {/* Header */}
      <Box 
        style={{ 
          background: "white", 
          borderBottom: "1px solid var(--gray-6)",
          top: 0,
          zIndex: 10
        }}
      >
        <Flex 
          justify="between" 
          align="center" 
          p={{ initial: "4", sm: "6" }}
          gap="3"
        >
          <Flex align="center" gap="3" style={{ minWidth: 0, flex: 1 }}>
            <FaHistory 
              size={isMobile ? 20 : 24} 
              color="var(--blue-9)" 
            />
            <Heading 
              size={{ initial: "4", sm: "6" }} 
              weight="bold"
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              History
            </Heading>
          </Flex>
          <Flex gap="2" style={{ flexShrink: 0 }}>
            <Button 
              variant="soft" 
              onClick={handleExportPDF}
              disabled={isLoading || sensorReads.length === 0}
              size={{ initial: "2", sm: "3" }}
              style={{
                fontSize: isMobile ? "12px" : "14px"
              }}
            >
              <FaDownload 
                size={isMobile ? 12 : 14}
              />
              <span style={{ display: isMobile && window.innerWidth < 480 ? "none" : "inline" }}>
                Export PDF
              </span>
            </Button>
            <Button 
              variant="soft" 
              onClick={handleRefresh}
              disabled={isRefreshing || isValidating}
              size={{ initial: "2", sm: "3" }}
              style={{
                fontSize: isMobile ? "12px" : "14px"
              }}
            >
              <FaSyncAlt 
                className={isRefreshing ? "animate-spin" : ""}
                size={isMobile ? 12 : 14}
              />
              <span style={{ display: isMobile && window.innerWidth < 480 ? "none" : "inline" }}>
                Refresh
              </span>
            </Button>
          </Flex>
        </Flex>
      </Box>

      <Box p={{ initial: "3", sm: "4", md: "6" }}>
        {/* Filters Card */}
        <Card 
          size={{ initial: "2", sm: "3" }} 
          style={{ 
            border: "1px solid var(--gray-6)", 
            marginBottom: isMobile ? "16px" : "24px" 
          }}
        >
          <Flex direction="column" gap={{ initial: "3", sm: "4" }}>
            <Flex direction="column" gap="4">
              {/* Date Range Section */}
              <Box>
                <Flex align="center" gap="2" mb="3">
                  <FaCalendarAlt 
                    size={isMobile ? 12 : 14} 
                    color="var(--blue-9)" 
                  />
                  <Text 
                    size={{ initial: "2", sm: "3" }} 
                    weight="medium"
                  >
                    Date Range
                  </Text>
                </Flex>
                
                {/* Date Preset Buttons */}
                <Flex gap="2" wrap="wrap" mb="3">
                  <Button 
                    variant="surface" 
                    size="1" 
                    onClick={() => handleDatePreset('today')}
                    style={{ fontSize: isMobile ? "11px" : "12px" }}
                  >
                    Today
                  </Button>
                  <Button 
                    variant="surface" 
                    size="1" 
                    onClick={() => handleDatePreset('yesterday')}
                    style={{ fontSize: window.innerWidth < 768 ? "11px" : "12px" }}
                  >
                    Yesterday
                  </Button>
                  <Button 
                    variant="surface" 
                    size="1" 
                    onClick={() => handleDatePreset('lastWeek')}
                    style={{ fontSize: window.innerWidth < 768 ? "11px" : "12px" }}
                  >
                    Last Week
                  </Button>
                  <Button 
                    variant="surface" 
                    size="1" 
                    onClick={() => handleDatePreset('lastMonth')}
                    style={{ fontSize: window.innerWidth < 768 ? "11px" : "12px" }}
                  >
                    Last Month
                  </Button>
                  <Button 
                    variant="surface" 
                    size="1" 
                    onClick={() => handleDatePreset('last3Months')}
                    style={{ fontSize: window.innerWidth < 768 ? "11px" : "12px" }}
                  >
                    Last 3 Months
                  </Button>
                </Flex>
                
                {/* Custom Date Range */}
                <Grid columns={{ initial: "1", sm: "2" }} gap="3">
                  <Box>
                    <Text 
                      size={{ initial: "1", sm: "2" }} 
                      weight="medium" 
                      style={{ 
                        marginBottom: "8px", 
                        display: "block",
                        fontSize: isMobile ? "12px" : "14px"
                      }}
                    >
                      Start Date
                    </Text>
                    <TextField.Root
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      size={{ initial: "2", sm: "3" }}
                    />
                  </Box>
                  <Box>
                    <Text 
                      size={{ initial: "1", sm: "2" }} 
                      weight="medium" 
                      style={{ 
                        marginBottom: "8px", 
                        display: "block",
                        fontSize: window.innerWidth < 768 ? "12px" : "14px"
                      }}
                    >
                      End Date
                    </Text>
                    <TextField.Root
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      size={{ initial: "2", sm: "3" }}
                    />
                  </Box>
                </Grid>
              </Box>

              <Separator size="2" />

{/* ID Selector */}
<Box>
  <Text 
    size={{ initial: "1", sm: "2" }} 
    weight="medium" 
    style={{ 
      marginBottom: "8px", 
      display: "block",
      fontSize: window.innerWidth < 768 ? "12px" : "14px"
    }}
  >
    Filter Records
  </Text>
  <Grid columns={{ initial: "1", sm: "2" }} gap="3">
    <Box>
      <Select.Root 
        value={selectedType} 
        onValueChange={(val) => setSelectedType(val)}
        size={{ initial: "2", sm: "3" }}
      >
        <Select.Trigger />
        <Select.Content>
          <Select.Item value="sensor">Sensor ID</Select.Item>
          <Select.Item value="gateway">Gateway ID</Select.Item>
        </Select.Content>
      </Select.Root>
    </Box>
    <Box>
      <Select.Root 
        value={selectedId} 
        onValueChange={(val) => setSelectedId(val)}
        size={{ initial: "2", sm: "3" }}
      >
        <Select.Trigger placeholder={`Select ${selectedType === 'sensor' ? 'Sensor' : 'Gateway'} ID`} />
        <Select.Content>
          <Select.Item value="all">All {selectedType === 'sensor' ? 'Sensors' : 'Gateways'}</Select.Item>
          {(selectedType === 'sensor' ? uniqueIds.sensors : uniqueIds.gateways).map(id => (
            <Select.Item key={id} value={id}>{id}</Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Box>
  </Grid>
</Box>
              
              {/* Sort Controls */}
              <Grid columns={{ initial: "1", sm: "2" }} gap="3">
                <Box>
                  <Text 
                    size={{ initial: "1", sm: "2" }} 
                    weight="medium" 
                    style={{ 
                      marginBottom: "8px", 
                      display: "block",
                      fontSize: window.innerWidth < 768 ? "12px" : "14px"
                    }}
                  >
                    Sort By
                  </Text>
                  <Select.Root 
                    value={sortBy} 
                    onValueChange={(val) => setSortBy(val)}
                    size={{ initial: "2", sm: "3" }}
                  >
                    <Select.Trigger />
                    <Select.Content>
                      <Select.Item value="timestamp">Timestamp</Select.Item>
                      <Select.Item value="sensor_id">Sensor ID</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>
                
                <Box>
                  <Text 
                    size={{ initial: "1", sm: "2" }} 
                    weight="medium" 
                    style={{ 
                      marginBottom: "8px", 
                      display: "block",
                      fontSize: window.innerWidth < 768 ? "12px" : "14px"
                    }}
                  >
                    Order
                  </Text>
                  <Select.Root 
                    value={sortOrder} 
                    onValueChange={(val) => setSortOrder(val)}
                    size={{ initial: "2", sm: "3" }}
                  >
                    <Select.Trigger />
                    <Select.Content>
                      <Select.Item value="desc">Newest First</Select.Item>
                      <Select.Item value="asc">Oldest First</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>
              </Grid>
            </Flex>
            
            {selectedId && (
              <Flex align="center" gap="2" mt="2">
                <Badge color="blue" variant="soft" size="1">
                  {stats.totalRecords} records found
                </Badge>
              </Flex>
            )}
          </Flex>
        </Card>

        {/* Loading indicator for large datasets */}
        {isValidating && (
          <Card size="2" style={{ border: "1px solid var(--gray-6)", marginBottom: "16px" }}>
            <Flex align="center" justify="center" gap="3" p="4">
              <Spinner size="2" />
            </Flex>
          </Card>
        )}

        {/* Data Display */}
        <Box>
          {/* Mobile Card View for Small Screens */}
          {isMobile ? (
            <Box>
              {sensorReads.length > 0 ? (
                <>
                  {mobileDisplayData.map((read, index) => (
                    <MobileDataCard key={`${read.sensor_id}-${read.timestamp}-${index}`} read={read} index={index} />
                  ))}
                  
                  {/* Load More Button */}
                  {mobileItemsToShow < sensorReads.length && (
                    <Flex justify="center" mt="4" mb="2">
                      <Button
                        variant="soft"
                        size="3"
                        onClick={handleMobileLoadMore}
                        style={{
                          width: "100%",
                          maxWidth: "300px",
                          padding: "16px"
                        }}
                      >
                        Load More
                      </Button>
                    </Flex>
                  )}
                </>
              ) : (
                <Card style={{ border: "1px solid var(--gray-6)" }}>
                  <Flex direction="column" align="center" gap="3" p="6">
                    <FaHistory size={24} color="var(--gray-8)" />
                    <Text size="2" color="gray" weight="medium" style={{ textAlign: "center" }}>
                      {selectedId ? 'No matching records found' : 'No sensor data available for selected date range'}
                    </Text>
                    {selectedId && (
                      <Text size="1" color="gray" style={{ textAlign: "center" }}>
                        Try adjusting your filters or date range
                      </Text>
                    )}
                  </Flex>
                </Card>
              )}
            </Box>
          ) : (
            /* Desktop Table View with Client-side Pagination */
            <Box style={{ overflowX: "auto" }}>
              <Table.Root variant="surface" size="2">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Sensor ID</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      <Flex align="center" gap="2">
                        <FaThermometerHalf size={12} />
                        Temp (°C)
                      </Flex>
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      <Flex align="center" gap="2">
                        <FaBolt size={12} />
                        Voltage
                      </Flex>
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      <Flex align="center" gap="2">
                        <FaSignal size={12} />
                        Signal
                      </Flex>
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      <Flex align="center" gap="2">
                        <FaMapMarkerAlt size={12} />
                        Gateway ID
                      </Flex>
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>RSSI</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      <Flex align="center" gap="2">
                        <FaClock size={12} />
                        Timestamp
                      </Flex>
                    </Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {paginatedTableData.length > 0 ? (
                    paginatedTableData.map((read, index) => (
                      <Table.Row key={index}>
                        <Table.Cell>
                          <Badge variant="soft" color="blue">
                            {read.sensor_id || 'N/A'}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Text weight="medium">{read.temperature}</Text>
                        </Table.Cell>
                        <Table.Cell>{read.voltage}</Table.Cell>
                        <Table.Cell>{read.signal_strength}</Table.Cell>
                        <Table.Cell>
                          <Badge variant="soft" color="green">
                            {read.gateway_id || 'N/A'}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">{read.sensor_rssi}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">
                            {new Date(read.timestamp).toLocaleString()}
                          </Text>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  ) : (
                    <Table.Row>
                      <Table.Cell colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                        <Flex direction="column" align="center" gap="3">
                          <FaHistory size={32} color="var(--gray-8)" />
                          <Text size="3" color="gray" weight="medium">
                            {selectedId ? 'No matching records found' : 'No sensor data available for selected date range'}
                          </Text>
                          {selectedId && (
                            <Text size="2" color="gray">
                              Try adjusting your filters or date range
                            </Text>
                          )}
                        </Flex>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table.Root>
              
              {/* Client-side Table Pagination */}
              {sensorReads.length > 0 && (
                <TablePaginationControls
                  totalItems={sensorReads.length}
                  pageIndex={tablePagination.pageIndex}
                  pageSize={tablePagination.pageSize}
                  onPageChange={handleTablePageChange}
                  onPageSizeChange={handleTablePageSizeChange}
                />
              )}
            </Box>
          )}
        </Box>
      </Box>

      <style>
        {`
          .animate-spin {
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          /* Mobile-specific optimizations */
          @media (max-width: 767px) {
            /* Ensure proper touch targets */
            button {
              min-height: 44px;
            }
            
            /* Optimize spacing for mobile */
            [data-radix-themes] {
              --space-3: 12px;
              --space-4: 16px;
            }
          }
          
          @media (max-width: 479px) {
            /* Extra small screens */
            [data-radix-themes] {
              --space-3: 8px;
              --space-4: 12px;
            }
          }
        `}
      </style>
    </Box>
  );
};

export default HistoryPage;