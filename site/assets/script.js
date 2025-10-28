// ===============================
// DocuTex File Tree Viewer
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  fetch("./docs_tree.json")
    .then(res => {
      if (!res.ok) throw new Error("Impossibile caricare docs_tree.json");
      return res.json();
    })
    .then(data => renderDocsTree(data))
    .catch(err => {
      document.getElementById("docs-container").innerHTML =
        `<p class="error">❌ Errore: ${err.message}</p>`;
    });
});

function renderDocsTree(treeData) {
  const container = document.getElementById("docs-container");
  container.innerHTML = "";

  for (const [section, items] of Object.entries(treeData)) {
    const sectionEl = document.createElement("div");
    sectionEl.classList.add("section");

    const title = document.createElement("h3");
    title.textContent = section;
    sectionEl.appendChild(title);

    const list = document.createElement("ul");
    buildTree(items, list);
    sectionEl.appendChild(list);

    container.appendChild(sectionEl);
  }
}

function buildTree(items, parentEl) {
  items.forEach(item => {
    const li = document.createElement("li");

    if (item.type === "folder") {
      const folderHeader = document.createElement("div");
      folderHeader.classList.add("folder-header");
      folderHeader.innerHTML = `<span class="arrow">▶</span>${item.name}`;

      const childrenContainer = document.createElement("ul");
      childrenContainer.classList.add("folder-content");
      buildTree(item.children || [], childrenContainer);

      folderHeader.addEventListener("click", () => {
        childrenContainer.classList.toggle("open");
        folderHeader.querySelector(".arrow").textContent =
          childrenContainer.classList.contains("open") ? "▼" : "▶";
      });

      li.appendChild(folderHeader);
      li.appendChild(childrenContainer);
    }

    if (item.type === "file") {
      const fileEl = document.createElement("div");
      fileEl.classList.add("file-item");

      const link = document.createElement("a");
      link.href = item.path;
      link.textContent = item.name;
      link.target = "_blank";

      const actions = document.createElement("div");
      actions.classList.add("file-actions");

      const openBtn = document.createElement("button");
      openBtn.textContent = "Apri";
      openBtn.title = "Apri PDF";
      openBtn.onclick = () => window.open(item.path, "_blank");

      const downloadBtn = document.createElement("button");
      downloadBtn.textContent = "⬇";
      downloadBtn.title = "Scarica PDF";
      downloadBtn.onclick = () => {
        const a = document.createElement("a");
        a.href = item.path;
        a.download = item.name + ".pdf";
        a.click();
      };

      actions.append(openBtn, downloadBtn);
      fileEl.append(link, actions);
      li.appendChild(fileEl);
    }

    parentEl.appendChild(li);
  });
}
