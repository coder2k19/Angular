import { Box, useMediaQuery, CircularProgress, Alert } from "@mui/material";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../../global";
import {
  capitalizeIndustry,
  capitalizeText,
  formatRevenue,
} from "../../Constants/Funtions/commonFunctions";
import DataTable from "../Reusable/DataTable/DataTable";
import { companyDatabaseColumnHeader } from "../OutReachDetails/CommonColumnHeadr";
import CompanyViewDetails from "../OutReachDetails/MarketPlan/CompanyViewDetails";
import ContactDetails from "../OutReachDetails/MarketPlan/ContactDetails";

const OptimizedCompanyList = () => {
  const navigate = useNavigate();

  // State management
  const [allCompanyDetails, setAllCompanyDetails] = useState([]); // Store all data from server
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userDetails, setUserListDetails] = useState([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // URL parameters
  const params = new URLSearchParams(window.location.search);
  const type = params.get("id");
  const mode = params.get("mode");

  // Media queries for responsive height
  const isSmallScreen = useMediaQuery("(min-width: 1200px) and (max-width: 1400px)");
  const isMediumScreen = useMediaQuery("(min-width: 1401px) and (max-width: 1600px)");
  const isLargeScreen = useMediaQuery("(min-width: 1601px) and (max-width: 1850px)");

  // Calculate table height based on screen size
  const tableHeight = useMemo(() => {
    if (isSmallScreen) return "60dvh";
    if (isMediumScreen) return "63dvh";
    if (isLargeScreen) return "63dvh";
    return "70dvh";
  }, [isSmallScreen, isMediumScreen, isLargeScreen]);

  // Enhanced data processing with comprehensive searchableText
  const processCompanyData = useCallback((companyData) => {
    const userList = [];
    
    const companyList = companyData.map((item) => {
      const sdrDetails = item?.sdr_details || {};
      const sdrName = [sdrDetails.first_name, sdrDetails.last_name]
        .filter(Boolean)
        .join(" ") || "---";

      const sdr_user_id = sdrDetails._id || null;
      
      // Collect unique users for filter dropdown
      if (sdr_user_id && !userList.some(user => user.sdr_user_id === sdr_user_id)) {
        userList.push({
          userName: sdrName,
          sdr_user_id,
        });
      }

      // Process geography information
      let country = "---";
      let region = "---";
      let state = "---";
      const geography = item?.geographies?.length
        ? item.geographies
            .map((geo) => {
              country = geo?.country?.toUpperCase() || "---";
              region = geo?.region
                ? geo.region.charAt(0).toUpperCase() + geo.region.slice(1)
                : "---";
              state = geo?.state
                ? geo.state.charAt(0).toUpperCase() + geo.state.slice(1)
                : "---";
              return `${country},${region},${state}`;
            })
            .join("; ")
        : "---";

      // Process industries
      const industries = item?.industries?.length > 0
        ? capitalizeIndustry(item.industries)
        : "---";

      const companyName = capitalizeText(item?.company_name || "---");
      const dataSource = capitalizeText(item?.data_source) || "---";
      const revenue = item?.revenue ? `$ ${formatRevenue(item.revenue)}` : "---";
      const contactCount = item?.prospect_contact_count?.toString() || "0";
      const buyerIntentScore = item?.buyer_intent_score || 0;

      // Return processed company object with comprehensive searchableText
      return {
        id: item?._id,
        company_name: companyName,
        industries,
        buyer_intent_score: buyerIntentScore,
        revenue,
        revenue_raw: item?.revenue || 0, // Keep raw value for sorting
        geography,
        country,
        state,
        region,
        sdr: sdrName,
        reviewed_by_sdr_date: item?.reviewed_by_sdr_date || "---",
        prospect_contact_count: contactCount,
        prospect_contact_count_raw: item?.prospect_contact_count || 0, // Keep raw value for sorting
        data_source: dataSource,
        user_id: sdr_user_id,
        
        // Additional fields for filtering and sorting
        created_date: item?.created_date || item?.createdAt,
        updated_date: item?.updated_date || item?.updatedAt,
        
        // Comprehensive searchableText field for enhanced global search
        searchableText: [
          // Basic company info
          companyName,
          item?.company_name?.toLowerCase(),
          
          // Industries
          industries,
          ...(item?.industries || []),
          
          // Geography
          country,
          region,
          state,
          geography,
          
          // SDR information
          sdrName,
          sdrDetails.first_name,
          sdrDetails.last_name,
          
          // Revenue and metrics
          revenue,
          item?.revenue?.toString(),
          buyerIntentScore.toString(),
          contactCount,
          
          // Data source
          dataSource,
          item?.data_source?.toLowerCase(),
          
          // Additional searchable terms
          'company', 'prospect', 'lead', 'business',
          
          // Dates for temporal search
          item?.created_date,
          item?.updated_date,
          item?.reviewed_by_sdr_date,
          
        ].filter(Boolean).join(" ").toLowerCase(),
      };
    });

    return { companyList, userList };
  }, []);

  // Fetch all company data from server with enhanced error handling
  const fetchAllCompanyData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const projectId = localStorage.getItem("project_id");
      const token = localStorage.getItem("token");

      if (!projectId || !token) {
        throw new Error("Missing authentication credentials");
      }

      const body = { project_id: projectId };

      console.log("Fetching all company data...");

      const response = await fetch(`${API}/project/get-prospect-companies`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch company data");
      }

      const companyData = result.result || [];
      console.log(`Fetched ${companyData.length} companies from server`);

      // Process and transform data
      const { companyList, userList } = processCompanyData(companyData);

      // Update state with all data
      setAllCompanyDetails(companyList);
      setUserListDetails(userList);
      setInitialLoadComplete(true);

      console.log(`Processed ${companyList.length} companies, ${userList.length} unique users`);

    } catch (error) {
      console.error("Company data fetch failed:", error);
      setError(error.message || "Failed to load company data");
      setAllCompanyDetails([]); // Reset data on error
      setUserListDetails([]);
    } finally {
      setIsLoading(false);
    }
  }, [processCompanyData]);

  // Initial data fetch - gets ALL data once
  useEffect(() => {
    fetchAllCompanyData();
  }, [fetchAllCompanyData]);

  // Handle row click navigation
  const handleReadMore = useCallback(
    (row) => {
      navigate(`?mode=market_plan&Item=Company+Details&id=${row.id}`, {
        state: {
          contact_id: row.id,
        },
      });
    },
    [navigate]
  );

  // Retry function for error handling
  const handleRetry = useCallback(() => {
    fetchAllCompanyData();
  }, [fetchAllCompanyData]);

  // Memoize table columns to prevent unnecessary re-renders
  const tableColumns = useMemo(() => {
    return companyDatabaseColumnHeader(userDetails, allCompanyDetails);
  }, [userDetails, allCompanyDetails]);

  // Calculate virtualization settings based on data size
  const virtualizationSettings = useMemo(() => {
    const dataSize = allCompanyDetails.length;
    
    if (dataSize > 1000) {
      return {
        enableVirtualization: true,
        virtualItemSize: 55,
        overscan: 10, // Reduced for very large datasets
      };
    } else if (dataSize > 100) {
      return {
        enableVirtualization: true,
        virtualItemSize: 55,
        overscan: 15,
      };
    } else {
      return {
        enableVirtualization: false,
        virtualItemSize: 55,
        overscan: 5,
      };
    }
  }, [allCompanyDetails.length]);

  // Error state
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

  // Loading state for initial load
  if (!initialLoadComplete && isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: tableHeight,
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress />
        <span>Loading company data...</span>
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
          // Core data
          tableData={allCompanyDetails}
          tableColumns={tableColumns}
          actionData={handleReadMore}
          
          // Virtualization settings (dynamic based on data size)
          {...virtualizationSettings}
          
          // Search configuration
          enableSearch={true}
          searchPlaceholder="Search companies, industries, locations, SDRs..."
          searchableTextKey="searchableText"
          
          // UI settings
          density="comfortable"
          isLoading={isLoading}
          
          // Disable pagination (use virtualization instead)
          enablePagination={false}

          // Enable client-side features
          enablePersistentFilters={true}
          enableTopToolbar={true}
          enableColumnFilters={true}
          enableSorting={true}
          
          // Configuration
          tableId="company-list-optimized"
          hgt={tableHeight}
          onDrag={true}
          borderPadding={true}
          columnFilterDisplayMode="popover"
          
          // Performance optimizations
          enableFacetedValues={true} // Enable filter dropdown values
          enableGlobalFilterModes={false}
          enableColumnFilterModes={false}
          
          // Subtitle with data statistics
          subTitle={`${allCompanyDetails.length} companies loaded • ${userDetails.length} unique SDRs`}
        />
      )}
    </Box>
  );
};

export default OptimizedCompanyList;