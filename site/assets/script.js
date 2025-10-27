/* =================================================== */
/* PARTE 1: Costruzione Dinamica delle Schede          */
/* =================================================== */
document.addEventListener("DOMContentLoaded", function() {
  
  const tabButtonsContainer = document.getElementById("tab-buttons");
  const tabContentContainer = document.getElementById("tab-content");

  // Controllo di robustezza
  if (!tabButtonsContainer || !tabContentContainer) {
    console.error("Errore critico: Impossibile trovare #tab-buttons o #tab-content. Controlla index.html.");
    return;
  }

  // --- ECCO I TUOI CONTENUTI STATICI ---
  // Ho spostato il tuo HTML "Contatti" qui, nel JavaScript.
  const staticTabs = {
    "Contatti": `
      <section id="contatti" aria-labelledby="h1-contatti">
        <h1 id="h1-contatti">Contatti e Membri</h1>
        <p>Pagina del progetto: 
          <a id="link-github" href="https://github.com/sass0lino/DocuTex" target="_blank">https://github.com/sass0lino/DocuTex</a>
        </p>
        <p>Email: <a href="mailto:swe.nightpro@gmail.com" target="_blank">swe.nightpro@gmail.com</a></p>
        <p>Membri del gruppo:</p>
        <ul>
          <li><a href="https://github.com/frazane04" target="_blank">Franceso Zanella</a></li>
          <li><a href="https://github.com/towsatt" target="_blank">Leonardo Bilato</a></li>
        </ul>
      </section>
    `
  };

  fetch('./docs_tree.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`File 'docs_tree.json' non trovato (404).`);
      }
      return response.json();
    })
    .then(treeData => {
      // Unisce le cartelle dinamiche (treeData) con le schede statiche
      const allTabs = { ...treeData, ...staticTabs };
      // Crea le schede (prima quelle dinamiche, poi quelle statiche)
      createTabs(allTabs);
    })
    .catch(error => {
      // --- QUESTO RISOLVE IL "TUTTO NASCOSTO" ---
      // Se il JSON fallisce (es. 404), mostra *solo* le schede statiche
      console.warn(`${error.message} Mostro solo le schede statiche.`);
      createTabs(staticTabs); // Mostra "Contatti" come fallback
    });
});

/**
 * Funzione helper per creare tutti i pulsanti e i pannelli
 */
function createTabs(allTabs) {
  const tabButtonsContainer = document.getElementById("tab-buttons");
  const tabContentContainer = document.getElementById("tab-content");
  
  // Pulisce i contenitori nel caso ci fossero errori
  tabButtonsContainer.innerHTML = '';
  tabContentContainer.innerHTML = '';

  const tabNames = Object.keys(allTabs);

  if (tabNames.length === 0) {
    tabContentContainer.innerHTML = "<p>Nessun documento o sezione da mostrare.</p>";
    return;
  }

  tabNames.forEach((tabName, index) => {
    // Pulisce il nome per usarlo come ID
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
    
    // Controlla se è una scheda statica o dinamica
    if (tabName === "Contatti") { // O un altro nome statico
      pane.innerHTML = allTabs[tabName]; // Inserisce l'HTML statico
    } else {
      pane.innerHTML = buildHtmlFromTree(allTabs[tabName]); // Costruisce l'albero
    }
    tabContentContainer.appendChild(pane);

    // Attiva la prima scheda di default
    if (index === 0) {
      button.classList.add('active');
      pane.classList.add('active');
    }
  });
  
  // Attiva tutti i listener necessari
  addCollapseListeners();
  addTabListeners();
}

/* =================================================== */
/* PARTE 3: Funzione per gestire le Schede (corretta)  */
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
/* PARTE 4: Funzione Helper Ricorsiva (per <ul>/<li>)   */
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
/* PARTE 5: Funzione per cartelle collassabili         */
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
    
    toggle.classList.add('collapsed');
    if (toggle.nextElementSibling) {
      toggle.nextElementSibling.classList.add('collapsed');
    }
  });
}