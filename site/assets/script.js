/* =================================================== */
/* PARTE 1: Costruzione Dinamica delle Schede          */
/* =================================================== */
document.addEventListener("DOMContentLoaded", function() {
  
  const tabButtonsContainer = document.getElementById("tab-buttons");
  const tabContentContainer = document.getElementById("tab-content");
  
  // Dati statici per le sezioni "Contatti"
  const staticTabs = {
    "Contatti": `
      <section id="contatti" aria-labelledby="h1-contatti">
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
      if (!response.ok) throw new Error(`Errore di rete: ${response.statusText}`);
      return response.json();
    })
    .then(treeData => {
      const allTabs = { ...treeData, ...staticTabs };
      const tabNames = Object.keys(allTabs);
      
      if (tabNames.length === 0) {
        tabContentContainer.innerHTML = "<p>Nessun documento trovato.</p>";
        return;
      }

      tabNames.forEach((tabName, index) => {
        // Pulisce il nome per usarlo come ID
        const cleanName = tabName.replace(/^[0-9]+_/, '').replace(/_/g, ' ');
        const id = tabName.toLowerCase().replace(/[^a-z0-9]/g, '-'); // ID sicuro

        // --- 1. Crea il Pulsante della Scheda ---
        const button = document.createElement('button');
        button.className = 'tab-button';
        button.textContent = cleanName;
        button.setAttribute('data-tab-target', `#${id}`);
        tabButtonsContainer.appendChild(button);

        // --- 2. Crea il Pannello di Contenuto della Scheda ---
        const pane = document.createElement('div');
        pane.className = 'tab-pane';
        pane.id = id;
        
        // Se è una scheda statica (Contatti) o dinamica (file)
        if (staticTabs[tabName]) {
          pane.innerHTML = staticTabs[tabName];
        } else {
          pane.innerHTML = buildHtmlFromTree(allTabs[tabName]);
        }
        tabContentContainer.appendChild(pane);

        // Attiva la prima scheda di default
        if (index === 0) {
          button.classList.add('active');
          pane.classList.add('active');
        }
      });
      
      // Attiva i listener per le cartelle collassabili
      addCollapseListeners();
      
      // Attiva i listener per i pulsanti delle schede
      addTabListeners();
    })
    .catch(error => {
      console.error("Impossibile caricare la struttura dei documenti:", error);
      tabContentContainer.innerHTML = "<p>Errore nel caricamento dei documenti.</p>";
    });
});

/* =================================================== */
/* PARTE 2: NUOVA Funzione per gestire le Schede       */
/* =================================================== */
function addTabListeners() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetPaneId = button.getAttribute('data-tab-target');
      
      // 1. Disattiva tutti i pulsanti e pannelli
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      // 2. Attiva il pulsante cliccato
      button.classList.add('active');
      
      // 3. Attiva il pannello corrispondente
      document.querySelector(targetPaneId).classList.add('active');
    });
  });
}


/* =================================================== */
/* PARTE 3: Funzione Helper Ricorsiva (INVARIATA)      */
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
/* PARTE 4: Funzione per cartelle collassabili (INVARIATA) */
/* =================================================== */
function addCollapseListeners() {
  const toggles = document.querySelectorAll('.folder-toggle');
  
  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const content = toggle.nextElementSibling;
      toggle.classList.toggle('collapsed');
      content.classList.toggle('collapsed');
    });
    
    // Inizia con le cartelle chiuse
    toggle.classList.add('collapsed');
    if (toggle.nextElementSibling) {
      toggle.nextElementSibling.classList.add('collapsed');
    }
  });
}