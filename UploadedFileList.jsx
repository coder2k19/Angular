import { Box, useMediaQuery } from "@mui/system";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { API } from "../../global";
import {
  capitalizeIndustry,
  capitalizeText,
  formatRevenue,
} from "../../Constants/Funtions/commonFunctions";
import DataTable from "../Reusable/DataTable/DataTable_v2";
import { companyDatabaseColumnHeader } from "../OutReachDetails/CommonColumnHeadr";
import CompanyViewDetails from "../OutReachDetails/MarketPlan/CompanyViewDetails";
import ContactDetails from "../OutReachDetails/MarketPlan/ContactDetails";

const UploadedFileList = () => {
  const navigate = useNavigate();

  // State management
  const [allUploadDetails, setAllUploadDetails] = useState([]); // Store all upload data from server
  const [isLoading, setIsLoading] = useState(false);
  const [userDetails, setUserListDetails] = useState([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // URL parameters
  const params = new URLSearchParams(window.location.search);
  const type = params.get("id");
  const mode = params.get("mode");

  // Media queries for responsive height
  const isSmallScreen = useMediaQuery(
    "(min-width: 1200px) and (max-width: 1400px)"
  );
  const isMediumScreen = useMediaQuery(
    "(min-width: 1401px) and (max-width: 1600px)"
  );
  const isLargeScreen = useMediaQuery(
    "(min-width: 1601px) and (max-width: 1850px)"
  );

  // Calculate table height based on screen size
  const tableHeight = useMemo(() => {
    if (isSmallScreen) return "60dvh";
    if (isMediumScreen) return "63dvh";
    if (isLargeScreen) return "63dvh";
    return "70dvh";
  }, [isSmallScreen, isMediumScreen, isLargeScreen]);

  // Extract data processing logic for upload logs
  const processUploadData = useCallback((uploadData) => {
    const uploadList = uploadData.map((item) => ({
      id: item._id || item.id,
      fileName: item.file_name,
      uploadedDate: format(new Date(item.created_at), "dd MMMM yyyy"),
      total_rowes: item.total_rows,
      companies_imported: item.total_new_companies.toString(),
      contacts_imported: item.total_new_contacts.toString(),
      companies_researched: item.total_companies_market_researched.toString(),
      contacts_researched: item.total_contacts_market_researched.toString(),
      total_rows_skipped: item.total_skipped.toString(),
      status: item.over_all_status,
      
      // Raw values for sorting
      total_rows_raw: item.total_rows || 0,
      companies_imported_raw: item.total_new_companies || 0,
      contacts_imported_raw: item.total_new_contacts || 0,
      companies_researched_raw: item.total_companies_market_researched || 0,
      contacts_researched_raw: item.total_contacts_market_researched || 0,
      total_rows_skipped_raw: item.total_skipped || 0,
      
      // Additional fields for filtering/searching
      created_at: item.created_at,
      
      // Add searchable text field for better global search
      searchableText: [
        item.file_name,
        item.over_all_status,
        format(new Date(item.created_at), "dd MMMM yyyy")
      ].filter(Boolean).join(" ").toLowerCase(),
    }));

    return uploadList;
  }, []);

  // Fetch all upload logs data from server
  const fetchAllUploadData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      console.log("Fetching all upload logs data...");

      const response = await fetch(`${API}/project/get-prospect-import-logs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!result.success) {
        console.error("Failed to fetch upload logs data:", result.message);
        return;
      }

      const uploadData = result.result || [];
      console.log("Raw upload logs data:", uploadData);

      // Process and transform data
      const uploadList = processUploadData(uploadData);

      // Update state with all data
      setAllUploadDetails(uploadList);
      setInitialLoadComplete(true);

      console.log("Processed upload list:", uploadList);

    } catch (error) {
      console.error("Upload logs data fetch failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [processUploadData]);

  // Initial data fetch - gets ALL data once
  useEffect(() => {
    fetchAllUploadData();
  }, [fetchAllUploadData]);

  // Handle row click navigation (you might want to adjust this based on your needs)
  const handleReadMore = useCallback(
    (row) => {
      // Adjust navigation logic based on what you want to show for upload logs
      navigate(`?mode=upload_details&Item=Upload+Details&id=${row.id}`, {
        state: {
          upload_id: row.id,
        },
      });
    },
    [navigate]
  );

  // Memoize table columns to prevent unnecessary re-renders
  // Note: You'll need to create appropriate column headers for upload logs
  const tableColumns = useMemo(() => {
    // You might want to create a new column header function for upload logs
    // or modify the existing one to handle upload data
    return companyDatabaseColumnHeader(userDetails, allUploadDetails);
  }, [userDetails, allUploadDetails]);

  // Show loading state for initial load
  if (!initialLoadComplete && isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        Loading upload logs data...
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: { sm: 2, md: 2, lg: 2, xl: 3 },
        height: "100%",
        overflowY: "auto",
      }}
    >
      {type ? (
        <>
          {mode === "market_plan" ? (
            <CompanyViewDetails />
          ) : (
            <ContactDetails callingFrom="database" />
          )}
        </>
      ) : (
        <DataTable
          // Pass all upload data to the table
          tableData={allUploadDetails}
          tableColumns={tableColumns}
          actionData={handleReadMore}
          
          // Virtualization settings for large datasets
          enableVirtualization={true}
          virtualItemSize={55}
          overscan={15}
          
          // UI settings
          density="comfortable"
          searchPlaceholder="Search uploaded files..."
          isLoading={isLoading}
          
          // Disable server-side operations
          enablePagination={false}

          // Enable client-side features
          enablePersistentFilters={true}
          enableTopToolbar={true}
          enableColumnFilters={true}
          enableGlobalFilter={true}
          enableSorting={true}
          enableSearch={true}
          
          // Configuration
          tableId="upload-logs-virtualized"
          hgt={tableHeight}
          onDrag={true}
          borderPadding={true}
          columnFilterDisplayMode={true}
        />
      )}
    </Box>
  );
};

export default UploadedFileList;