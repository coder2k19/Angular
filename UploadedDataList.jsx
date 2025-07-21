import { useEffect, useState, useMemo, useCallback } from "react";
import { useMediaQuery, Alert, CircularProgress, Box } from "@mui/material";
import { format } from "date-fns";
import DataTable from "../Reusable/DataTable/DataTable";
import { uploadedDataColumnHeader } from "../OutReachDetails/CommonColumnHeadr";
import { API } from "../../global";

const UploadedDataList = () => {
  // State management
  const [dataUploaded, setDataUploaded] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Media queries for responsive design
  const isSmallScreen = useMediaQuery("(min-width: 1200px) and (max-width: 1400px)");
  const isMediumScreen = useMediaQuery("(min-width: 1401px) and (max-width: 1600px)");
  const isLargeScreen = useMediaQuery("(min-width: 1601px) and (max-width: 1850px)");

  // Memoized height calculation for better performance
  const tableHeight = useMemo(() => {
    if (isSmallScreen) return "60dvh";
    if (isMediumScreen) return "63dvh";
    if (isLargeScreen) return "63dvh";
    return "65dvh";
  }, [isSmallScreen, isMediumScreen, isLargeScreen]);

  // Memoized data transformation function with searchableText
  const transformUploadedData = useCallback((data) => {
    return data.map((item) => {
      const fileName = item.file_name || 'Unknown File';
      const uploadedDate = item.created_at 
        ? format(new Date(item.created_at), "dd MMMM yyyy")
        : 'Unknown Date';
      const status = item.over_all_status || 'Unknown';
      const totalRows = item.total_rows || 0;
      const companiesImported = (item.total_new_companies || 0).toString();
      const contactsImported = (item.total_new_contacts || 0).toString();
      const companiesResearched = (item.total_companies_market_researched || 0).toString();
      const contactsResearched = (item.total_contacts_market_researched || 0).toString();
      const totalSkipped = (item.total_skipped || 0).toString();

      return {
        fileName,
        uploadedDate,
        total_rowes: totalRows,
        companies_imported: companiesImported,
        contacts_imported: contactsImported,
        companies_researched: companiesResearched,
        contacts_researched: contactsResearched,
        total_rows_skipped: totalSkipped,
        status,
        // Searchable text for global search - includes all searchable content
        searchableText: [
          fileName,
          uploadedDate,
          status,
          totalRows.toString(),
          companiesImported,
          contactsImported,
          companiesResearched,
          contactsResearched,
          totalSkipped,
          // Additional searchable terms
          item.file_name?.toLowerCase(),
          item.over_all_status?.toLowerCase(),
          'uploaded', 'import', 'data', 'file'
        ].filter(Boolean).join(' ').toLowerCase()
      };
    });
  }, []);

  // Optimized API call with proper error handling
  const uploadedListData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API}/project/get-prospect-import-logs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const res = await response.json();
      
      if (res.success && res.result) {
        const transformedData = transformUploadedData(res.result);
        setDataUploaded(transformedData);
      } else {
        throw new Error(res.message || "Failed to fetch data");
      }
    } catch (err) {
      console.error("Error fetching uploaded data:", err);
      setError(err.message || "An error occurred while fetching data");
      setDataUploaded([]); // Reset data on error
    } finally {
      setIsLoading(false);
    }
  }, [transformUploadedData]);

  // Effect for initial data loading
  useEffect(() => {
    uploadedListData();
  }, [uploadedListData]);

  // Retry function for error handling
  const handleRetry = useCallback(() => {
    uploadedListData();
  }, [uploadedListData]);

  // Error state rendering
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert 
          severity="error" 
          action={
            <button onClick={handleRetry} style={{ marginLeft: '8px' }}>
              Retry
            </button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // Loading state rendering
  if (isLoading && dataUploaded.length === 0) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: tableHeight,
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress />
        <span>Loading uploaded data...</span>
      </Box>
    );
  }

  return (
        <DataTable
      tableData={dataUploaded}
      tableColumns={uploadedDataColumnHeader}
      density="comfortable"
      enableSearch={true} // Enable global search
      searchPlaceholder="Search files, dates, status, numbers..."
      searchableTextKey="searchableText" // Use searchableText field for global search
      isLoading={isLoading}
      enablePagination={true} // Enable pagination to show row count info
      hgt={tableHeight}
      onDrag={false}
      borderPadding={false}
      enablePersistentFilters={true}
      enableTopToolbar={true}
      enableColumnFilters={true}
      columnFilterDisplayMode="popover" // Use popover for better UX
              enableVirtualization={false} // Disable virtualization when using pagination
        virtualItemSize={60} // Optimized row height
        tableId="upload-list"
        // Pagination settings
        paginationDisplayMode="pages"
        pageSize={10} // Default page size
        pageSizeOptions={[5, 10, 20, 50]} // Page size options
        // Performance optimizations
        enableFacetedValues={true} // Enable for filter dropdown values
        enableGlobalFilterModes={false}
        enableColumnFilterModes={false}
    />
  );
};

export default UploadedDataList;