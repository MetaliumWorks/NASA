import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { REGION_ORDER } from '../content/regions';
import type { RegionId, Status } from '../domain/types';
import { StatusGlyph } from '../ui/StatusGlyph';
import { BodyFigure, figureLabel } from './BodyFigure';
import { HOT_BONES, ORGANS } from './layout';
import { Stars } from './Stars';

const nominal = Object.fromEntries(REGION_ORDER.map((r) => [r, 'nominal'])) as Record<RegionId, Status>;
const flagged: Record<RegionId, Status> = { ...nominal, kidneys: 'warning', bones: 'caution' };
const noop = () => {};

test('flagged regions are named with their status', () => {
  render(<BodyFigure statuses={flagged} selected={null} showOrgans={false} onSelect={noop} />);
  expect(screen.getByRole('img')).toHaveAccessibleName('Body scan. Kidneys: warning. Bones: caution. 11 systems nominal.');
  expect(screen.getByText('Kidneys')).toBeInTheDocument();
  expect(screen.getByText('warning')).toBeInTheDocument();
  expect(screen.getByText('Bones')).toBeInTheDocument();
  expect(screen.getByText('caution')).toBeInTheDocument();
});

test('with nothing flagged the figure says so and labels nothing', () => {
  render(<BodyFigure statuses={nominal} selected={null} showOrgans={false} onSelect={noop} />);
  expect(screen.getByRole('img')).toHaveAccessibleName('Body scan. 13 systems nominal.');
  expect(screen.queryByText('nominal')).toBeNull();
  expect(figureLabel({ ...nominal, eyes: 'caution' })).toBe('Body scan. Eyes: caution. 12 systems nominal.');
});

test('organs stay hidden when nothing is wrong', () => {
  const { container } = render(<BodyFigure statuses={nominal} selected={null} showOrgans={false} onSelect={noop} />);
  expect(container.querySelectorAll('[data-testid="organs"] image')).toHaveLength(0);
  expect(container.querySelectorAll('[data-testid="markers"] circle')).toHaveLength(0);
});

test('a flagged organ shows even with organs hidden', () => {
  const { container } = render(<BodyFigure statuses={flagged} selected={null} showOrgans={false} onSelect={noop} />);
  expect(container.querySelectorAll('image[data-region="kidneys"][data-status="warning"]')).toHaveLength(1);
  expect(container.querySelectorAll('image[data-region="lungs"]')).toHaveLength(0);
});

test('showOrgans reveals every organ', () => {
  const { container } = render(<BodyFigure statuses={nominal} selected={null} showOrgans onSelect={noop} />);
  expect(container.querySelectorAll('image[data-region]')).toHaveLength(ORGANS.length);
  expect(container.querySelectorAll('image[data-status="nominal"]')).toHaveLength(ORGANS.length);
});

test('eyes and inner ear are shown as markers', () => {
  const { container } = render(<BodyFigure statuses={{ ...nominal, eyes: 'caution' }} selected={null} showOrgans={false} onSelect={noop} />);
  expect(container.querySelectorAll('circle[data-region="eyes"][data-status="caution"]')).toHaveLength(2);
  expect(container.querySelectorAll('circle[data-region="innerEar"]')).toHaveLength(0);
});

test('weight-bearing bones light up for Bones', () => {
  const { container } = render(<BodyFigure statuses={flagged} selected={null} showOrgans={false} onSelect={noop} />);
  expect(container.querySelector('#FemurLeft')).toHaveClass('hot-caution');
  expect(container.querySelector('#g3760')).toHaveClass('hot-caution');
  expect(container.querySelector('#LumbarVertebrae')).toHaveClass('hot-caution');
  expect(container.querySelector('#HumerusLeft')).not.toHaveClass('hot-caution');
});

test('spine takes the worse of Bones and Spine', () => {
  const { container } = render(
    <BodyFigure statuses={{ ...flagged, spine: 'warning' }} selected={null} showOrgans={false} onSelect={noop} />,
  );
  expect(container.querySelector('#LumbarVertebrae')).toHaveClass('hot-warning');
  expect(container.querySelector('#LumbarVertebrae')).not.toHaveClass('hot-caution');
  expect(container.querySelector('#CervicalVertebrae')).toHaveClass('hot-warning');
  expect(container.querySelector('#FemurLeft')).toHaveClass('hot-caution');
});

test('bones lose their colour when the region returns to nominal', () => {
  const { container, rerender } = render(<BodyFigure statuses={flagged} selected={null} showOrgans={false} onSelect={noop} />);
  expect(container.querySelector('#FemurLeft')).toHaveClass('hot-caution');
  rerender(<BodyFigure statuses={nominal} selected={null} showOrgans={false} onSelect={noop} />);
  expect(container.querySelector('#FemurLeft')).not.toHaveClass('hot-caution');
});

test('organs are selectable by click and keyboard', async () => {
  const onSelect = vi.fn();
  const { container } = render(<BodyFigure statuses={flagged} selected={null} showOrgans onSelect={onSelect} />);
  await userEvent.click(container.querySelector('image[data-region="heart"]')!);
  (container.querySelector('image[data-region="lungs"]') as SVGElement).focus();
  await userEvent.keyboard('{Enter}');
  (container.querySelector('image[data-region="kidneys"]') as SVGElement).focus();
  await userEvent.keyboard(' ');
  expect(onSelect.mock.calls.map((c) => c[0])).toEqual(['heart', 'lungs', 'kidneys']);
});

test('each region is one named button, even when it has several drawings', () => {
  render(<BodyFigure statuses={flagged} selected="kidneys" showOrgans onSelect={noop} />);
  expect(screen.getAllByRole('button', { name: 'Digestion & nutrition: nominal' })).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Kidneys: warning' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Radiation: nominal' })).toBeInTheDocument();
});

test('clicking a bone selects Bones, clicking a vertebra selects Spine', async () => {
  const onSelect = vi.fn();
  const { container } = render(<BodyFigure statuses={nominal} selected={null} showOrgans={false} onSelect={onSelect} />);
  await userEvent.click(container.querySelector('#FemurLeft path')!);
  await userEvent.click(container.querySelector('#LumbarVertebrae path')!);
  await userEvent.click(container.querySelector('#HandLeft-m path')!);
  expect(onSelect.mock.calls.map((c) => c[0])).toEqual(['bones', 'spine', 'bones']);
});

test('a selected nominal region is labelled without a colour word of alarm', () => {
  render(<BodyFigure statuses={nominal} selected="heart" showOrgans={false} onSelect={noop} />);
  expect(screen.getByText('Heart & vessels')).toBeInTheDocument();
  expect(screen.getByText('nominal')).toBeInTheDocument();
});

test('a name too long for its slot is broken over two lines', () => {
  render(<BodyFigure statuses={{ ...nominal, digestion: 'caution', heart: 'caution' }} selected={null} showOrgans={false} onSelect={noop} />);
  expect(screen.getByText('Digestion &')).toBeInTheDocument();
  expect(screen.getByText('nutrition')).toBeInTheDocument();
  expect(screen.getByText('Heart & vessels')).toBeInTheDocument();
});

test('status glyphs differ by shape, not only colour', () => {
  const { container } = render(
    <>
      <StatusGlyph status="nominal" />
      <StatusGlyph status="caution" />
      <StatusGlyph status="warning" />
    </>,
  );
  expect(container.querySelector('circle')).not.toBeNull();
  expect(container.querySelector('path')).not.toBeNull();
  expect(container.querySelector('rect')).not.toBeNull();
});

test('a status glyph always carries its word', () => {
  const { rerender } = render(<StatusGlyph status="caution" label />);
  expect(screen.getByText('Caution')).toBeVisible();
  rerender(<StatusGlyph status="warning" />);
  expect(screen.getByText('Warning')).toHaveClass('visually-hidden');
});

test('stars are decoration only', () => {
  const { container } = render(<Stars width={1160} height={660} dimFromX={520} />);
  expect(container.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true');
});

const paintedAfter = (a: Element, b: Element) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

test('flagged bones are redrawn above nominal organ art and below flagged organs', () => {
  const { container } = render(<BodyFigure statuses={flagged} selected={null} showOrgans onSelect={noop} />);
  const overlay = container.querySelector('[data-testid="hot-bones"]');
  expect(overlay).not.toBeNull();
  expect(overlay!.querySelector('use[href="#FemurLeft"]')).not.toBeNull();
  const thigh = container.querySelector('image[data-region="muscles"]')!; // nominal art that lies over the femur
  const kidneys = container.querySelector('image[data-region="kidneys"]')!; // a flagged organ
  expect(paintedAfter(thigh, overlay!)).toBe(true);
  expect(paintedAfter(overlay!, kidneys)).toBe(true);
});

test('only flagged bones are redrawn', () => {
  const some = render(<BodyFigure statuses={flagged} selected={null} showOrgans onSelect={noop} />);
  expect(some.container.querySelectorAll('[data-testid="hot-bones"] use')).toHaveLength(HOT_BONES.bones!.length);
  expect(some.container.querySelector('[data-testid="hot-bones"] use[href="#HumerusLeft"]')).toBeNull();
  some.unmount();
  const none = render(<BodyFigure statuses={nominal} selected={null} showOrgans onSelect={noop} />);
  expect(none.container.querySelectorAll('[data-testid="hot-bones"] use')).toHaveLength(0);
});

test('the redrawn bones are decoration, not a second control', () => {
  const { container } = render(<BodyFigure statuses={flagged} selected={null} showOrgans onSelect={noop} />);
  const overlay = container.querySelector('[data-testid="hot-bones"]')!;
  expect(overlay).toHaveAttribute('aria-hidden', 'true');
  expect(overlay.querySelector('[role="button"], [tabindex]')).toBeNull();
});

test('a redrawn bone carries its own status, because a copy does not take the colour of the original', () => {
  const statuses: Record<RegionId, Status> = { ...flagged, spine: 'warning' };
  const { container } = render(<BodyFigure statuses={statuses} selected={null} showOrgans onSelect={noop} />);
  const overlay = container.querySelector('[data-testid="hot-bones"]')!;
  expect(overlay.querySelector('use[href="#FemurLeft"]')).toHaveClass('hot-caution');
  expect(overlay.querySelector('use[href="#LumbarVertebrae"]')).toHaveClass('hot-warning');
});
