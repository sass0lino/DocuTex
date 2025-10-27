/* =================================================== */
/* PARTE 1: Effetto Scroll per l'Header (INVARIATO)    */
/* =================================================== */

document.addEventListener("scroll", function() {
  var header = document.querySelector("header");
  var logo = document.querySelector("#header-logo");
  
  if (window.scrollY > 100) {
    header.classList.add("scrolled");
    logo.classList.add("scrolled-logo");
  } else {
    header.classList.remove("scrolled");
    logo.classList.remove("scrolled-logo");
  }
});


/* =================================================== */
/* PARTE 2: Costruzione Dinamica della Pagina          */
/* =================================================== */

document.addEventListener("DOMContentLoaded", function() {
  
  // Trova i contenitori principali
  const navContainer = document.getElementById("nav-navigation");
  const mainContainer = document.getElementById("main-content");
  
  // Trova i primi elementi statici (per inserire i nuovi *prima* di loro)
  const firstStaticLink = navContainer.querySelector('li'); // "Contatti"
  const firstStaticSection = mainContainer.querySelector('section'); // "contatti"

  fetch('./docs_tree.json')
    .then(response => {
      if (!response.ok) throw new Error(`Errore di rete: ${response.statusText}`);
      return response.json();
    })
    .then(treeData => {
      // Prende i nomi delle cartelle (es. "01_Capitolati") e li ordina
      const folderNames = Object.keys(treeData).sort();
      
      if (folderNames.length === 0) {
        const msg = document.createElement('p');
        msg.textContent = 'Nessun documento trovato nella cartella docs/.';
        mainContainer.insertBefore(msg, firstStaticSection);
        return;
      }

      // Itera su ogni cartella principale trovata nel JSON
      folderNames.forEach((folderName, index) => {
        
        // Pulisce il nome per usarlo come link e ID
        // es. "01_Analisi_Requisiti" -> "Analisi Requisiti"
        const cleanName = folderName.replace(/^[0-9]+_/, '').replace(/_/g, ' ');
        // es. "Analisi Requisiti" -> "analisi-requisiti"
        const id = cleanName.toLowerCase().replace(/\s+/g, '-'); 

        // --- 1. Costruisci il link di Navigazione ---
        const navLi = document.createElement('li');
        navLi.innerHTML = `<a href="#${id}">${cleanName}</a>`;
        // Inserisce il nuovo link prima di "Contatti"
        if (firstStaticLink) {
          navContainer.insertBefore(navLi, firstStaticLink);
        } else {
          navContainer.appendChild(navLi); // Fallback se non ci sono link statici
        }
        
        // --- 2. Costruisci la Sezione <section> ---
        const section = document.createElement('section');
        section.id = id;
        section.setAttribute('aria-labelledby', `h1-${id}`);
        
        // Applica la classe speciale solo alla prima sezione
        if (index === 0) {
          section.classList.add('firstSection');
        }
        
        // Crea l'HTML interno per la sezione
        section.innerHTML = `
          <h1 id="h1-${id}">${folderName.replace(/_/g, ' ')}</h1>
          <div class="dynamic-content-container" role="region" aria-live="polite">
            ${buildHtmlFromTree(treeData[folderName])}
          </div>
        `;
        
        // Inserisce la nuova sezione prima di "contatti"
        if (firstStaticSection) {
          mainContainer.insertBefore(section, firstStaticSection);
        } else {
          mainContainer.appendChild(section); // Fallback
        }
      });
    })
    .catch(error => {
      console.error("Impossibile caricare la struttura dei documenti:", error);
      const err = document.createElement('p');
      err.textContent = 'Errore nel caricamento dei documenti.';
      mainContainer.insertBefore(err, firstStaticSection);
    });
});


/* =================================================== */
/* PARTE 3: Funzione Helper Ricorsiva (INVARIATA)      */
/* =================================================== */

/**
 * Funzione ricorsiva che costruisce l'HTML semantico (con <ul> e <li>)
 * a partire dall'albero di file/cartelle.
 * @param {Array} nodes - Un array di oggetti (file o cartelle)
 */
function buildHtmlFromTree(nodes) {
  if (!nodes || nodes.length === 0) return "";

  nodes.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'folder' ? -1 : 1; 
  });

  let html = '<ul>';

  for (const node of nodes) {
    if (node.type === 'file') {
      html += `
        <li>
          <p>
            <a href="${node.path}" target="_blank">${node.name}</a>
            ${node.version ? `<span class="tag-versione">${node.version}</span>` : ''}
            ${node.gulpease ? `<span class="tag-versione">Gulpease: ${node.gulpease}</span>` : ''}
          </p>
        </li>
      `;
    } else if (node.type === 'folder') {
      html += `
        <li>
          <h3>${node.name}</h3>
          ${buildHtmlFromTree(node.children)} 
        </li>
      `;
    }
  }

  html += '</ul>';
  return html;
}