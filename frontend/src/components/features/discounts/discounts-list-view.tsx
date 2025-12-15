import type { MRT_ColumnDef } from "material-react-table";
import type React from "react";
import { useMemo } from "react";
import { Chip } from "@mui/material";
import {
  RecordListView,
  type FormFieldDefinition,
  type ViewFieldDefinition,
  ValidationRules,
} from "@/components/elements/record-list-view";
import { useMenuItems } from "@/hooks/menu/menu-item-hooks";
import { useServiceDefinitions } from "@/hooks/appointments/service-definition-hooks";
import type {
  DiscountResponse,
  CreateDiscountBody,
  UpdateDiscountBody,
} from "@ps-design/schemas/discount";
import { formatPrice } from "@/utils/price";
import dayjs from "dayjs";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";

interface DiscountsListViewProps<TCreate, TUpdate> {
  useDiscounts: () => UseQueryResult<DiscountResponse[], Error>;
  useCreateDiscount: () => UseMutationResult<DiscountResponse, Error, TCreate>;
  useUpdateDiscount: () => UseMutationResult<
    DiscountResponse,
    Error,
    { id: string; data: TUpdate }
  >;
  useDeleteDiscount: () => UseMutationResult<void, Error, string>;
  allowedTargetTypes: ("SERVICE" | "MENU_ITEM" | "ORDER")[];
  title: string;
}

export const DiscountsListView = <
  TCreate extends CreateDiscountBody,
  TUpdate extends UpdateDiscountBody,
>({
  useDiscounts,
  useCreateDiscount,
  useUpdateDiscount,
  useDeleteDiscount,
  allowedTargetTypes,
  title,
}: DiscountsListViewProps<TCreate, TUpdate>) => {
  const {
    data: discounts = [],
    isLoading,
    error,
    refetch,
  } = useDiscounts();
  const { data: menuItems = [] } = useMenuItems();
  const { data: serviceDefinitions = [] } = useServiceDefinitions();
  const createMutation = useCreateDiscount();
  const updateMutation = useUpdateDiscount();
  const deleteMutation = useDeleteDiscount();

  const menuItemOptions = useMemo(
    () =>
      menuItems.map((item) => ({
        value: item.id,
        label: item.baseName,
      })),
    [menuItems],
  );

  const serviceDefinitionOptions = useMemo(
    () =>
      serviceDefinitions.map((service) => ({
        value: service.id,
        label: service.name,
      })),
    [serviceDefinitions],
  );

  const typeOptions = [
    { value: "PERCENTAGE", label: "Percentage" },
    { value: "FIXED_AMOUNT", label: "Fixed Amount" },
  ];

  const targetTypeOptions = [
    { value: "ORDER", label: "Entire Order" },
    { value: "MENU_ITEM", label: "Menu Item" },
    { value: "SERVICE", label: "Service" },
  ].filter((option) =>
    allowedTargetTypes.includes(
      option.value as "SERVICE" | "MENU_ITEM" | "ORDER",
    ),
  );

  const columns = useMemo<MRT_ColumnDef<DiscountResponse>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 150,
      },
      {
        accessorKey: "type",
        header: "Type",
        size: 100,
        Cell: ({ cell }) => {
          const type = cell.getValue<string>();
          return (
            <Chip
              label={type === "PERCENTAGE" ? "Percentage" : "Fixed"}
              color={type === "PERCENTAGE" ? "primary" : "secondary"}
              size="small"
            />
          );
        },
      },
      {
        accessorKey: "value",
        header: "Value",
        size: 100,
        Cell: ({ row }) => {
          const type = row.original.type;
          const value = row.original.value;
          return type === "PERCENTAGE" ? `${value}%` : formatPrice(value);
        },
      },
      {
        accessorKey: "targetType",
        header: "Applies To",
        size: 150,
        Cell: ({ row }) => {
          const { targetType, menuItemName, serviceDefinitionName } =
            row.original;
          if (targetType === "ORDER") return "Entire Order";
          if (targetType === "MENU_ITEM")
            return menuItemName || "Specific Item";
          if (targetType === "SERVICE")
            return serviceDefinitionName || "Specific Service";
          return targetType;
        },
      },
      {
        accessorKey: "isDisabled",
        header: "Status",
        size: 100,
        Cell: ({ cell }) => {
          const disabled = cell.getValue<boolean>();
          return (
            <Chip
              label={disabled ? "Disabled" : "Active"}
              color={disabled ? "default" : "success"}
              size="small"
            />
          );
        },
      },
      {
        accessorKey: "startsAt",
        header: "Starts",
        size: 120,
        Cell: ({ cell }) => {
          const value = cell.getValue<string | null>();
          return value ? dayjs(value).format("YYYY-MM-DD") : "Immediate";
        },
      },
      {
        accessorKey: "expiresAt",
        header: "Expires",
        size: 120,
        Cell: ({ cell }) => {
          const value = cell.getValue<string | null>();
          return value ? dayjs(value).format("YYYY-MM-DD") : "Never";
        },
      },
    ],
    [],
  );

  const createFormFields: FormFieldDefinition[] = [
    {
      name: "name",
      label: "Discount Name",
      type: "text",
      required: true,
      validationRules: [
        ValidationRules.minLength(1, "Name is required"),
        ValidationRules.maxLength(100, "Name is too long"),
      ],
    },
    {
      name: "type",
      label: "Discount Type",
      type: "select",
      required: true,
      options: typeOptions,
    },
    {
      name: "value",
      label: "Value (% or €)",
      type: "number",
      required: true,
      validationRules: [ValidationRules.min(1, "Value must be at least 1")],
    },
    {
      name: "targetType",
      label: "Applies To",
      type: "select",
      required: true,
      options: targetTypeOptions,
    },
    ...(allowedTargetTypes.includes("MENU_ITEM")
      ? ([
        {
          name: "menuItemId",
          label: "Menu Item",
          type: "select",
          required: false,
          options: menuItemOptions,
        },
      ] as FormFieldDefinition[])
      : []),
    ...(allowedTargetTypes.includes("SERVICE")
      ? ([
        {
          name: "serviceDefinitionId",
          label: "Service",
          type: "select",
          required: false,
          options: serviceDefinitionOptions,
        },
      ] as FormFieldDefinition[])
      : []),
    {
      name: "startsAt",
      label: "Start Date",
      type: "date",
      required: false,
    },
    {
      name: "expiresAt",
      label: "Expiration Date",
      type: "date",
      required: false,
      validationRules: [
        ValidationRules.custom((value, allValues) => {
          if (allValues?.startsAt === undefined) return true;
          const startsAt = allValues.startsAt
            ? dayjs(allValues.startsAt as string)
            : null;
          const expiresAt = value ? dayjs(value as string) : null;
          if (startsAt && expiresAt && expiresAt.isBefore(startsAt)) {
            return false;
          }
          return true;
        }, "Expiration date cannot be before start date"),
      ],
    },
    {
      name: "isDisabled",
      label: "Disabled",
      type: "checkbox",
      required: false,
    },
  ];

  const editFormFields: FormFieldDefinition[] = createFormFields.map(
    (field) => ({
      ...field,
      required: false,
      transformForEdit:
        field.name === "startsAt" || field.name === "expiresAt"
          ? (value: unknown) =>
            value ? dayjs(value as string).format("YYYY-MM-DD") : ""
          : undefined,
    }),
  );

  const viewFields: ViewFieldDefinition[] = [
    { name: "id", label: "ID" },
    { name: "name", label: "Name" },
    {
      name: "type",
      label: "Type",
      render: (value) =>
        value === "PERCENTAGE" ? "Percentage" : "Fixed Amount",
    },
    {
      name: "value",
      label: "Value",
      render: (value, row) =>
        row.type === "PERCENTAGE" ? `${value}%` : formatPrice(value as number),
    },
    {
      name: "targetType",
      label: "Applies To",
      render: (_, row): React.ReactNode => {
        if (row.targetType === "ORDER") return "Entire Order";
        if (row.targetType === "MENU_ITEM")
          return `Menu Item: ${row.menuItemName || row.menuItemId}`;
        if (row.targetType === "SERVICE")
          return `Service: ${row.serviceDefinitionName || row.serviceDefinitionId}`;
        return String(row.targetType);
      },
    },
    {
      name: "isDisabled",
      label: "Status",
      render: (value) => (value ? "Disabled" : "Active"),
    },
    {
      name: "startsAt",
      label: "Starts",
      render: (value) =>
        value ? dayjs(value as string).format("YYYY-MM-DD HH:mm") : "Immediate",
    },
    {
      name: "expiresAt",
      label: "Expires",
      render: (value) =>
        value ? dayjs(value as string).format("YYYY-MM-DD HH:mm") : "Never",
    },
    { name: "createdAt", label: "Created At" },
    { name: "updatedAt", label: "Updated At" },
  ];

  const handleCreate = async (values: Partial<DiscountResponse>) => {
    const value =
      values.type === "FIXED_AMOUNT"
        ? Math.round(Number(values.value) * 100) // Convert euros to cents
        : Number(values.value);

    const payload = {
      name: String(values.name),
      type: values.type,
      value,
      targetType: values.targetType,
      menuItemId:
        values.targetType === "MENU_ITEM"
          ? (values.menuItemId as string)
          : null,
      serviceDefinitionId:
        values.targetType === "SERVICE"
          ? (values.serviceDefinitionId as string)
          : null,
      startsAt: values.startsAt
        ? dayjs(values.startsAt).startOf("day").toISOString()
        : null,
      expiresAt: values.expiresAt
        ? dayjs(values.expiresAt).endOf("day").toISOString()
        : null,
      isDisabled: Boolean(values.isDisabled),
    } as unknown as TCreate;

    await createMutation.mutateAsync(payload);
  };

  const handleEdit = async (id: string, values: Partial<DiscountResponse>) => {
    const data: any = {};

    if (values.name !== undefined) data.name = values.name;
    if (values.type !== undefined) data.type = values.type;
    if (values.value !== undefined) {
      data.value =
        values.type === "FIXED_AMOUNT"
          ? Math.round(Number(values.value) * 100)
          : Number(values.value);
    }
    if (values.targetType !== undefined) data.targetType = values.targetType;
    if (values.menuItemId !== undefined) data.menuItemId = values.menuItemId;
    if (values.serviceDefinitionId !== undefined)
      data.serviceDefinitionId = values.serviceDefinitionId;
    if (values.startsAt !== undefined) {
      data.startsAt = values.startsAt
        ? dayjs(values.startsAt).startOf("day").toISOString()
        : null;
    }
    if (values.expiresAt !== undefined) {
      data.expiresAt = values.expiresAt
        ? dayjs(values.expiresAt).endOf("day").toISOString()
        : null;
    }
    if (values.isDisabled !== undefined) data.isDisabled = values.isDisabled;

    await updateMutation.mutateAsync({ id, data: data as TUpdate });
  };

  const handleDelete = async (ids: string[]) => {
    await Promise.all(ids.map((id) => deleteMutation.mutateAsync(id)));
  };

  return (
    <RecordListView<DiscountResponse>
      title={title}
      columns={columns}
      data={discounts}
      isLoading={isLoading}
      error={error}
      createFormFields={createFormFields}
      editFormFields={editFormFields}
      viewFields={viewFields}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSuccess={() => refetch()}
      createModalTitle={`Create Discount`}
      editModalTitle={`Edit Discount`}
      viewModalTitle={`View Discount`}
    />
  );
};
