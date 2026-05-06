import json
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import Column, String, Integer, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import strdb

# Configuração do Banco de Dados
DATABASE_URL = f'{strdb.strdb()}'
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class TicketModel(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, index=True)
    ticket_ref = Column(String) 
    categoria = Column(String)
    nome_contato = Column(String)
    email_contato = Column(String)
    telefone_contato = Column(String)
    descricao = Column(String)
    nivel_suporte = Column(String)
    atualizacoes = Column(String, nullable=True)
    resolucao = Column(String, nullable=True)  # Melhoria: Campo para o texto de encerramento
    data_criacao = Column(DateTime, default=datetime.now)
    status = Column(String, default="Aberto/Em Progresso")

Base.metadata.create_all(bind=engine)

# Função para atualizar status com base no tempo (SLA) de forma automática
def calcular_status_sla(ticket: TicketModel):
    if ticket.status == "Encerrado":
        return "Encerrado"
    
    agora = datetime.now()
    diff = agora - ticket.data_criacao
    horas_passadas = diff.total_seconds() / 3600
    
    # Regra original: 4h Incidente, 16h Requisição
    limite = 4 if "Incidente" in (ticket.ticket_ref or "") else 16
    
    if horas_passadas >= limite:
        return "Vencido"
    return "Aberto/Em Progresso"

class Jsonfromjs(BaseModel):
    ticket: str 
    categoria: str
    nome_contato: str 
    email_contato: str 
    telefone_contato: str 
    descricao: str 
    nivel_suporte: str
    atualizacoes: Optional[str] = None
    resolucao: Optional[str] = None  # Melhoria: Novo campo no Schema Pydantic
    status: Optional[str] = None

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@app.get('/listar_tickets')
async def listar_tickets(db: Session = Depends(get_db)):
    tickets = db.query(TicketModel).all()
    lista_retorno = []
    for t in tickets:
        # Atualização transparente no BD durante a listagem (SLA)
        novo_status = calcular_status_sla(t)
        if t.status != novo_status:
            t.status = novo_status
            db.commit()
        
        lista_retorno.append({
            "id": t.id,
            "ticket": t.ticket_ref,
            "nivel_suporte": t.nivel_suporte,
            "data_criacao": t.data_criacao.isoformat(),
            "status": t.status
        })
    return lista_retorno

@app.get('/consultar_ticket/{ticket_id}')
async def consultar_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(TicketModel).filter(TicketModel.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")
    
    # Atualização transparente no BD durante a consulta
    novo_status = calcular_status_sla(ticket)
    if ticket.status != novo_status:
        ticket.status = novo_status
        db.commit()
        db.refresh(ticket)

    return {
        "id": ticket.id,
        "ticket": ticket.ticket_ref,
        "categoria": ticket.categoria,
        "nome_contato": ticket.nome_contato,
        "email_contato": ticket.email_contato,
        "telefone_contato": ticket.telefone_contato,
        "descricao": ticket.descricao,
        "nivel_suporte": ticket.nivel_suporte,
        "atualizacoes": ticket.atualizacoes,
        "resolucao": ticket.resolucao,  # Melhoria: Retorno do texto de resolução
        "status": ticket.status,
        "data_criacao": ticket.data_criacao.isoformat()
    }

@app.post('/criar_ticket')
async def criar_item(post_ticket: Jsonfromjs, db: Session = Depends(get_db)):
    try:
        novo_ticket = TicketModel(
            ticket_ref=post_ticket.ticket,
            categoria=post_ticket.categoria,
            nome_contato=post_ticket.nome_contato,
            email_contato=post_ticket.email_contato,
            telefone_contato=post_ticket.telefone_contato,
            descricao=post_ticket.descricao,
            nivel_suporte=post_ticket.nivel_suporte,
            atualizacoes=post_ticket.atualizacoes,
            status="Aberto/Em Progresso"
        )
        db.add(novo_ticket)
        db.commit()
        db.refresh(novo_ticket)
        return {"id_gerado": novo_ticket.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.put('/atualizar_ticket/{ticket_id}')
async def atualizar_ticket(ticket_id: int, dados: Jsonfromjs, db: Session = Depends(get_db)):
    ticket_db = db.query(TicketModel).filter(TicketModel.id == ticket_id).first()
    if not ticket_db:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")
    
    try:
        # Atualiza campos se fornecidos no JSON
        if dados.status: 
            ticket_db.status = dados.status
        
        # Melhoria: Persiste as atualizações textuais e a resolução de encerramento
        ticket_db.atualizacoes = dados.atualizacoes
        if dados.resolucao:
            ticket_db.resolucao = dados.resolucao
            
        db.commit()
        return {"message": "Sucesso"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))