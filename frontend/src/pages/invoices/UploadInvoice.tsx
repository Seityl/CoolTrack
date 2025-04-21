import { useState, useRef } from "react";
import { useFrappeFileUpload } from "frappe-react-sdk";
import { Card, Flex, Heading, Text, Button, Progress, Separator } from "@radix-ui/themes";
import { AiOutlineCheckCircle, AiOutlineInfoCircle } from "react-icons/ai";

type FileStatus = {
  name: string;
  status: "pending" | "uploading" | "success" | "failed";
  error?: string;
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const SUPPORTED_FORMATS = ["pdf", "jpg", "jpeg", "png", "xlsx", "xls", "csv"];

const UploadInvoice = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { upload, progress, reset } = useFrappeFileUpload();

  const validateFile = (file: File) => {
    const fileType = file.name.split('.').pop()?.toLowerCase();
    const isValidType = SUPPORTED_FORMATS.includes(fileType || "");
    const isValidSize = file.size <= MAX_FILE_SIZE;

    if (!isValidType) {
      return `Invalid file type. Supported types: ${SUPPORTED_FORMATS.join(", ")}`;
    }
    if (!isValidSize) {
      return `File size exceeds 25MB limit.`;
    }
    return null;
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      fileInputRef.current?.click();
      return;
    }

    setUploading(true);

    for (let file of selectedFiles) {
      setCurrentFileName(file.name);

      setFileStatuses((prev) =>
        prev.map((f) =>
          f.name === file.name ? { ...f, status: "uploading" } : f
        )
      );

      try {
        const error = validateFile(file);
        if (error) {
          throw new Error(error);
        }

        await upload(file, { folder: "Home/Invoices" });

        setFileStatuses((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, status: "success" } : f
          )
        );
      } catch (err: any) {
        setFileStatuses((prev) =>
          prev.map((f) =>
            f.name === file.name
              ? { ...f, status: "failed", error: err.message }
              : f
          )
        );
      }
    }

    setCurrentFileName(null);
    setUploading(false);
    setUploadComplete(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const existingFileNames = selectedFiles.map((f) => f.name);
      const uniqueFiles = newFiles.filter(
        (f) => !existingFileNames.includes(f.name)
      );

      const validFiles = uniqueFiles.filter((file) => !validateFile(file));

      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
        setFileStatuses((prev) => [
          ...prev,
          ...validFiles.map((file) => ({
            name: file.name,
            status: "pending" as "pending",
          })),
        ]);
      }

      e.target.value = "";
    }
  };

  const handleNewUpload = () => {
    setSelectedFiles([]);
    setFileStatuses([]);
    setUploadComplete(false);
    reset();
  };

  return (
    <Card p="4" m="4">
      <Flex direction="column" gap="4">
        <Heading size="6">Upload Invoices</Heading>

        <Flex direction="column" gap="4" p="4">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv"
            multiple
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: "none" }}
          />

          {!uploadComplete && selectedFiles.length === 0 && (
            <Button
              onClick={handleUpload}
              variant="solid"
              color="blue"
              style={{ display: "inline-flex", width: "fit-content" }}
            >
              Select Files
            </Button>
          )}

          {!uploadComplete && selectedFiles.length > 0 && (
            <Flex gap="3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                style={{ display: "inline-flex", width: "fit-content" }} // Same here
              >
                Select More Files
              </Button>
              <Button
                onClick={handleUpload}
                variant="solid"
                color="green"
                disabled={uploading}
                style={{ display: "inline-flex", width: "fit-content" }} // Same here
              >
                Upload Files
              </Button>
            </Flex>
          )}

          {uploading && progress !== null && currentFileName && (
            <Flex direction="column" gap="2">
              <Text size="2" weight="medium">
                Uploading {currentFileName}
              </Text>
              <Progress value={progress} />
            </Flex>
          )}

          {selectedFiles.length > 0 && (
            <Flex direction="column" gap="2">
              <Text size="2" weight="bold">
                Selected Files:
              </Text>
              {fileStatuses.map((file) => (
                <Flex key={file.name} align="center">
                  <Text
                    size="2"
                    color={
                      file.status === "success"
                        ? "green"
                        : file.status === "failed"
                        ? "red"
                        : file.status === "uploading"
                        ? "blue"
                        : "gray"
                    }
                  >
                    {file.name} —{" "}
                    {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                  </Text>
                  {file.status === "failed" && file.error && (
                    <Text size="2" color="red">
                      {file.error}
                    </Text>
                  )}
                </Flex>
              ))}
            </Flex>
          )}

          {uploadComplete && (
            <Button onClick={handleNewUpload} variant="outline" style={{ display: "inline-flex", width: "fit-content" }}>
              Upload Another File
            </Button>
          )}

          {selectedFiles.length > 0 && (
            <>
              <Separator my="1" />
            </>
          )}
					
					<Card p="4" style={{ marginTop: "24px" }}>
						<Heading size="4">Invoice Guidelines</Heading>
						<Separator my="2" />
						<Flex direction="column" gap="4">
							<Flex align="center" gap="2">
								<AiOutlineCheckCircle style={{ color: "green" }} />
								<Text size="2">Supported formats: PDF, JPG, PNG, XLSX, XLS, CSV</Text>
							</Flex>
							<Flex align="center" gap="2">
								<AiOutlineCheckCircle style={{ color: "green" }} />
								<Text size="2">Max file size: 25MB</Text>
							</Flex>
							<Flex align="center" gap="2">
								<AiOutlineInfoCircle style={{ color: "gray" }} />
								<Text size="2">
									Make sure the invoice is readable and complete.
								</Text>
							</Flex>
						</Flex>
					</Card>
        </Flex>
      </Flex>
    </Card>
  );
};

export default UploadInvoice;