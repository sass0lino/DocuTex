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
      showSection('Tutto'); // 👈 apre la sezione "Tutto" all'avvio
    } catch (err) {
      container.innerHTML = `<p style="color:#555;">Impossibile caricare docs_tree.json</p>`;
    }
  }

  // Crea la barra di navigazione dinamicamente
  function buildNavigation() {
    nav.innerHTML = '';

    // Sezione speciale "Tutto"
    const allLi = document.createElement('li');
    const allA = document.createElement('a');
    allA.href = '#';
    allA.dataset.section = 'Tutto';
    allA.textContent = 'Tutto';
    allA.classList.add('active', 'show-arrow');
    allLi.appendChild(allA);
    nav.appendChild(allLi);

    // Sezioni dal JSON
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

  // Mostra la sezione selezionata
  function showSection(name) {
    currentSection = name;

    document.querySelectorAll('#nav-navigation a').forEach(a => {
      const isActive = a.dataset.section === name;
      a.classList.toggle('active', isActive);
      a.classList.toggle('show-arrow', isActive);
    });

    // Placeholder diverso se siamo in "Tutto"
    searchInput.placeholder = name === 'Tutto' ? 'Cerca...' : `Cerca in ${name}…`;

    container.innerHTML = '';
    noResults.hidden = true;

    const rootWrapper = document.createElement('section');
    rootWrapper.className = 'doc-section active-section';

    // Sezione "Tutto" -> solo titolo
    if (name === 'Tutto') {
      const title = document.createElement('h1');
      title.className = 'repo-title';
      title.textContent = 'Tutto';
      rootWrapper.appendChild(title);

      Object.keys(docsTree).forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.appendChild(buildTree(docsTree[section]));
        rootWrapper.appendChild(sectionDiv);
      });
    } else {
      // Sezioni normali -> cartella collassabile
      const rootToggle = document.createElement('div');
      rootToggle.className = 'folder-toggle';
      rootToggle.textContent = name;

      const rootContent = document.createElement('div');
      rootContent.className = 'folder-content';
      rootContent.appendChild(buildTree(docsTree[name]));

      rootWrapper.append(rootToggle, rootContent);
    }

    container.appendChild(rootWrapper);
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
