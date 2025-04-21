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
import { FiDownload, FiTrash2, FiUpload } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useState } from "react";

const InvoiceList = () => {
  const { data, isLoading, error, mutate } = useFrappeGetDocList("File", {
    fields: ["name", "file_name", "file_url", "creation"],
    filters: [["folder", "=", "Home/Invoices"]],
    orderBy: {
      field: "creation",
      order: "desc",
    },
  });

  const { deleteDoc } = useFrappeDeleteDoc();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (name: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this invoice?");
    if (!confirmed) return;

    setDeletingId(name);
    try {
      await deleteDoc("File", name);
      mutate(); // Refresh list
    } catch (err) {
      alert("Failed to delete file.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card p="4" m="4">
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center">
          <Heading size="6">Invoices</Heading>
          <Button asChild variant="solid" color="blue" size="2">
            <Link to="/invoices/upload">
              <FiUpload style={{ marginRight: 6 }} />
              Upload Invoices
            </Link>
          </Button>
        </Flex>

        {isLoading ? (
          <Flex align="center" justify="center" p="6">
            <Spinner size="3" />
          </Flex>
        ) : error ? (
          <Text color="red" size="2">
            Failed to load invoices: {error.message}
          </Text>
        ) : !data || data.length === 0 ? (
          <Text size="2" color="gray">
            No invoices uploaded yet.
          </Text>
        ) : (
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>File Name</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Uploaded On</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.map((file) => (
                <Table.Row key={file.name}>
                  <Table.Cell>{file.file_name}</Table.Cell>
                  <Table.Cell>
                    {new Date(file.creation).toLocaleString()}
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap="2">
                      <Button
                        asChild
                        variant="outline"
                        color="blue"
                        size="1"
                      >
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FiDownload />
                        </a>
                      </Button>
                      <Button
                        onClick={() => handleDelete(file.name)}
                        variant="outline"
                        color="red"
                        size="1"
                        disabled={deletingId === file.name}
                      >
                        <FiTrash2 />
                      </Button>
                    </Flex>
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

export default InvoiceList;