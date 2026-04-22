import os
import uuid
import aiofiles
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.schemas import UploadResponse

router = APIRouter()

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg', '.gif', '.txt', '.csv', '.zip'}


@router.post("/scope", response_model=UploadResponse)
async def upload_scope_file(file: UploadFile = File(...)):
    """Upload de arquivo de escopo do projeto"""
    
    # Validar extensão
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de arquivo não permitido. Extensões aceitas: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Gerar nome único
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOADS_DIR, unique_name)

    # Salvar arquivo
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    
    size = 0
    async with aiofiles.open(file_path, 'wb') as f:
        while chunk := await file.read(8192):
            size += len(chunk)
            if size > MAX_FILE_SIZE:
                os.remove(file_path)
                raise HTTPException(status_code=413, detail="Arquivo muito grande. Máximo: 10MB")
            await f.write(chunk)

    return UploadResponse(
        filename=file.filename,
        url=f"/uploads/{unique_name}",
        size=size
    )


@router.delete("/{filename}")
async def delete_file(filename: str):
    """Deletar um arquivo enviado"""
    file_path = os.path.join(UPLOADS_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    
    os.remove(file_path)
    return {"message": "Arquivo excluído com sucesso"}
