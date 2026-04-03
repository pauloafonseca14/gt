document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formTicket');
    const listaTickets = document.getElementById('lista');
    const checkAtualizacao = document.getElementById('check_atualizacao');
    const txtAtualizacao = document.getElementById('txt_atualizacao');
    const btnInicio = document.getElementById('btn_inicio');
    const btnCriarTicket = document.getElementById('criar_ticket');

    // --- NOVAS CONSTANTES INTEGRADAS ---
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
                    const opt = document.createElement('option');
                    opt.value = t.id;
                    opt.textContent = `#${t.id} | ${t.ticket} | ${t.nivel_suporte} | ${t.categoria}`;
                    listaTickets.appendChild(opt);
                });
            }
        } catch (e) { 
            console.log("Aviso: Banco de dados não disponível ou vazio."); 
            listaTickets.innerHTML = '<option value="" disabled selected>Nenhum ticket encontrado</option>';
        }
    }

    btnInicio.addEventListener('click', () => {
        form.reset();
        ticketIdConsultado = null;
        btnCriarTicket.disabled = false;
        
        txtAtualizacao.style.display = 'none';
        txtAtualizacao.value = '';
        
        gerenciarBloqueioCampos(false); 
        carregarLista();
    });

    // Lógica de Bloqueio Atualizada para incluir os novos campos
    function gerenciarBloqueioCampos(bloquear) {
        const seletores = 'input:not(#check_atualizacao), textarea:not(#txt_atualizacao), select:not(#lista)';
        form.querySelectorAll(seletores).forEach(campo => {
            campo.disabled = bloquear;
        });

        // Se estivermos desbloqueando (Novo Ticket), aplicamos a trava lógica inicial
        if (!bloquear) {
            inputOutraCategoria.disabled = !document.getElementById('catZ').checked;
            campoResolucao.disabled = !checkResolucao.checked;
        }
    }

    // Ouvintes de evento para comportamento dinâmico (Idêntico ao script1)
    form.addEventListener('change', (e) => {
        if (e.target.name === 'categoria') {
            const isOutro = document.getElementById('catZ').checked;
            // Só altera se não estiver em modo de consulta bloqueado
            if (!ticketIdConsultado) {
                inputOutraCategoria.disabled = !isOutro;
                if (!isOutro) inputOutraCategoria.value = "";
            }
        }
    });

    checkResolucao.addEventListener('change', () => {
        if (!ticketIdConsultado) {
            campoResolucao.disabled = !checkResolucao.checked;
        }
    });

    checkAtualizacao.addEventListener('change', () => {
        if (checkAtualizacao.checked) {
            txtAtualizacao.style.display = 'block';
            txtAtualizacao.disabled = false; 
        } else {
            txtAtualizacao.style.display = 'none';
        }
    });

    async function consultarTicket(id) {
        form.reset();
        try {
            const response = await fetch(`http://127.0.0.1:8000/consultar_ticket/${id}`);
            if (response.ok) {
                const d = await response.json();
                ticketIdConsultado = id;
                
                preencherDados(d);
                btnCriarTicket.disabled = true; 
                gerenciarBloqueioCampos(true); // Bloqueia tudo, incluindo os novos campos

                if (d.atualizacoes) {
                    checkAtualizacao.checked = true;
                    txtAtualizacao.value = d.atualizacoes;
                    txtAtualizacao.style.display = 'block';
                    txtAtualizacao.disabled = true; 
                } else {
                    checkAtualizacao.checked = false;
                    txtAtualizacao.style.display = 'none';
                    txtAtualizacao.value = '';
                }
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
        
        // Preenchimento do campo de resolução se existir no banco
        if (d.resolucao) {
            campoResolucao.value = d.resolucao;
            checkResolucao.checked = true;
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const acao = e.submitter.id;

        if (acao === 'consultar_ticket') {
            const id = listaTickets.value;
            if (id) await consultarTicket(id);
            else alert("Selecione um ticket.");

        } else if (acao === 'atualizar_ticket') {
            if (!ticketIdConsultado) {
                alert("Consulte um ticket antes de atualizar.");
                return;
            }

            const dadosAtualizacao = {
                ticket: form.ticket.value,
                categoria: form.categoria.value === "Outro" ? inputOutraCategoria.value : form.categoria.value,
                nome_contato: form.nome_contato.value,
                email_contato: form.email_contato.value,
                telefone_contato: form.telefone_contato.value,
                descricao: form.descricao.value,
                nivel_suporte: form.nivel_suporte.value,
                atualizacoes: txtAtualizacao.value,
                resolucao: checkResolucao.checked ? campoResolucao.value : null
            };

            try {
                const response = await fetch(`http://127.0.0.1:8000/atualizar_ticket/${ticketIdConsultado}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosAtualizacao)
                });
                if (response.ok) {
                    alert("Atualizações salvas com sucesso!");
                    await consultarTicket(ticketIdConsultado); 
                }
            } catch (e) { alert("Erro ao atualizar ticket."); }

        } else if (acao === 'criar_ticket') {
            const formData = new FormData(form);
            const dados = Object.fromEntries(formData.entries());
            
            if (dados.categoria === "Outro") dados.categoria = inputOutraCategoria.value;
            if (checkResolucao.checked) dados.resolucao = campoResolucao.value;

            try {
                const response = await fetch('http://127.0.0.1:8000/criar_ticket', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                });
                if (response.ok) {
                    alert("Ticket criado com sucesso!");
                    form.reset();
                    carregarLista();
                }
            } catch (e) { alert("Erro ao criar ticket."); }
        }
    });

    carregarLista();
});