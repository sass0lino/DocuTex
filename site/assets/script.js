document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('nav-navigation');
  const container = document.getElementById('sections-container');
  const searchInput = document.getElementById('document-search');
  const noResults = document.getElementById('no-results');
  const sectionsWrapper = document.getElementById('sections-wrapper');
  let docsTree = {};
  let currentSection = null;

  async function loadDocsTree() {
    try {
      const res = await fetch('./docs_tree.json');
      docsTree = await res.json();
      buildNavigation();
      const first = Object.keys(docsTree)[0];
      if (first) showSection(first);
    } catch (err) {
      container.innerHTML = `<p style="color:#555;">Impossibile caricare docs_tree.json</p>`;
    }
  }

  // Crea la barra di navigazione dinamicamente
  function buildNavigation() {
    nav.innerHTML = '';
    Object.keys(docsTree).forEach((name, i) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.dataset.section = name;
      a.textContent = name;
      if (i === 0) a.classList.add('active');
      li.appendChild(a);
      nav.appendChild(li);
    });
  }

  // Mostra la sezione scelta
  function showSection(name) {
    currentSection = name;

    // aggiorna link attivi
    document.querySelectorAll('#nav-navigation a').forEach(a => {
      const isActive = a.dataset.section === name;
      a.classList.toggle('active', isActive);
      a.textContent = isActive ? '↓' : a.dataset.section; // freccia o testo
    });

    // aggiorna placeholder ricerca
    searchInput.placeholder = `Cerca in ${name}…`;

    // aggiorna titolo principale sotto
    let existingTitle = sectionsWrapper.querySelector('h1.repo-title');
    if (!existingTitle) {
      existingTitle = document.createElement('h1');
      existingTitle.className = 'repo-title';
      sectionsWrapper.insertBefore(existingTitle, container);
    }
    existingTitle.textContent = name;

    // reset contenuto
    container.innerHTML = '';
    noResults.hidden = true;

    const section = document.createElement('section');
    section.className = 'doc-section active-section';
    section.appendChild(buildTree(docsTree[name]));
    container.appendChild(section);
  }

  // Costruzione ricorsiva della struttura file/cartelle
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
        if (item.children?.length) {
          content.appendChild(buildTree(item.children));
        }
        li.append(toggle, content);
      } else if (item.type === 'file') {
        li.innerHTML = `
          <p>
            <a href="${item.path}" target="_blank">${item.name}</a>
            ${item.version ? `<span class="tag-versione">${item.version}</span>` : ''}
            <a class="download-button" href="${item.path}" download title="Scarica file"></a>
          </p>`;
      }
      ul.appendChild(li);
    });

    wrapper.appendChild(ul);
    return wrapper;
  }

  // Toggle cartelle
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
    const active = container.querySelector('.doc-section');
    if (!active) return;

    const items = active.querySelectorAll('li');
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
