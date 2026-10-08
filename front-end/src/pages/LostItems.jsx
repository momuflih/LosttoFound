import React from "react";
import ItemsListView from "../components/ItemsListView";

export default function LostItems() {
  return (
    <ItemsListView
      itemKind="lost"
      title="Lost Items"
      subtitle="Browse items that people have lost."
      searchPlaceholder="Search for lost items (e.g. wallet, phone, keys...)"
    />
  );
}
