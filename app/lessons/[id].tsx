import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function LessonsLegacyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={"/(tabs)/explore" as any} />;
}
