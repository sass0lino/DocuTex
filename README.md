# Obiettivi della Build

Questo documento descrive la logica di funzionamento della build implementata con github action. 
L’obiettivo di questa build è quello di mantenere **coerenza e consistenza** tra i file sorgenti latex e i rispettivi pdf.
Nello specifico la build garantisce che:
- `src/` e `docs/` sono perfettamente allineati;  
- ogni file pdf presente in `docs/` é generato esclusivamente dalla build di github action
- i documenti latex che falliscono la compilazione non avranno il rispettivo documento pdf (nemmeno la versione precedente alla build)
- non esistono PDF orfani o obsoleti;  

# Regole di utilizzo
1) caricare tutti i file `.tex` nella cartella `src/`, la build di compilazione infatti si attiva solo in tal caso
2) potete caricare progetti .tex standalone (monolitici) oppure progetti multi-file

Attenzione: per i progetti multi-file è importante che esista un file .tex principale (cioè il file principale da compilare) e che tutti i file secondari o inclusi siano collocati in un sottocartella denominata esattamente `contenuti/`.

# Struttura logica del processo

### **STEP 1 – Pulizia e Consistenza**
Scopo: rimuovere ogni elemento non coerente o non generato dal sistema:
1. Elimina i **PDF orfani**, ossia presenti in `docs/` ma senza `.tex` corrispondente.  
2. Rimuove i **PDF aggiunti o modificati manualmente** dagli utenti.  

### **STEP 2 – Analisi delle Differenze e Preparazione della Lista di Compilazione**
Scopo: creazione della `compile_list.txt` dei file da compilare:
1. Determina l’**ultimo commit automatico di build** (`Automated LaTeX build`), che rappresenta lo stato coerente più recente.
2. Confronta (`git diff`) i cambiamenti rispetto a quel commit:
   - trova tutti i file `.tex` **modificati, aggiunti o rinominati**;  
   - se un file modificato è in una cartella `contenuti/`, risale al suo file “padre”.
3. Esegue uno **scanner di integrità** per individuare i `.tex` “padre” che **non hanno un PDF corrispondente** in `docs/`.  
4. I risultati dei punti 2 e 3 vengono **uniti nella lista finale** (`compile_list.txt`) dei file da compilare.

### **STEP 3 – Compilazione Automatica e Generazione del Report**
Scopo: ricompilare i file identificati e aggiornare il report del repository:
1. Elimina i PDF esistenti relativi ai file che verranno ricompilati.  
2. Compila i `.tex` all’interno di un container Docker (`texlive-full`)  per garantire un ambiente stabile e identico per tutti (se la lista dei file da compilare è vuota (cioè tutto è già coerente), la build non scarica l'immagine docker per la compilazione dei file latex dato che sarebbe solo una perdita di tempo).
3. Per ogni file `.tex`:
   - se la compilazione riesce → sposta il PDF in `docs/`;
   - se fallisce → registra l’errore nel log della build.  
4. Genera un file `build_report.md` con:
   - una riga iniziale che indica **il commit di base** usato per la compilazione:
     ```
     Compilazione basata su commit 7a4e1c2 (base: 7a4e1c2)
     ```
   - l’elenco dei file falliti (❌) con link alla build GitHub;
   - l’elenco dei file compilati (✅) con link diretto ai PDF;

### **STEP 4 – Commit Automatico dei Risultati**
Scopo: salvare lo stato aggiornato e coerente del repository:
1. Se sono stati generati o aggiornati PDF, crea un commit automatico: `Automated LaTeX build (base: <SHA>)` dove `<SHA>` è il commit della precedente build automatica ritenuta coerente.  
2. Questo commit diventa il nuovo **punto di riferimento** per la prossima build (in pratica, ogni commit “Automated LaTeX build”rappresenta uno **snapshot coerente** tra `src/` e `docs/`).

# **Informazioni di compilazione**
- **Compilatore:** `latexmk`  
- **Ambiente:** Docker `ghcr.io/xu-cheng/texlive-full`

# **Varie ed eventuali da sistemare/aggiungere**
- commenti del file yaml
- implementare l'autocompilazione anche in caso di modifica di immagini
- generalizzare il sistema di build dei progetti multi-file eliminando il vincolo della cartella `contenuti/`


