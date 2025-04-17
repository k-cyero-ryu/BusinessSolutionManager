import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface DataTableProps<T> {
  data: T[];
  columns: {
    id: string;
    header: string;
    cell: (item: T) => React.ReactNode;
    sortable?: boolean;
  }[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pagination?: boolean;
  pageSize?: number;
  selectable?: boolean;
  selectedItems?: T[];
  onSelectionChange?: (items: T[]) => void;
  loading?: boolean;
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = "Search...",
  pagination = true,
  pageSize = 10,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  loading = false,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  const [selectedRows, setSelectedRows] = React.useState<(string | number)[]>(
    selectedItems.map((item) => item.id)
  );

  // Filter and sort data
  const filteredData = React.useMemo(() => {
    let result = [...data];

    // Apply search filter if provided
    if (search) {
      const lowercasedSearch = search.toLowerCase();
      result = result.filter((item) =>
        Object.values(item).some((value) => {
          if (typeof value === "string") {
            return value.toLowerCase().includes(lowercasedSearch);
          }
          if (typeof value === "number") {
            return value.toString().includes(lowercasedSearch);
          }
          return false;
        })
      );
    }

    // Apply sorting if provided
    if (sortColumn) {
      result.sort((a, b) => {
        const valueA = (a as any)[sortColumn];
        const valueB = (b as any)[sortColumn];

        if (typeof valueA === "string" && typeof valueB === "string") {
          return sortDirection === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }

        if (typeof valueA === "number" && typeof valueB === "number") {
          return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
        }

        return 0;
      });
    }

    return result;
  }, [data, search, sortColumn, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = pagination
    ? filteredData.slice(startIndex, startIndex + pageSize)
    : filteredData;

  // Handle sorting
  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnId);
      setSortDirection("asc");
    }
  };

  // Handle selection
  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      const allIds = paginatedData.map((item) => item.id);
      setSelectedRows(allIds);
      onSelectionChange?.(paginatedData);
    } else {
      setSelectedRows([]);
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (id: string | number, checked: boolean | "indeterminate") => {
    if (checked) {
      const newSelected = [...selectedRows, id];
      setSelectedRows(newSelected);
      const selectedItems = data.filter((item) => newSelected.includes(item.id));
      onSelectionChange?.(selectedItems);
    } else {
      const newSelected = selectedRows.filter((rowId) => rowId !== id);
      setSelectedRows(newSelected);
      const selectedItems = data.filter((item) => newSelected.includes(item.id));
      onSelectionChange?.(selectedItems);
    }
  };

  const isAllSelected =
    paginatedData.length > 0 && selectedRows.length === paginatedData.length;
  const isPartiallySelected =
    selectedRows.length > 0 && selectedRows.length < paginatedData.length;

  return (
    <div className="w-full">
      {searchable && (
        <div className="flex items-center py-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && (
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isPartiallySelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                )}
                {columns.map((column) => (
                  <TableHead key={column.id}>
                    {column.sortable ? (
                      <Button
                        variant="ghost"
                        onClick={() => handleSort(column.id)}
                        className="p-0 font-medium flex items-center gap-1"
                      >
                        {column.header}
                        {sortColumn === column.id && (
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              sortDirection === "desc" ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </Button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="h-24 text-center"
                  >
                    Loading data...
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="h-24 text-center"
                  >
                    No results found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row) => (
                  <TableRow key={row.id}>
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(row.id)}
                          onCheckedChange={(checked) =>
                            handleSelectRow(row.id, checked)
                          }
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={`${row.id}-${column.id}`}>
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium">
              {Math.min(startIndex + 1, filteredData.length)}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(startIndex + pageSize, filteredData.length)}
            </span>{" "}
            of <span className="font-medium">{filteredData.length}</span> results
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous Page</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next Page</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
