import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as sessionRecorder from '../src/core/session-recorder';

describe('SessionRecorder', () => {
  afterEach(() => {
    sessionRecorder.stop();
    vi.restoreAllMocks();
  });

  it('start() registers event listeners', () => {
    const addDocSpy = vi.spyOn(document, 'addEventListener');
    const addWinSpy = vi.spyOn(window, 'addEventListener');
    sessionRecorder.start();

    expect(addDocSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
    expect(addWinSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
    expect(addWinSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(addWinSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
  });

  it('stop() removes event listeners', () => {
    sessionRecorder.start();

    const removeDocSpy = vi.spyOn(document, 'removeEventListener');
    const removeWinSpy = vi.spyOn(window, 'removeEventListener');
    sessionRecorder.stop();

    expect(removeDocSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
    expect(removeWinSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
    expect(removeWinSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeWinSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
  });

  it('records click events with CSS selector', () => {
    sessionRecorder.start();

    const button = document.createElement('button');
    button.id = 'submit-btn';
    document.body.appendChild(button);

    button.click();

    const events = sessionRecorder.getEvents();
    expect(events.length).toBeGreaterThanOrEqual(1);
    const clickEvent = events.find((e) => e.type === 'click');
    expect(clickEvent).toBeDefined();
    expect(clickEvent!.target).toContain('button#submit-btn');

    document.body.removeChild(button);
  });

  it('records scroll events (debounced)', async () => {
    vi.useFakeTimers();
    sessionRecorder.start();

    window.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(300);

    const events = sessionRecorder.getEvents();
    const scrollEvent = events.find((e) => e.type === 'scroll');
    expect(scrollEvent).toBeDefined();

    vi.useRealTimers();
  });

  it('getEvents() returns events within buffer time window', () => {
    sessionRecorder.start();

    const button = document.createElement('button');
    document.body.appendChild(button);
    button.click();

    const events = sessionRecorder.getEvents();
    expect(events.length).toBeGreaterThanOrEqual(1);
    for (const event of events) {
      expect(event.timestamp).toBeGreaterThan(0);
    }

    document.body.removeChild(button);
  });
});
