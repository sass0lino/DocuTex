/* =================================================== */
/* PARTE 1: Costruzione Dinamica della Pagina          */
/* =================================================== */
document.addEventListener("DOMContentLoaded", function() {
  
  const navContainer = document.getElementById("nav-navigation");
  const mainContainer = document.getElementById("main-content");

  // Controllo robustezza
  if (!navContainer || !mainContainer) {
    console.error("Errore critico: Impossibile trovare #nav-navigation o #main-content.");
    return; 
  }
  
  // Trova la sezione statica "Contatti" (anche se vuota) per inserire le altre prima
  const staticContactSection = document.getElementById('contatti');

  // --- NUOVO CONTROLLO ---
  // Se anche l'anchor #contatti non esiste, ferma tutto
  if (!staticContactSection) {
      console.error("Errore critico: Sezione #contatti (anchor) non trovata in index.html. Impossibile inserire contenuto dinamico.");
      mainContainer.innerHTML = '<p style="color: red; font-weight: bold;">Errore di configurazione: Manca l\'elemento #contatti in index.html.</p>';
      return;
  }

  fetch('./docs_tree.json') // Cerca il file JSON nella root
    .then(response => {
      if (!response.ok) {
        throw new Error(`File 'docs_tree.json' non trovato (404). Hai eseguito lo script di build e committato il file?`);
      }
      return response.json();
    })
    .then(treeData => {
      const folderNames = Object.keys(treeData).sort(); // Ordina le sezioni
      
      if (folderNames.length === 0) {
        // Se non ci sono documenti, mostra un messaggio PRIMA della sezione contatti
         const noDocsP = document.createElement('p');
         noDocsP.textContent = 'Nessun documento trovato nella cartella docs/.';
         mainContainer.insertBefore(noDocsP, staticContactSection);
        return;
      }

      folderNames.forEach((folderName, index) => {
        const cleanName = folderName.replace(/^[0-9]+_/, '').replace(/_/g, ' ');
        const id = cleanName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '') || `section-${index}`;

        // 1. Crea il Link di Navigazione
        const navLi = document.createElement('li');
        navLi.innerHTML = `<a href="#${id}" class="nav-link">${cleanName}</a>`; 
        navContainer.appendChild(navLi); // Appende semplicemente alla fine della lista nav
        
        // 2. Crea la Sezione <section>
        const section = document.createElement('section');
        section.id = id;
        section.setAttribute('aria-labelledby', `h1-${id}`);
        
        section.innerHTML = `
          <h1 id="h1-${id}">${folderName.replace(/_/g, ' ')}</h1>
          <div class="dynamic-content-container" role="region" aria-live="polite">
            ${buildHtmlFromTree(treeData[folderName])}
          </div>
        `;
        
        // Inserisce la nuova sezione prima della sezione "Contatti"
        mainContainer.insertBefore(section, staticContactSection);
      });
      
      // Attiva le funzionalità JS
      addCollapseListeners();
      addScrollSpy(); 
    })
    .catch(error => {
      console.error("Impossibile caricare/processare docs_tree.json:", error);
       const errorP = document.createElement('p');
       errorP.style.color = 'red';
       errorP.style.fontWeight = 'bold';
       errorP.textContent = error.message;
       // Inserisce l'errore prima della sezione contatti
       mainContainer.insertBefore(errorP, staticContactSection);
    });
});

/* =================================================== */
/* PARTE 2: Funzione Helper Ricorsiva (per <ul>/<li>)   */
/* =================================================== */
function buildHtmlFromTree(nodes) {
  if (!nodes || nodes.length === 0) return "<p>Nessun documento in questa sezione.</p>";

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
      // Inizia cartelle chiuse di default
      html += `
        <li>
          <h3 class="folder-toggle collapsed">${node.name}</h3> 
          <div class="folder-content collapsed"> 
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
/* PARTE 3: Funzione per cartelle collassabili         */
/* =================================================== */
function addCollapseListeners() {
  const toggles = document.querySelectorAll('.folder-toggle');
  
  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const content = toggle.nextElementSibling;
      if (content && content.classList.contains('folder-content')) {
        requestAnimationFrame(() => {
            toggle.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
        });
      } else {
        console.warn("Elemento 'folder-content' non trovato:", toggle);
      }
    });
  });
}

/* =================================================== */
/* PARTE 4: Funzione per "Scroll-Spy"                  */
/* =================================================== */
function addScrollSpy() {
  const sections = document.querySelectorAll('main section[id]:not(#contatti)'); // Esclude la sezione contatti vuota
  const navLinks = document.querySelectorAll('#nav-navigation a.nav-link'); 
  const headerHeight = document.querySelector('header')?.offsetHeight || 80;

  if (sections.length === 0 || navLinks.length === 0) return; 

  const onScroll = () => {
    let current = '';

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (window.scrollY >= sectionTop - headerHeight - 20) { 
        current = section.getAttribute('id');
      }
    });

     const lastSection = sections[sections.length - 1];
     // Aggiunto controllo per evitare errori se non ci sono sezioni
     if (lastSection && window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) { 
        current = lastSection.getAttribute('id');
     }

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href').substring(1) === current) {
        link.classList.add('active');
      }
    });
  };

  onScroll(); 
  window.addEventListener('scroll', onScroll, { passive: true }); 
}