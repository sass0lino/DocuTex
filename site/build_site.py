import os
import re
import json

def estrai_versione(filename):
    ''' Estrae un numero di versione (es. v1.0.0) dal nome file '''
    match = re.search(r'v(\d+\.\d+(\.\d+)?)', filename)
    if match:
        return match.group(0)
    return None

def build_file_tree(directory):
    '''
    Analizza ricorsivamente la directory e crea un albero (dict)
    di cartelle e file.
    '''
    tree_root_dict = {}

    for root, dirs, files in os.walk(directory, topdown=True):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        files = [f for f in files if not f.startswith('.')]

        relative_path = os.path.relpath(root, directory)

        if relative_path == '.':
            for d in dirs:
                 if d not in tree_root_dict:
                    tree_root_dict[d] = {'type': 'folder', 'name': d, 'children': []}
            continue 
        else:
            root_folder_name = relative_path.split(os.sep)[0]
            if root_folder_name not in tree_root_dict:
                 tree_root_dict[root_folder_name] = {'type': 'folder', 'name': root_folder_name, 'children': []}
                 
            parts = relative_path.split(os.sep)
            current_folder_dict = tree_root_dict[parts[0]]
            
            for part in parts[1:]:
                children_list = current_folder_dict['children']
                found_folder = None
                for item in children_list:
                    if item['type'] == 'folder' and item['name'] == part:
                        found_folder = item
                        break
                
                if not found_folder:
                    found_folder = {'type': 'folder', 'name': part, 'children': []}
                    children_list.append(found_folder)
                
                current_folder_dict = found_folder

        children_list_to_add_files = current_folder_dict.setdefault('children', [])
        for file in files:
            if file.lower().endswith('.pdf'):
                pdf_path = os.path.join(root, file)
                clean_name = os.path.splitext(file)[0].replace('_', ' ')
                
                # Crea il percorso web relativo: es. './docs/file.pdf'
                web_path = f'./{pdf_path.replace(os.sep, "/").lstrip("../")}'

                file_data = {
                    'type': 'file',
                    'name': clean_name,
                    'path': web_path, 
                    'version': estrai_versione(clean_name),
                }
                children_list_to_add_files.append(file_data)
                
    final_tree = {}
    for key, value in tree_root_dict.items():
        if value['type'] == 'folder':
            final_tree[key] = value['children']
            
    return final_tree


if __name__ == "__main__":
    # --- CONFIGURAZIONE PER SCRIPT IN 'site/' ---
    
    # Legge la cartella 'docs' salendo di un livello
    directory_docs = '../docs' 
    
    # Salva il JSON accanto a sé, in 'site/'
    output_json_file = './docs_tree.json' 
    
    print(f"Avvio scansione della cartella: {directory_docs}")
    file_tree = build_file_tree(directory_docs)
    
    try:
        with open(output_json_file, 'w', encoding='utf-8') as f:
            json.dump(file_tree, f, indent=2, ensure_ascii=False)
        print(f"\nAlbero dei file salvato con successo in: {output_json_file}")
    except Exception as e:
        print(f"\nErrore durante la scrittura del file JSON: {e}")