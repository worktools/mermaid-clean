import './style.css';
import mermaid from 'mermaid';

const initialDiagram = `graph TD
    A[Start] --> B{Is it?};
    B -- Yes --> C[OK];
    C --> D[Rethink];
    D --> A;
    B -- No --> E[End];
`;

const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const errorContainer = document.getElementById('error-container');

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

const renderMermaid = async () => {
  const code = editor.value;
  if (!code) {
    preview.innerHTML = '';
    errorContainer.textContent = '';
    return;
  }

  try {
    // First, validate the syntax
    await mermaid.parse(code);
    
    // If valid, render it
    const { svg } = await mermaid.render('graphDiv', code);
    preview.innerHTML = svg;
    errorContainer.textContent = '';
  } catch (e) {
    errorContainer.textContent = e.str || e.message;
  }
};

editor.value = initialDiagram;
editor.addEventListener('input', renderMermaid);

// Initial render
renderMermaid();
