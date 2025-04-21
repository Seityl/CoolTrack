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
  import { FiTrash2, FiPlus } from "react-icons/fi";
  import { useState } from "react";
  import SortByDropdown from "../../components/common/SortByDropdown";
  
  const SupplierList = () => {
    const { data, isLoading, error, mutate } = useFrappeGetDocList("Supplier", {
      fields: ["name", "supplier_name", "creation"],
      orderBy: {
        field: "creation",
        order: "desc",
      },
    });
  
    const { deleteDoc } = useFrappeDeleteDoc();
    const { createDoc } = useFrappeCreateDoc();
  
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState("");
    const [addError, setAddError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
  
    const [sortField, setSortField] = useState("creation");
    const [sortOrder, setSortOrder] = useState("desc");
    const [searchQuery, setSearchQuery] = useState("");
  
    const handleDelete = async (name: string) => {
      if (!window.confirm("Are you sure you want to delete this supplier?")) return;
      setDeletingId(name);
      try {
        await deleteDoc("Supplier", name);
        mutate();
      } catch {
        alert("Failed to delete supplier.");
      } finally {
        setDeletingId(null);
      }
    };
  
    const handleAddSupplier = async () => {
      setIsAdding(true);
      setAddError(null);
  
      if (!newSupplierName.trim()) {
        setAddError("Supplier name cannot be empty.");
        setIsAdding(false);
        return;
      }
  
      try {
        await createDoc("Supplier", { supplier_name: newSupplierName.trim() });
        setShowAddDialog(false);
        setNewSupplierName("");
        mutate();
      } catch (err: any) {
        if (err?.message?.includes("exists")) {
          setAddError("A supplier with this name already exists.");
        } else {
          setAddError("Failed to create supplier.");
        }
      } finally {
        setIsAdding(false);
      }
    };
  
    const filteredData = data?.filter((supplier) =>
      supplier.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
    const sortedData = filteredData?.sort((a, b) => {
      const fieldA = a[sortField];
      const fieldB = b[sortField];
      const compare = fieldA < fieldB ? -1 : fieldA > fieldB ? 1 : 0;
      return sortOrder === "asc" ? compare : -compare;
    });
  
    return (
      <Card p="4" m="4">
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center">
            <Heading size="6">Suppliers</Heading>
            <Dialog.Root open={showAddDialog} onOpenChange={setShowAddDialog}>
              <Dialog.Trigger>
                <Button variant="solid" color="blue" size="2">
                  <FiPlus style={{ marginRight: 6 }} /> Add Supplier
                </Button>
              </Dialog.Trigger>
              <Dialog.Content style={{ maxWidth: 400 }}>
                <Dialog.Title>Add a New Supplier</Dialog.Title>
                <Dialog.Description size="2">
                  Enter the name of the new supplier.
                </Dialog.Description>
                <Flex direction="column" gap="3" mt="4">
                  <TextField.Root
                    placeholder="Supplier Name"
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
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
                  <Button onClick={handleAddSupplier} disabled={isAdding}>
                    {isAdding ? "Adding..." : "Add Supplier"}
                  </Button>
                </Flex>
              </Dialog.Content>
            </Dialog.Root>
          </Flex>
  
          <Flex direction="column" gap="4">
            <Flex justify="space-between" align="start" gap="3" style={{ width: "100%" }}>
              <TextField.Root
                placeholder="Search Supplier"
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
                  style={{ height: 36, padding: "0 12px" }}
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
              Failed to load suppliers: {error.message}
            </Text>
          ) : !sortedData || sortedData.length === 0 ? (
            <Text size="2" color="gray">
              No suppliers found.
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
                {sortedData.map((supplier) => (
                  <Table.Row key={supplier.name}>
                    <Table.Cell>{supplier.supplier_name}</Table.Cell>
                    <Table.Cell>
                      <Button
                        onClick={() => handleDelete(supplier.name)}
                        variant="outline"
                        color="red"
                        size="1"
                        disabled={deletingId === supplier.name}
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
    );
  };
  
  export default SupplierList;  