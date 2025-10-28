async function loadDocsTree() {
  try {
    const response = await fetch("./docs_tree.json");
    const data = await response.json();
    const treeContainer = document.getElementById("docs-tree");
    treeContainer.innerHTML = "";
    renderTree(data, treeContainer);
  } catch (error) {
    console.error("Errore nel caricamento del file docs_tree.json:", error);
  }
}

function renderTree(node, container) {
  for (const [key, value] of Object.entries(node)) {
    const section = document.createElement("div");
    section.classList.add("section");
    const title = document.createElement("h3");
    title.textContent = key;
    section.appendChild(title);

    const list = document.createElement("ul");
    value.forEach(item => list.appendChild(renderNode(item)));
    section.appendChild(list);
    container.appendChild(section);
  }
}

function renderNode(item) {
  const li = document.createElement("li");

  if (item.type === "folder") {
    const folderTitle = document.createElement("div");
    folderTitle.classList.add("folder");
    folderTitle.textContent = item.name;
    folderTitle.addEventListener("click", () => {
      folderTitle.classList.toggle("open");
      ul.classList.toggle("hidden");
    });

    const ul = document.createElement("ul");
    if (item.children) {
      item.children.forEach(child => ul.appendChild(renderNode(child)));
    }
    ul.classList.add("hidden");

    li.appendChild(folderTitle);
    li.appendChild(ul);
  }

  if (item.type === "file") {
    const fileDiv = document.createElement("div");
    fileDiv.classList.add("file-item");

    const link = document.createElement("a");
    link.href = item.path;
    link.target = "_blank";
    link.textContent = item.name;

    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = "↓";
    downloadBtn.title = "Scarica PDF";
    downloadBtn.classList.add("download-btn");
    downloadBtn.onclick = (e) => {
      e.stopPropagation();
      window.open(item.path, "_blank");
    };

    fileDiv.appendChild(link);
    fileDiv.appendChild(downloadBtn);
    li.appendChild(fileDiv);
  }

  return li;
}

document.addEventListener("DOMContentLoaded", loadDocsTree);
