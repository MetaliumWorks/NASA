import { AppProvider, useApp } from './state/store';
import { Header } from './ui/Header';
import { shownView } from './ui/gate';
import { SCREENS } from './ui/screens';

/** Header and the screen in view. While the daily check-in is still required, that is the check-in. */
export function Shell() {
  const { state } = useApp();
  const view = shownView(state);
  const screen = SCREENS.find((s) => s.view === view) ?? SCREENS[0];
  return (
    <div className="app">
      <Header />
      <main className="app-main">{screen.render()}</main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
