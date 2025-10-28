document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('nav-navigation');
  const container = document.getElementById('sections-container');
  const searchInput = document.getElementById('document-search');
  const noResults = document.getElementById('no-results');
  let docsTree = {};
  let currentSection = null;

  // Carica il file JSON principale
  async function loadDocsTree() {
    try {
      const res = await fetch('./site/docs_tree.json');
      docsTree = await res.json();
      buildNavigation();
      const firstSection = Object.keys(docsTree)[0];
      if (firstSection) showSection(firstSection);
    } catch (err) {
      container.innerHTML = `<p style="color:#555;">Impossibile caricare docs_tree.json</p>`;
    }
  }

  // Crea la barra di navigazione dalle sezioni principali
  function buildNavigation() {
    nav.innerHTML = '';
    Object.keys(docsTree).forEach((sectionName, index) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.dataset.section = sectionName;
      a.textContent = sectionName;
      if (index === 0) a.classList.add('active');
      li.appendChild(a);
      nav.appendChild(li);
    });
  }

  // Mostra una sezione principale
  function showSection(name) {
    currentSection = name;
    document.querySelectorAll('#nav-navigation a').forEach(a => {
      a.classList.toggle('active', a.dataset.section === name);
    });

    container.innerHTML = ''; // pulisci tutto
    noResults.hidden = true;

    const section = document.createElement('section');
    section.className = 'doc-section active-section';
    section.appendChild(buildTree(docsTree[name]));
    container.appendChild(section);
  }

  // Costruzione ricorsiva dell'albero
  function buildTree(items) {
    const wrapper = document.createElement('div');
    wrapper.className = 'dynamic-content-container';
    const ul = document.createElement('ul');

    items.forEach(item => {
      const li = document.createElement('li');
      if (item.type === 'folder') {
        const toggle = document.createElement('span');
        toggle.className = 'folder-toggle';
        toggle.textContent = item.name;

        const content = document.createElement('div');
        content.className = 'folder-content';
        if (item.children && item.children.length > 0) {
          content.appendChild(buildTree(item.children));
        }

        li.appendChild(toggle);
        li.appendChild(content);
      } else if (item.type === 'file') {
        li.innerHTML = `
          <p>
            <a href="${item.path}" target="_blank">${item.name}</a>
            ${item.version ? `<span class="tag-versione">${item.version}</span>` : ''}
            <a class="download-button" href="${item.path}" download>Scarica</a>
          </p>`;
      }
      ul.appendChild(li);
    });

    wrapper.appendChild(ul);
    return wrapper;
  }

  // Gestione toggle delle cartelle
  document.body.addEventListener('click', e => {
    const toggle = e.target.closest('.folder-toggle');
    if (!toggle) return;
    toggle.classList.toggle('collapsed');
    toggle.nextElementSibling?.classList.toggle('collapsed');
  });

  // Cambio sezione
  nav.addEventListener('click', e => {
    const link = e.target.closest('a[data-section]');
    if (!link) return;
    e.preventDefault();
    showSection(link.dataset.section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Ricerca
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    const activeSection = container.querySelector('.doc-section');
    if (!activeSection) return;

    const items = activeSection.querySelectorAll('li');
    let visible = 0;
    items.forEach(li => {
      const match = li.textContent.toLowerCase().includes(query);
      li.style.display = match ? '' : 'none';
      if (match) visible++;
    });

    noResults.hidden = query === '' || visible > 0;
  });

  loadDocsTree();
});
