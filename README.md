# QualiQA — Sistema de Gerenciamento de Testes QA/Dev

## 🚀 Como Iniciar

### Opção 1: Script automático (recomendado)

Abra o PowerShell na pasta do projeto e execute:

```powershell
cd c:\Users\Work\Desktop\QualiQA
.\start.ps1
```

Isso abrirá 3 janelas:
- **Node API** → http://localhost:3001
- **Python API** → http://localhost:8000
- **Frontend** → http://localhost:5173

---

### Opção 2: Iniciar manualmente

Abra **3 terminais PowerShell** e execute em cada um:

**Terminal 1 — Backend Node.js:**
```powershell
$env:PATH = "C:\Program Files\nodejs;$env:PATH"
cd c:\Users\Work\Desktop\QualiQA\backend-node
npm run dev
```

**Terminal 2 — Backend Python:**
```powershell
cd c:\Users\Work\Desktop\QualiQA\backend-python
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 3 — Frontend React:**
```powershell
$env:PATH = "C:\Program Files\nodejs;$env:PATH"
cd c:\Users\Work\Desktop\QualiQA\frontend
npm run dev
```

---

## 📋 Stack

| Camada | Tecnologia | Porta |
|--------|-----------|-------|
| Frontend | React + Vite | 5173 |
| Backend API | Node.js + Express | 3001 |
| Analytics/Uploads | Python + FastAPI | 8000 |
| Banco de Dados | SQLite (sql.js) | — |

## 🔐 Primeiro Acesso

1. Abra http://localhost:5173
2. Clique em **"Criar conta"**
3. Preencha nome, email e senha (mín. 6 caracteres)
4. Pronto! Você será redirecionado ao Dashboard
