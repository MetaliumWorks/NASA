import type { ReactElement } from 'react';
import type { View } from '../state/store';
import { CheckIn } from './checkin/CheckIn';
import { MapScreen } from './map/MapScreen';

export interface Screen {
  view: View;
  /** Label of its button in the header. */
  label: string;
  render(): ReactElement;
}

/** The screens that exist, in header order. A view without a screen falls back to the map. */
export const SCREENS: Screen[] = [
  { view: 'map', label: 'Body map', render: () => <MapScreen /> },
  { view: 'checkin', label: 'Check-in', render: () => <CheckIn /> },
];
