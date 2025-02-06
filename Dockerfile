# Usa una versione ufficiale di Python come immagine base
FROM python:3.9-slim

# Imposta la directory di lavoro all'interno del container
WORKDIR /app

# Copia il file requirements.txt nella directory di lavoro del container
COPY app/requirements.txt .

# Crea un nuovo ambiente virtuale
RUN python -m venv .venv

# Assicurati che pip sia aggiornato
RUN .venv/bin/pip install --upgrade pip

# Installa le dipendenze nel nuovo ambiente virtuale
RUN .venv/bin/pip install --no-cache-dir -r requirements.txt

# Copia il contenuto del tuo progetto nella directory di lavoro del container
COPY app/ /app/

# Imposta la variabile d'ambiente per usare l'ambiente virtuale
ENV PATH="/app/.venv/bin:$PATH"

# Espone la porta su cui Flask gira
EXPOSE 5000

# Comando per avviare l'applicazione
CMD ["python", "app.py"]