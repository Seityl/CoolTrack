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
  
  const ItemGroup = () => {
    const { data, isLoading, error, mutate } = useFrappeGetDocList("Item Group", {
      fields: ["name", "creation"],
      orderBy: {
        field: "creation",
        order: "desc",
      },
    });
  
    const { deleteDoc } = useFrappeDeleteDoc();
    const { createDoc } = useFrappeCreateDoc();
  
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [itemGroupToDelete, setItemGroupToDelete] = useState<string | null>(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [addError, setAddError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
  
    const [sortField, setSortField] = useState("creation");
    const [sortOrder, setSortOrder] = useState("desc");
    const [searchQuery, setSearchQuery] = useState("");
  
    const handleDelete = async () => {
      if (!itemGroupToDelete) return;
      setDeletingId(itemGroupToDelete);
      try {
        await deleteDoc("Item Group", itemGroupToDelete);
        mutate();
      } catch (err) {
        alert("Failed to delete Item Group.");
      } finally {
        setDeletingId(null);
        setItemGroupToDelete(null);
        setShowConfirmDialog(false);
      }
    };
  
    const handleAddItemGroup = async () => {
      setIsAdding(true);
      setAddError(null);
  
      const trimmed = newGroupName.trim();
      if (!trimmed) {
        setAddError("Item Group name cannot be empty.");
        setIsAdding(false);
        return;
      }
  
      try {
        await createDoc("Item Group", { item_group_name: trimmed });
        setShowAddDialog(false);
        setNewGroupName("");
        mutate();
      } catch (err: any) {
        const message = err?.message || "";
        const exc = err?.exception || "";
  
        if (message.includes("Duplicate") || exc.includes("DuplicateEntryError")) {
          setAddError("An Item Group with this name already exists.");
        } else {
          setAddError("Failed to create Item Group.");
        }
      } finally {
        setIsAdding(false);
      }
    };
  
    const filteredData = data?.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
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
            <Heading size="6">Item Groups</Heading>
            <Dialog.Root open={showAddDialog} onOpenChange={setShowAddDialog}>
              <Dialog.Trigger>
                <Button variant="solid" color="blue" size="2">
                  <FiPlus style={{ marginRight: 6 }} />
                  Add Item Group
                </Button>
              </Dialog.Trigger>
              <Dialog.Content style={{ maxWidth: 400 }}>
                <Dialog.Title>Add a New Item Group</Dialog.Title>
                <Dialog.Description size="2">
                  Enter the name of the new Item Group.
                </Dialog.Description>
  
                <Flex direction="column" gap="3" mt="4">
                  <TextField.Root
                    placeholder="Item Group Name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
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
                  <Button onClick={handleAddItemGroup} disabled={isAdding}>
                    {isAdding ? "Adding..." : "Add Item Group"}
                  </Button>
                </Flex>
              </Dialog.Content>
            </Dialog.Root>
          </Flex>
  
          {/* Filters */}
          <Flex direction="column" gap="4">
            <Flex justify="space-between" align="start" gap="3" style={{ width: "100%" }}>
              <TextField.Root
                placeholder="Search Item Group"
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
              Failed to load Item Groups: {error.message}
            </Text>
          ) : !sortedData || sortedData.length === 0 ? (
            <Text size="2" color="gray">
              No Item Groups found.
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
                {sortedData.map((group) => (
                  <Table.Row key={group.name}>
                    <Table.Cell>{group.name}</Table.Cell>
                    <Table.Cell>
                      <Button
                        onClick={() => {
                          setItemGroupToDelete(group.name);
                          setShowConfirmDialog(true);
                        }}
                        variant="outline"
                        color="red"
                        size="1"
                        disabled={deletingId === group.name}
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
  
        {/* Delete Confirmation Dialog */}
        <Dialog.Root open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <Dialog.Content style={{ maxWidth: 400 }}>
            <Dialog.Title>Confirm Delete</Dialog.Title>
            <Dialog.Description>
              Are you sure you want to delete Item Group <strong>{itemGroupToDelete}</strong>?
            </Dialog.Description>
            <Flex mt="4" justify="end" gap="3">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button onClick={handleDelete} color="red" disabled={!itemGroupToDelete}>
                Delete
              </Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
      </Card>
    );
  };
  
  export default ItemGroup;  