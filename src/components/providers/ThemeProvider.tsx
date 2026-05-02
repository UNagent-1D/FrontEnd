'use client'

import { useEffect } from 'react';
import { useTenantStore } from '@/store/tenantStore';
import { hexToHSL, isLightColor } from '@/utils/colors';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const currentTenant = useTenantStore((state) => state.currentTenant);

  useEffect(() => {
    const root = document.documentElement;

    // Reset to default variables if no tenant color is set
    if (!currentTenant || !currentTenant.branding_primary_color) {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
      return;
    }

    const primaryColorHex = currentTenant.branding_primary_color;
    
    // Convert the primary color to HSL for Tailwind/Shadcn variable injection
    const primaryHsl = hexToHSL(primaryColorHex);
    root.style.setProperty('--primary', primaryHsl);

    // Calculate contrast to set the foreground (text) color for the primary button/background
    const isLight = isLightColor(primaryColorHex);
    
    // In Shadcn HSL format, 210 40% 98% is a light color (whiteish) 
    // and 222.2 47.4% 11.2% is a dark color (blackish)
    const foregroundHsl = isLight ? '222.2 47.4% 11.2%' : '210 40% 98%';
    root.style.setProperty('--primary-foreground', foregroundHsl);

  }, [currentTenant]);

  return <>{children}</>;
}
