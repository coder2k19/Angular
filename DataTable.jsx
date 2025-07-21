import { useMemo, useState, useEffect, useCallback, memo } from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import { Box, Typography, useMediaQuery, Button } from "@mui/material";
import theme from "../../../Constants/theme";

// Memoized debounce function to prevent recreation
const createDebounce = (func, delay) => {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
};

const DataTable = memo(({
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
  searchableTextKey = null, // Key for searchable text field in data
  isLoading = false,
  density = "comfortable",
  subTitle,
  enablePagination = false,
  hgt = "70vh",
  minHgt,
  type,
  wdth,
  onDrag = false,
  borderPadding = true,
  enableColumnFilters = false,
  fetchColumnFilters,
  tableId,
  enablePersistentFilters = false,
  columnFilterDisplayMode,
  enableVirtualization = true,
  virtualItemSize = 50,
  overscan = 5, // Reduced overscan for better performance
  enableFacetedValues = false,
  enableGlobalFilterModes = false,
  enableColumnFilterModes = false,
  // Pagination props
  paginationDisplayMode = "pages",
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
}) => {
  // Memoize processed columns to prevent unnecessary recalculations
  const columns = useMemo(() => {
    const processedColumns = typeof tableColumns === "function"
      ? tableColumns(actionData)
      : tableColumns;
    
    // Ensure columns have proper filter configuration
    return processedColumns?.map(column => ({
      ...column,
      // Enable filtering for all columns unless explicitly disabled
      enableColumnFilter: column.enableColumnFilter !== false && enableColumnFilters,
      // Ensure proper filter function
      filterFn: column.filterFn || 'includesString',
    }));
  }, [tableColumns, actionData, enableColumnFilters]);

  const isSmallScreen = useMediaQuery("(max-width: 1366px)");
  
  // Optimized state management
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSize,
  });

  // Memoize storage key functions
  const storageKeys = useMemo(() => {
    if (!enablePersistentFilters || !tableId) return null;
    return {
      columnFilters: `datatable_${tableId}_columnFilters`,
      globalFilter: `datatable_${tableId}_globalFilter`,
      sorting: `datatable_${tableId}_sorting`,
    };
  }, [enablePersistentFilters, tableId]);

  // Load persistent filters from localStorage (only once on mount)
  useEffect(() => {
    if (!storageKeys) return;

    try {
      const savedFilters = localStorage.getItem(storageKeys.columnFilters);
      const savedGlobalFilter = localStorage.getItem(storageKeys.globalFilter);
      const savedSorting = localStorage.getItem(storageKeys.sorting);

      if (savedFilters) {
        setColumnFilters(JSON.parse(savedFilters));
      }
      if (savedGlobalFilter) {
        setGlobalFilter(savedGlobalFilter);
      }
      if (savedSorting) {
        setSorting(JSON.parse(savedSorting));
      }
    } catch (e) {
      console.warn("Failed to parse saved filters:", e);
    }
  }, []); // Only run once on mount

  // Debounced save to localStorage
  const debouncedSave = useMemo(
    () => createDebounce((key, value) => {
      if (storageKeys) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }, 500),
    [storageKeys]
  );

  // Save filters to localStorage with debouncing
  useEffect(() => {
    if (storageKeys) {
      debouncedSave(storageKeys.columnFilters, columnFilters);
    }
  }, [columnFilters, storageKeys, debouncedSave]);

  useEffect(() => {
    if (storageKeys) {
      debouncedSave(storageKeys.globalFilter, globalFilter);
    }
  }, [globalFilter, storageKeys, debouncedSave]);

  useEffect(() => {
    if (storageKeys) {
      debouncedSave(storageKeys.sorting, sorting);
    }
  }, [sorting, storageKeys, debouncedSave]);

  // Enhanced global search function
  const performGlobalSearch = useCallback((searchTerm, data) => {
    if (!searchTerm || searchTerm.trim() === "") {
      return data;
    }

    const searchTermLower = searchTerm.toLowerCase().trim();
    
    return data.filter((row) => {
      // If searchableTextKey is provided, search in that field first
      if (searchableTextKey && row[searchableTextKey]) {
        return row[searchableTextKey].toLowerCase().includes(searchTermLower);
      }
      
      // Otherwise, search in all visible columns
      return Object.values(row).some((value) => {
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchTermLower);
      });
    });
  }, [searchableTextKey]);

  // Memoized debounced search handler
  const debouncedSearch = useMemo(
    () => createDebounce((value) => {
      setGlobalFilter(value);
    }, 300),
    []
  );

  // Memoized row click handler
  const handleRowClick = useCallback((row) => {
    if (actionData) {
      actionData(row.original);
    }
  }, [actionData]);

  // Memoized clear filters function
  const clearAllFilters = useCallback(() => {
    setColumnFilters([]);
    setGlobalFilter("");
    setSorting([]);

    if (storageKeys) {
      localStorage.removeItem(storageKeys.columnFilters);
      localStorage.removeItem(storageKeys.globalFilter);
      localStorage.removeItem(storageKeys.sorting);
    }
  }, [storageKeys]);

  // Memoized virtualization options
  const virtualizationOptions = useMemo(() => {
    if (!enableVirtualization) return {};
    
    return {
      enableRowVirtualization: true,
      rowVirtualizerOptions: {
        overscan,
        estimateSize: () => virtualItemSize,
      },
      enableColumnVirtualization: columns.length > 10,
      columnVirtualizerOptions: columns.length > 10 ? {
        overscan: 2,
        estimateSize: (index) => {
          const column = columns[index];
          return column?.size || column?.maxSize || 150;
        }
      } : undefined,
    };
  }, [enableVirtualization, overscan, virtualItemSize, columns]);

  // Memoized styling options
  const stylingOptions = useMemo(() => ({
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => handleRowClick(row),
      sx: {
        boxShadow: "none !important",
        backgroundColor: theme.palette.common.white,
        height: enableVirtualization ? `${virtualItemSize}px` : "auto",
        minHeight: enableVirtualization ? `${virtualItemSize}px` : "auto",
        overflow: "hidden",
        "&:hover": {
          cursor: actionData ? "pointer" : "default",
          backgroundColor: theme.palette.action?.hover || "#f5f5f5",
        },
      },
    }),

    muiSearchTextFieldProps: {
      placeholder: searchPlaceholder,
      sx: {
        marginBottom: "12px",
        width: "100%",
        borderRadius: "8px",
        backgroundColor: theme.palette.common.white + "!important",
        "& .MuiOutlinedInput-root": {
          "&:hover fieldset": {
            borderColor: theme.palette.primary.main,
          },
          "&.Mui-focused fieldset": {
            borderColor: theme.palette.primary.main,
            borderWidth: "2px",
          },
        },
        "& .MuiInputBase-input": {
          fontSize: "14px",
          padding: "12px 14px",
        },
      },
      variant: "outlined",
      autoComplete: "off",
    },

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
        fontSize: "16px",
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

    // Bottom toolbar for pagination
    muiBottomToolbarProps: enablePagination ? {
      sx: {
        boxShadow: "none",
        backgroundColor: theme.palette.common.white,
        minHeight: minHgt || "3rem",
        "& .MuiTablePagination-root": {
          fontSize: "14px",
        },
        "& .MuiTablePagination-selectLabel": {
          fontSize: "14px",
          fontWeight: 500,
        },
        "& .MuiTablePagination-displayedRows": {
          fontSize: "14px",
          fontWeight: 500,
        },
      },
    } : undefined,

    muiTableBodyCellProps: {
      sx: {
        fontSize: "14px",
        padding: enableVirtualization ? "8px 16px" : "12px 16px",
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
        height: hgt,
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
  }), [
    handleRowClick,
    enableVirtualization,
    virtualItemSize,
    actionData,
    searchPlaceholder,
    isSmallScreen,
    type,
    borderPadding,
    wdth,
    hgt,
  ]);

  // Memoized filtered data for display statistics
  const filteredData = useMemo(() => {
    return performGlobalSearch(globalFilter, tableData);
  }, [performGlobalSearch, globalFilter, tableData]);

    // Debug: Log data structure for filter troubleshooting
  useEffect(() => {
    if (enableColumnFilters && tableData.length > 0) {
      console.log('DataTable Debug - Sample row:', tableData[0]);
      console.log('DataTable Debug - Columns:', columns);
      console.log('DataTable Debug - enableFacetedValues:', enableColumnFilters);
    }
  }, [tableData, columns, enableColumnFilters]);

  // Memoized custom toolbar
  const customToolbar = useMemo(() => (
    <Box display="flex" flexDirection="column" gap={1}>
      {subTitle && (
        <Typography fontFamily="Roboto" color={theme.palette.text.darkGray}>
          {subTitle}
        </Typography>
      )}
      
      {/* Data statistics with search results and pagination info */}
      <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
        <Typography variant="caption" sx={{
          color: theme.palette.text.secondary,
          fontSize: "12px",
          pl: 1
        }}>
          {enablePagination ? (
            // Show pagination-style info
            `Total: ${globalFilter ? filteredData.length : tableData.length} records`
          ) : (
            // Show regular info
            globalFilter ? 
              `Showing ${filteredData.length} of ${tableData.length} records` :
              `Showing ${tableData.length} records`
          )}
        </Typography>
        
        {enablePagination && (
          <Typography variant="caption" sx={{
            color: theme.palette.info.main,
            fontSize: "12px",
            fontWeight: 500,
          }}>
            {`${pagination.pageSize} rows per page`}
          </Typography>
        )}
        
        {globalFilter && (
          <Typography variant="caption" sx={{
            color: theme.palette.primary.main,
            fontSize: "12px",
            fontWeight: 500,
          }}>
            Search: "{globalFilter}"
          </Typography>
        )}
      </Box>

      {enableColumnFilters && (
        <Box display="flex" gap={1} alignItems="center">
          <Typography variant="caption" sx={{
            color: theme.palette.text.secondary,
            fontSize: "14px",
            fontWeight: 500,
            pl: 1
          }}>
            Filters Active: {columnFilters.length}
          </Typography>
          <Typography variant="caption" sx={{
            color: theme.palette.info.main,
            fontSize: "12px",
            fontStyle: "italic",
          }}>
            (Click column headers to filter)
          </Typography>
          {(columnFilters.length > 0 || globalFilter) && (
            <Button
              size="small"
              variant="text"
              onClick={clearAllFilters}
              sx={{
                fontSize: "12px",
                textTransform: "none",
                minWidth: "auto",
                p: 0.5,
              }}
            >
              Clear All
            </Button>
          )}
        </Box>
      )}
      {renderCustomActions && renderCustomActions()}
    </Box>
  ), [subTitle, tableData.length, filteredData.length, globalFilter, enablePagination, pagination.pageSize, enableColumnFilters, columnFilters.length, clearAllFilters, renderCustomActions]);

  // Main table configuration - heavily memoized
  const tableConfig = useMemo(() => ({
    columns,
    data: tableData,
    
    // Virtualization
    ...virtualizationOptions,
    
    // Core features
    enableGlobalFilter: enableSearch,
    enablePagination,
    enableColumnActions: false,
    enableColumnFilters,
    enableSorting,
    enableTopToolbar,
    enableBottomToolbar: enablePagination,
    positionToolbarAlertBanner: "bottom",
    enableColumnOrdering: onDrag,
    enableColumnDragging: false,
    
    // Global filter function
    globalFilterFn: searchableTextKey ? 
      (row, columnId, filterValue) => {
        if (!filterValue) return true;
        const searchableText = row.original[searchableTextKey];
        return searchableText ? 
          searchableText.toLowerCase().includes(filterValue.toLowerCase()) : 
          false;
      } : 
      'includesString', // Default MRT filter
    
    // Performance optimizations - enable faceted values for filter dropdowns
    enableFacetedValues: enableColumnFilters, // Enable when column filters are enabled
    enableGlobalFilterModes: false, // Disable for performance
    enableColumnFilterModes: false, // Disable for performance
    
    // Filter configuration
    filterFromLeafRows: true, // Filter from leaf rows for better performance
    maxLeafRowFilterDepth: 0, // No sub-rows, so set to 0
    
    // Manual operations (all disabled for client-side processing)
    manualPagination: false,
    manualFiltering: false,
    manualSorting: false,
    
    // Initial state
    initialState: { 
      density,
      showColumnFilters: enableColumnFilters, // Show column filters if enabled
      columnFilters: [], // Initialize empty column filters
      pagination: {
        pageIndex: 0,
        pageSize: pageSize,
      },
    },
    
    // Event handlers
    onGlobalFilterChange: debouncedSearch,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,

    // State
    state: {
      isLoading,
      columnFilters,
      globalFilter,
      sorting,
      pagination,
    },

    // Styling
    ...stylingOptions,

    // Custom toolbar
    renderTopToolbarCustomActions: () => customToolbar,

    // Other props
    columnFilterDisplayMode: columnFilterDisplayMode || "popover",
    isMultiSortEvent: () => false,
    
    // Pagination configuration
    paginationDisplayMode: enablePagination ? paginationDisplayMode : undefined,
    muiPaginationProps: enablePagination ? {
      rowsPerPageOptions: pageSizeOptions,
      showFirstButton: true,
      showLastButton: true,
    } : undefined,
    
    // Column filter props for better UX
    muiTableHeadCellFilterTextFieldProps: {
      sx: {
        m: 0.5,
        "& .MuiInputBase-root": {
          fontSize: "14px",
        },
      },
      variant: "outlined",
      size: "small",
    },
  }), [
    columns,
    tableData,
    virtualizationOptions,
    enableSearch,
    enablePagination,
    enableColumnFilters,
    enableSorting,
    enableTopToolbar,
    onDrag,
    enableFacetedValues,
    enableGlobalFilterModes,
    enableColumnFilterModes,
    density,
    enableVirtualization,
    searchableTextKey,
    debouncedSearch,
    isLoading,
    columnFilters,
    globalFilter,
    sorting,
    pagination,
    stylingOptions,
    customToolbar,
    columnFilterDisplayMode,
    paginationDisplayMode,
    pageSizeOptions,
  ]);

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
});

DataTable.displayName = 'DataTable';

export default DataTable;