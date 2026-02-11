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

  it('snapshot() freezes events at the current point in time', () => {
    sessionRecorder.start();

    const button = document.createElement('button');
    document.body.appendChild(button);
    button.click();

    sessionRecorder.snapshot();

    const snapshotEvents = sessionRecorder.getEvents();
    expect(snapshotEvents.length).toBeGreaterThanOrEqual(1);
    expect(snapshotEvents.find((e) => e.type === 'click')).toBeDefined();

    document.body.removeChild(button);
  });

  it('new events after snapshot() do not appear in getEvents()', () => {
    sessionRecorder.start();

    const button = document.createElement('button');
    document.body.appendChild(button);
    button.click();

    sessionRecorder.snapshot();
    const countAfterSnapshot = sessionRecorder.getEvents().length;

    const button2 = document.createElement('button');
    button2.id = 'second-btn';
    document.body.appendChild(button2);
    button2.click();

    const eventsAfterNewClick = sessionRecorder.getEvents();
    expect(eventsAfterNewClick.length).toBe(countAfterSnapshot);

    document.body.removeChild(button);
    document.body.removeChild(button2);
  });

  it('clearSnapshot() returns getEvents() to live buffer', () => {
    sessionRecorder.start();

    const button = document.createElement('button');
    document.body.appendChild(button);
    button.click();

    sessionRecorder.snapshot();
    const snapshotCount = sessionRecorder.getEvents().length;

    const button2 = document.createElement('button');
    button2.id = 'live-btn';
    document.body.appendChild(button2);
    button2.click();

    sessionRecorder.clearSnapshot();

    const liveEvents = sessionRecorder.getEvents();
    expect(liveEvents.length).toBeGreaterThan(snapshotCount);

    document.body.removeChild(button);
    document.body.removeChild(button2);
  });

  it('stop() clears snapshot so getEvents() returns live buffer', () => {
    sessionRecorder.start();

    const button = document.createElement('button');
    document.body.appendChild(button);
    button.click();

    sessionRecorder.snapshot();
    const snapshotCount = sessionRecorder.getEvents().length;
    expect(snapshotCount).toBeGreaterThanOrEqual(1);

    sessionRecorder.stop();

    // After stop, snapshot is cleared. Start again and add a new event.
    sessionRecorder.start();

    const button2 = document.createElement('button');
    button2.id = 'after-stop-btn';
    document.body.appendChild(button2);
    button2.click();

    // getEvents() should return live buffer (not a frozen snapshot)
    const events = sessionRecorder.getEvents();
    const hasNewClick = events.some((e) => e.target?.includes('after-stop-btn'));
    expect(hasNewClick).toBe(true);

    document.body.removeChild(button);
    document.body.removeChild(button2);
  });
});
