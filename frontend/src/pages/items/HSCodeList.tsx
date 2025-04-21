import {
  useFrappeGetDocList,
  useFrappeDeleteDoc,
  useFrappeCreateDoc,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";
import {
  Card,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  Dialog,
  TextField,
} from "@radix-ui/themes";
import * as Table from "@radix-ui/themes/components/table";
import * as Toast from "@radix-ui/react-toast";
import { FiTrash2, FiPlus, FiEdit } from "react-icons/fi";
import { useState, useEffect, ChangeEvent } from "react";
import SortByDropdown from "../../components/common/SortByDropdown";

interface HSCode {
  name?: string;
  tariff_number: string;
  description: string;
  custom_precision: string;
  custom_markup_percentage: string;
  custom_surcharge_percentage: string;
  custom_excise_percentage: string;
  custom_duty_percentage: string;
  custom_vat_percentage: string;
  custom_service_charge_percentage: string;
}

type ToastType = "success" | "error";

const HSCodeList = () => {
  const [loadedItems, setLoadedItems] = useState<HSCode[]>([]);
  const [pageSize, setPageSize] = useState<number>(20);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [hscodeToDelete, setHscodeToDelete] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [sortField, setSortField] = useState<keyof HSCode>("tariff_number");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const initialHSCode: HSCode = {
    tariff_number: "",
    description: "",
    custom_precision: "",
    custom_markup_percentage: "",
    custom_surcharge_percentage: "",
    custom_excise_percentage: "",
    custom_duty_percentage: "",
    custom_vat_percentage: "15",
    custom_service_charge_percentage: "",
  };

  const [newHSCodeData, setNewHSCodeData] = useState<HSCode>({ ...initialHSCode });
  const [editHSCodeData, setEditHSCodeData] = useState<HSCode>({ ...initialHSCode });

  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<ToastType>("success");

  const handleFieldChange = (field: keyof HSCode, value: string) => {
    setNewHSCodeData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditFieldChange = (field: keyof HSCode, value: string) => {
    setEditHSCodeData((prev) => ({ ...prev, [field]: value }));
  };

  const renderFields = (
    data: HSCode,
    onChange: (field: keyof HSCode, value: string) => void,
    isEditDialog = false
  ) => (
    <Flex direction="row" wrap="wrap" gap="4" mt="4">
      {(Object.entries(data) as [keyof HSCode, string][]).map(([key, value]) => (
        <Flex key={key} direction="column" style={{ flex: "1 1 45%", minWidth: 250 }}>
          {isEditDialog && key === "tariff_number" ? (
            <TextField.Root
              placeholder={formatFieldLabel(key)}
              value={value}
              readOnly
              disabled
            />
          ) : (
            <TextField.Root
              placeholder={formatFieldLabel(key)}
              value={value}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(key, e.target.value)}
              type={key.includes("percentage") || key.includes("precision") ? "number" : "text"}
            />
          )}
        </Flex>
      ))}
    </Flex>
  );

  const formatFieldLabel = (field: string) =>
    field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const { data, error, mutate } = useFrappeGetDocList<HSCode>("Customs Tariff Number", {
    fields: [
      "tariff_number",
      "description",
      "custom_precision",
      "custom_markup_percentage",
      "custom_surcharge_percentage",
      "custom_excise_percentage",
      "custom_duty_percentage",
      "custom_vat_percentage",
      "custom_service_charge_percentage",
    ],
    limit: pageSize,
    offset: loadedItems.length,
  });

  const { deleteDoc } = useFrappeDeleteDoc();
  const { createDoc } = useFrappeCreateDoc();
  const { updateDoc } = useFrappeUpdateDoc();

  const handleDeleteClick = (tariff_number: string) => {
    setHscodeToDelete(tariff_number);
    setShowConfirmDialog(true);
  };

  const handleDelete = async () => {
    if (!hscodeToDelete) return;
    setDeletingId(hscodeToDelete);

    try {
      await deleteDoc("Customs Tariff Number", hscodeToDelete);
      mutate();
      showToast("HS Code deleted successfully.", "success");
    } catch {
      showToast("Failed to delete HS Code.", "error");
    } finally {
      setDeletingId(null);
      setHscodeToDelete(null);
      setShowConfirmDialog(false);
    }
  };

  const handleAddHSCode = async () => {
    setIsAdding(true);
    setAddError(null);

    const { tariff_number, description, custom_precision, custom_vat_percentage } = newHSCodeData;

    if (!tariff_number.trim() || !description.trim() || !custom_precision || !custom_vat_percentage) {
      setAddError("Please fill in all required fields.");
      setIsAdding(false);
      return;
    }

    try {
      await createDoc("Customs Tariff Number", {
        ...newHSCodeData,
        name: tariff_number.trim(),
      });
      setNewHSCodeData({ ...initialHSCode });
      setShowAddDialog(false);
      setLoadedItems([]);
      mutate();
      showToast("HS Code added successfully.", "success");
    } catch (err: any) {
      if (err?.message?.includes("exists")) {
        setAddError("An HS Code with this tariff number already exists.");
      } else {
        setAddError("Failed to create HS Code.");
      }
      showToast("Failed to add HS Code.", "error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditHSCode = async () => {
    setIsEditing(true);

    const { tariff_number, description, custom_precision, custom_vat_percentage } = editHSCodeData;

    if (!tariff_number.trim() || !description.trim() || !custom_precision || !custom_vat_percentage) {
      alert("Please fill in all required fields.");
      setIsEditing(false);
      return;
    }

    try {
      await updateDoc("Customs Tariff Number", tariff_number, {
        ...editHSCodeData,
      });
      setEditHSCodeData({ ...initialHSCode });
      setShowEditDialog(false);
      setLoadedItems([]);
      mutate();
      showToast("HS Code updated successfully.", "success");
    } catch {
      showToast("Failed to update HS Code.", "error");
    } finally {
      setIsEditing(false);
    }
  };

  const showToast = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setToastOpen(true);
  };

  const filteredData = loadedItems.filter(
    (hscode) =>
      hscode.tariff_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hscode.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedData = filteredData?.sort((a, b) => {
    const fieldA = a[sortField] ?? "";
    const fieldB = b[sortField] ?? "";
    const compare = fieldA < fieldB ? -1 : fieldA > fieldB ? 1 : 0;
    return sortOrder === "asc" ? compare : -compare;
  });

  const handleLoadMore = () => {
    setIsLoading(true);
    mutate({
      limit: pageSize,
      offset: loadedItems.length,
    });
  };

  const handleEditClick = (hscode: HSCode) => {
    setEditHSCodeData(hscode);
    setShowEditDialog(true);
  };

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setLoadedItems((prevItems) => [...prevItems, ...data]);
    }
    setIsLoading(false);
  }, [data]);

  return (
    <Toast.Provider swipeDirection="right">
      <Card p="4" m="4">
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center">
            <Heading size="6">HS Codes</Heading>
            <Dialog.Root open={showAddDialog} onOpenChange={setShowAddDialog}>
              <Dialog.Trigger>
                <Button variant="solid" color="blue" size="2">
                  <FiPlus style={{ marginRight: 6 }} />
                  Add HS Code
                </Button>
              </Dialog.Trigger>
              <Dialog.Content style={{ maxWidth: 800 }}>
                <Dialog.Title>Add a New HS Code</Dialog.Title>
                {renderFields(newHSCodeData, handleFieldChange)}
                {addError && <Text color="red">{addError}</Text>}
                <Flex gap="3" mt="4" justify="end">
                  <Dialog.Close>
                    <Button variant="soft" color="gray">Cancel</Button>
                  </Dialog.Close>
                  <Button variant="solid" color="blue" onClick={handleAddHSCode} disabled={isAdding}>
                    {isAdding ? <Spinner size="small" /> : "Add HS Code"}
                  </Button>
                </Flex>
              </Dialog.Content>
            </Dialog.Root>

            <Dialog.Root open={showEditDialog} onOpenChange={setShowEditDialog}>
              <Dialog.Content style={{ maxWidth: 800 }}>
                <Dialog.Title>Edit HS Code</Dialog.Title>
                <Dialog.Description size="2">
                  Modify the fields for this HS Code (Tariff Number cannot be changed).
                </Dialog.Description>
                {renderFields(editHSCodeData, handleEditFieldChange, true)}
                <Flex gap="3" mt="4" justify="end">
                  <Dialog.Close>
                    <Button variant="soft" color="gray">Cancel</Button>
                  </Dialog.Close>
                  <Button variant="solid" color="blue" onClick={handleEditHSCode} disabled={isEditing}>
                    {isEditing ? <Spinner size="small" /> : "Update HS Code"}
                  </Button>
                </Flex>
              </Dialog.Content>
            </Dialog.Root>
          </Flex>

          {/* Search and Filter Section */}
          <Flex direction="column" gap="4">
            <Flex justify="space-between" align="start" gap="3" style={{ width: "100%" }}>
              <TextField.Root
                placeholder="Search HS Codes"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                clearable
                onClear={() => setSearchQuery("")}
                style={{ flexGrow: 1, minWidth: 200, height: 36 }}
              />

              <Flex direction="row" align="start" gap="2">
                <SortByDropdown
                  sortField={sortField}
                  setSortField={setSortField}
                  setSortOrder={setSortOrder}
                />

                <Button
                  variant="soft"
                  color="gray"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  size="2"
                  style={{
                    height: 36,
                    padding: "0 12px",
                  }}
                >
                  {sortOrder === "asc" ? "Ascending" : "Descending"}
                </Button>
              </Flex>
            </Flex>
          </Flex>

          {isLoading ? (
            <Flex align="center" justify="center" p="6">
              <Spinner size="3" />
            </Flex>
          ) : error ? (
            <Text color="red" size="2">
              Failed to load HS Codes: {error.message}
            </Text>
          ) : !sortedData || sortedData.length === 0 ? (
            <Text size="2" color="gray">
              No HS Codes found.
            </Text>
          ) : (
            <>
              <Table.Root variant="surface">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Tariff Number</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Precision</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Markup %</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Surcharge %</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Excise %</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Duty %</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>VAT %</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Service Charge %</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {sortedData?.map((item, index) => (
                    <Table.Row key={index}>
                      <Table.Cell>{item.tariff_number}</Table.Cell>
                      <Table.Cell>{item.custom_precision}</Table.Cell>
                      <Table.Cell>{item.description}</Table.Cell>
                      <Table.Cell>{item.custom_markup_percentage}</Table.Cell>
                      <Table.Cell>{item.custom_surcharge_percentage}</Table.Cell>
                      <Table.Cell>{item.custom_excise_percentage}</Table.Cell>
                      <Table.Cell>{item.custom_duty_percentage}</Table.Cell>
                      <Table.Cell>{item.custom_vat_percentage}</Table.Cell>
                      <Table.Cell>{item.custom_service_charge_percentage}</Table.Cell>
                      <Table.Cell>
                        <Button variant="outline" color="blue" onClick={() => handleEditClick(item)}>
                          <FiEdit />
                        </Button>
                        <Button
                          variant="outline"
                          color="red"
                          onClick={() => handleDeleteClick(item.tariff_number)}
                          disabled={deletingId === item.tariff_number}
                        >
                          {deletingId === item.tariff_number ? <Spinner size="small" /> : <FiTrash2 />}
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>

              <Flex gap="3" justify="end" mt="4">
                {[20, 50, 100, 500].map((size) => (
                  <Button
                    key={size}
                    variant="outline"
                    color="blue"
                    onClick={() => setPageSize(size)}
                  >
                    {size}
                  </Button>
                ))}
              </Flex>

              <Flex justify="center" mt="4">
                <Button onClick={handleLoadMore} disabled={isLoading}>
                  {isLoading ? <Spinner size="small" /> : "Load More"}
                </Button>
              </Flex>
            </>
          )}
        </Flex>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <Dialog.Content style={{ maxWidth: 400 }}>
          <Dialog.Title>Confirm Delete</Dialog.Title>
          <Dialog.Description>
            Are you sure you want to delete HS Code <strong>{hscodeToDelete}</strong>?
          </Dialog.Description>
          <Flex mt="4" justify="end" gap="3">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={handleDelete} color="red" disabled={!hscodeToDelete}>
              Delete
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Toast Notification */}
      <Toast.Root
        open={toastOpen}
        onOpenChange={setToastOpen}
        duration={3000}
        style={{
          backgroundColor: toastType === "success" ? "var(--green-5)" : "var(--red-5)",
          color: "white",
          borderRadius: "6px",
          padding: "12px 16px",
          fontSize: "14px",
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 1000,
        }}
      >
        <Toast.Title>{toastMessage}</Toast.Title>
      </Toast.Root>
      <Toast.Viewport />
    </Toast.Provider>
  );
};

export default HSCodeList;