import json
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import Column, String, Integer, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import strdb

# 1. Configuração do Banco de Dados
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
    # Melhoria: Campo para persistir as atualizações vinculadas
    atualizacoes = Column(String, nullable=True)

Base.metadata.create_all(bind=engine)

class Jsonfromjs(BaseModel):
    ticket: str 
    categoria: str
    nome_contato: str 
    email_contato: str 
    telefone_contato: str 
    descricao: str 
    nivel_suporte: str
    # Melhoria: Campo opcional no Pydantic para receber a atualização
    atualizacoes: Optional[str] = None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get('/listar_tickets')
async def listar_tickets(db: Session = Depends(get_db)):
    tickets = db.query(TicketModel).all()
    return [
        {
            "id": t.id,
            "ticket": t.ticket_ref,
            "nivel_suporte": t.nivel_suporte,
            "categoria": t.categoria
        } for t in tickets
    ]

@app.post('/criar_ticket')
async def criar_item(post_ticket: Jsonfromjs, db: Session = Depends(get_db)):
    try:
        novo_ticket_db = TicketModel(
            ticket_ref=post_ticket.ticket,
            categoria=post_ticket.categoria,
            nome_contato=post_ticket.nome_contato,
            email_contato=post_ticket.email_contato,
            telefone_contato=post_ticket.telefone_contato,
            descricao=post_ticket.descricao,
            nivel_suporte=post_ticket.nivel_suporte,
            atualizacoes=post_ticket.atualizacoes
        )
        db.add(novo_ticket_db)
        db.commit()
        db.refresh(novo_ticket_db)
        return {"id_gerado": novo_ticket_db.id, "ticket": post_ticket.ticket}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/consultar_ticket/{ticket_id}')
async def consultar_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(TicketModel).filter(TicketModel.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")
    return {
        "id": ticket.id,
        "ticket": ticket.ticket_ref,
        "categoria": ticket.categoria,
        "nome_contato": ticket.nome_contato,
        "email_contato": ticket.email_contato,
        "telefone_contato": ticket.telefone_contato,
        "descricao": ticket.descricao,
        "nivel_suporte": ticket.nivel_suporte,
        "atualizacoes": ticket.atualizacoes # Retorna o conteúdo vinculado se houver
    }

# Melhoria: Endpoint para persistir o conteúdo da textarea no BD
@app.put('/atualizar_ticket/{ticket_id}')
async def atualizar_ticket(ticket_id: int, dados: Jsonfromjs, db: Session = Depends(get_db)):
    ticket_db = db.query(TicketModel).filter(TicketModel.id == ticket_id).first()
    if not ticket_db:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")
    
    try:
        # Vincula o novo conteúdo da textarea ao ticket sob consulta
        ticket_db.atualizacoes = dados.atualizacoes
        db.commit()
        db.refresh(ticket_db)
        return {"message": "Ticket atualizado com sucesso", "id": ticket_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))