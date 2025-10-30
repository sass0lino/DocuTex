import os
import re
import json
from datetime import datetime
from unidecode import unidecode  # serve per normalizzare nomi senza accenti

def estrai_info(filename):
    """Estrae nome base, versione, data e firma da un nome file PDF."""
    name_no_ext = os.path.splitext(filename)[0]

    # Normalizza underscore e spazi in un unico spazio
    normalized = re.sub(r'[_\-]+', ' ', name_no_ext.strip())
    normalized = re.sub(r'\s+', ' ', normalized)

    # Cerca la firma (firmato/signed)
    signed = bool(re.search(r'\b(firmato|signed)\b', normalized, re.IGNORECASE))
    normalized = re.sub(r'\b(firmato|signed)\b', '', normalized, flags=re.IGNORECASE)

    # Estrai versione (es. v1.0, v0.1.3, V2)
    version_match = re.search(r'v\s?(\d+(?:\.\d+){0,2})', normalized, re.IGNORECASE)
    version = f"v{version_match.group(1)}" if version_match else None
    if version:
        normalized = re.sub(r'v\s?\d+(?:\.\d+){0,2}', '', normalized, flags=re.IGNORECASE)

    # Estrai data (molti formati possibili)
    date_match = re.search(r'(\d{1,2}[-_/]\d{1,2}[-_/]\d{2,4}|\d{4}[-_/]\d{1,2}[-_/]\d{1,2})', normalized)
    if date_match:
        raw_date = date_match.group(1)
        normalized = normalized.replace(raw_date, '')
        for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d", "%d-%m-%y"):
            try:
                date = datetime.strptime(re.sub(r'[-_/]', '-', raw_date), fmt).strftime("%Y-%m-%d")
                break
            except ValueError:
                date = None
    else:
        date = None

    # Rimuovi spazi extra e normalizza accenti
    clean_name = unidecode(normalized.strip().title())

    # Costruisci nome completo per ricerca
    parts = [clean_name]
    if version: parts.append(version)
    if date: parts.append(date)
    if signed: parts.append("firmato")
    search_name = " ".join(parts).lower()

    return clean_name, version, date, signed, search_name


def build_file_tree(directory):
    tree_root_dict = {}

    for root, dirs, files in os.walk(directory, topdown=True):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        files = [f for f in files if f.lower().endswith('.pdf') and not f.startswith('.')]

        relative_path = os.path.relpath(root, directory)
        if relative_path == '.':
            for d in dirs:
                if d not in tree_root_dict:
                    tree_root_dict[d] = {'type': 'folder', 'name': d, 'children': []}
            continue

        root_folder_name = relative_path.split(os.sep)[0]
        if root_folder_name not in tree_root_dict:
            tree_root_dict[root_folder_name] = {'type': 'folder', 'name': root_folder_name, 'children': []}

        parts = relative_path.split(os.sep)
        current_folder_dict = tree_root_dict[parts[0]]

        for part in parts[1:]:
            found_folder = next(
                (i for i in current_folder_dict['children'] if i['type'] == 'folder' and i['name'] == part),
                None
            )
            if not found_folder:
                found_folder = {'type': 'folder', 'name': part, 'children': []}
                current_folder_dict['children'].append(found_folder)
            current_folder_dict = found_folder

        children_list = current_folder_dict.setdefault('children', [])

        for file in files:
            clean_name, version, date, signed, search_name = estrai_info(file)
            web_path = f'./{os.path.join(root, file).replace(os.sep, "/").lstrip("../")}'

            file_data = {
                'type': 'file',
                'name': clean_name,
                'version': version,
                'date': date,
                'signed': signed,
                'path': web_path,
                'search_name': search_name,  # <- campo aggiunto per la searchbar JS
            }

            children_list.append(file_data)

    final_tree = {}
    for key, value in tree_root_dict.items():
        if value['type'] == 'folder':
            final_tree[key] = value['children']

    return final_tree


if __name__ == "__main__":
    directory_docs = '../docs'
    output_json_file = './docs_tree.json'

    print(f"Avvio scansione della cartella: {directory_docs}")
    file_tree = build_file_tree(directory_docs)

    with open(output_json_file, 'w', encoding='utf-8') as f:
        json.dump(file_tree, f, indent=2, ensure_ascii=False)
    print(f"\nAlbero dei file salvato in: {output_json_file}")
