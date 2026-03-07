import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function ChooseSubjectLegacyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={/video/ as any} />;
}
