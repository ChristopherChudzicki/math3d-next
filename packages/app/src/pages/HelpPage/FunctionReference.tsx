import React from "react";

interface ReferenceEntry {
  name: string;
  keyboard: string;
  shortDescription: string;
  longDescription?: string;
  tags: string[];
}
interface ConstantEntry extends ReferenceEntry {
  value: string;
}

const FunctionReference: React.FC = () => {
  <div />;
};
