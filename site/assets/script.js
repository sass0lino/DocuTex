document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('nav-navigation');
  const container = document.getElementById('sections-container');
  const searchInput = document.getElementById('document-search');
  const searchContainer = document.getElementById('search-container');
  const noResults = document.getElementById('no-results');
  const sectionsWrapper = document.getElementById('sections-wrapper');
  
  let docsTree = {};
  let currentSection = null;

  // carica l'albero dei documenti dal json
  async function loadDocsTree() {
    try {
      const res = await fetch('./docs_tree.json');
      docsTree = await res.json();
      buildNavigation();
      showSection('Tutto');
    } catch (err) {
      container.innerHTML = `<p style="color:#555;">Errore nel caricamento dei documenti.</p>`;
      console.error('Errore caricamento docs_tree.json:', err);
    }
  }

  // crea i link di navigazione in base alle sezioni presenti
  function buildNavigation() {
    nav.innerHTML = '';

    // sezione "Tutto" che mostra tutte le cartelle
    const allLi = document.createElement('li');
    const allA = document.createElement('a');
    allA.href = '#';
    allA.dataset.section = 'Tutto';
    allA.textContent = 'Tutto';
    allA.classList.add('active', 'show-arrow');
    allLi.appendChild(allA);
    nav.appendChild(allLi);

    // aggiungi le altre sezioni principali
    Object.keys(docsTree).forEach(name => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.dataset.section = name;
      a.textContent = name;
      li.appendChild(a);
      nav.appendChild(li);
    });
  }

  // mostra la sezione selezionata
  function showSection(name) {
    currentSection = name;

    // reset della search bar al cambio sezione
    searchInput.value = '';
    noResults.hidden = true;

    // aggiorna gli stati attivi dei link
    document.querySelectorAll('#nav-navigation a').forEach(a => {
      const isActive = a.dataset.section === name;
      a.classList.toggle('active', isActive);
      a.classList.toggle('show-arrow', isActive);
    });

    // aggiorna il placeholder della search
    searchInput.placeholder = name === 'Tutto' ? 'Cerca…' : `Cerca in ${name}…`;

    container.innerHTML = '';

    // nella sezione "Tutto" mettiamo la search sotto il titolo
    if (name === 'Tutto') {
      searchContainer.classList.add('below-title');
      sectionsWrapper.style.display = 'flex';
      sectionsWrapper.style.flexDirection = 'column';
      
      const title = document.createElement('h1');
      title.className = 'repo-title';
      title.textContent = 'Documentazione di Progetto';
      title.style.order = '0';
      container.appendChild(title);

      // crea una sezione collassabile per ogni cartella principale
      Object.keys(docsTree).forEach(section => {
        const sectionContainer = document.createElement('div');
        sectionContainer.style.order = '2';
        
        const sectionToggle = document.createElement('div');
        sectionToggle.className = 'folder-toggle';
        sectionToggle.textContent = section;

        const sectionContent = document.createElement('div');
        sectionContent.className = 'folder-content';
        sectionContent.appendChild(buildTree(docsTree[section], section));

        sectionContainer.append(sectionToggle, sectionContent);
        container.appendChild(sectionContainer);
      });
    } else {
      // nelle altre sezioni la search resta sopra
      searchContainer.classList.remove('below-title');
      sectionsWrapper.style.display = 'block';

      const rootToggle = document.createElement('div');
      rootToggle.className = 'folder-toggle';
      rootToggle.textContent = name;

      const rootContent = document.createElement('div');
      rootContent.className = 'folder-content';
      rootContent.appendChild(buildTree(docsTree[name], name));

      container.append(rootToggle, rootContent);
    }
  }

  // costruisce ricorsivamente l'albero di cartelle e file
  function buildTree(items, currentPath = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'dynamic-content-container';
    const ul = document.createElement('ul');

    items.forEach(item => {
      const li = document.createElement('li');
      const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;

      if (item.type === 'folder') {
        const toggle = document.createElement('span');
        toggle.className = 'folder-toggle';
        toggle.textContent = item.name;

        const content = document.createElement('div');
        content.className = 'folder-content';
        if (item.children?.length) {
          content.appendChild(buildTree(item.children, itemPath));
        }
        li.append(toggle, content);
      } else if (item.type === 'file') {
        // mostra nome file e percorso
        const p = document.createElement('p');
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        
        const fileLink = document.createElement('a');
        fileLink.className = 'file-name';
        fileLink.href = item.path;
        fileLink.target = '_blank';
        fileLink.textContent = item.name;
        
        const filePath = document.createElement('span');
        filePath.className = 'file-path';
        filePath.textContent = itemPath;
        
        fileInfo.append(fileLink, filePath);
        
        const downloadLink = document.createElement('a');
        downloadLink.className = 'download-button';
        downloadLink.href = item.path;
        downloadLink.download = '';
        downloadLink.title = 'Scarica file';
        downloadLink.setAttribute('aria-label', `Scarica ${item.name}`);
        
        p.append(fileInfo, downloadLink);
        li.appendChild(p);
      }
      ul.appendChild(li);
    });

    wrapper.appendChild(ul);
    return wrapper;
  }

  // gestisce il click sui toggle delle cartelle
  document.body.addEventListener('click', e => {
    const toggle = e.target.closest('.folder-toggle');
    if (!toggle) return;
    
    e.preventDefault();
    toggle.classList.toggle('collapsed');
    const nextContent = toggle.nextElementSibling;
    if (nextContent?.classList.contains('folder-content')) {
      nextContent.classList.toggle('collapsed');
    }
  });

  // gestisce il click sui link di navigazione
  nav.addEventListener('click', e => {
    const link = e.target.closest('a[data-section]');
    if (!link) return;
    
    e.preventDefault();
    showSection(link.dataset.section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // gestisce la ricerca in tempo reale
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    
    // se la query è vuota mostra tutto
    if (query === '') {
      const allItems = container.querySelectorAll('li');
      allItems.forEach(li => li.style.display = '');
      noResults.hidden = true;
      return;
    }

    // cerca nei nomi file e nei percorsi
    const allItems = container.querySelectorAll('li');
    let visibleCount = 0;

    allItems.forEach(li => {
      const text = li.textContent.toLowerCase();
      const matches = text.includes(query);
      li.style.display = matches ? '' : 'none';
      if (matches) visibleCount++;
    });

    // mostra messaggio se non ci sono risultati
    noResults.hidden = visibleCount > 0;
  });

  loadDocsTree();
});