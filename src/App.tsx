import { AppProvider, useApp } from './state/store';
import { Header } from './ui/Header';
import { SCREENS } from './ui/screens';

function Shell() {
  const { state } = useApp();
  const screen = SCREENS.find((s) => s.view === state.view) ?? SCREENS[0];
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
