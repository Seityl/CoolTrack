import {
  useFrappeGetDocList,
  useFrappeDeleteDoc,
  useFrappeCreateDoc,
} from "frappe-react-sdk";
import {
  Card,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  TextField,
  Dialog,
} from "@radix-ui/themes";
import * as Table from "@radix-ui/themes/components/table";
import * as Toast from "@radix-ui/react-toast";
import { FiTrash2, FiPlus } from "react-icons/fi";
import { useState } from "react";
import SortByDropdown from "../../components/common/SortByDropdown";

const Uom = () => {
  const { data, isLoading, error, mutate } = useFrappeGetDocList("UOM", {
    fields: ["name", "creation"],
    orderBy: {
      field: "creation",
      order: "desc",
    },
  });

  const { deleteDoc } = useFrappeDeleteDoc();
  const { createDoc } = useFrappeCreateDoc();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uomToDelete, setUomToDelete] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUomName, setNewUomName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [sortField, setSortField] = useState("creation");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const handleDelete = async () => {
    if (!uomToDelete) return;
    setDeletingId(uomToDelete);
    try {
      await deleteDoc("UOM", uomToDelete);
      mutate();
      setToastType("success");
      setToastMessage("UOM deleted successfully.");
    } catch {
      setToastType("error");
      setToastMessage("Failed to delete UOM.");
    } finally {
      setToastOpen(true);
      setDeletingId(null);
      setUomToDelete(null);
      setShowConfirmDialog(false);
    }
  };

  const handleAddUom = async () => {
    setIsAdding(true);
    setAddError(null);

    const trimmed = newUomName.trim();
    if (!trimmed) {
      setAddError("UOM name cannot be empty.");
      setIsAdding(false);
      return;
    }

    try {
      await createDoc("UOM", { uom_name: trimmed });
      setShowAddDialog(false);
      setNewUomName("");
      mutate();
      setToastType("success");
      setToastMessage("UOM added successfully.");
    } catch (err: any) {
      const message = err?.message || "";
      const exc = err?.exception || "";

      if (message.includes("Duplicate") || exc.includes("DuplicateEntryError")) {
        setAddError("A UOM with this name already exists.");
      } else if (message.toLowerCase().includes("validation")) {
        setAddError("Invalid UOM name.");
      } else {
        setAddError("Failed to create UOM.");
      }

      setToastType("error");
      setToastMessage("Failed to add UOM.");
    } finally {
      setIsAdding(false);
      setToastOpen(true);
    }
  };

  const filteredData = data?.filter((uom) =>
    uom.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedData = filteredData?.sort((a, b) => {
    const fieldA = a[sortField];
    const fieldB = b[sortField];
    const compare = fieldA < fieldB ? -1 : fieldA > fieldB ? 1 : 0;
    return sortOrder === "asc" ? compare : -compare;
  });

  return (
    <Toast.Provider swipeDirection="right">
      <Card p="4" m="4">
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center">
            <Heading size="6">UOMs</Heading>
            <Dialog.Root open={showAddDialog} onOpenChange={setShowAddDialog}>
              <Dialog.Trigger>
                <Button variant="solid" color="blue" size="2">
                  <FiPlus style={{ marginRight: 6 }} />
                  Add UOM
                </Button>
              </Dialog.Trigger>
              <Dialog.Content style={{ maxWidth: 400 }}>
                <Dialog.Title>Add a New UOM</Dialog.Title>
                <Dialog.Description size="2">
                  Enter the name of the new Unit of Measure.
                </Dialog.Description>

                <Flex direction="column" gap="3" mt="4">
                  <TextField.Root
                    placeholder="UOM Name"
                    value={newUomName}
                    onChange={(e) => setNewUomName(e.target.value)}
                  />
                  {addError && (
                    <Text color="red" size="1">
                      {addError}
                    </Text>
                  )}
                </Flex>

                <Flex gap="3" mt="4" justify="end">
                  <Dialog.Close>
                    <Button variant="soft" color="gray">
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button onClick={handleAddUom} disabled={isAdding}>
                    {isAdding ? "Adding..." : "Add UOM"}
                  </Button>
                </Flex>
              </Dialog.Content>
            </Dialog.Root>
          </Flex>

          {/* Filters */}
          <Flex direction="column" gap="4">
            <Flex justify="space-between" align="start" gap="3" style={{ width: "100%" }}>
              <TextField.Root
                placeholder="Search UOM"
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
              Failed to load UOMs: {error.message}
            </Text>
          ) : !sortedData || sortedData.length === 0 ? (
            <Text size="2" color="gray">
              No UOMs found.
            </Text>
          ) : (
            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {sortedData.map((uom) => (
                  <Table.Row key={uom.name}>
                    <Table.Cell>{uom.name}</Table.Cell>
                    <Table.Cell>
                      <Button
                        onClick={() => {
                          setUomToDelete(uom.name);
                          setShowConfirmDialog(true);
                        }}
                        variant="outline"
                        color="red"
                        size="1"
                        disabled={deletingId === uom.name}
                      >
                        <FiTrash2 />
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Flex>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <Dialog.Content style={{ maxWidth: 400 }}>
          <Dialog.Title>Confirm Delete</Dialog.Title>
          <Dialog.Description>
            Are you sure you want to delete UOM <strong>{uomToDelete}</strong>?
          </Dialog.Description>
          <Flex mt="4" justify="end" gap="3">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={handleDelete} color="red" disabled={!uomToDelete}>
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

export default Uom;