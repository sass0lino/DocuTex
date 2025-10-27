import textract
import os
import re
import json

def calcola_indice_gulpease(pdf_path):
    ''' Calcola l'indice Gulpease per un file PDF '''
    try:
        testo = textract.process(pdf_path, method='pdftotext').decode('utf-8')
    except Exception as e:
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
    tree = {}

    for root, dirs, files in os.walk(directory, topdown=True):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        files = [f for f in files if not f.startswith('.')]

        relative_path = os.path.relpath(root, directory)

        current_level = tree
        if relative_path != '.':
            parts = relative_path.split(os.sep)
            for part in parts:
                current_level = current_level.setdefault(part, {'type': 'folder', 'name': part, 'children': []})['children']
        
        for file in files:
            if file.lower().endswith('.pdf'):
                pdf_path = os.path.join(root, file)
                clean_name = os.path.splitext(file)[0].replace('_', ' ')

                # --- MODIFICA CHIAVE ---
                # Il link ora parte dalla root, non deve più "salire"
                web_path = f'./{pdf_path.replace(os.sep, "/")}'

                file_data = {
                    'type': 'file',
                    'name': clean_name,
                    'path': web_path, 
                    'version': estrai_versione(clean_name),
                    'gulpease': calcola_indice_gulpease(pdf_path)
                }
                current_level.append(file_data)
                
                print(f"Processato: {pdf_path} (Gulpease: {file_data['gulpease']})")

    final_tree = {}
    for key, value in tree.items():
        if value['type'] == 'folder':
            final_tree[key] = value['children']
            
    return final_tree

if __name__ == "__main__":
    # --- CONFIGURAZIONE MODIFICATA ---
    
    # Ora lo script è nella root, quindi 'docs' è una cartella locale
    directory_docs = './docs' 
    
    # Salva il JSON nella stessa cartella (la root)
    output_json_file = './docs_tree.json' 

    print(f"Avvio scansione della cartella: {directory_docs}")
    file_tree = build_file_tree(directory_docs)
    
    try:
        with open(output_json_file, 'w', encoding='utf-8') as f:
            json.dump(file_tree, f, indent=2, ensure_ascii=False)
        print(f"\nAlbero dei file salvato con successo in: {output_json_file}")
    except Exception as e:
        print(f"\nErrore durante la scrittura del file JSON: {e}")