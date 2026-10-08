import React from "react";
import ItemsListView from "../components/ItemsListView";

export default function FoundItems() {
  return (
    <ItemsListView
      itemKind="found"
      title="Found Items"
      subtitle="Browse items that people have found."
      searchPlaceholder="Search for found items (e.g. wallet, phone, keys...)"
    />
  );
}
