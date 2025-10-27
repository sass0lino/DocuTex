import textract
import os
import re
import json

def calcola_indice_gulpease(pdf_path):
    ''' Calcola l'indice Gulpease per un file PDF '''
    try:
        # Tenta di estrarre il testo dal PDF
        testo = textract.process(pdf_path, method='pdftotext').decode('utf-8')
    except Exception as e:
        # Se fallisce (es. PDF corrotto o protetto), stampa un errore e restituisce None
        print(f"Errore textract su {pdf_path}: {e}")
        return None

    parole = len(re.findall(r'\w+', testo))
    lettere = len(re.findall(r'\w', testo))
    # Calcola i punti che terminano una frase
    punti = len(re.findall(r'[.!?]+\s', testo)) + len(re.findall(r'[;]+\s', testo))

    # Evita divisione per zero o testi troppo corti
    if parole == 0 or parole < 10:
        return None

    # Formula Gulpease
    indiceG = 89 + ((300 * punti) - (10 * lettere)) / parole
    
    # Assicura che l'indice sia sempre tra 0 e 100
    indiceG = max(0, min(100, indiceG)) 

    return round(indiceG, 2)

def estrai_versione(filename):
    ''' Estrae un numero di versione (es. v1.0.0) dal nome file '''
    # Cerca pattern come v1.0.0, v2.3, ecc.
    match = re.search(r'v(\d+\.\d+(\.\d+)?)', filename)
    if match:
        return match.group(0) # Ritorna es. "v1.0.0"
    return None

def build_file_tree(directory):
    '''
    Analizza ricorsivamente la directory e crea un albero (dict)
    di cartelle e file, calcolando Gulpease per i PDF.
    '''
    tree = {}

    # Itera su tutte le cartelle e sottocartelle
    for root, dirs, files in os.walk(directory, topdown=True):
        # Escludi cartelle nascoste (es. .git)
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        files = [f for f in files if not f.startswith('.')]

        # Calcola il percorso relativo (es. "01_Capitolati/Documenti_Esterni")
        relative_path = os.path.relpath(root, directory)

        # Naviga la struttura del dizionario 'tree' per trovare il posto giusto
        current_level = tree
        if relative_path != '.':
            parts = relative_path.split(os.sep)
            for part in parts:
                # Crea la sottocartella se non esiste
                current_level = current_level.setdefault(part, {'type': 'folder', 'name': part, 'children': []})['children']
        
        # Aggiungi i file PDF trovati
        for file in files:
            if file.lower().endswith('.pdf'):
                pdf_path = os.path.join(root, file)
                
                # Pulisce il nome del file per la visualizzazione
                clean_name = os.path.splitext(file)[0].replace('_', ' ')

                # Crea il percorso web relativo: es. ../docs/01_Capitolati/file.pdf
                web_path = f'../{pdf_path.replace(os.sep, "/")}'

                file_data = {
                    'type': 'file',
                    'name': clean_name,       # Nome pulito
                    'path': web_path,         # Percorso per il link <a>
                    'version': estrai_versione(clean_name),
                    'gulpease': calcola_indice_gulpease(pdf_path)
                }
                current_level.append(file_data)
                
                print(f"Processato: {pdf_path} (Gulpease: {file_data['gulpease']})")

    # Pulisce la struttura per il JSON finale
    final_tree = {}
    for key, value in tree.items():
        if value['type'] == 'folder':
            final_tree[key] = value['children'] # Mette solo i figli delle cartelle radice
            
    return final_tree


if __name__ == "__main__":
    # --- CONFIGURAZIONE ---
    
    # Lo script è in 'site/', quindi sale di uno ('..') per trovare 'docs/'
    directory_docs = '../docs' 
    
    # Salva il JSON nella stessa cartella dello script ('site/')
    output_json_file = './docs_tree.json' 

    print(f"Avvio scansione della cartella: {directory_docs}")
    
    file_tree = build_file_tree(directory_docs)
    
    # Scrive il dizionario 'final_tree' nel file JSON
    try:
        with open(output_json_file, 'w', encoding='utf-8') as f:
            json.dump(file_tree, f, indent=2, ensure_ascii=False)
        print(f"\nAlbero dei file salvato con successo in: {output_json_file}")
    except Exception as e:
        print(f"\nErrore durante la scrittura del file JSON: {e}")