document.addEventListener("DOMContentLoaded", function() {
  const tabButtonsContainer = document.getElementById("tab-buttons");
  const tabContentContainer = document.getElementById("tab-content");

  if (!tabButtonsContainer || !tabContentContainer) {
    console.error("Errore critico: Impossibile trovare #tab-buttons o #tab-content.");
    return;
  }

  fetch('./docs_tree.json')
    .then(res => {
      if (!res.ok) throw new Error("Impossibile trovare docs_tree.json");
      return res.json();
    })
    .then(data => createTabs(data))
    .catch(err => {
      console.error("Errore nel caricamento struttura documenti:", err);
      tabContentContainer.innerHTML = `<p class="error-msg">${err.message}</p>`;
    });
});

function createTabs(treeData) {
  const tabButtonsContainer = document.getElementById("tab-buttons");
  const tabContentContainer = document.getElementById("tab-content");

  tabButtonsContainer.innerHTML = '';
  tabContentContainer.innerHTML = '';

  const tabNames = Object.keys(treeData).sort();

  if (tabNames.length === 0) {
    tabContentContainer.innerHTML = "<p>Nessun documento disponibile.</p>";
    return;
  }

  tabNames.forEach((tabName, i) => {
    const cleanName = tabName.replace(/^[0-9]+_/, '').replace(/_/g, ' ');
    const id = `tab-${tabName.toLowerCase().replace(/[^a-z0-9]/g, '-') || i}`;

    const button = document.createElement('button');
    button.className = 'tab-button';
    button.textContent = cleanName;
    button.dataset.tabTarget = `#${id}`;
    tabButtonsContainer.appendChild(button);

    const pane = document.createElement('div');
    pane.className = 'tab-pane';
    pane.id = id;
    pane.innerHTML = buildHtmlFromTree(treeData[tabName]);
    tabContentContainer.appendChild(pane);

    if (i === 0) {
      button.classList.add('active');
      pane.classList.add('active');
    }
  });

  addTabListeners();
  addCollapseListeners();
}

function addTabListeners() {
  const buttons = document.querySelectorAll('.tab-button');
  const panes = document.querySelectorAll('.tab-pane');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.querySelector(btn.dataset.tabTarget).classList.add('active');
    });
  });
}

function buildHtmlFromTree(nodes) {
  if (!nodes || !nodes.length) return "";

  nodes.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1));

  let html = '<ul class="file-tree">';
  for (const node of nodes) {
    if (node.type === 'file') {
      html += `
        <li class="file-item">
          <a href="${node.path}" target="_blank" class="file-link">${node.name}</a>
          <button class="download-btn" title="Scarica PDF" onclick="window.open('${node.path}')">↓</button>
          ${node.version ? `<span class="tag-version">${node.version}</span>` : ''}
        </li>
      `;
    } else if (node.type === 'folder') {
      html += `
        <li class="folder">
          <div class="folder-header">
            <span class="folder-toggle collapsed">📂 ${node.name}</span>
          </div>
          <div class="folder-content collapsed">${buildHtmlFromTree(node.children)}</div>
        </li>
      `;
    }
  }
  html += '</ul>';
  return html;
}

function addCollapseListeners() {
  document.querySelectorAll('.folder-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const content = toggle.parentElement.nextElementSibling;
      toggle.classList.toggle('collapsed');
      content.classList.toggle('collapsed');
    });
  });
}
