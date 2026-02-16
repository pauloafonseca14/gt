from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

class JsonIncoming(BaseModel):
    ticket:str 
    categoria:str
    nome_contato: str 
    email_contato: str 
    telefone_contato:str 
    descricao: str 
    nivel_suporte: str

app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permite seu HTML acessar o servidor
    allow_methods=["*"], # Permite POST, OPTIONS, etc.
    allow_headers=["*"],
)
@app.post('/criar_ticket')
async def criar_item(c_ticket:JsonIncoming):
    return c_ticket

