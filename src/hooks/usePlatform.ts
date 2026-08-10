import { Platform, useWindowDimensions } from 'react-native';

/** Seuil au-delà duquel la mise en page passe en deux colonnes. */
const WIDE_BREAKPOINT = 900;

export interface PlatformInfo {
  isWeb: boolean;
  isMobile: boolean;
  /**
   * Web ET fenêtre assez large. Un navigateur réduit doit retomber sur la
   * disposition mobile, sinon les deux colonnes deviennent illisibles.
   */
  isWide: boolean;
  width: number;
}

export function usePlatform(): PlatformInfo {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  return {
    isWeb,
    isMobile: !isWeb,
    isWide: isWeb && width >= WIDE_BREAKPOINT,
    width,
  };
}
