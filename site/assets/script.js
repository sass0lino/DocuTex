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
  
  // Trova il link statico "Contatti" per inserire gli altri prima
  const staticContactLink = navContainer.querySelector('a[href="#contatti"]')?.parentElement;
  // Trova la sezione statica "Contatti" per inserire le altre prima
  const staticContactSection = document.getElementById('contatti');


  fetch('./docs_tree.json') // Cerca il file JSON nella root
    .then(response => {
      if (!response.ok) {
        throw new Error(`File 'docs_tree.json' non trovato (404). Hai eseguito lo script di build e committato il file?`);
      }
      return response.json();
    })
    .then(treeData => {
      const folderNames = Object.keys(treeData).sort(); // Ordina le sezioni
      
      if (folderNames.length === 0 && staticContactSection) {
        // Se non ci sono documenti, non fare nulla (mostra solo Contatti)
        return;
      }
      
      if (!staticContactSection) {
          console.error("Errore: Sezione #contatti non trovata in index.html");
          mainContainer.innerHTML = '<p style="color: red;">Errore di configurazione: sezione Contatti mancante.</p>';
          return;
      }

      folderNames.forEach((folderName, index) => {
        const cleanName = folderName.replace(/^[0-9]+_/, '').replace(/_/g, ' ');
        // Crea un ID valido per HTML (solo lettere, numeri, trattini, _)
        const id = cleanName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '') || `section-${index}`;

        // 1. Crea il Link di Navigazione
        const navLi = document.createElement('li');
        // Aggiunge la classe nav-link per lo scroll-spy
        navLi.innerHTML = `<a href="#${id}" class="nav-link">${cleanName}</a>`; 
        // Inserisce prima del link "Contatti", se esiste
        if (staticContactLink) {
          navContainer.insertBefore(navLi, staticContactLink);
        } else {
          navContainer.appendChild(navLi); // Fallback
        }
        
        // 2. Crea la Sezione <section>
        const section = document.createElement('section');
        section.id = id;
        section.setAttribute('aria-labelledby', `h1-${id}`);
        // La classe firstSection non serve più con header sticky
        
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
      addScrollSpy(); // Riattivato scroll-spy
    })
    .catch(error => {
      console.error("Impossibile caricare/processare docs_tree.json:", error);
      // Se fallisce, mostra un errore PRIMA della sezione contatti
       if (staticContactSection) {
           const errorP = document.createElement('p');
           errorP.style.color = 'red';
           errorP.style.fontWeight = 'bold';
           errorP.textContent = error.message;
           mainContainer.insertBefore(errorP, staticContactSection);
       } else {
           mainContainer.innerHTML = `<p style="color: red; font-weight: bold;">${error.message}</p>`;
       }
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
        // Usa requestAnimationFrame per animazione più fluida
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
  // Seleziona tutte le sezioni DENTRO main E i link generati dinamicamente
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('#nav-navigation a.nav-link'); // Usa la classe specifica
  const headerHeight = document.querySelector('header')?.offsetHeight || 80; // Altezza header

  if (sections.length === 0 || navLinks.length === 0) return; // Non fare nulla se non ci sono sezioni/link

  const onScroll = () => {
    let current = '';

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      // Considera l'altezza dell'header + un piccolo offset
      if (window.scrollY >= sectionTop - headerHeight - 20) { 
        current = section.getAttribute('id');
      }
    });

    // Controlla anche l'ultimo elemento per attivarlo se siamo in fondo
     const lastSection = sections[sections.length - 1];
     if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) { // Se siamo quasi in fondo
        current = lastSection.getAttribute('id');
     }


    navLinks.forEach(link => {
      link.classList.remove('active');
      // Controlla se l'href del link (senza #) matcha l'ID corrente
      if (link.getAttribute('href').substring(1) === current) {
        link.classList.add('active');
      }
    });
  };

  // Esegui subito per impostare lo stato iniziale
  onScroll(); 
  // Poi aggiungi l'ascoltatore per lo scroll
  window.addEventListener('scroll', onScroll, { passive: true }); // passive: true per performance
}