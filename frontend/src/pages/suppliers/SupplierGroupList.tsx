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
  const SupplierGroupList = () => {
    const { data, isLoading, error, mutate } = useFrappeGetDocList("Supplier Group", {
      fields: ["name", "supplier_group_name", "creation"],
      orderBy: {
        field: "creation",
        order: "desc",
      },
    });
  
    const { deleteDoc } = useFrappeDeleteDoc();
    const { createDoc } = useFrappeCreateDoc();
  
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newSupplierGroupName, setNewSupplierGroupName] = useState("");
    const [addError, setAddError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
  
    const [sortField, setSortField] = useState("creation");
    const [sortOrder, setSortOrder] = useState("desc");
    const [searchQuery, setSearchQuery] = useState("");
  
    const handleDelete = async (name: string) => {
      if (!window.confirm("Are you sure you want to delete this supplier group?")) return;
      setDeletingId(name);
      try {
        await deleteDoc("Supplier Group", name);
        mutate();
      } catch {
        alert("Failed to delete supplier group.");
      } finally {
        setDeletingId(null);
      }
    };
  
    const handleAddSupplierGroup = async () => {
      setIsAdding(true);
      setAddError(null);
  
      if (!newSupplierGroupName.trim()) {
        setAddError("Supplier group name cannot be empty.");
        setIsAdding(false);
        return;
      }
  
      try {
        await createDoc("Supplier Group", { supplier_group_name: newSupplierGroupName.trim() });
        setShowAddDialog(false);
        setNewSupplierGroupName("");
        mutate();
      } catch (err: any) {
        if (err?.message?.includes("exists")) {
          setAddError("A supplier group with this name already exists.");
        } else {
          setAddError("Failed to create supplier group.");
        }
      } finally {
        setIsAdding(false);
      }
    };
  
    const filteredData = data?.filter((supplierGroup) =>
      supplierGroup.supplier_group_name.toLowerCase().includes(searchQuery.toLowerCase())
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
            <Heading size="6">Supplier Groups</Heading>
            <Dialog.Root open={showAddDialog} onOpenChange={setShowAddDialog}>
              <Dialog.Trigger>
                <Button variant="solid" color="blue" size="2">
                  <FiPlus style={{ marginRight: 6 }} /> Add Supplier Group
                </Button>
              </Dialog.Trigger>
              <Dialog.Content style={{ maxWidth: 400 }}>
                <Dialog.Title>Add a New Supplier Group</Dialog.Title>
                <Dialog.Description size="2">
                  Enter the name of the new supplier group.
                </Dialog.Description>
                <Flex direction="column" gap="3" mt="4">
                  <TextField.Root
                    placeholder="Supplier Group Name"
                    value={newSupplierGroupName}
                    onChange={(e) => setNewSupplierGroupName(e.target.value)}
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
                  <Button onClick={handleAddSupplierGroup} disabled={isAdding}>
                    {isAdding ? "Adding..." : "Add Supplier Group"}
                  </Button>
                </Flex>
              </Dialog.Content>
            </Dialog.Root>
          </Flex>
  
          <Flex direction="column" gap="4">
            <Flex justify="space-between" align="start" gap="3" style={{ width: "100%" }}>
              <TextField.Root
                placeholder="Search Supplier Group"
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
              Failed to load supplier groups: {error.message}
            </Text>
          ) : !sortedData || sortedData.length === 0 ? (
            <Text size="2" color="gray">
              No supplier groups found.
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
                {sortedData.map((supplierGroup) => (
                  <Table.Row key={supplierGroup.name}>
                    <Table.Cell>{supplierGroup.supplier_group_name}</Table.Cell>
                    <Table.Cell>
                      <Button
                        onClick={() => handleDelete(supplierGroup.name)}
                        variant="outline"
                        color="red"
                        size="1"
                        disabled={deletingId === supplierGroup.name}
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
  
  export default SupplierGroupList;  