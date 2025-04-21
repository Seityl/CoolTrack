import { useState } from "react";
import { Button, Box, Flex, Text } from "@radix-ui/themes";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const SortByDropdown = ({ sortField, setSortField, setSortOrder }) => {
  const [isSortByDropdownOpen, setSortByDropdownOpen] = useState(false);

  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSortByDropdownOpen((prev) => !prev);
  };

  return (
    <Box style={{ width: "100%" }}>
      <Button
        variant="soft"
        color="gray"
        style={{
          width: "100%",
          justifyContent: "space-between",
          padding: "0 1rem",
        }}
        onClick={handleDropdownToggle}
      >
        <span style={{ flex: 1, textAlign: "left", padding: "0.5rem 0" }}>
          Sort By: {sortField === "creation" ? "Creation Date" : "Name"}
        </span>
        <motion.span
          style={{
            display: "flex",
            fontSize: "1.2em",
            padding: "0.5rem 0 0.5rem 0.5rem",
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isSortByDropdownOpen ? <FiChevronDown /> : <FiChevronRight />}
        </motion.span>
      </Button>

      <AnimatePresence>
        {isSortByDropdownOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <Box style={{ paddingLeft: "1.5rem" }}>
              <Button
                as="div"
                variant="soft"
                color="gray"
                style={{ width: "100%", justifyContent: "start" }}
                onClick={() => {
                  setSortField("creation");
                  setSortByDropdownOpen(false);
                }}
              >
                Creation Date
              </Button>
              <Button
                as="div"
                variant="soft"
                color="gray"
                style={{ width: "100%", justifyContent: "start" }}
                onClick={() => {
                  setSortField("name");
                  setSortByDropdownOpen(false);
                }}
              >
                Name
              </Button>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default SortByDropdown;