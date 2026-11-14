import type { ReactElement } from 'react';
import type { View } from '../state/store';
import { CheckIn } from './checkin/CheckIn';
import { SymptomLog } from './log/SymptomLog';
import { MapScreen } from './map/MapScreen';
import { Review } from './review/Review';
import { Sources } from './sources/Sources';

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
  { view: 'review', label: 'Review', render: () => <Review /> },
  { view: 'log', label: 'Symptom log', render: () => <SymptomLog /> },
  { view: 'sources', label: 'Sources', render: () => <Sources /> },
];
