document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formTicket');
    const listaTickets = document.getElementById('lista');
    const checkAtualizacao = document.getElementById('check_atualizacao');
    const txtAtualizacao = document.getElementById('txt_atualizacao');
    const btnInicio = document.getElementById('btn_inicio');
    const btnCriarTicket = document.getElementById('criar_ticket');
    const inputTicketConsulta = document.getElementById('ticket_em_consulta');
    const inputOutraCategoria = document.getElementById('outra_categoria');
    const campoResolucao = document.getElementById('descricao_resolução');
    const checkResolucao = document.getElementById('check_resolucao');

    let ticketIdConsultado = null; 

    async function carregarLista() {
        try {
            const response = await fetch('http://127.0.0.1:8000/listar_tickets');
            if (response.ok) {
                const tickets = await response.json();
                listaTickets.innerHTML = '<option value="" disabled selected>Escolher ticket</option>';
                
                tickets.forEach(t => {
                    if (ticketIdConsultado && t.id == ticketIdConsultado) return;

                    const opt = document.createElement('option');
                    opt.value = t.id;
                    opt.textContent = `#${t.id} | ${t.status} | ${t.ticket} | ${t.nivel_suporte}`;
                    listaTickets.appendChild(opt);
                });
            }
        } catch (e) { console.error("Erro ao listar", e); }
    }

    async function consultarTicket(id) {
        const infoTexto = listaTickets.options[listaTickets.selectedIndex].text;
        ticketIdConsultado = id; 

        try {
            const response = await fetch(`http://127.0.0.1:8000/consultar_ticket/${id}`);
            if (response.ok) {
                const d = await response.json();
                form.reset();
                preencherDados(d);

                inputTicketConsulta.value = infoTexto; 
                
                btnCriarTicket.disabled = true;
                gerenciarBloqueioCampos(true);
                
                checkAtualizacao.disabled = false; 
                checkResolucao.disabled = false;

                if (d.atualizacoes) {
                    txtAtualizacao.value = d.atualizacoes;
                    txtAtualizacao.style.display = 'block';
                    txtAtualizacao.disabled = true; 
                }
                
                carregarLista();
            }
        } catch (e) { alert("Erro ao consultar"); }
    }

    btnInicio.addEventListener('click', () => {
        ticketIdConsultado = null;
        form.reset();
        inputTicketConsulta.value = "";
        btnCriarTicket.disabled = false;
        txtAtualizacao.style.display = 'none';
        campoResolucao.disabled = true; // Garante que o campo de resolução volte a ficar bloqueado
        gerenciarBloqueioCampos(false);
        carregarLista();
    });

    form.addEventListener('change', (e) => {
        if (e.target.name === 'categoria') {
            const isOutro = document.getElementById('catZ').checked;
            if (!ticketIdConsultado) {
                inputOutraCategoria.disabled = !isOutro;
                if (!isOutro) inputOutraCategoria.value = "";
            }
        }
    });

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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const acao = e.submitter.id;

        if (acao === 'consultar_ticket') {
            if (listaTickets.value) await consultarTicket(listaTickets.value);
            else alert("Selecione um ticket.");
        } 
        else if (acao === 'atualizar_ticket' || acao === 'encerrar_ticket') {
            // Melhoria: Coleta o conteúdo de resolucao somente no encerramento
            const dados = {
                ticket: form.ticket.value,
                categoria: form.categoria.value === "Outro" ? inputOutraCategoria.value : form.categoria.value,
                nome_contato: form.nome_contato.value,
                email_contato: form.email_contato.value,
                telefone_contato: form.telefone_contato.value,
                descricao: document.getElementById('descricao_problema').value,
                nivel_suporte: form.nivel_suporte.value,
                atualizacoes: txtAtualizacao.value,
                resolucao: acao === 'encerrar_ticket' ? campoResolucao.value : null, // Envio do novo campo
                status: acao === 'encerrar_ticket' ? "Encerrado" : null
            };
            
            const response = await fetch(`http://127.0.0.1:8000/atualizar_ticket/${ticketIdConsultado}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(dados)
            });

            if (response.ok) {
                btnInicio.click();
            } else {
                alert("Erro ao processar a solicitação.");
            }
        }
        else if (acao === 'criar_ticket') {
            const formData = new FormData(form);
            const obj = Object.fromEntries(formData.entries());
            if (obj.categoria === "Outro") obj.categoria = inputOutraCategoria.value;

            await fetch('http://127.0.0.1:8000/criar_ticket', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(obj)
            });
            btnInicio.click();
        }
    });

    function gerenciarBloqueioCampos(bloquear) {
        const seletores = 'input:not(#check_atualizacao):not(#check_resolucao), textarea:not(#txt_atualizacao):not(#descricao_resolução), select:not(#lista)';
        form.querySelectorAll(seletores).forEach(c => c.disabled = bloquear);
        if (!bloquear) {
            inputOutraCategoria.disabled = true;
            campoResolucao.disabled = true;
            checkAtualizacao.disabled = true;
            checkResolucao.disabled = true;
        }
    }

    function preencherDados(d) {
        document.getElementById('nome_contato').value = d.nome_contato;
        document.getElementById('email_contato').value = d.email_contato;
        document.getElementById('telefone_contato').value = d.telefone_contato;
        document.getElementById('descricao_problema').value = d.descricao;
        
        // Melhoria: Preenche o campo de resolução com os dados vindos do BD
        if (d.resolucao) {
            campoResolucao.value = d.resolucao;
        }

        const rTicket = form.querySelector(`input[name="ticket"][value="${d.ticket}"]`);
        if(rTicket) rTicket.checked = true;
        const rNivel = form.querySelector(`input[name="nivel_suporte"][value="${d.nivel_suporte}"]`);
        if(rNivel) rNivel.checked = true;
        const rCat = form.querySelector(`input[name="categoria"][value="${d.categoria}"]`);
        if(rCat) rCat.checked = true; 
        else {
            document.getElementById('catZ').checked = true;
            inputOutraCategoria.value = d.categoria;
            inputOutraCategoria.disabled = true;
        }
    }

    carregarLista();
});