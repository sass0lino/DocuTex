/* =================================================== */
/* PARTE 1: Costruzione Dinamica della Pagina          */
/* =================================================== */
document.addEventListener("DOMContentLoaded", function() {
  
  const navContainer = document.getElementById("nav-navigation");
  const mainContainer = document.getElementById("main-content");
  const searchInput = document.getElementById("document-search"); // Assicurati che l'HTML abbia questo input

  // Controllo robustezza
  if (!navContainer || !mainContainer) { // Rimosso controllo searchInput qui, lo gestiamo dopo
    console.error("Errore critico: Impossibile trovare #nav-navigation o #main-content.");
    return; 
  }
  
  // Rimosso: const staticContactSection = document.getElementById('contatti');
  // Rimosso: if (!staticContactSection) { ... }

  fetch('./docs_tree.json') 
    .then(response => {
      if (!response.ok) {
        throw new Error(`File 'docs_tree.json' non trovato (404). Hai eseguito lo script di build e committato il file?`);
      }
      return response.json();
    })
    .then(treeData => {
      const folderNames = Object.keys(treeData).sort(); 
      
      if (folderNames.length === 0) {
         // Se non ci sono documenti, mostra un messaggio direttamente in main
         const noDocsP = document.createElement('p');
         noDocsP.textContent = 'Nessun documento trovato nella cartella docs/.';
         noDocsP.style.textAlign = 'center'; // Stile opzionale
         noDocsP.style.padding = '2em 0'; // Stile opzionale
         mainContainer.appendChild(noDocsP); // Appende a main
        return; // Esce dalla funzione
      }

      folderNames.forEach((folderName, index) => {
        const cleanName = folderName.replace(/^[0-9]+_/, '').replace(/_/g, ' ');
        const sectionId = cleanName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '') || `section-${index}`;
        const folderContentId = `content-${sectionId}`;

        // 1. Crea il Link di Navigazione
        const navLi = document.createElement('li');
        navLi.innerHTML = `<a href="#${sectionId}" class="nav-link">${cleanName}</a>`; 
        navContainer.appendChild(navLi); // Appende alla fine
        
        // 2. Crea la Sezione <section>
        const section = document.createElement('section');
        section.id = sectionId;
        
        section.innerHTML = `
          <h3 class="folder-toggle collapsed" data-target="#${folderContentId}">${folderName.replace(/_/g, ' ')}</h3>
          <div id="${folderContentId}" class="folder-content collapsed dynamic-content-container" role="region">
            ${buildHtmlFromTree(treeData[folderName])}
          </div>
        `;
        
        // --- MODIFICA CHIAVE ---
        // Appende la nuova sezione direttamente al mainContainer
        mainContainer.appendChild(section); 
      });
      
      addCollapseListeners(); 
      addScrollSpy(); 
      
      // Aggiunge la funzionalità di ricerca solo se l'input esiste
      if (searchInput) {
          addSearchFunctionality(searchInput, mainContainer); 
      } else {
          console.warn("Elemento #document-search non trovato. Funzionalità di ricerca disabilitata.");
      }
    })
    .catch(error => {
      console.error("Impossibile caricare/processare docs_tree.json:", error);
       // Mostra l'errore direttamente in main
       const errorP = document.createElement('p');
       errorP.style.color = 'red';
       errorP.style.fontWeight = 'bold';
       errorP.textContent = error.message;
       mainContainer.appendChild(errorP); // Appende a main
    });
});

/* =================================================== */
/* PARTE 2: Funzione Helper Ricorsiva (per <ul>/<li>)   */
/* (INVARIATA)                                         */
/* =================================================== */
function buildHtmlFromTree(nodes) {
  if (!nodes || nodes.length === 0) return "<p>Nessun documento in questa sezione.</p>";

  nodes.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'folder' ? -1 : 1; 
  });

  let html = ''; // Inizia vuoto

  for (const node of nodes) {
    if (node.type === 'file') {
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

  // Ritorna il contenuto wrappato in <ul>
  return `<ul>${html}</ul>`; 
}

/* =================================================== */
/* PARTE 3: Funzione per cartelle collassabili         */
/* (INVARIATA)                                         */
/* =================================================== */
function addCollapseListeners() {
  const toggles = document.querySelectorAll('.folder-toggle');
  
  toggles.forEach(toggle => {
    const targetId = toggle.getAttribute('data-target'); 
    const content = targetId ? document.querySelector(targetId) : null; 

    if (!content) {
        console.warn("Elemento 'folder-content' non trovato per il toggle:", toggle);
        toggle.classList.add('collapsed'); 
        return; 
    }
    
    toggle.classList.add('collapsed');
    content.classList.add('collapsed');

    toggle.addEventListener('click', () => {
        requestAnimationFrame(() => {
            toggle.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
        });
    });
  });
}

/* =================================================== */
/* PARTE 4: Funzione per "Scroll-Spy"                  */
/* (INVARIATA)                                         */
/* =================================================== */
function addScrollSpy() {
  // Rimuove :not(#contatti) perché non c'è più
  const sections = document.querySelectorAll('main section[id]'); 
  const navLinks = document.querySelectorAll('#nav-navigation a.nav-link'); 
  const headerHeight = document.querySelector('header')?.offsetHeight || 80;

  if (sections.length === 0 || navLinks.length === 0) return; 

  const onScroll = () => {
    let current = '';

    sections.forEach(section => {
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
/* (INVARIATA)                                         */
/* =================================================== */
function addSearchFunctionality(searchInput, mainContainer) {
  
  function filterElements(searchTerm) {
    const allListItems = mainContainer.querySelectorAll('.dynamic-content-container li'); 
    const allToggles = mainContainer.querySelectorAll('.folder-toggle');
    const allSections = mainContainer.querySelectorAll('main section[id]');

    allListItems.forEach(li => li.style.display = 'list-item');
    allToggles.forEach(toggle => {
        toggle.style.display = 'block';
        // Non forzare lo stato collapsed/expanded durante la ricerca
    });
    allSections.forEach(section => section.style.display = 'block');

    if (searchTerm === '') {
        // Se la ricerca è vuota, NON forzare il collasso, lascia lo stato corrente
        addScrollSpy();
        return; 
    }

    const matchedFileItems = []; 

    mainContainer.querySelectorAll('.document-item-li').forEach(li => {
      const link = li.querySelector('a');
      const documentName = link?.textContent.toLowerCase();
      if (documentName && documentName.includes(searchTerm)) {
        li.style.display = 'list-item'; 
        matchedFileItems.push(li); 
      } else {
        li.style.display = 'none'; 
      }
    });

    // Gestisci visibilità cartelle (sia sezioni che sottocartelle)
    allSections.forEach(section => {
      let sectionHasVisibleContent = false;
      const sectionToggle = section.querySelector(':scope > .folder-toggle'); // Seleziona solo il toggle diretto
      const sectionContent = section.querySelector(':scope > .folder-content'); // Seleziona solo il content diretto
      
      // Controlla file diretti nella sezione (se buildHtmlFromTree li generasse qui)
      section.querySelectorAll(':scope > .folder-content > ul > .document-item-li').forEach(fileLi => {
          if (fileLi.style.display !== 'none') sectionHasVisibleContent = true;
      });

      // Controlla sotto-cartelle
      section.querySelectorAll(':scope > .folder-content > ul > .folder-item-li').forEach(folderLi => {
          const folderToggle = folderLi.querySelector(':scope > .folder-toggle');
          const folderContent = folderLi.querySelector(':scope > .folder-content');
          let folderHasVisibleContent = false;
          
          folderContent.querySelectorAll('.document-item-li').forEach(fileLi => {
              if (fileLi.style.display !== 'none') {
                  folderHasVisibleContent = true;
              }
          });
          
          if (folderHasVisibleContent) {
              folderToggle.style.display = 'block';
              folderContent.style.display = 'block'; // Assicura sia visibile
              // ESPANDI automaticamente
              folderToggle.classList.remove('collapsed');
              folderContent.classList.remove('collapsed');
              sectionHasVisibleContent = true; 
          } else {
               folderToggle.style.display = 'none'; 
               folderContent.style.display = 'none'; 
          }
      });

      // Mostra/Nascondi la sezione principale
      if (sectionHasVisibleContent) {
        section.style.display = 'block';
        if (sectionToggle) {
             sectionToggle.classList.remove('collapsed'); // Espandi
             sectionToggle.style.display = 'block';
        }
        if(sectionContent) sectionContent.classList.remove('collapsed'); // Espandi

      } else {
        section.style.display = 'none';
      }
    });
    
    addScrollSpy(); 
  }

  searchInput.addEventListener('input', () => {
    filterElements(searchInput.value.toLowerCase().trim());
  });
}