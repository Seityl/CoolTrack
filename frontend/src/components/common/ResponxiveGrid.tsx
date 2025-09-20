import React from 'react';
import { Grid } from "@radix-ui/themes";

interface ResponsiveGridProps {
  children: React.ReactNode;
  minItemWidth?: string;
  gap?: "1" | "2" | "3" | "4" | "5" | "6";
  columns?: {
    initial?: string;
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  gap = "4",
  columns = { initial: '1', sm: '2', lg: '3' }
}) => {
  return (
    <Grid 
      columns={columns} 
      gap={gap}
    >
      {children}
    </Grid>
  );
};