/* =================================================== */
/* PARTE 1: Costruzione Dinamica delle Schede          */
/* =================================================== */
document.addEventListener("DOMContentLoaded", function() {
  
  const tabButtonsContainer = document.getElementById("tab-buttons");
  const tabContentContainer = document.getElementById("tab-content");

  if (!tabButtonsContainer || !tabContentContainer) {
    console.error("Errore critico: Impossibile trovare #tab-buttons o #tab-content.");
    return; 
  }

  fetch('./docs_tree.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`File 'docs_tree.json' non trovato (404). Hai eseguito lo script di build?`);
      }
      return response.json();
    })
    .then(treeData => {
      // Crea le schede usando solo i dati dal JSON
      createTabs(treeData); 
    })
    .catch(error => {
      console.error("Impossibile caricare la struttura dei documenti:", error);
      tabContentContainer.innerHTML = `<p style="color: red; font-weight: bold;">${error.message}</p>`; 
    });
});

/**
 * Funzione helper per creare tutti i pulsanti e i pannelli
 */
function createTabs(treeData) {
  const tabButtonsContainer = document.getElementById("tab-buttons");
  const tabContentContainer = document.getElementById("tab-content");
  
  tabButtonsContainer.innerHTML = '';
  tabContentContainer.innerHTML = '';

  const tabNames = Object.keys(treeData);

  if (tabNames.length === 0) {
    tabContentContainer.innerHTML = "<p>Nessun documento trovato.</p>";
    return;
  }

  tabNames.sort(); // Ordina i nomi delle schede

  tabNames.forEach((tabName, index) => {
    const cleanName = tabName.replace(/^[0-9]+_/, '').replace(/_/g, ' ');
    const id = `tab-${tabName.toLowerCase().replace(/[^a-z0-9]/g, '-') || index}`;

    // 1. Crea il Pulsante della Scheda
    const button = document.createElement('button');
    button.className = 'tab-button';
    button.textContent = cleanName;
    button.setAttribute('data-tab-target', `#${id}`);
    tabButtonsContainer.appendChild(button);

    // 2. Crea il Pannello di Contenuto della Scheda
    const pane = document.createElement('div');
    pane.className = 'tab-pane';
    pane.id = id;
    
    // Costruisce sempre l'albero di file
    pane.innerHTML = buildHtmlFromTree(treeData[tabName]); 
    tabContentContainer.appendChild(pane);

    // Attiva la prima scheda di default
    if (index === 0) {
      button.classList.add('active');
      pane.classList.add('active');
    }
  });
  
  addCollapseListeners();
  addTabListeners();
}

/* =================================================== */
/* PARTE 2: Funzione per gestire le Schede              */
/* =================================================== */
function addTabListeners() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetPaneId = button.getAttribute('data-tab-target');
      const targetPane = document.querySelector(targetPaneId);

      if (targetPane) {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        button.classList.add('active');
        targetPane.classList.add('active');
      } else {
        console.warn(`Pannello non trovato: ${targetPaneId}`);
      }
    });
  });
}

/* =================================================== */
/* PARTE 3: Funzione Helper Ricorsiva (per <ul>/<li>)   */
/* =================================================== */
function buildHtmlFromTree(nodes) {
  if (!nodes || nodes.length === 0) return "";

  nodes.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'folder' ? -1 : 1; 
  });

  let html = '<ul class="dynamic-content-container">';

  for (const node of nodes) {
    if (node.type === 'file') {
      html += `
        <li>
          <p>
            <a href="${node.path}" target="_blank">${node.name}</a>
            <span>
              ${node.version ? `<span class="tag-versione">${node.version}</span>` : ''}
            </span>
          </p>
        </li>
      `;
    } else if (node.type === 'folder') {
      html += `
        <li>
          <h3 class="folder-toggle">${node.name}</h3>
          <div class="folder-content">
            ${buildHtmlFromTree(node.children)} 
          </div>
        </li>
      `;
    }
  }

  html += '</ul>';
  return html;
}

/* =================================================== */
/* PARTE 4: Funzione per cartelle collassabili         */
/* =================================================== */
function addCollapseListeners() {
  const toggles = document.querySelectorAll('.folder-toggle');
  
  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const content = toggle.nextElementSibling;
      if (content) {
        toggle.classList.toggle('collapsed');
        content.classList.toggle('collapsed');
      }
    });
    
    // Inizia con le cartelle chiuse
    toggle.classList.add('collapsed');
    if (toggle.nextElementSibling) {
      toggle.nextElementSibling.classList.add('collapsed');
    }
  });
}