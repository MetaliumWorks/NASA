import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
});

test('parts play one at a time, and the app shows each feature after its part', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: 'Tanıtım modu' }));
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
  // between parts there is no bar; → ends the part
  expect(screen.queryByRole('region', { name: 'Tanıtım modu' })).toBeNull();
  await userEvent.keyboard('{ArrowRight}');
  expect(screen.getByRole('button', { name: /Sonraki: Günlük kontrol/ })).toBeInTheDocument();
  expect(screen.getByText('Tanıtım · 1/9')).toBeInTheDocument();
  // the next part, then the check-in screen
  await userEvent.keyboard('{ArrowRight}');
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
  await userEvent.keyboard('{ArrowRight}');
  expect(screen.getByRole('heading', { name: /Daily check-in/ })).toBeInTheDocument();
  // Esc leaves
  await userEvent.keyboard('{Escape}');
  expect(screen.queryByRole('region', { name: 'Tanıtım modu' })).toBeNull();
});
