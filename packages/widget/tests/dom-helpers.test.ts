import { describe, it, expect } from 'vitest';
import { createElement, getCssSelector } from '../src/utils/dom-helpers';

describe('createElement', () => {
  it('creates element with the specified tag', () => {
    const el = createElement('div');
    expect(el.tagName).toBe('DIV');
  });

  it('applies attributes', () => {
    const el = createElement('input', { type: 'text', placeholder: 'Name' });
    expect(el.getAttribute('type')).toBe('text');
    expect(el.getAttribute('placeholder')).toBe('Name');
  });

  it('appends string children as text nodes', () => {
    const el = createElement('p', {}, ['Hello ', 'World']);
    expect(el.textContent).toBe('Hello World');
    expect(el.childNodes).toHaveLength(2);
  });

  it('appends HTMLElement children', () => {
    const child = document.createElement('span');
    child.textContent = 'inner';
    const el = createElement('div', {}, [child]);
    expect(el.querySelector('span')).toBe(child);
  });

  it('handles mixed string and element children', () => {
    const span = document.createElement('span');
    const el = createElement('div', {}, ['text', span]);
    expect(el.childNodes).toHaveLength(2);
  });
});

describe('getCssSelector', () => {
  it('generates selector with id shortcut', () => {
    const el = document.createElement('div');
    el.id = 'main';
    document.body.appendChild(el);

    const selector = getCssSelector(el);
    expect(selector).toContain('div#main');

    document.body.removeChild(el);
  });

  it('generates selector with class names', () => {
    const container = document.createElement('div');
    const el = document.createElement('span');
    el.className = 'badge primary';
    container.appendChild(el);
    document.body.appendChild(container);

    const selector = getCssSelector(el);
    expect(selector).toContain('span.badge.primary');

    document.body.removeChild(container);
  });

  it('generates nth-of-type for sibling disambiguation', () => {
    const parent = document.createElement('div');
    parent.id = 'parent';
    const child1 = document.createElement('p');
    const child2 = document.createElement('p');
    parent.appendChild(child1);
    parent.appendChild(child2);
    document.body.appendChild(parent);

    const selector = getCssSelector(child2);
    expect(selector).toContain(':nth-of-type(2)');

    document.body.removeChild(parent);
  });
});
