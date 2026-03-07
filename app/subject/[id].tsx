import { Redirect, useLocalSearchParams } from "expo-router";
import React from "react";

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/video/${id}` as any} />;
}
