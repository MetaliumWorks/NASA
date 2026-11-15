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
  expect(screen.getByText('Tanıtım · 1/10')).toBeInTheDocument();
  // the next part, then the check-in screen
  await userEvent.keyboard('{ArrowRight}');
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
  await userEvent.keyboard('{ArrowRight}');
  expect(screen.getByRole('heading', { name: /Daily check-in/ })).toBeInTheDocument();
  // Esc leaves
  await userEvent.keyboard('{Escape}');
  expect(screen.queryByRole('region', { name: 'Tanıtım modu' })).toBeNull();
});

test('the closing part stays on its last frame until the next press', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: 'Tanıtım modu' }));
  // parts 1 to 9: end each, then play the next
  for (let i = 0; i < 9; i++) {
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{ArrowRight}');
  }
  // the sources part ended earlier: the app showed Sources, and now the closing part is playing
  expect(screen.queryByRole('region', { name: 'Tanıtım modu' })).toBeNull();
  await userEvent.keyboard('{ArrowRight}');
  // held: the video stays up, no bar yet
  expect(document.querySelector('.present-video')).toHaveClass('is-playing');
  expect(screen.queryByRole('region', { name: 'Tanıtım modu' })).toBeNull();
  await userEvent.keyboard('{ArrowRight}');
  expect(document.querySelector('.present-video')).not.toHaveClass('is-playing');
  expect(screen.getByText('Tanıtım bitti')).toBeInTheDocument();
});
