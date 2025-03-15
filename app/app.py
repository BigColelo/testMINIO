from flask import Flask, request, send_file
from flask_cors import CORS
from minio import Minio
from minio.error import S3Error
import os
import io
from flask_restx import Api, Resource, fields, abort
from dotenv import load_dotenv
import zipfile
import tempfile
import os

# Carica le variabili d'ambiente dal file .env
load_dotenv()

app = Flask(__name__)
# Configurazione di Flask-RestX
api = Api(
    app,
    version="1.0",
    title="MinIO Flask API",
    description="API per interagire con MinIO: upload, download e visualizzazione dei file.",
    doc="/swagger"  # URL per accedere alla documentazione Swagger
)
CORS(app, resources={r"*": {"origins": "*"}})

# Funzione che forza l'header CORS per ogni richiesta
@app.after_request
def apply_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

ns = api.namespace('minio-test', description='Test pratico per comprendere minIO')

# Leggi TUTTE le configurazioni di MinIO dalle variabili d'ambiente
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY")
MINIO_BUCKET_NAME = os.getenv("MINIO_BUCKET_NAME")

# Verifica che tutte le variabili d'ambiente siano presenti
if not all([MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET_NAME]):
    raise ValueError("Mancano alcune variabili d'ambiente necessarie per MinIO")

# Inizializza il client MinIO
minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False  # Usa HTTP invece di HTTPS
)

# Crea il bucket se non esiste
if not minio_client.bucket_exists(MINIO_BUCKET_NAME):
    minio_client.make_bucket(MINIO_BUCKET_NAME)


# Namespace per le API
ns = api.namespace("files", description="Operazioni sui file in MinIO")

# Modello per la risposta della lista dei file
file_list_model = api.model("FileList", {
    "files": fields.List(fields.String, description="Lista dei nomi dei file"),
})

# Modello per l'upload di un file
upload_model = api.model("Upload", {
    "message": fields.String(description="Messaggio di conferma dell'upload"),
})

# Endpoint per elencare i file
@ns.route("/")
class FileList(Resource):
    @ns.doc("list_files")
    @ns.marshal_with(file_list_model)
    def get(self):
        """Visualizza tutti i file nel bucket."""
        try:
            objects = minio_client.list_objects(MINIO_BUCKET_NAME, recursive=True)
            files = [obj.object_name for obj in objects]
            return {"files": files}, 200
        except S3Error as e:
            abort(500, message=str(e))

# Endpoint per caricare un file
@ns.route("/upload")
class FileUpload(Resource):
    @ns.doc("upload_file")
    @ns.expect(api.parser().add_argument("file", location="files", type="file", required=True))
    @ns.marshal_with(upload_model, code=201)
    def post(self):
        """Carica un file nel bucket."""
        if "file" not in request.files:
            abort(400, message="Nessun file fornito")
        file = request.files["file"]
        if file.filename == "":
            abort(400, message="Nome file vuoto")
        try:
            file_data = file.read()
            minio_client.put_object(
                MINIO_BUCKET_NAME,
                file.filename,
                data=io.BytesIO(file_data),
                length=len(file_data),
                content_type=file.content_type
            )
            return {"message": f"File '{file.filename}' caricato con successo"}, 201
        except S3Error as e:
            abort(500, message=str(e))

# Endpoint per scaricare un file
@ns.route("/download/<string:filename_prefix>")
class FileDownload(Resource):
    @ns.doc("download_file")
    def get(self, filename_prefix):
        """Download files that start with the given prefix from the bucket as a ZIP file."""
        try:
            # List all objects that start with the given prefix
            objects = minio_client.list_objects(MINIO_BUCKET_NAME, prefix=filename_prefix)
            
            # Get all matching files
            matching_files = list(objects)
            if not matching_files:
                abort(404, message=f"No files found starting with '{filename_prefix}'")
            
            # Create a temporary directory to store files
            with tempfile.TemporaryDirectory() as temp_dir:
                # Create a ZIP file
                zip_filename = f"{filename_prefix}.zip"
                zip_path = os.path.join(temp_dir, zip_filename)
                
                with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    # Download and add each file to the ZIP
                    for file_obj in matching_files:
                        filename = file_obj.object_name
                        temp_file_path = os.path.join(temp_dir, filename)
                        
                        # Download the file
                        minio_client.fget_object(MINIO_BUCKET_NAME, filename, temp_file_path)
                        
                        # Add file to ZIP
                        zipf.write(temp_file_path, os.path.basename(filename))
                        
                        # Remove temporary file
                        os.remove(temp_file_path)
                
                return send_file(
                    zip_path,
                    mimetype='application/zip',
                    as_attachment=True,
                    download_name=zip_filename
                )
                
        except S3Error as e:
            abort(500, message=str(e))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)