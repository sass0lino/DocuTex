// Mostra una sola sezione alla volta + gestione toggle cartelle + search base
document.addEventListener('DOMContentLoaded', () => {
  /* ----- Selezione sezione (una alla volta) ----- */
  const navLinks = document.querySelectorAll('#nav-navigation a');
  const sections = document.querySelectorAll('.doc-section');

  function showSection(id) {
    sections.forEach(section => {
      section.classList.toggle('active-section', section.id === id);
    });
    navLinks.forEach(l => {
      l.classList.toggle('active', l.dataset.section === id);
      if (l.dataset.section === id) l.setAttribute('aria-current', 'page');
      else l.removeAttribute('aria-current');
    });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.dataset.section;
      if (targetId) showSection(targetId);
      // scroll top comodo su mobile
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  /* ----- Toggle cartelle ----- */
  document.body.addEventListener('click', (e) => {
    const toggle = e.target.closest('.folder-toggle');
    if (!toggle) return;

    const content = toggle.nextElementSibling;
    toggle.classList.toggle('collapsed');
    content?.classList.toggle('collapsed');
  });

  /* ----- Ricerca documenti (semplice, client-side) ----- */
  const searchInput = document.getElementById('document-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      // Filtra solo nella sezione attiva
      const active = document.querySelector('.doc-section.active-section');
      if (!active) return;

      const items = active.querySelectorAll('.dynamic-content-container li');
      items.forEach(li => {
        const txt = li.textContent.toLowerCase();
        li.style.display = txt.includes(q) ? '' : 'none';
      });
    });
  }

  // Opzionale: apri la prima cartella della sezione attiva
  const firstOpen = document.querySelector('.doc-section.active-section .folder-toggle');
  if (firstOpen && firstOpen.nextElementSibling) {
    firstOpen.classList.remove('collapsed');
    firstOpen.nextElementSibling.classList.remove('collapsed');
  }
});
