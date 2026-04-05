document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formTicket');
    const listaTickets = document.getElementById('lista');
    const checkAtualizacao = document.getElementById('check_atualizacao');
    const txtAtualizacao = document.getElementById('txt_atualizacao');
    const btnInicio = document.getElementById('btn_inicio');
    const btnCriarTicket = document.getElementById('criar_ticket');
    
    // Elemento de identificação do ticket sob consulta (Item 1 e 2)
    const inputTicketConsulta = document.getElementById('ticket_em_consulta');

    const inputOutraCategoria = document.getElementById('outra_categoria');
    const campoResolucao = document.getElementById('descricao_resolução');
    const checkResolucao = document.getElementById('check_resolucao');

    let ticketIdConsultado = null; 

    // Cálculo de SLA (Item 2 do pedido anterior)
    function calcularSLA(dataCriacao, tipoTicket) {
        const inicio = new Date(dataCriacao);
        const agora = new Date();
        const diffHoras = (agora - inicio) / (1000 * 60 * 60);
        
        // Define o limite: 4h para Incidente, 16h para Requisição
        const limite = tipoTicket.includes("Incidente") ? 4 : 16;
        const progresso = Math.min((diffHoras / limite) * 100, 100).toFixed(1);
        
        return progresso >= 100 ? "⚠️ SLA Vencido" : `⏳ ${progresso}%`;
    }

    // Carregamento da lista com a versão resumida/SLA
    async function carregarLista() {
        try {
            const response = await fetch('http://127.0.0.1:8000/listar_tickets');
            if (response.ok) {
                const tickets = await response.json();
                listaTickets.innerHTML = '<option value="" disabled selected>Escolher ticket</option>';
                tickets.forEach(t => {
                    const slaStatus = calcularSLA(t.data_criacao, t.ticket);
                    const opt = document.createElement('option');
                    opt.value = t.id;
                    // Informação resumida que será mapeada na consulta
                    opt.textContent = `#${t.id} | ${slaStatus} | ${t.ticket} | ${t.nivel_suporte}`;
                    listaTickets.appendChild(opt);
                });
            }
        } catch (e) { 
            listaTickets.innerHTML = '<option value="" disabled selected>Nenhum ticket encontrado</option>';
        }
    }

    // Ação de Início / form.reset() (Item 3)
    btnInicio.addEventListener('click', () => {
        form.reset();
        ticketIdConsultado = null;
        btnCriarTicket.disabled = false;
        txtAtualizacao.style.display = 'none';
        
        // Limpa e garante que o campo de identificação esteja desabilitado
        inputTicketConsulta.value = "";
        inputTicketConsulta.disabled = true;

        gerenciarBloqueioCampos(false); 
        carregarLista();
    });

    // Gerenciamento de bloqueios e estados iniciais (Item 1 e 3)
    function gerenciarBloqueioCampos(bloquear) {
        const seletores = 'input:not(#check_atualizacao):not(#check_resolucao), textarea:not(#txt_atualizacao), select:not(#lista)';
        form.querySelectorAll(seletores).forEach(campo => {
            campo.disabled = bloquear;
        });

        if (!bloquear) {
            inputOutraCategoria.disabled = true;
            campoResolucao.disabled = true;
            checkAtualizacao.disabled = true; // Desabilitado no reset
            checkResolucao.disabled = true;   // Desabilitado no reset
            inputTicketConsulta.disabled = true; // Desabilitado no início
        }
    }

    // ITEM 2: Consultar Ticket e mapear informação da lista
    async function consultarTicket(id) {
        // Mapeia a informação resumida selecionada na lista antes do reset do form
        const infoSelecionada = listaTickets.options[listaTickets.selectedIndex].text;
        
        form.reset();
        try {
            const response = await fetch(`http://127.0.0.1:8000/consultar_ticket/${id}`);
            if (response.ok) {
                const d = await response.json();
                ticketIdConsultado = id;
                
                preencherDados(d);
                
                // Exibe a informação mapeada no novo elemento (Item 2)
                inputTicketConsulta.value = infoSelecionada;
                inputTicketConsulta.disabled = true; // Mantém desabilitado (Item 3)

                btnCriarTicket.disabled = true; 
                gerenciarBloqueioCampos(true); 

                // Habilita as checkboxes após a consulta
                checkAtualizacao.disabled = false; 
                checkResolucao.disabled = false;
                checkAtualizacao.checked = false;
                txtAtualizacao.style.display = 'none';

                if (d.atualizacoes) txtAtualizacao.value = d.atualizacoes;
            }
        } catch (e) { alert("Erro ao consultar ticket."); }
    }

    function preencherDados(d) {
        const rTicket = form.querySelector(`input[name="ticket"][value="${d.ticket}"]`);
        if(rTicket) rTicket.checked = true;
        
        const rNivel = form.querySelector(`input[name="nivel_suporte"][value="${d.nivel_suporte}"]`);
        if(rNivel) rNivel.checked = true;
        
        const rCat = form.querySelector(`input[name="categoria"][value="${d.categoria}"]`);
        if (rCat) {
            rCat.checked = true;
        } else {
            document.getElementById('catZ').checked = true;
            inputOutraCategoria.value = d.categoria;
        }

        document.getElementById('nome_contato').value = d.nome_contato;
        document.getElementById('email_contato').value = d.email_contato;
        document.getElementById('telefone_contato').value = d.telefone_contato;
        document.getElementById('descricao_problema').value = d.descricao;
    }

    // Listeners para as Checkboxes
    checkResolucao.addEventListener('change', () => {
        campoResolucao.disabled = !checkResolucao.checked;
    });

    checkAtualizacao.addEventListener('change', () => {
        if (checkAtualizacao.checked) {
            txtAtualizacao.style.display = 'block';
            txtAtualizacao.disabled = false; 
        } else {
            txtAtualizacao.style.display = 'none';
        }
    });

    // Lógica de envio do formulário (Criar e Atualizar)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const acao = e.submitter.id;

        if (acao === 'consultar_ticket') {
            const id = listaTickets.value;
            if (id) await consultarTicket(id);
            else alert("Selecione um ticket.");

        } else if (acao === 'atualizar_ticket') {
            if (!ticketIdConsultado) return alert("Consulte um ticket antes de atualizar.");

            const dadosAtualizacao = {
                ticket: form.ticket.value,
                categoria: form.categoria.value === "Outro" ? inputOutraCategoria.value : form.categoria.value,
                nome_contato: form.nome_contato.value,
                email_contato: form.email_contato.value,
                telefone_contato: form.telefone_contato.value,
                descricao: form.descricao.value,
                nivel_suporte: form.nivel_suporte.value,
                atualizacoes: txtAtualizacao.value
            };

            try {
                const response = await fetch(`http://127.0.0.1:8000/atualizar_ticket/${ticketIdConsultado}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosAtualizacao)
                });
                if (response.ok) {
                    alert("Ticket atualizado!");
                    btnInicio.click();
                }
            } catch (e) { alert("Erro ao atualizar."); }

        } else if (acao === 'criar_ticket') {
            const formData = new FormData(form);
            const dados = Object.fromEntries(formData.entries());
            if (dados.categoria === "Outro") dados.categoria = inputOutraCategoria.value;

            try {
                const response = await fetch('http://127.0.0.1:8000/criar_ticket', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                });
                if (response.ok) {
                    alert("Criado com sucesso!");
                    btnInicio.click();
                }
            } catch (e) { alert("Erro ao criar."); }
        }
    });

    // Inicialização da interface
    gerenciarBloqueioCampos(false);
    carregarLista();
});