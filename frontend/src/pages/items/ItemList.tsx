import { useFrappeGetDocList, useFrappeDeleteDoc } from "frappe-react-sdk";
import {
  Card,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
} from "@radix-ui/themes";
import * as Table from "@radix-ui/themes/components/table";
import { FiTrash2, FiPlus } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useState } from "react";

const ItemList = () => {
  const { data, isLoading, error, mutate } = useFrappeGetDocList("Item", {
    fields: ["name", "item_name", "item_group", "creation"],
    orderBy: {
      field: "creation",
      order: "desc",
    },
  });

  const { deleteDoc } = useFrappeDeleteDoc();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (name: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this item?");
    if (!confirmed) return;

    setDeletingId(name);
    try {
      await deleteDoc("Item", name);
      mutate(); // Refresh list
    } catch (err) {
      alert("Failed to delete item.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card p="4" m="4">
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center">
          <Heading size="6">Items</Heading>
          <Button asChild variant="solid" color="blue" size="2">
            <Link to="/items/create">
              <FiPlus style={{ marginRight: 6 }} />
              Create Item
            </Link>
          </Button>
        </Flex>

        {isLoading ? (
          <Flex align="center" justify="center" p="6">
            <Spinner size="3" />
          </Flex>
        ) : error ? (
          <Text color="red" size="2">
            Failed to load items: {error.message}
          </Text>
        ) : !data || data.length === 0 ? (
          <Text size="2" color="gray">
            No items found.
          </Text>
        ) : (
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Group</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Created On</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.map((item) => (
                <Table.Row key={item.name}>
                  <Table.Cell>{item.item_name}</Table.Cell>
                  <Table.Cell>{item.item_group}</Table.Cell>
                  <Table.Cell>{new Date(item.creation).toLocaleString()}</Table.Cell>
                  <Table.Cell>
                    <Button
                      onClick={() => handleDelete(item.name)}
                      variant="outline"
                      color="red"
                      size="1"
                      disabled={deletingId === item.name}
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

export default ItemList;
