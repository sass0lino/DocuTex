document.addEventListener('DOMContentLoaded', () => {

const navLinks = document.querySelectorAll('#nav-navigation a');
const docsSection = document.getElementById('docs-section');
const contactsSection = document.getElementById('contacts-section');
const container = document.getElementById('sections-container');
const searchInput = document.getElementById('document-search');
const filtersBar = document.getElementById('section-filters');

let docsTree = {};
let currentFilter = "Tutto";
let currentSection = "Archivio";
let lastQuery = "";

/* NAV switching */
navLinks.forEach(link => {
  link.addEventListener("click", () => {
    navLinks.forEach(a => a.classList.remove("active"));
    link.classList.add("active");
    const view = link.dataset.view;
    docsSection.classList.toggle("hidden", view !== "docs");
    contactsSection.classList.toggle("hidden", view !== "contacts");
  });
});

/* Load */
async function loadDocsTree(){
  const res = await fetch("./docs_tree.json");
  docsTree = await res.json();
  renderFilters();
  showSection("Archivio");
}

/* Filters UI */
function renderFilters(){
  filtersBar.innerHTML="";

  const sections = Object.keys(docsTree);

  const makeChip = sec=>{
    const chip=document.createElement("button");
    chip.className="filter-chip"+(currentFilter===sec?" active":"");
    chip.textContent=sec;
    chip.onclick=()=>{
      currentFilter=sec;
      showSection(sec);
    };
    return chip;
  };

  const allChip = document.createElement("button");
  allChip.className="filter-chip"+(currentFilter==="Tutto"?" active":"");
  allChip.textContent="Tutto";
  allChip.onclick=()=>{
    currentFilter="Tutto";
    showSection("Archivio");
  };

  filtersBar.append(allChip);
  sections.forEach(sec=>filtersBar.append(makeChip(sec)));
}

/* Search logic */
function filterTree(items,query){
  if(!query) return items;
  const q=query.toLowerCase();
  const res=[];
  for(const it of items){
    if(it.type==="file"){
      const txt=(it.search_name||it.name||"").toLowerCase();
      if(txt.includes(q)) res.push(it);
    } else {
      const kids=filterTree(it.children||[],q);
      if(kids.length) res.push({...it,children:kids});
    }
  }
  return res;
}

/* Tree builder */
function buildTree(items){
  const ul=document.createElement("ul");

  items.forEach(item=>{
    const li=document.createElement("li");

    if(item.type==="folder"){
      const t=document.createElement("div");
      t.className="folder-toggle";
      t.textContent=item.name;

      const c=document.createElement("div");
      c.className="folder-content";
      if(item.children?.length) c.append(buildTree(item.children));
      li.append(t,c);
    } else {
      const row=document.createElement("p");
      row.className="pdf_row";

      const link=document.createElement("a");
      link.className="file-name";
      link.href=item.path;
      link.target="_blank";

      const name=item.name||"";

      // ✅ version logic correct (only add v if missing)
      let version="";
      if(item.version){
        version = item.version.startsWith("v")
          ? ` <span style="opacity:.7">${item.version}</span>`
          : ` <span style="opacity:.7">v${item.version}</span>`;
      }

      const date=item.date?` <span style="opacity:.7">(${item.date})</span>`:"";
      const signed=item.signed?` <span class="signed-badge">Firmato</span>`:"";

      link.innerHTML = `
        <img src="./assets/images/pdf.svg" class="icon-pdf">
        ${name}${date}${version}${signed}
      `;

      const dl=document.createElement("a");
      dl.className="download-button";
      dl.href=item.path;
      dl.download="";

      row.append(link,dl);
      li.append(row);
    }

    ul.append(li);
  });

  return ul;
}

/* Visible sections */
function visibleSections(){
  if(currentFilter==="Tutto") return Object.keys(docsTree);
  return [currentFilter];
}

/* Render section */
function showSection(name){
  currentSection=name;
  container.innerHTML="";

  // ✅ correct placeholder behaviour
  searchInput.placeholder =
    currentSection==="Archivio"
      ? "Cerca nei documenti…"
      : `Cerca in ${currentSection}…`;

  // ✅ update filter highlight
  renderFilters();

  visibleSections().forEach(sec=>{
    const data = docsTree[sec];
    const filtered = lastQuery ? filterTree(data,lastQuery) : data;
    if(!filtered.length) return;

    const toggle=document.createElement("div");
    toggle.className="folder-toggle";
    toggle.textContent=sec;

    const content=document.createElement("div");
    content.className="folder-content";
    content.append(buildTree(filtered));

    container.append(toggle,content);
  });

  requestAnimationFrame(()=>{
    document.querySelectorAll('.folder-toggle').forEach(e=>e.classList.remove('collapsed'));
    document.querySelectorAll('.folder-content').forEach(e=>e.classList.remove('collapsed'));
  });
}

/* Collapse without scroll jump */
document.body.addEventListener("click",e=>{
  const t=e.target.closest(".folder-toggle");
  if(!t) return;
  const y=window.scrollY;
  t.classList.toggle("collapsed");
  const next=t.nextElementSibling;
  if(next?.classList.contains("folder-content")) next.classList.toggle("collapsed");
  requestAnimationFrame(()=>window.scrollTo(0,y));
});

/* Search input */
searchInput.addEventListener("input",()=>{
  lastQuery=searchInput.value;
  showSection(currentSection);
});

loadDocsTree();
});
