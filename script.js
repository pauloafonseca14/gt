document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formTicket');
    const listaTickets = document.getElementById('lista');
    const checkEdicao = document.getElementById('check_edicao');
    const labelEdicao = document.getElementById('label_edicao');
    const inputOutraCategoria = document.getElementById('outra_categoria');
    const campoResolucao = document.getElementById('descricao_resolução');
    const checkResolucao = document.getElementById('check_resolucao');
    const btnInicio = document.getElementById('btn_inicio');
    const btnCriarTicket = document.getElementById('criar_ticket');

    let ticketConsultado = false; 

    // Função para carregar lista com bypass no catch em caso de erro/vazio
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
            // Bypass: Silencia o erro caso o BD não esteja acessível ou vazio
            console.log("Aviso: Banco de dados não disponível ou vazio."); 
            listaTickets.innerHTML = '<option value="" disabled selected>Nenhum ticket encontrado</option>';
        }
    }

    // Requisito 3: Ação do ícone início
    btnInicio.addEventListener('click', () => {
        form.reset();
        ticketConsultado = false;
        
        // Reset da UI de Edição
        checkEdicao.checked = false;
        checkEdicao.disabled = true; 
        labelEdicao.style.color = "#6c757d";
        labelEdicao.textContent = "Habilitar edição (Consultar primeiro)";
        
        btnCriarTicket.disabled = false; // Permite criar novo ticket
        gerenciarCampos(true); // Inputs livres para novo ticket
        carregarLista(); // Tenta recarregar lista (com bypass)
    });

    function gerenciarCampos(permitir) {
        const seletores = 'input:not(#check_edicao), textarea, select:not(#lista)';
        form.querySelectorAll(seletores).forEach(campo => {
            campo.disabled = !permitir;
        });
        
        if (permitir) {
            // Lógica específica para categoria "Outro"
            inputOutraCategoria.disabled = !document.getElementById('catZ').checked;
            campoResolucao.disabled = !checkResolucao.checked;
        }
    }

    // Monitora mudanças nos radios de categoria (Criação ou Edição ativa)
    form.addEventListener('change', (e) => {
        if (e.target.name === 'categoria') {
            const isOutro = document.getElementById('catZ').checked;
            if (!ticketConsultado || checkEdicao.checked) {
                inputOutraCategoria.disabled = !isOutro;
                if (!isOutro) inputOutraCategoria.value = "";
            }
        }
    });

    checkEdicao.addEventListener('change', () => {
        if (ticketConsultado) {
            gerenciarCampos(checkEdicao.checked);
        }
    });

    // Requisito 2: Consulta desabilita apenas Criar Ticket
    async function consultarTicket(id) {
        form.reset();
        try {
            const response = await fetch(`http://127.0.0.1:8000/consultar_ticket/${id}`);
            if (response.ok) {
                const d = await response.json();
                preencherDados(d);
                
                ticketConsultado = true; 
                btnCriarTicket.disabled = true; // Bloqueia criação
                
                // Ativa controle de edição
                checkEdicao.disabled = false;
                checkEdicao.checked = false;
                labelEdicao.style.color = "#0056b3";
                labelEdicao.textContent = "Habilitar campos para edição";
                
                gerenciarCampos(false); 
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
            inputOutraCategoria.disabled = true;
        } else {
            document.getElementById('catZ').checked = true;
            inputOutraCategoria.value = d.categoria;
            inputOutraCategoria.disabled = true; 
        }

        document.getElementById('nome_contato').value = d.nome_contato;
        document.getElementById('email_contato').value = d.email_contato;
        document.getElementById('telefone_contato').value = d.telefone_contato;
        document.getElementById('descricao_problema').value = d.descricao;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const acao = e.submitter.id;

        if (acao === 'consultar_ticket') {
            const id = listaTickets.value;
            if (id) await consultarTicket(id);
            else alert("Selecione um ticket.");
        } else if (acao === 'criar_ticket') {
            const formData = new FormData(form);
            const dados = Object.fromEntries(formData.entries());
            
            // Tratamento para salvar "Outra Categoria" corretamente
            if (dados.categoria === "Outro") {
                dados.categoria = dados.outra_categoria;
            }

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

    checkResolucao.addEventListener('change', () => {
        if (!ticketConsultado || checkEdicao.checked) {
            campoResolucao.disabled = !checkResolucao.checked;
        }
    });

    // Inicialização da página
    carregarLista();
});