import { render, screen } from '@testing-library/react';
import App from './App';

test('shell shows the app name and a main landmark', () => {
  render(<App />);
  expect(screen.getByText('Crew Health')).toBeInTheDocument();
  expect(screen.getByRole('main')).toBeInTheDocument();
});
