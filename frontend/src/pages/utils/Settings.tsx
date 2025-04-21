import { useEffect, useState } from "react";
import { Card, Flex, Heading, Text, TextField, Button, Select, Checkbox, Dialog, Tabs, Box } from "@radix-ui/themes";
import { useFrappeGetDoc, useFrappePostCall } from "frappe-react-sdk";

interface SettingsData {
    declarant_representative: string;
    declarant_reference_no: string;
    declarant_reference_address: string;
    extended_customs_procedure: string;
    national_customs_procedure: string;
    mode_of_payment: string;
    destination_country_code: string;
    supplementary_unit_code: string;
    supplementary_unit_name: string;
    supplementary_unit_quantity: string;
    calculation_working_mode: string;
    marks1: string;
    suppliers_document_type_code: string;
    attaced_document_code: string;
    sad_flow: string;
    selected_page: string;
    declaration_type: string;
    declaration_gen: string;
    auto_submit_created_landed_cost_voucher: boolean;
    threshold: number;
    distribute_charges_based_on: "Qty" | "Amount";
    default_bank_per: number;
    default_handler_per: number;
  }
  
  const Settings = () => {
    const [settings, setSettings] = useState<SettingsData>({
      declarant_representative: "",
      declarant_reference_no: "",
      declarant_reference_address: "",
      extended_customs_procedure: "",
      national_customs_procedure: "",
      mode_of_payment: "",
      destination_country_code: "",
      supplementary_unit_code: "",
      supplementary_unit_name: "",
      supplementary_unit_quantity: "",
      calculation_working_mode: "",
      marks1: "",
      suppliers_document_type_code: "",
      attaced_document_code: "",
      sad_flow: "",
      selected_page: "",
      declaration_type: "",
      declaration_gen: "",
      auto_submit_created_landed_cost_voucher: false,
      threshold: 0,
      distribute_charges_based_on: "Qty",
      default_bank_per: 0,
      default_handler_per: 0
    });
  
    const [originalSettings, setOriginalSettings] = useState<SettingsData>({} as SettingsData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
    // Fetch the document - note we're not typing the response here
    const { data, error, isValidating } = useFrappeGetDoc(
      "Customs Management Settings",
      "Customs Management Settings"
    );
  
    const { call } = useFrappePostCall('frappe.client.set_value');
  
    useEffect(() => {
      if (data) {
        // Access the data directly (Frappe returns data in the root object)
        const initialSettings: SettingsData = {
          declarant_representative: data.declarant_representative || "",
          declarant_reference_no: data.declarant_reference_no || "",
          declarant_reference_address: data.declarant_reference_address || "",
          extended_customs_procedure: data.extended_customs_procedure || "",
          national_customs_procedure: data.national_customs_procedure || "",
          mode_of_payment: data.mode_of_payment || "",
          destination_country_code: data.destination_country_code || "",
          supplementary_unit_code: data.supplementary_unit_code || "",
          supplementary_unit_name: data.supplementary_unit_name || "",
          supplementary_unit_quantity: data.supplementary_unit_quantity || "",
          calculation_working_mode: data.calculation_working_mode || "",
          marks1: data.marks1 || "",
          suppliers_document_type_code: data.suppliers_document_type_code || "",
          attaced_document_code: data.attaced_document_code || "",
          sad_flow: data.sad_flow || "",
          selected_page: data.selected_page || "",
          declaration_type: data.declaration_type || "",
          declaration_gen: data.declaration_gen || "",
          auto_submit_created_landed_cost_voucher: data.auto_submit_created_landed_cost_voucher || false,
          threshold: data.threshold || 0,
          distribute_charges_based_on: data.distribute_charges_based_on || "Qty",
          default_bank_per: data.default_bank_per || 0,
          default_handler_per: data.default_handler_per || 0
        };
        setSettings(initialSettings);
        setOriginalSettings(initialSettings);
      }
    }, [data]);

  useEffect(() => {
    if (Object.keys(originalSettings).length > 0) {
      const changesExist = (Object.keys(settings) as Array<keyof SettingsData>).some(key => 
        JSON.stringify(settings[key]) !== JSON.stringify(originalSettings[key])
      );
      setHasChanges(changesExist);
    }
  }, [settings, originalSettings]);

  const handleChange = <K extends keyof SettingsData>(field: K, value: SettingsData[K]) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const updates = (Object.keys(settings) as Array<keyof SettingsData>)
        .filter(key => JSON.stringify(settings[key]) !== JSON.stringify(originalSettings[key]))
        .map(key => ({
          doctype: 'Customs Management Settings',
          name: 'Customs Management Settings',
          fieldname: key as string,
          value: settings[key]
        }));

      for (const update of updates) {
        await call(update);
      }

      setOriginalSettings(settings);
      setHasChanges(false);
      setShowConfirmDialog(false);
    } catch (error) {
      console.error("Error updating settings:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSettings(originalSettings);
    setHasChanges(false);
  };

  if (isValidating) {
    return (
      <Card p="4" m="4">
        <Text>Loading settings...</Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card p="4" m="4">
        <Text color="red">Error: {error.message}</Text>
      </Card>
    );
  }

  return (
    <Card p="4" m="4">
      <Flex justify="between" align="center" mb="4">
        <Heading size="5">Customs Management Settings</Heading>
        {hasChanges && (
          <Flex gap="3">
            <Button variant="soft" color="gray" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={() => setShowConfirmDialog(true)}>
              Save Changes
            </Button>
          </Flex>
        )}
      </Flex>

      <Tabs.Root defaultValue="xml">
        <Tabs.List>
          <Tabs.Trigger value="xml">XML Details</Tabs.Trigger>
          <Tabs.Trigger value="costing">Costing Settings</Tabs.Trigger>
          <Tabs.Trigger value="additional">Additional Details</Tabs.Trigger>
        </Tabs.List>

        <Box pt="3">
          <Tabs.Content value="xml">
            <Flex direction="column" gap="3">
              <Flex gap="3" wrap="wrap">
                <TextField.Root
                  style={{ flex: "1 1 300px" }}
                  value={settings.declarant_representative}
                  onChange={(e) => handleChange("declarant_representative", e.target.value)}
                >
                  <TextField.Slot>
                    <Text>Declarant Representative:</Text>
                  </TextField.Slot>
                </TextField.Root>

                <TextField.Root
                  style={{ flex: "1 1 300px" }}
                  value={settings.declarant_reference_no}
                  onChange={(e) => handleChange("declarant_reference_no", e.target.value)}
                >
                  <TextField.Slot>
                    <Text>Declarant Reference No:</Text>
                  </TextField.Slot>
                </TextField.Root>
              </Flex>

              <TextField.Root
                value={settings.declarant_reference_address}
                onChange={(e) => handleChange("declarant_reference_address", e.target.value)}
              >
                <TextField.Slot>
                  <Text>Declarant Reference Address:</Text>
                </TextField.Slot>
              </TextField.Root>

              <Flex gap="3" wrap="wrap">
                <TextField.Root
                  style={{ flex: "1 1 300px" }}
                  value={settings.extended_customs_procedure}
                  onChange={(e) => handleChange("extended_customs_procedure", e.target.value)}
                >
                  <TextField.Slot>
                    <Text>Extended Customs Procedure:</Text>
                  </TextField.Slot>
                </TextField.Root>

                <TextField.Root
                  style={{ flex: "1 1 300px" }}
                  value={settings.national_customs_procedure}
                  onChange={(e) => handleChange("national_customs_procedure", e.target.value)}
                >
                  <TextField.Slot>
                    <Text>National Customs Procedure:</Text>
                  </TextField.Slot>
                </TextField.Root>
              </Flex>
            </Flex>
          </Tabs.Content>

          <Tabs.Content value="costing">
            <Flex direction="column" gap="3">
              <Flex gap="3" align="center">
                <Checkbox
                  checked={settings.auto_submit_created_landed_cost_voucher}
                  onCheckedChange={(checked) => 
                    handleChange("auto_submit_created_landed_cost_voucher", checked as boolean)
                  }
                />
                <Text>Auto submit created Landed cost voucher</Text>
              </Flex>

              <Flex gap="3" wrap="wrap">
                <TextField.Root
                  style={{ flex: "1 1 300px" }}
                  type="number"
                  value={settings.threshold}
                  onChange={(e) => handleChange("threshold", parseFloat(e.target.value) || 0)}
                >
                  <TextField.Slot>
                    <Text>Price Difference Threshold (%):</Text>
                  </TextField.Slot>
                </TextField.Root>

                <div style={{ flex: "1 1 300px" }}>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Distribute Charges Based On:
                  </Text>
                  <Select.Root
                    value={settings.distribute_charges_based_on}
                    onValueChange={(value: "Qty" | "Amount") => 
                      handleChange("distribute_charges_based_on", value)
                    }
                  >
                    <Select.Trigger />
                    <Select.Content>
                      <Select.Item value="Qty">Quantity</Select.Item>
                      <Select.Item value="Amount">Amount</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </div>
              </Flex>

              <Flex gap="3" wrap="wrap">
                <TextField.Root
                  style={{ flex: "1 1 300px" }}
                  type="number"
                  value={settings.default_bank_per}
                  onChange={(e) => handleChange("default_bank_per", parseFloat(e.target.value) || 0)}
                >
                  <TextField.Slot>
                    <Text>Default Bank (%):</Text>
                  </TextField.Slot>
                </TextField.Root>

                <TextField.Root
                  style={{ flex: "1 1 300px" }}
                  type="number"
                  value={settings.default_handler_per}
                  onChange={(e) => handleChange("default_handler_per", parseFloat(e.target.value) || 0)}
                >
                  <TextField.Slot>
                    <Text>Default Handler (%):</Text>
                  </TextField.Slot>
                </TextField.Root>
              </Flex>
            </Flex>
          </Tabs.Content>

          <Tabs.Content value="additional">
            <Flex direction="column" gap="3">
              <Flex gap="3" wrap="wrap">
                <TextField.Root
                  style={{ flex: "1 1 300px" }}
                  value={settings.destination_country_code}
                  onChange={(e) => handleChange("destination_country_code", e.target.value)}
                >
                  <TextField.Slot>
                    <Text>Destination Country Code:</Text>
                  </TextField.Slot>
                </TextField.Root>

                <TextField.Root
                  style={{ flex: "1 1 300px" }}
                  value={settings.mode_of_payment}
                  onChange={(e) => handleChange("mode_of_payment", e.target.value)}
                >
                  <TextField.Slot>
                    <Text>Mode of Payment:</Text>
                  </TextField.Slot>
                </TextField.Root>
              </Flex>

              <Flex gap="3" wrap="wrap">
                <TextField.Root
                  style={{ flex: "1 1 300px" }}
                  value={settings.supplementary_unit_code}
                  onChange={(e) => handleChange("supplementary_unit_code", e.target.value)}
                >
                  <TextField.Slot>
                    <Text>Supplementary Unit Code:</Text>
                  </TextField.Slot>
                </TextField.Root>

                <TextField.Root
                  style={{ flex: "1 1 300px" }}
                  value={settings.supplementary_unit_name}
                  onChange={(e) => handleChange("supplementary_unit_name", e.target.value)}
                >
                  <TextField.Slot>
                    <Text>Supplementary Unit Name:</Text>
                  </TextField.Slot>
                </TextField.Root>

                <TextField.Root
                  style={{ flex: "1 1 300px" }}
                  value={settings.supplementary_unit_quantity}
                  onChange={(e) => handleChange("supplementary_unit_quantity", e.target.value)}
                >
                  <TextField.Slot>
                    <Text>Supplementary Unit Quantity:</Text>
                  </TextField.Slot>
                </TextField.Root>
              </Flex>
            </Flex>
          </Tabs.Content>
        </Box>
      </Tabs.Root>

      <Dialog.Root open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>Confirm Changes</Dialog.Title>
          <Dialog.Description size="2">
            Are you sure you want to save these changes?
          </Dialog.Description>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Card>
  );
};

export default Settings;