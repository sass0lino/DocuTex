/* =================================================== */
/* PARTE 1: Effetto Scroll per l'Header                 */
/* =================================================== */
document.addEventListener("scroll", function() {
  const header = document.querySelector("header");
  if (window.scrollY > 10) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
  const logo = document.querySelector("#header-logo");
  logo.classList.remove("scrolled-logo");
});

/* =================================================== */
/* PARTE 2: Costruzione Dinamica della Pagina          */
/* =================================================== */
document.addEventListener("DOMContentLoaded", function() {
  
  const navContainer = document.getElementById("nav-navigation");
  const mainContainer = document.getElementById("main-content");
  const firstStaticLink = navContainer.querySelector('li');
  const firstStaticSection = mainContainer.querySelector('section');

  // Legge il file JSON (che si trova in 'site/docs_tree.json')
  fetch('./docs_tree.json')
    .then(response => {
      if (!response.ok) throw new Error(`Errore di rete: ${response.statusText}`);
      return response.json();
    })
    .then(treeData => {
      const folderNames = Object.keys(treeData).sort();
      
      if (folderNames.length === 0) {
        const msg = document.createElement('p');
        msg.textContent = 'Nessun documento trovato nella cartella docs/.';
        mainContainer.insertBefore(msg, firstStaticSection);
        return;
      }

      folderNames.forEach((folderName, index) => {
        const cleanName = folderName.replace(/^[0-9]+_/, '').replace(/_/g, ' ');
        const id = cleanName.toLowerCase().replace(/\s+/g, '-'); 

        // 1. Costruisci il link di Navigazione
        const navLi = document.createElement('li');
        navLi.innerHTML = `<a href="#${id}" class="nav-link">${cleanName}</a>`; 
        if (firstStaticLink) {
          navContainer.insertBefore(navLi, firstStaticLink);
        } else {
          navContainer.appendChild(navLi);
        }
        
        // 2. Costruisci la Sezione <section>
        const section = document.createElement('section');
        section.id = id;
        section.setAttribute('aria-labelledby', `h1-${id}`);
        if (index === 0) {
          section.classList.add('firstSection');
        }
        
        section.innerHTML = `
          <h1 id="h1-${id}">${folderName.replace(/_/g, ' ')}</h1>
          <div class="dynamic-content-container" role="region" aria-live="polite">
            ${buildHtmlFromTree(treeData[folderName])}
          </div>
        `;
        
        if (firstStaticSection) {
          mainContainer.insertBefore(section, firstStaticSection);
        } else {
          mainContainer.appendChild(section);
        }
      });
      
      addCollapseListeners();
      addScrollSpy();
    })
    .catch(error => {
      console.error("Impossibile caricare la struttura dei documenti:", error);
      const err = document.createElement('p');
      err.textContent = 'Errore nel caricamento dei documenti.';
      mainContainer.insertBefore(err, firstStaticSection);
    });
});

/* =================================================== */
/* PARTE 3: Funzione Helper Ricorsiva (per <ul>/<li>)   */
/* =================================================== */
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
      toggle.classList.toggle('collapsed');
      content.classList.toggle('collapsed');
    });
    
    toggle.classList.add('collapsed');
    toggle.nextElementSibling.classList.add('collapsed');
  });
}

/* =================================================== */
/* PARTE 5: Funzione per "Scroll-Spy"                  */
/* =================================================== */
function addScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('a.nav-link');

  const onScroll = () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (window.scrollY >= sectionTop - 150) { 
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  };
  window.addEventListener('scroll', onScroll);
}