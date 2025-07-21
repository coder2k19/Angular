# Optimized Data Component Pattern Guide

## Overview
This guide demonstrates how to create high-performance data components using the pattern from `OptimizedCompanyList`. This pattern is ideal for components that handle large datasets with complex filtering, searching, and virtualization needs.

## Core Pattern Structure

### 1. **State Management Pattern**
```javascript
const [allData, setAllData] = useState([]); // Store ALL data from server
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);
const [additionalData, setAdditionalData] = useState([]); // Related data (users, categories, etc.)
const [initialLoadComplete, setInitialLoadComplete] = useState(false);
```

### 2. **Responsive Height Calculation**
```javascript
const isSmallScreen = useMediaQuery("(min-width: 1200px) and (max-width: 1400px)");
const isMediumScreen = useMediaQuery("(min-width: 1401px) and (max-width: 1600px)");
const isLargeScreen = useMediaQuery("(min-width: 1601px) and (max-width: 1850px)");

const tableHeight = useMemo(() => {
  if (isSmallScreen) return "60dvh";
  if (isMediumScreen) return "63dvh";
  if (isLargeScreen) return "63dvh";
  return "70dvh";
}, [isSmallScreen, isMediumScreen, isLargeScreen]);
```

### 3. **Data Processing with SearchableText**
```javascript
const processData = useCallback((rawData) => {
  const processedData = rawData.map((item) => {
    // Process individual fields
    const processedField1 = processField(item.field1);
    const processedField2 = processField(item.field2);
    
    return {
      id: item._id,
      field1: processedField1,
      field2: processedField2,
      // ... other fields
      
      // Comprehensive searchableText for global search
      searchableText: [
        processedField1,
        processedField2,
        item.field1?.toLowerCase(),
        item.field2?.toLowerCase(),
        // Additional searchable terms
        'relevant', 'keywords', 'for', 'search'
      ].filter(Boolean).join(" ").toLowerCase(),
    };
  });
  
  return processedData;
}, []);
```

### 4. **API Fetch with Error Handling**
```javascript
const fetchAllData = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await fetch(`${API}/endpoint`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ /* request body */ }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || "Failed to fetch data");
    }

    const processedData = processData(result.result || []);
    setAllData(processedData);
    setInitialLoadComplete(true);

  } catch (error) {
    console.error("Data fetch failed:", error);
    setError(error.message || "Failed to load data");
    setAllData([]);
  } finally {
    setIsLoading(false);
  }
}, [processData]);
```

### 5. **Dynamic Virtualization Settings**
```javascript
const virtualizationSettings = useMemo(() => {
  const dataSize = allData.length;
  
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
}, [allData.length]);
```

## Implementation Template

```javascript
import { Box, useMediaQuery, CircularProgress, Alert } from "@mui/material";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../../global";
import DataTable from "../Reusable/DataTable/DataTable";

const OptimizedDataComponent = () => {
  const navigate = useNavigate();

  // State management
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Responsive height calculation
  const isSmallScreen = useMediaQuery("(min-width: 1200px) and (max-width: 1400px)");
  const isMediumScreen = useMediaQuery("(min-width: 1401px) and (max-width: 1600px)");
  const isLargeScreen = useMediaQuery("(min-width: 1601px) and (max-width: 1850px)");

  const tableHeight = useMemo(() => {
    if (isSmallScreen) return "60dvh";
    if (isMediumScreen) return "63dvh";
    if (isLargeScreen) return "63dvh";
    return "70dvh";
  }, [isSmallScreen, isMediumScreen, isLargeScreen]);

  // Data processing function
  const processData = useCallback((rawData) => {
    return rawData.map((item) => ({
      id: item._id,
      // ... process fields
      searchableText: [
        // ... searchable content
      ].filter(Boolean).join(" ").toLowerCase(),
    }));
  }, []);

  // API fetch function
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // ... API call logic
      const processedData = processData(result.data);
      setAllData(processedData);
      setInitialLoadComplete(true);
    } catch (error) {
      setError(error.message);
      setAllData([]);
    } finally {
      setIsLoading(false);
    }
  }, [processData]);

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Event handlers
  const handleRowClick = useCallback((row) => {
    // Handle row interaction
  }, []);

  const handleRetry = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Dynamic virtualization
  const virtualizationSettings = useMemo(() => {
    const dataSize = allData.length;
    return {
      enableVirtualization: dataSize > 100,
      virtualItemSize: 55,
      overscan: dataSize > 1000 ? 10 : 15,
    };
  }, [allData.length]);

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" action={<button onClick={handleRetry}>Retry</button>}>
          {error}
        </Alert>
      </Box>
    );
  }

  // Loading state
  if (!initialLoadComplete && isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: tableHeight }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DataTable
      tableData={allData}
      tableColumns={tableColumns}
      actionData={handleRowClick}
      
      // Virtualization
      {...virtualizationSettings}
      
      // Search
      enableSearch={true}
      searchPlaceholder="Search..."
      searchableTextKey="searchableText"
      
      // Configuration
      density="comfortable"
      isLoading={isLoading}
      enablePagination={false}
      enablePersistentFilters={true}
      enableTopToolbar={true}
      enableColumnFilters={true}
      enableSorting={true}
      
      tableId="optimized-data-table"
      hgt={tableHeight}
      enableFacetedValues={true}
      columnFilterDisplayMode="popover"
      
      subTitle={`${allData.length} records loaded`}
    />
  );
};

export default OptimizedDataComponent;
```

## Key Benefits of This Pattern

### 1. **Performance Optimizations**
- ✅ **Single API call** - Fetch all data once, no server requests for filtering/sorting
- ✅ **Client-side processing** - All operations happen locally for instant responses
- ✅ **Dynamic virtualization** - Automatically adjusts based on dataset size
- ✅ **Memoized calculations** - Prevents unnecessary re-renders

### 2. **Enhanced Search Capabilities**
- ✅ **Comprehensive searchableText** - Includes all relevant searchable content
- ✅ **Case-insensitive search** - Better user experience
- ✅ **Custom keywords** - Add domain-specific search terms
- ✅ **Real-time filtering** - Instant search results

### 3. **Robust Error Handling**
- ✅ **Comprehensive error states** - Handle network, auth, and data errors
- ✅ **Retry functionality** - Allow users to retry failed operations
- ✅ **Loading states** - Clear feedback during data loading
- ✅ **Graceful degradation** - Component remains functional even with errors

### 4. **Responsive Design**
- ✅ **Dynamic height calculation** - Adapts to different screen sizes
- ✅ **Responsive virtualization** - Adjusts performance based on screen size
- ✅ **Mobile-friendly** - Works well on all device sizes

## Usage Guidelines

### When to Use This Pattern
- **Large datasets** (>100 records)
- **Complex filtering requirements**
- **Real-time search needs**
- **Performance-critical components**
- **Data that doesn't change frequently**

### When NOT to Use This Pattern
- **Small datasets** (<50 records) - Standard table is sufficient
- **Frequently changing data** - Consider server-side pagination
- **Real-time data streams** - Use WebSocket or polling patterns
- **Memory-constrained environments** - Consider server-side processing

## Customization Options

### Search Enhancement
```javascript
searchableText: [
  // Basic fields
  item.name,
  item.description,
  
  // Processed fields
  processedStatus,
  formattedDate,
  
  // Related data
  item.category?.name,
  item.tags?.join(" "),
  
  // Custom keywords for your domain
  'custom', 'domain', 'keywords',
  
  // Numeric values as strings
  item.count?.toString(),
  item.score?.toString(),
].filter(Boolean).join(" ").toLowerCase()
```

### Virtualization Tuning
```javascript
// For different row heights
virtualItemSize: 45, // Compact rows
virtualItemSize: 55, // Standard rows  
virtualItemSize: 75, // Detailed rows

// For different performance needs
overscan: 5,  // Minimal - for very large datasets
overscan: 15, // Standard - good balance
overscan: 25, // Smooth - for smaller datasets
```

This pattern provides a solid foundation for building high-performance, user-friendly data components that can handle large datasets with excellent search and filtering capabilities.