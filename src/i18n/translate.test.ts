import { translateText, translateTree } from './translate';

describe('translateText', () => {
  test('an exact phrase', () => {
    expect(translateText('Body map')).toBe('Vücut haritası');
  });

  test('keeps the spaces around a fragment', () => {
    expect(translateText(' steps done today.')).toBe(' adım bugün tamamlandı.');
  });

  test('numbers go back in, in order', () => {
    expect(translateText('3 systems need attention')).toBe('3 sistem dikkat istiyor');
    expect(translateText('Anxiety, reported on 3 of 30 days')).toBe('Kaygı, 3/30 günde bildirildi');
  });

  test('numbers can change places', () => {
    expect(translateText('Reported on 3 of the last 7 days')).toBe("Son 7 günün 3'inde bildirildi");
  });

  test('decimal numbers stay whole', () => {
    expect(translateText('Today 2.6 L · 3-day average 1.7 L, 69% of baseline')).toBe(
      "Bugün 2.6 L · 3 günlük ortalama 1.7 L, başlangıcın %69'ü",
    );
  });

  test('an unknown phrase is left alone', () => {
    expect(translateText('Crew 03')).toBeNull();
    expect(translateText('   ')).toBeNull();
  });
});

describe('text the app builds from parts', () => {
  test('a confirmed critical reading', () => {
    expect(translateText('Critical reading: Heart rate')).toBe('Kritik değer: Nabız');
    expect(translateText('Today 140 bpm · Critical reading 140 bpm, 125.8% above baseline')).toBe(
      'Bugün 140 atım/dk · Kritik değer 140 atım/dk, başlangıcın 125.8% üstünde',
    );
    expect(translateText('Reported to the ground today')).toBe('Bugün yere bildirilenler');
    expect(translateText('critical')).toBe('kritik');
  });
});

describe('translateTree', () => {
  test('text and labels, but not what was typed', () => {
    document.body.innerHTML =
      '<div><h2>Body map</h2><button aria-label="Mission: Mars">Mars</button><input value="Body map" /></div>';
    translateTree(document.body);
    expect(document.querySelector('h2')!.textContent).toBe('Vücut haritası');
    expect(document.querySelector('button')!.getAttribute('aria-label')).toBe('Görev: Mars');
    expect((document.querySelector('input') as HTMLInputElement).value).toBe('Body map');
  });
});
