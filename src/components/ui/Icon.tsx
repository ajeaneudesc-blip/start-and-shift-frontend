import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Colors } from '../../theme/tokens';

/**
 * Icônes vectorielles, dessinées dans le style du jeu Lucide utilisé par le
 * prototype — traits de 2, extrémités arrondies, grille de 24.
 *
 * Ce sont des tracés écrits à la main, pas une copie du jeu Lucide : aucune
 * question de licence, et seules les icônes réellement employées entrent dans
 * le bundle. `react-native-svg` remplace ici une police d'icônes complète, qui
 * aurait embarqué plusieurs centaines de glyphes inutiles.
 */
export type IconName =
  | 'check'
  | 'arrow-left'
  | 'arrow-right'
  | 'clock'
  | 'shield'
  | 'sound'
  | 'palette'
  | 'refresh'
  | 'mic'
  | 'send'
  | 'paperclip'
  | 'camera'
  | 'search'
  | 'plus'
  | 'close'
  | 'lock'
  | 'store'
  | 'card';

const ICONS: Record<IconName, ReactNode> = {
  check: <Path d="M20 6 9 17l-5-5" />,

  'arrow-left': (
    <>
      <Path d="M19 12H5" />
      <Path d="m12 19-7-7 7-7" />
    </>
  ),

  'arrow-right': (
    <>
      <Path d="M5 12h14" />
      <Path d="m12 5 7 7-7 7" />
    </>
  ),

  clock: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3.5 2" />
    </>
  ),

  shield: (
    <>
      <Path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <Path d="m9 12 2 2 4-4" />
    </>
  ),

  sound: (
    <>
      <Path d="M11 5 6 9H3v6h3l5 4z" />
      <Path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
      <Path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),

  palette: (
    <>
      <Path d="M12 21a9 9 0 1 1 9-9 3.5 3.5 0 0 1-3.5 3.5H16a1.9 1.9 0 0 0-1.4 3.2A1.6 1.6 0 0 1 12 21z" />
      <Circle cx="8.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <Circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <Circle cx="15.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),

  refresh: (
    <>
      <Path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <Path d="M21 3v6h-6" />
    </>
  ),

  mic: (
    <>
      <Rect x="9" y="3" width="6" height="11" rx="3" />
      <Path d="M5 11a7 7 0 0 0 14 0" />
      <Path d="M12 18v3" />
    </>
  ),

  send: (
    <>
      <Path d="M22 2 11 13" />
      <Path d="M22 2 15 22l-4-9-9-4z" />
    </>
  ),

  paperclip: (
    <Path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  ),

  camera: (
    <>
      <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
      <Circle cx="12" cy="13" r="3.2" />
    </>
  ),

  search: (
    <>
      <Circle cx="11" cy="11" r="7" />
      <Path d="m21 21-4.3-4.3" />
    </>
  ),

  plus: (
    <>
      <Path d="M12 5v14" />
      <Path d="M5 12h14" />
    </>
  ),

  close: (
    <>
      <Path d="M18 6 6 18" />
      <Path d="m6 6 12 12" />
    </>
  ),

  lock: (
    <>
      <Rect x="4" y="10" width="16" height="11" rx="2.5" />
      <Path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),

  store: (
    <>
      <Path d="M4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" />
      <Path d="M3 10 5 4h14l2 6a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z" />
    </>
  ),

  card: (
    <>
      <Rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <Path d="M2.5 10h19" />
    </>
  ),
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
}

export function Icon({
  name,
  size = 20,
  color = Colors.textPrimary,
  strokeWidth = 2,
  style,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      // `currentColor` sur les points de la palette suit cette valeur.
      color={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {ICONS[name]}
    </Svg>
  );
}
