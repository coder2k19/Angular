import { useMemo, useState, useEffect, useCallback } from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import { Box, Typography, useMediaQuery } from "@mui/material";
import theme from "../../../Constants/theme";

const DataTable = ({
  tableData = [],
  tableColumns,
  actionData,
  paginationData,
  onFetch,
  renderCustomActions,
  enableSearch = true,
  enableTopToolbar = true,
  enableSorting = true,
  searchPlaceholder = "Search...",
  isLoading = false,
  density,
  subTitle,
  enablePagination = false, // Changed default to false for virtualization
  hgt,
  minHgt,
  type,
  wdth,
  onDrag,
  borderPadding,
  enableColumnFilters,
  fetchColumnFilters,
  tableId,
  enablePersistentFilters,
  columnFilterDisplayMode,
  enableVirtualization = true, // New prop to enable/disable virtualization
  virtualItemSize = 50, // Height of each row for virtualization
  overscan = 10, // Number of items to render outside visible area
}) => {
  // Process columns if a transform function is provided
  const columns = useMemo(
    () =>
      typeof tableColumns === "function"
        ? tableColumns(actionData)
        : tableColumns,
    [tableColumns, actionData]
  );

  const isSmallScreen = useMediaQuery("(max-width: 1366px)");
  
  // Store original data from server (never filtered on server)
  const [originalData, setOriginalData] = useState([]);
  
  // Filtered and sorted data for display
  const [processedData, setProcessedData] = useState([]);
  
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);

  // Generate storage keys for persistent filters (moved outside useEffect to fix dependency warning)
  const getStorageKey = useCallback((key) => `datatable_${tableId}_${key}`, [tableId]);

  // Load persistent filters from localStorage
  useEffect(() => {
    if (enablePersistentFilters && tableId) {
      const savedFilters = localStorage.getItem(getStorageKey("columnFilters"));
      const savedGlobalFilter = localStorage.getItem(
        getStorageKey("globalFilter")
      );
      const savedSorting = localStorage.getItem(getStorageKey("sorting"));

      if (savedFilters) {
        try {
          const parsedFilters = JSON.parse(savedFilters);
          setColumnFilters(parsedFilters);
        } catch (e) {
          console.warn("Failed to parse saved column filters:", e);
        }
      }

      if (savedGlobalFilter) {
        setGlobalFilter(savedGlobalFilter);
      }

      if (savedSorting) {
        try {
          const parsedSorting = JSON.parse(savedSorting);
          setSorting(parsedSorting);
        } catch (e) {
          console.warn("Failed to parse saved sorting:", e);
        }
      }
    }
  }, [enablePersistentFilters, tableId, getStorageKey]);

  // Save filters to localStorage when they change
  useEffect(() => {
    if (enablePersistentFilters && tableId) {
      localStorage.setItem(
        getStorageKey("columnFilters"),
        JSON.stringify(columnFilters)
      );
    }
  }, [columnFilters, enablePersistentFilters, tableId, getStorageKey]);

  useEffect(() => {
    if (enablePersistentFilters && tableId) {
      localStorage.setItem(getStorageKey("globalFilter"), globalFilter);
    }
  }, [globalFilter, enablePersistentFilters, tableId, getStorageKey]);

  useEffect(() => {
    if (enablePersistentFilters && tableId) {
      localStorage.setItem(
        getStorageKey("sorting"),
        JSON.stringify(sorting)
      );
    }
  }, [sorting, enablePersistentFilters, tableId, getStorageKey]);

  // Update original data when tableData changes
  useEffect(() => {
    setOriginalData(tableData);
  }, [tableData]);

  // Client-side filtering and sorting function
  const filterAndSortData = useCallback((data, filters, globalSearch, sortConfig) => {
    let filteredData = [...data];

    // Apply global filter
    if (globalSearch && globalSearch.trim() !== "") {
      const searchTerm = globalSearch.toLowerCase().trim();
      filteredData = filteredData.filter((row) => {
        return Object.values(row).some((value) => {
          if (value == null) return false;
          return String(value).toLowerCase().includes(searchTerm);
        });
      });
    }

    // Apply column filters
    if (filters && filters.length > 0) {
      filteredData = filteredData.filter((row) => {
        return filters.every((filter) => {
          const { id, value } = filter;
          if (value === undefined || value === null || value === "") return true;
          
          const cellValue = row[id];
          if (cellValue == null) return false;

          // Handle different filter types
          if (Array.isArray(value)) {
            // Multi-select filter
            return value.includes(cellValue);
          } else if (typeof value === "string") {
            // Text filter
            return String(cellValue).toLowerCase().includes(value.toLowerCase());
          } else if (typeof value === "number") {
            // Numeric filter
            return Number(cellValue) === value;
          } else if (typeof value === "boolean") {
            // Boolean filter
            return Boolean(cellValue) === value;
          }
          
          return String(cellValue).toLowerCase().includes(String(value).toLowerCase());
        });
      });
    }

    // Apply sorting
    if (sortConfig && sortConfig.length > 0) {
      filteredData.sort((a, b) => {
        for (const sort of sortConfig) {
          const { id, desc } = sort;
          const aValue = a[id];
          const bValue = b[id];

          if (aValue == null && bValue == null) continue;
          if (aValue == null) return desc ? 1 : -1;
          if (bValue == null) return desc ? -1 : 1;

          let comparison = 0;
          
          // Handle different data types
          if (typeof aValue === "number" && typeof bValue === "number") {
            comparison = aValue - bValue;
          } else if (aValue instanceof Date && bValue instanceof Date) {
            comparison = aValue.getTime() - bValue.getTime();
          } else {
            comparison = String(aValue).localeCompare(String(bValue));
          }

          if (comparison !== 0) {
            return desc ? -comparison : comparison;
          }
        }
        return 0;
      });
    }

    return filteredData;
  }, []);

  // Process data whenever filters, sorting, or original data changes
  useEffect(() => {
    const filtered = filterAndSortData(originalData, columnFilters, globalFilter, sorting);
    setProcessedData(filtered);
  }, [originalData, columnFilters, globalFilter, sorting, filterAndSortData]);

  // Calculate if filters are active
  const hasActiveFilters = useMemo(() => {
    return (columnFilters && columnFilters.length > 0) || (globalFilter && globalFilter.trim() !== "");
  }, [columnFilters, globalFilter]);

  // Create a debounce function for search
  const debounce = (func, delay) => {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // Debounced search handler (now only updates local state)
  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        setGlobalFilter(value);
      }, 300), // Reduced delay since it's client-side
    []
  );

  // Handle row click
  const handleRowClick = useCallback((row) => {
    if (actionData) {
      actionData(row.original);
    }
  }, [actionData]);

  // Clear all filters function
  const clearAllFilters = useCallback(() => {
    setColumnFilters([]);
    setGlobalFilter("");
    setSorting([]);

    if (enablePersistentFilters && tableId) {
      localStorage.removeItem(getStorageKey("columnFilters"));
      localStorage.removeItem(getStorageKey("globalFilter"));
      localStorage.removeItem(getStorageKey("sorting"));
    }
  }, [enablePersistentFilters, tableId, getStorageKey]);

  // Memoize table configuration
  const tableConfig = useMemo(() => ({
    columns,
    data: processedData,
    
    // Virtualization settings
    enableRowVirtualization: enableVirtualization,
    rowVirtualizerInstanceRef: enableVirtualization ? { current: null } : undefined,
    rowVirtualizerOptions: enableVirtualization ? {
      overscan: overscan,
      estimateSize: () => virtualItemSize,
    } : undefined,
    
    // Column virtualization for wide tables
    enableColumnVirtualization: enableVirtualization && columns.length > 10,
    columnVirtualizerOptions: enableVirtualization ? { 
      overscan: 2,
      estimateSize: (index) => {
        // Estimate column width based on column type or provide default
        const column = columns[index];
        if (column?.size) return column.size;
        if (column?.maxSize) return Math.min(column.maxSize, 200);
        return 150; // default column width
      }
    } : undefined,

    // Disable server-side operations
    manualPagination: false,
    manualFiltering: false,
    manualSorting: false,
    
    // Enable client-side features
    enableGlobalFilter: enableSearch,
    enablePagination: enablePagination,
    enableColumnActions: false,
    enableColumnFilters: enableColumnFilters,
    enableSorting: enableSorting,
    enableTopToolbar: enableTopToolbar,
    enableBottomToolbar: true, // Always enable to show row count
    positionToolbarAlertBanner: "bottom",
    enableColumnOrdering: onDrag,
    enableColumnDragging: false,
    // Performance optimizations
    enableFacetedValues: false, // Disable for large datasets as it can be slow
    enableGlobalFilterModes: false,
    enableColumnFilterModes: false,
    
    // Initial state
    initialState: { 
      density: density, 
      showColumnFilters: false,
      pagination: enablePagination ? {
        pageIndex: 0,
        pageSize: 50, // Larger page size for virtualized tables
      } : {
        pageIndex: 0,
        pageSize: 50, // Larger page size for virtualized tables
      },
    },
    
    columnFilterDisplayMode: columnFilterDisplayMode && "popover",
    isMultiSortEvent: () => false,
    
    // Event handlers
    onGlobalFilterChange: debouncedSearch,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,

    // Row props
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => handleRowClick(row),
      sx: {
        boxShadow: "none !important",
        backgroundColor: theme.palette.common.white,
        height: enableVirtualization ? `${virtualItemSize}px` : "auto",
        minHeight: enableVirtualization ? `${virtualItemSize}px` : "auto",
        overflow: "hidden", // Prevent content overflow in virtualized rows
        "&:hover": {
          cursor: actionData ? "pointer" : "default",
          backgroundColor: theme.palette.action?.hover || "#f5f5f5",
        },
      },
    }),

    // State
    state: {
      isLoading,
      columnFilters,
      globalFilter,
      sorting,
      pagination: enablePagination ? {
        pageIndex: 0,
        pageSize: 50,
      } : {
        pageIndex: 0,
        pageSize: 50, // Larger page size for virtualized tables
      },
    },

    // Pagination settings
    paginationDisplayMode: enablePagination ? "pages" : undefined,
    
    // Search field props
    muiSearchTextFieldProps: {
      placeholder: searchPlaceholder,
      sx: {
        marginBottom: "12px",
        width: "100%",
        borderRadius: "8px",
        backgroundColor: theme.palette.common.white + "!important",
      },
      variant: "outlined",
    },

    // Styling props (keeping your existing styles)
    muiTopToolbarProps: {
      sx: {
        backgroundColor: theme.palette.common.white,
        padding: "0px",
        "& .MuiIconButton-root": {
          padding: "4px",
          fontSize: "1rem",
          width: "36px",
          height: "36px",
        },
        "& .MuiSvgIcon-root": {
          fontSize: isSmallScreen ? "1rem" : "24px",
          padding: "0px",
        },
        "& .css-vv1s46": {
          padding: "0px",
          minHeight: "1rem",
        },
      },
    },

    muiTableHeadProps: {
      sx: {
        position: "sticky",
        zIndex: 10,
        top: 0,
      },
    },

    muiTableHeadCellProps: {
      sx: {
        boxShadow: "none !important",
        color: theme.palette.secondary.main,
        fontWeight: "bold",
        fontSize: "16px", // Fixed from 40px which seemed like a mistake
        padding: "12px 16px",
        backgroundColor: theme.palette.background?.paper || "#fff",
      },
    },

    muiTablePaperProps: {
      elevation: 0,
      sx: (theme) => ({
        boxShadow: "none",
        backgroundColor: theme.palette.common.white,
        padding: type === "lead_tracker" || !borderPadding ? "0px" : "0px 12px",
        [theme.breakpoints.between(1200, 1400)]: {
          padding: !borderPadding ? "0px" : "0px 6px",
        },
        [theme.breakpoints.between(1401, 1600)]: {
          padding: !borderPadding ? "0px" : "0px 8px",
        },
        [theme.breakpoints.between(1601, 1850)]: {
          padding: !borderPadding ? "0px" : "0px 10px",
        },
      }),
    },

    muiBottomToolbarProps: {
      sx: {
        boxShadow: "none",
        backgroundColor: theme.palette.common.white,
        minHeight: minHgt ? minHgt : "3rem",
        position: "relative", // Ensure proper positioning for absolute children
        display: "flex",
        alignItems: "center",
        justifyContent: enablePagination ? "space-between" : "flex-end",
      },
    },

    muiTableBodyCellProps: {
      sx: {
        fontSize: "14px", // Slightly smaller for better virtualization performance
        padding: enableVirtualization ? "8px 16px" : "12px 16px", // Reduced padding for virtualized rows
        border: `1px solid ${theme.palette.custom.lightGray}`,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
    },

    muiTableContainerProps: {
      sx: {
        margin: "0 auto",
        width: wdth || "98% !important",
        boxShadow: "none !important",
        backgroundColor: theme.palette.common.white,
        borderRadius: "12px",
        border: `1px solid ${theme.palette.custom.lightGray}`,
        height: hgt ? hgt : "70vh", // Increased default height for virtualization
        overflow: "auto",
        "&::-webkit-scrollbar": {
          width: "6px",
          height: "6px",
        },
        "&::-webkit-scrollbar-track": {
          background: "#f1f1f1",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#BBBBBB",
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-thumb:hover": {
          backgroundColor: "#a8a8a8",
        },
      },
    },

    // Custom toolbar actions
    renderTopToolbarCustomActions: () => (
      <Box display="flex" flexDirection="column" gap={1}>
        {subTitle && (
          <Typography fontFamily="Roboto" color={theme.palette.text.darkGray}>
            {subTitle}
          </Typography>
        )}

        {enableColumnFilters && (
          <Box display="flex" gap={1} alignItems="center">
            <Typography variant="caption" sx={{
              color: theme.palette.text.secondary,
              fontSize: "14px",
              fontWeight: 500,
              pl: 1
            }}>
              Column Filters Active: {columnFilters.length}
            </Typography>
            {(columnFilters.length > 0 || globalFilter) && (
              <Typography
                variant="caption"
                sx={{
                  cursor: "pointer",
                  color: theme.palette.primary.main,
                  textDecoration: "underline",
                  fontSize: "14px",
                }}
                onClick={clearAllFilters}
              >
                Clear All Filters
              </Typography>
            )}
          </Box>
        )}
        {renderCustomActions && renderCustomActions()}
      </Box>
    ),

    // Custom bottom toolbar actions for row count
    renderBottomToolbarCustomActions: () => (
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="flex-end"
        sx={{ 
          position: "absolute",
          right: 16,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 1,
        }}
      >
        <Typography 
          variant="body2" 
          sx={{
            color: theme.palette.text.primary,
            fontSize: "14px",
            fontWeight: 600,
            mr: 2,
          }}
        >
          {hasActiveFilters ? (
            <>
              Showing {processedData.length.toLocaleString()} of {originalData.length.toLocaleString()} rows
            </>
          ) : (
            <>
              Total Rows: {originalData.length.toLocaleString()}
            </>
          )}
        </Typography>
        
        {hasActiveFilters && (
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.warning.main,
              fontSize: "12px",
              fontStyle: "italic",
            }}
          >
            (Filtered)
          </Typography>
        )}
      </Box>
    ),
  }), [
    columns,
    processedData,
    originalData,
    hasActiveFilters,
    enableVirtualization,
    virtualItemSize,
    overscan,
    enablePagination,
    enableSearch,
    enableColumnFilters,
    enableSorting,
    enableTopToolbar,
    onDrag,
    density,
    columnFilterDisplayMode,
    debouncedSearch,
    isLoading,
    columnFilters,
    globalFilter,
    sorting,
    searchPlaceholder,
    isSmallScreen,
    type,
    borderPadding,
    minHgt,
    wdth,
    hgt,
    subTitle,
    renderCustomActions,
    actionData,
    handleRowClick,
    clearAllFilters,
  ]); // Removed 'theme' from dependency array as it's an imported constant

  const table = useMaterialReactTable(tableConfig);

  return (
    <Box
      sx={{
        width: "100%",
        overflowX: "auto",
        borderRadius: "12px",
        "& .MuiInputLabel-root": {
          fontSize: "16px",
          [theme.breakpoints.between(1200, 1400)]: {
            fontSize: "12px",
          },
          [theme.breakpoints.between(1401, 1600)]: {
            fontSize: "14px",
          },
        },
        "& .MuiSelect-select": {
          fontSize: "16px",
          [theme.breakpoints.between(1200, 1400)]: {
            fontSize: "12px",
          },
          [theme.breakpoints.between(1401, 1600)]: {
            fontSize: "14px",
          },
        },
      }}
    >
      <MaterialReactTable table={table} />
    </Box>
  );
};

export default DataTable;