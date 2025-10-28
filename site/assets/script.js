/* =================================================== */
/* PARTE 1: Costruzione Dinamica della Pagina          */
/* =================================================== */
document.addEventListener("DOMContentLoaded", function() {
  
  const navContainer = document.getElementById("nav-navigation");
  const mainContainer = document.getElementById("main-content");
  const searchInput = document.getElementById("document-search");

  if (!navContainer || !mainContainer || !searchInput) {
    console.error("Errore critico: Elementi #nav-navigation, #main-content o #document-search mancanti.");
    return; 
  }
  
  const staticContactSection = document.getElementById('contatti');
  if (!staticContactSection) {
      console.error("Errore critico: #contatti anchor mancante.");
      mainContainer.innerHTML = '<p style="color: red; font-weight: bold;">Errore: #contatti mancante.</p>';
      return;
  }

  fetch('./docs_tree.json') 
    .then(response => {
      if (!response.ok) {
        throw new Error(`docs_tree.json non trovato (404). Esegui lo script di build?`);
      }
      return response.json();
    })
    .then(treeData => {
      const folderNames = Object.keys(treeData).sort(); 
      
      if (folderNames.length === 0) {
         const noDocsP = document.createElement('p');
         noDocsP.textContent = 'Nessun documento trovato.';
         mainContainer.insertBefore(noDocsP, staticContactSection);
        return;
      }

      folderNames.forEach((folderName, index) => {
        const cleanName = folderName.replace(/^[0-9]+_/, '').replace(/_/g, ' ');
        const sectionId = cleanName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '') || `section-${index}`;
        const folderContentId = `content-${sectionId}`; // ID per il div collassabile

        // 1. Crea il Link di Navigazione
        const navLi = document.createElement('li');
        navLi.innerHTML = `<a href="#${sectionId}" class="nav-link">${cleanName}</a>`; 
        navContainer.appendChild(navLi); 
        
        // 2. Crea la Sezione <section> che CONTIENE la cartella collassabile
        const section = document.createElement('section');
        section.id = sectionId; // ID per lo scroll-spy
        // Rimuoviamo aria-labelledby perché l'h1 è stato rimosso
        
        // --- MODIFICA CHIAVE ---
        // Invece di H1 + div, creiamo H3 toggle + div content
        section.innerHTML = `
          <h3 class="folder-toggle collapsed" data-target="#${folderContentId}">${folderName.replace(/_/g, ' ')}</h3>
          <div id="${folderContentId}" class="folder-content collapsed dynamic-content-container" role="region">
            ${buildHtmlFromTree(treeData[folderName])}
          </div>
        `;
        
        mainContainer.insertBefore(section, staticContactSection);
      });
      
      addCollapseListeners(); // Ora gestisce anche i toggle H3 delle sezioni
      addScrollSpy(); 
      addSearchFunctionality(searchInput, mainContainer); 
    })
    .catch(error => {
      console.error("Errore caricamento docs_tree.json:", error);
       const errorP = document.createElement('p');
       errorP.style.color = 'red';
       errorP.style.fontWeight = 'bold';
       errorP.textContent = error.message;
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

  // Rimuove l'ul esterno, verrà messo dal chiamante (o è già in un .folder-content)
  let html = ''; 

  for (const node of nodes) {
    if (node.type === 'file') {
      // Usa <li><p> per i file
      html += `
        <li class="document-item-li">
          <p class="document-item">
            <a href="${node.path}" target="_blank">${node.name}</a>
            <span>
              ${node.version ? `<span class="tag-versione">${node.version}</span>` : ''}
              <a href="${node.path}" download="${node.name}.pdf" class="download-button" aria-label="Scarica ${node.name}">Download</a>
            </span>
          </p>
        </li>
      `;
    } else if (node.type === 'folder') {
      // Usa <li> che contiene h3 e div per le sotto-cartelle
      const folderContentId = `folder-${node.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 7)}`;
      html += `
        <li class="folder-item-li">
          <h3 class="folder-toggle collapsed" data-target="#${folderContentId}">${node.name}</h3> 
          <div id="${folderContentId}" class="folder-content collapsed"> 
            <ul> ${buildHtmlFromTree(node.children)} 
            </ul>
          </div>
        </li>
      `;
    }
  }

  // Ritorna il contenuto senza <ul> wrapper esterno
  return `<ul>${html}</ul>`;
}

/* =================================================== */
/* PARTE 3: Funzione per cartelle collassabili         */
/* =================================================== */
function addCollapseListeners() {
  // Seleziona TUTTI gli elementi con classe 'folder-toggle'
  const toggles = document.querySelectorAll('.folder-toggle');
  
  toggles.forEach(toggle => {
    // Il contenuto da collassare è identificato dall'attributo data-target
    const targetId = toggle.getAttribute('data-target'); 
    const content = targetId ? document.querySelector(targetId) : null; 

    // Assicurati che il contenuto esista
    if (!content) {
        console.warn("Elemento 'folder-content' non trovato per il toggle:", toggle);
        // Inizia comunque chiuso visivamente se il contenuto non c'è
        toggle.classList.add('collapsed'); 
        return; // Salta questo toggle se non trova il contenuto
    }
    
    // Inizia chiuso di default (aggiungi classi)
    toggle.classList.add('collapsed');
    content.classList.add('collapsed');

    toggle.addEventListener('click', () => {
        // Usa requestAnimationFrame per animazione più fluida
        requestAnimationFrame(() => {
            toggle.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
        });
    });
  });
}


/* =================================================== */
/* PARTE 4: Funzione per "Scroll-Spy"                  */
/* =================================================== */
function addScrollSpy() {
  const sections = document.querySelectorAll('main section[id]:not(#contatti)'); 
  const navLinks = document.querySelectorAll('#nav-navigation a.nav-link'); 
  const headerHeight = document.querySelector('header')?.offsetHeight || 80;

  if (sections.length === 0 || navLinks.length === 0) return; 

  const onScroll = () => {
    let current = '';

    sections.forEach(section => {
      // Considera solo sezioni visibili
      if (section.offsetParent !== null) { 
        const sectionTop = section.offsetTop;
        if (window.scrollY >= sectionTop - headerHeight - 20) { 
          current = section.getAttribute('id');
        }
      }
    });

     const lastVisibleSection = Array.from(sections).reverse().find(s => s.offsetParent !== null);
     if (lastVisibleSection && window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) { 
        current = lastVisibleSection.getAttribute('id');
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

/* =================================================== */
/* PARTE 5: Funzione di Ricerca Documenti              */
/* =================================================== */
function addSearchFunctionality(searchInput, mainContainer) {
  
  // Funzione per mostrare/nascondere elementi e i loro parenti collassabili
  function filterElements(searchTerm) {
    const allListItems = mainContainer.querySelectorAll('.dynamic-content-container li'); // Tutti gli <li> (file e cartelle)
    const allToggles = mainContainer.querySelectorAll('.folder-toggle');
    const allSections = mainContainer.querySelectorAll('main section[id]:not(#contatti)');

    // 1. Reset: mostra tutto inizialmente
    allListItems.forEach(li => li.style.display = 'list-item');
    allToggles.forEach(toggle => toggle.style.display = 'block'); // Mostra i titoli delle cartelle
    allSections.forEach(section => section.style.display = 'block'); // Mostra le sezioni

    if (searchTerm === '') {
      // Se la ricerca è vuota, assicurati che le cartelle siano collassate (stato iniziale)
      allToggles.forEach(toggle => {
          const contentId = toggle.getAttribute('data-target');
          const content = contentId ? document.querySelector(contentId) : null;
          if(content && !toggle.classList.contains('collapsed')) {
              // Non forzare il collasso qui, lascia lo stato come è
              // Potrebbe essere stato aperto dall'utente
          }
      });
      addScrollSpy(); // Aggiorna scroll-spy
      return; // Esci se la ricerca è vuota
    }

    const matchedFileItems = []; // Tiene traccia degli <li> dei file trovati

    // 2. Nascondi tutti i file che non matchano
    mainContainer.querySelectorAll('.document-item-li').forEach(li => {
      const link = li.querySelector('a');
      const documentName = link?.textContent.toLowerCase();
      if (documentName && documentName.includes(searchTerm)) {
        li.style.display = 'list-item'; // Mostra questo file
        matchedFileItems.push(li); // Aggiungi alla lista dei match
      } else {
        li.style.display = 'none'; // Nasconde questo file
      }
    });

    // 3. Gestisci visibilità cartelle e sezioni in base ai file visibili
    allSections.forEach(section => {
      const sectionToggle = section.querySelector('.folder-toggle'); // Il toggle H3 della sezione
      const sectionContent = section.querySelector('.folder-content'); // Il div content della sezione
      let sectionHasVisibleContent = false;

      // Controlla se ci sono file visibili direttamente o in sottocartelle
      section.querySelectorAll('.document-item-li').forEach(li => {
        if(li.style.display !== 'none') {
            sectionHasVisibleContent = true;
        }
      });
      
      // Itera sulle sotto-cartelle per vedere se contengono match
      section.querySelectorAll('.folder-item-li').forEach(folderLi => {
          const folderToggle = folderLi.querySelector('.folder-toggle');
          const folderContent = folderLi.querySelector('.folder-content');
          let folderHasVisibleContent = false;
          
          folderContent.querySelectorAll('.document-item-li').forEach(fileLi => {
              if (fileLi.style.display !== 'none') {
                  folderHasVisibleContent = true;
              }
          });
          
          if(folderHasVisibleContent) {
              folderToggle.style.display = 'block'; // Mostra il toggle della cartella
              folderContent.style.display = 'block'; // Mostra il contenuto
              // ESPANDI automaticamente la cartella che contiene risultati
              folderToggle.classList.remove('collapsed');
              folderContent.classList.remove('collapsed');
              sectionHasVisibleContent = true; // Segna che la sezione ha contenuto
          } else {
               folderToggle.style.display = 'none'; // Nasconde il toggle
               folderContent.style.display = 'none'; // Nasconde il contenuto
          }
      });


      // Mostra/Nascondi la sezione principale
      if (sectionHasVisibleContent) {
        section.style.display = 'block';
        if (sectionToggle) {
             sectionToggle.classList.remove('collapsed'); // Espandi la sezione principale
             sectionToggle.style.display = 'block';
        }
        if(sectionContent) sectionContent.classList.remove('collapsed');

      } else {
        section.style.display = 'none';
      }
    });
    
    addScrollSpy(); // Aggiorna scroll-spy
  }

  // Ascolta l'evento 'input' sulla barra di ricerca
  searchInput.addEventListener('input', () => {
    filterElements(searchInput.value.toLowerCase().trim());
  });
}