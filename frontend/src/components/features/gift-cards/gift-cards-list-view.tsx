import type { MRT_ColumnDef } from "material-react-table";
import { useMemo } from "react";
import { Chip } from "@mui/material";
import {
  RecordListView,
  type FormFieldDefinition,
  type ViewFieldDefinition,
  ValidationRules,
} from "@/components/elements/record-list-view";
import {
  useCreateGiftCard,
  useDeleteGiftCard,
  useGiftCards,
  useUpdateGiftCard,
} from "@/hooks/gift-cards";
import type { GiftCardResponse } from "@ps-design/schemas/gift-card";
import { formatPrice, centsToEuros, eurosToCents } from "@/utils/price";
import dayjs from "dayjs";

export const GiftCardsListView = () => {
  const { data: giftCards = [], isLoading, error, refetch } = useGiftCards();
  const createMutation = useCreateGiftCard();
  const updateMutation = useUpdateGiftCard();
  const deleteMutation = useDeleteGiftCard();

  const columns = useMemo<MRT_ColumnDef<GiftCardResponse>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        size: 150,
      },
      {
        accessorKey: "value",
        header: "Value",
        size: 100,
        Cell: ({ cell }) => formatPrice(cell.getValue<number>()),
      },
      {
        accessorKey: "expiresAt",
        header: "Expires",
        size: 150,
        Cell: ({ cell }) => {
          const value = cell.getValue<string | null>();
          return value ? dayjs(value).format("YYYY-MM-DD") : "No expiration";
        },
      },
      {
        accessorKey: "redeemedAt",
        header: "Status",
        size: 120,
        Cell: ({ cell }) => {
          const redeemed = cell.getValue<string | null>();
          return (
            <Chip
              label={redeemed ? "Redeemed" : "Available"}
              color={redeemed ? "default" : "success"}
              size="small"
            />
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        size: 150,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return dayjs(value).format("YYYY-MM-DD HH:mm");
        },
      },
    ],
    [],
  );

  const createFormFields: FormFieldDefinition[] = [
    {
      name: "code",
      label: "Code",
      type: "text",
      required: true,
      validationRules: [
        ValidationRules.minLength(
          3,
          "Gift card code must be at least 3 characters",
        ),
        ValidationRules.maxLength(
          50,
          "Gift card code must be at most 50 characters",
        ),
      ],
    },
    {
      name: "value",
      label: "Value (€)",
      type: "number",
      required: true,
      validationRules: [
        ValidationRules.min(0.01, "Value must be at least €0.01"),
      ],
    },
    {
      name: "expiresAt",
      label: "Expiration Date",
      type: "date",
      required: false,
      validationRules: [
        ValidationRules.custom(
          (value) => !value || new Date(value as string) > new Date(),
          "Expiration date must be in the future",
        ),
      ],
    },
  ];

  const editFormFields: FormFieldDefinition[] = [
    {
      name: "code",
      label: "Code",
      type: "text",
      required: false,
      validationRules: [
        ValidationRules.minLength(
          3,
          "Gift card code must be at least 3 characters",
        ),
        ValidationRules.maxLength(
          50,
          "Gift card code must be at most 50 characters",
        ),
      ],
    },
    {
      name: "value",
      label: "Value (€)",
      type: "number",
      required: false,
      validationRules: [
        ValidationRules.min(0.01, "Value must be at least €0.01"),
      ],
      transformForEdit: (value) => centsToEuros(value as number),
    },
    {
      name: "expiresAt",
      label: "Expiration Date",
      type: "date",
      required: false,
      validationRules: [
        ValidationRules.custom(
          (value) => !value || new Date(value as string) > new Date(),
          "Expiration date must be in the future",
        ),
      ],
      transformForEdit: (value) =>
        value ? dayjs(value as string).format("YYYY-MM-DD") : "",
    },
  ];

  const viewFields: ViewFieldDefinition[] = [
    { name: "id", label: "ID" },
    { name: "code", label: "Code" },
    {
      name: "value",
      label: "Value",
      render: (value) => formatPrice(value as number),
    },
    {
      name: "expiresAt",
      label: "Expires",
      render: (value) =>
        value ? dayjs(value as string).format("YYYY-MM-DD") : "No expiration",
    },
    {
      name: "redeemedAt",
      label: "Redeemed At",
      render: (value) =>
        value
          ? dayjs(value as string).format("YYYY-MM-DD HH:mm")
          : "Not redeemed",
    },
    { name: "createdAt", label: "Created At" },
    { name: "updatedAt", label: "Updated At" },
  ];

  const handleCreate = async (values: Partial<GiftCardResponse>) => {
    await createMutation.mutateAsync({
      code: String(values.code),
      value: eurosToCents(Number(values.value)),
      expiresAt: values.expiresAt
        ? dayjs(values.expiresAt).endOf("day").toISOString()
        : null,
    });
  };

  const handleEdit = async (id: string, values: Partial<GiftCardResponse>) => {
    await updateMutation.mutateAsync({
      id,
      data: {
        code: values.code,
        value:
          values.value !== undefined
            ? eurosToCents(Number(values.value))
            : undefined,
        expiresAt:
          values.expiresAt !== undefined
            ? values.expiresAt
              ? dayjs(values.expiresAt).endOf("day").toISOString()
              : null
            : undefined,
      },
    });
  };

  const handleDelete = async (ids: string[]) => {
    await Promise.all(ids.map((id) => deleteMutation.mutateAsync(id)));
  };

  const canEditRow = (row: GiftCardResponse): boolean => {
    const isRedeemed = !!row.redeemedAt;
    return !isRedeemed;
  };

  return (
    <RecordListView<GiftCardResponse>
      title="Gift Cards"
      columns={columns}
      data={giftCards}
      isLoading={isLoading}
      error={error}
      createFormFields={createFormFields}
      editFormFields={editFormFields}
      viewFields={viewFields}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSuccess={() => refetch()}
      createModalTitle="Create Gift Card"
      editModalTitle="Edit Gift Card"
      viewModalTitle="View Gift Card"
      canEditRow={canEditRow}
    />
  );
};
