import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createDemoProfile, emptyProfile } from '../../domain/demo';
import { groundReport } from '../../domain/report';
import { renderApp } from '../test-helpers';
import { GroundReport } from './GroundReport';

test('the report is shown as read-only text', () => {
  renderApp(<GroundReport />);
  const box = screen.getByRole('textbox', { name: 'Report text' });
  expect(box).toHaveAttribute('readonly');
  expect(box).toHaveValue(groundReport(createDemoProfile(), 47));
});

test('it says that nothing is sent', () => {
  renderApp(<GroundReport />);
  expect(screen.getByText(/Nothing leaves this device/)).toBeInTheDocument();
  expect(screen.getByText('Simulated link')).toBeInTheDocument();
});

test('Copy puts the text on the clipboard and says so', async () => {
  const user = userEvent.setup();
  renderApp(<GroundReport />);
  await user.click(screen.getByRole('button', { name: 'Copy' }));
  expect(await navigator.clipboard.readText()).toBe(groundReport(createDemoProfile(), 47));
  expect(screen.getByRole('status')).toHaveTextContent('Copied');
});

test('without a clipboard the text is selected instead', async () => {
  renderApp(<GroundReport />);
  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  try {
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(await screen.findByText('Text selected. Press Ctrl+C to copy.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Report text' })).toHaveFocus();
  } finally {
    if (original) Object.defineProperty(navigator, 'clipboard', original);
    else Reflect.deleteProperty(navigator, 'clipboard');
  }
});

test('Download offers the text as a file named after the crew and day', async () => {
  const blobs: Blob[] = [];
  const createObjectURL = vi.fn((b: Blob) => {
    blobs.push(b);
    return 'blob:report';
  });
  const revokeObjectURL = vi.fn();
  Object.assign(URL, { createObjectURL, revokeObjectURL });
  const clicked: { download: string; href: string }[] = [];
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    clicked.push({ download: this.download, href: this.href });
  });
  try {
    renderApp(<GroundReport />);
    await userEvent.click(screen.getByRole('button', { name: 'Download .txt' }));
    expect(clicked).toEqual([{ download: 'crew-health-report-crew-03-day-047.txt', href: 'blob:report' }]);
    expect(blobs[0].type).toBe('text/plain;charset=utf-8');
    expect(await blobs[0].text()).toBe(groundReport(createDemoProfile(), 47));
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:report');
  } finally {
    click.mockRestore();
  }
});

test('the Mars report shows the one-way delay', () => {
  renderApp(<GroundReport />, { profile: { ...createDemoProfile(), mission: 'mars' } });
  expect((screen.getByRole('textbox', { name: 'Report text' }) as HTMLTextAreaElement).value).toContain('Comms: Up to 20 minutes one way');
});

test('the log lists what was sent, newest first, and each message opens', async () => {
  renderApp(<GroundReport />);
  const sent = within(screen.getByRole('region', { name: 'Sent to ground' }));
  const items = sent.getAllByRole('listitem');
  expect(items.map((li) => li.querySelector('summary')?.textContent)).toEqual([
    'Day 47 urgent Urgent: Kidneys',
    'Day 35 missed Missed check-in: flight day 34',
    'Day 7 review Weekly review: Inner ear & balance',
  ]);
  expect(items[0].querySelector('pre')?.textContent).toContain('[WARNING] Kidneys');
  expect(items[0].querySelector('pre')?.textContent).toContain('SIMULATED DATA');
});

test('a profile that has sent nothing says so', () => {
  renderApp(<GroundReport />, { profile: emptyProfile('New crew', 'station', {}) });
  expect(within(screen.getByRole('region', { name: 'Sent to ground' })).getByText('Nothing has been sent yet.')).toBeInTheDocument();
});

test('Mars shows the one-way delay next to the simulated-link notice', () => {
  renderApp(<GroundReport />, { profile: { ...createDemoProfile(), mission: 'mars' } });
  expect(screen.getByText(/Comms on this mission: Up to 20 minutes one way/)).toBeInTheDocument();
});
