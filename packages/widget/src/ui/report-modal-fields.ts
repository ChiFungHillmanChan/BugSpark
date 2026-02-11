export function createField(
  labelText: string,
  inputType: 'input' | 'textarea' | 'select',
  name: string,
  options?: Array<{ value: string; label: string }>,
): HTMLDivElement {
  const field = document.createElement('div');
  field.className = 'bugspark-field';

  const label = document.createElement('label');
  label.textContent = labelText;
  label.setAttribute('for', `bugspark-${name}`);
  field.appendChild(label);

  if (inputType === 'select' && options) {
    const select = document.createElement('select');
    select.id = `bugspark-${name}`;
    select.setAttribute('data-name', name);
    for (const opt of options) {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      select.appendChild(option);
    }
    field.appendChild(select);
  } else if (inputType === 'textarea') {
    const textarea = document.createElement('textarea');
    textarea.id = `bugspark-${name}`;
    textarea.setAttribute('data-name', name);
    textarea.placeholder = 'Describe the issue in detail...';
    textarea.rows = 4;
    field.appendChild(textarea);
  } else {
    const input = document.createElement('input');
    input.id = `bugspark-${name}`;
    input.type = 'text';
    input.setAttribute('data-name', name);
    if (name === 'email') {
      input.type = 'email';
      input.placeholder = 'your@email.com (optional)';
    } else {
      input.placeholder = 'Brief summary of the issue';
    }
    field.appendChild(input);
  }

  return field;
}

export function createCameraButton(onCapture: () => void): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'bugspark-screenshot-capture';
  container.addEventListener('click', onCapture);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path1.setAttribute('d', 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z');
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '13');
  circle.setAttribute('r', '4');
  svg.appendChild(path1);
  svg.appendChild(circle);
  container.appendChild(svg);

  const label = document.createElement('span');
  label.textContent = 'Capture Screen';
  container.appendChild(label);

  return container;
}
