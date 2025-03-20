"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Table as TableInstance,
  Row,
  ColumnOrderState,
  ColumnResizeMode,
  ColumnSizingState,
} from "@tanstack/react-table";
import { DateRange } from "react-day-picker";
import {
  ChevronDown,
  MoreHorizontal,
  GripVertical,
  Loader2,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DraggableProvided,
} from "react-beautiful-dnd";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RichTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  enableSelection?: boolean;
  defaultSorting?: SortingState;
  defaultColumnVisibility?: VisibilityState;
  defaultColumnOrder?: string[];
  searchPlaceholder?: string;
  searchColumn?: string;
  onRowAction?: (action: string, row: TData) => void;
  actions?: {
    label: string;
    action: string;
    className?: string;
  }[];
  enableExport?: boolean;
  onExport?: (data: TData[]) => void;
  enableBulkActions?: boolean;
  bulkActions?: {
    label: string;
    action: string;
    className?: string;
  }[];
  onBulkAction?: (action: string, rows: TData[]) => void;
  enableRowExpansion?: boolean;
  expandedContent?: (row: TData) => React.ReactNode;
  isLoading?: boolean;
  error?: string;
  enableColumnResizing?: boolean;
  enableColumnReordering?: boolean;
  columnNameMapping?: Record<string, string>;
  advancedFilters?: {
    column: string;
    type: "date" | "number" | "select";
    label: string;
    options?: { label: string; value: string }[];
    min?: number;
    max?: number;
  }[];
}

interface AdvancedFilterValue {
  date?: DateRange;
  number?: number;
  select?: string;
}

const SortableHeader = ({
  column,
  children,
}: {
  column: {
    getIsSorted: () => false | "asc" | "desc";
    toggleSorting: (ascending: boolean) => void;
  };
  children: React.ReactNode;
}) => {
  const isSorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(isSorted === "asc")}
      className="cursor-pointer h-auto p-0 font-medium hover:bg-transparent"
    >
      {children}
      {isSorted && (
        <span className="ml-2">{isSorted === "asc" ? "↑" : "↓"}</span>
      )}
    </Button>
  );
};

const formatColumnName = (
  columnId: string,
  columnNameMapping?: Record<string, string>
) => {
  if (columnNameMapping?.[columnId]) {
    return columnNameMapping[columnId];
  }

  // Default formatting if no mapping is provided
  return columnId
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

export function RichTable<TData>({
  data,
  columns,
  enableSelection = false,
  defaultSorting = [],
  defaultColumnVisibility = {},
  defaultColumnOrder = [],
  searchPlaceholder = "Filter...",
  searchColumn = "name",
  onRowAction,
  actions = [],
  enableExport = false,
  onExport,
  enableBulkActions = false,
  bulkActions = [],
  onBulkAction,
  enableRowExpansion = false,
  expandedContent,
  isLoading = false,
  error,
  enableColumnResizing = false,
  enableColumnReordering = false,
  columnNameMapping,
  advancedFilters = [],
}: RichTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>(defaultSorting);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(defaultColumnVisibility);
  const [columnOrder, setColumnOrder] =
    React.useState<ColumnOrderState>(defaultColumnOrder);
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [expandedRows, setExpandedRows] = React.useState<
    Record<string, boolean>
  >({});
  const [advancedFilterValues, setAdvancedFilterValues] = React.useState<
    Record<string, AdvancedFilterValue>
  >({});

  const allColumns = React.useMemo(() => {
    const baseColumns = enableSelection
      ? [
          {
            id: "select",
            header: ({ table }: { table: TableInstance<TData> }) => (
              <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) =>
                  table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
                className="translate-y-[2px]"
              />
            ),
            cell: ({ row }: { row: Row<TData> }) => (
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                className="translate-y-[2px]"
              />
            ),
            enableSorting: false,
            enableHiding: false,
            enableResizing: false,
          },
        ]
      : [];

    const actionColumn =
      actions.length > 0
        ? [
            {
              id: "actions",
              enableHiding: false,
              enableResizing: false,
              cell: ({ row }: { row: Row<TData> }) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {actions.map((action) => (
                      <DropdownMenuItem
                        key={action.action}
                        className={action.className}
                        onClick={() =>
                          onRowAction?.(action.action, row.original)
                        }
                      >
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
            },
          ]
        : [];

    const sortableColumns = columns.map((column) => ({
      ...column,
      header:
        column.enableSorting !== false
          ? ({ column: col, header, table }) => (
              <SortableHeader column={col}>
                {column.header
                  ? flexRender(column.header, { column: col, header, table })
                  : formatColumnName(column.id as string, columnNameMapping)}
              </SortableHeader>
            )
          : column.header,
    })) as ColumnDef<TData>[];

    return [...baseColumns, ...sortableColumns, ...actionColumn];
  }, [enableSelection, columns, actions, onRowAction, columnNameMapping]);

  const table = useReactTable({
    data,
    columns: allColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: "onChange" as ColumnResizeMode,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnOrder,
      columnSizing,
      rowSelection,
    },
  });

  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(table.getAllColumns());
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    table.setColumnOrder(items.map((column) => column.id));
  };

  const renderAdvancedFilter = (filter: (typeof advancedFilters)[0]) => {
    switch (filter.type) {
      case "date":
        return (
          <DateRangePicker
            value={advancedFilterValues[filter.column]?.date}
            onChange={(value) => {
              setAdvancedFilterValues((prev) => ({
                ...prev,
                [filter.column]: { ...prev[filter.column], date: value },
              }));
              table.getColumn(filter.column)?.setFilterValue(value);
            }}
          />
        );
      case "number":
        return (
          <div className="flex items-center gap-2">
            <Slider
              value={[
                advancedFilterValues[filter.column]?.number || filter.min || 0,
              ]}
              min={filter.min}
              max={filter.max}
              step={1}
              onValueChange={([value]: number[]) => {
                setAdvancedFilterValues((prev) => ({
                  ...prev,
                  [filter.column]: { ...prev[filter.column], number: value },
                }));
                table.getColumn(filter.column)?.setFilterValue(value);
              }}
            />
            <span className="text-sm">
              {advancedFilterValues[filter.column]?.number || filter.min || 0}
            </span>
          </div>
        );
      case "select":
        return (
          <Select
            value={advancedFilterValues[filter.column]?.select}
            onValueChange={(value: string) => {
              setAdvancedFilterValues((prev) => ({
                ...prev,
                [filter.column]: { ...prev[filter.column], select: value },
              }));
              table.getColumn(filter.column)?.setFilterValue(value);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 py-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder={searchPlaceholder}
            value={
              (table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(searchColumn)?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <div className="ml-auto flex gap-2">
            {enableExport && onExport && (
              <Button variant="outline" onClick={() => onExport(data)}>
                Export
              </Button>
            )}
            {enableBulkActions && selectedRows.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Bulk Actions ({selectedRows.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {bulkActions.map((action) => (
                    <DropdownMenuItem
                      key={action.action}
                      className={action.className}
                      onClick={() =>
                        onBulkAction?.(action.action, selectedRows)
                      }
                    >
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {formatColumnName(column.id, columnNameMapping)}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {advancedFilters.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {advancedFilters.map((filter) => (
              <div key={filter.column} className="flex flex-col gap-2">
                <label className="text-sm font-medium">{filter.label}</label>
                {renderAdvancedFilter(filter)}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              {enableColumnReordering ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="columns" direction="horizontal">
                    {(provided: DroppableProvided) => (
                      <TableRow
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="relative"
                      >
                        {table
                          .getHeaderGroups()[0]
                          .headers.map((header, index) => (
                            <Draggable
                              key={header.id}
                              draggableId={header.id}
                              index={index}
                              isDragDisabled={!enableColumnReordering}
                            >
                              {(provided: DraggableProvided) => (
                                <TableHead
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="p-3 relative"
                                  style={{
                                    width: header.getSize(),
                                    ...provided.draggableProps.style,
                                  }}
                                >
                                  {enableColumnReordering && (
                                    <div
                                      {...provided.dragHandleProps}
                                      className="absolute left-0 top-1/2 -translate-y-1/2 cursor-grab"
                                    >
                                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                  {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                      )}
                                  {enableColumnResizing && (
                                    <div
                                      onMouseDown={header.getResizeHandler()}
                                      onTouchStart={header.getResizeHandler()}
                                      className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none ${
                                        header.column.getIsResizing()
                                          ? "bg-primary"
                                          : "bg-border"
                                      }`}
                                    />
                                  )}
                                </TableHead>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </TableRow>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : (
                <TableRow className="relative">
                  {table.getHeaderGroups()[0].headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="p-3 relative"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {enableColumnResizing && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none ${
                            header.column.getIsResizing()
                              ? "bg-primary"
                              : "bg-border"
                          }`}
                        />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      className={enableRowExpansion ? "cursor-pointer" : ""}
                      onClick={() => {
                        if (enableRowExpansion) {
                          setExpandedRows((prev) => ({
                            ...prev,
                            [row.id]: !prev[row.id],
                          }));
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-3 py-2">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {enableRowExpansion &&
                      expandedRows[row.id] &&
                      expandedContent && (
                        <TableRow>
                          <TableCell
                            colSpan={row.getVisibleCells().length}
                            className="px-3 py-2"
                          >
                            {expandedContent(row.original)}
                          </TableCell>
                        </TableRow>
                      )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        {enableSelection && (
          <div className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
        )}
        <div className={enableSelection ? "space-x-2" : "ml-auto space-x-2"}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
