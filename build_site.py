import textract
import os
import re
import json

def calcola_indice_gulpease(pdf_path):
    ''' Calcola l'indice Gulpease per un file PDF '''
    try:
        testo = textract.process(pdf_path, method='pdftotext').decode('utf-8')
    except Exception as e:
        # Gestisce l'errore di textract in modo più pulito
        if 'is not yet supported' in str(e):
            print(f"Info: textract non è riuscito a processare '{pdf_path}'. Potrebbe essere corrotto o protetto.")
        else:
            print(f"Errore textract su {pdf_path}: {e}")
        return None

    parole = len(re.findall(r'\w+', testo))
    lettere = len(re.findall(r'\w', testo))
    punti = len(re.findall(r'[.!?]+\s', testo)) + len(re.findall(r'[;]+\s', testo))

    if parole == 0 or parole < 10:
        return None

    indiceG = 89 + ((300 * punti) - (10 * lettere)) / parole
    indiceG = max(0, min(100, indiceG)) # Blocca l'indice tra 0 e 100
    return round(indiceG, 2)

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
    # Questo è il dizionario radice che conterrà le cartelle di primo livello
    # Es: {'01_Capitolati': {...}, '02_Verbali': {...}}
    tree_root_dict = {}

    for root, dirs, files in os.walk(directory, topdown=True):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        files = [f for f in files if not f.startswith('.')]

        relative_path = os.path.relpath(root, directory)

        # 1. Trova il dizionario della cartella giusta in cui aggiungere i file
        if relative_path == '.':
            # Siamo nella root ('docs/'). Creiamo le voci per le cartelle di primo livello
            for d in dirs:
                 if d not in tree_root_dict:
                    tree_root_dict[d] = {'type': 'folder', 'name': d, 'children': []}
            # I file nella root 'docs/' vengono ignorati, ci interessano solo le cartelle
            continue 
        else:
            # Siamo in una sottocartella (es. '01_Capitolati/Esterni')
            parts = relative_path.split(os.sep)
            
            # Inizia dalla cartella di primo livello (es. tree_root_dict['01_Capitolati'])
            current_folder_dict = tree_root_dict[parts[0]]
            
            # Scendi nelle sottocartelle (es. 'Esterni')
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
                
                current_folder_dict = found_folder # Passa alla sottocartella trovata/creata

        # 2. Aggiungi i file trovati alla lista 'children' della cartella corrente
        children_list_to_add_files = current_folder_dict.setdefault('children', [])
        for file in files:
            if file.lower().endswith('.pdf'):
                pdf_path = os.path.join(root, file)
                clean_name = os.path.splitext(file)[0].replace('_', ' ')
                web_path = f'./{pdf_path.replace(os.sep, "/")}'

                file_data = {
                    'type': 'file',
                    'name': clean_name,
                    'path': web_path, 
                    'version': estrai_versione(clean_name),
                    'gulpease': calcola_indice_gulpease(pdf_path)
                }
                children_list_to_add_files.append(file_data)
                
                # Messaggio di stato spostato qui
                if file_data['gulpease'] is not None:
                    print(f"Processato: {pdf_path} (Gulpease: {file_data['gulpease']})")
            
    # La struttura JS si aspetta solo la lista dei figli delle cartelle di primo livello
    final_tree = {}
    for key, value in tree_root_dict.items():
        if value['type'] == 'folder':
            final_tree[key] = value['children'] # Es: final_tree['01_Capitolati'] = [...]
            
    return final_tree


if __name__ == "__main__":
    directory_docs = './docs' 
    output_json_file = './docs_tree.json' 

    print(f"Avvio scansione della cartella: {directory_docs}")
    file_tree = build_file_tree(directory_docs)
    
    try:
        with open(output_json_file, 'w', encoding='utf-8') as f:
            json.dump(file_tree, f, indent=2, ensure_ascii=False)
        print(f"\nAlbero dei file salvato con successo in: {output_json_file}")
    except Exception as e:
        print(f"\nErrore durante la scrittura del file JSON: {e}")