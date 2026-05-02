'use client'

import { useEffect } from 'react';
import { useTenantStore } from '@/store/tenantStore';
import { hexToHSL, isLightColor } from '@/utils/colors';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return <>{children}</>;
}
