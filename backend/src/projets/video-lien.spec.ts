import { estLienVideoValide } from './video-lien';

describe('estLienVideoValide', () => {
  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://vimeo.com/123456789',
    'https://player.vimeo.com/video/123456789',
  ])('accepte %s', (url) => {
    expect(estLienVideoValide(url)).toBe(true);
  });

  it.each([
    'https://www.dailymotion.com/video/x123',
    'https://example.com/video.mp4',
    'pas-une-url',
    '',
  ])('rejette %s', (url) => {
    expect(estLienVideoValide(url)).toBe(false);
  });
});
