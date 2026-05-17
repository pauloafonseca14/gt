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

    // Seletores dos novos elementos da funcionalidade de relatórios
    const secaoRelatorio = document.getElementById('secao_relatorio');
    const txtResultadoRelatorio = document.getElementById('txt_resultado_relatorio');
    const btnLimparFiltros = document.getElementById('btn_limpar_filtros');

    let ticketIdConsultado = null; 

    // Estado global da query parameter de filtros acumulativos
    let filtrosAtivos = {
        ticket: null,
        nivel_suporte: null,
        categoria: null,
        status: null,
        com_atualizacao: null
    };

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

    // Função responsável por construir e disparar a query de busca dinâmica
    async function executarRelatorio() {
        let url = new URL('http://127.0.0.1:8000/gerar_relatorio');
        
        if (filtrosAtivos.ticket) url.searchParams.append('ticket', filtrosAtivos.ticket);
        if (filtrosAtivos.nivel_suporte) url.searchParams.append('nivel_suporte', filtrosAtivos.nivel_suporte);
        if (filtrosAtivos.categoria) url.searchParams.append('categoria', filtrosAtivos.categoria);
        if (filtrosAtivos.status) url.searchParams.append('status', filtrosAtivos.status);
        if (filtrosAtivos.com_atualizacao) url.searchParams.append('com_atualizacao', filtrosAtivos.com_atualizacao);

        try {
            const response = await fetch(url);
            if (response.ok) {
                const dados = await response.json();
                if (dados.length === 0) {
                    txtResultadoRelatorio.value = "Nenhum registro encontrado para os critérios selecionados.";
                    return;
                }

                let textoFormatado = `=== RELATÓRIO DE TICKETS EXTRAÍDO EM ${new Date().toLocaleString()} ===\n`;
                textoFormatado += `Total de registros encontrados: ${dados.length}\n`;
                textoFormatado += `----------------------------------------------------------------------\n\n`;

                dados.forEach(t => {
                    textoFormatado += `ID: #${t.id}\n`;
                    textoFormatado += `Tipo: ${t.ticket}\n`;
                    textoFormatado += `Status: ${t.status}\n`;
                    textoFormatado += `Nível: ${t.nivel_suporte} | Categoria: ${t.categoria}\n`;
                    textoFormatado += `Contato: ${t.nome_contato} (${t.email_contato} / ${t.telefone_contato})\n`;
                    textoFormatado += `Data Criação: ${new Date(t.data_criacao).toLocaleString()}\n`;
                    if (t.data_encerramento) textoFormatado += `Data Encerramento: ${new Date(t.data_encerramento).toLocaleString()}\n`;
                    textoFormatado += `Descrição: ${t.descricao}\n`;
                    if (t.atualizacoes) textoFormatado += `Atualizações: ${t.atualizacoes}\n`;
                    if (t.resolucao) textoFormatado += `Resolução: ${t.resolucao}\n`;
                    textoFormatado += `\n========================================\n\n`;
                });

                txtResultadoRelatorio.value = textoFormatado;
            }
        } catch (e) {
            txtResultadoRelatorio.value = "Erro ao processar/carregar dados do relatório.";
        }
    }

    // Monitora as seleções dos botões de rádio do relatório (atualiza o critério de busca acumulativo)
    document.querySelectorAll('input[name="filtro_relatorio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const id = e.target.id;
            const valor = e.target.value;

            if (id === 'rel_req' || id === 'rel_inc') {
                filtrosAtivos.ticket = valor;
            } else if (id === 'rel_n1' || id === 'rel_n2' || id === 'rel_n3') {
                filtrosAtivos.nivel_suporte = valor;
            } else if (id === 'rel_catX' || id === 'rel_catY' || id === 'rel_catZ') {
                filtrosAtivos.categoria = valor;
            } else if (id.startsWith('rel_status_')) {
                filtrosAtivos.status = valor;
            } else if (id === 'rel_com_atualizacao') {
                filtrosAtivos.com_atualizacao = true;
            }

            executarRelatorio();
        });
    });

    // Evento do botão para limpar filtros do relatório
    if (btnLimparFiltros) {
        btnLimparFiltros.addEventListener('click', () => {
            document.querySelectorAll('input[name="filtro_relatorio"]').forEach(r => r.checked = false);
            filtrosAtivos = { ticket: null, nivel_suporte: null, categoria: null, status: null, com_atualizacao: null };
            txtResultadoRelatorio.value = "";
        });
    }

    btnInicio.addEventListener('click', () => {
        ticketIdConsultado = null;
        form.reset();
        inputTicketConsulta.value = "";
        btnCriarTicket.disabled = false;
        txtAtualizacao.style.display = 'none';
        campoResolucao.disabled = true; 
        gerenciarBloqueioCampos(false);
        
        // Esconde a seção de relatório ao retornar para o início
        if (secaoRelatorio) {
            secaoRelatorio.style.display = 'none';
            btnLimparFiltros.click();
        }
        
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

        // Nova ação vinculada ao botão "Relatórios"
        if (acao === 'relatorio_ticket') {
            if (secaoRelatorio.style.display === 'none') {
                secaoRelatorio.style.display = 'flex';
                secaoRelatorio.style.flexDirection = 'column';
                await executarRelatorio(); // Executa sem parâmetros inicialmente trazendo a base completa
            } else {
                secaoRelatorio.style.display = 'none';
            }
            return; // Interrompe para evitar o fluxo padrão de criação ou atualização do formulário
        }

        if (acao === 'consultar_ticket') {
            if (listaTickets.value) await consultarTicket(listaTickets.value);
            else alert("Selecione um ticket.");
        } 
        else if (acao === 'atualizar_ticket' || acao === 'encerrar_ticket') {
            const dataEncerramento = acao === 'encerrar_ticket' ? new Date().toISOString() : null;

            const dados = {
                ticket: form.ticket.value,
                categoria: form.categoria.value === "Outro" ? inputOutraCategoria.value : form.categoria.value,
                nome_contato: form.nome_contato.value,
                email_contato: form.email_contato.value,
                telefone_contato: form.telefone_contato.value,
                descricao: document.getElementById('descricao_problema').value,
                nivel_suporte: form.nivel_suporte.value,
                atualizacoes: txtAtualizacao.value,
                resolucao: acao === 'encerrar_ticket' ? campoResolucao.value : null, 
                status: acao === 'encerrar_ticket' ? "Encerrado" : null,
                data_encerramento: dataEncerramento
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
            const catZ = document.getElementById('catZ');
            if (catZ) {
                catZ.checked = true;
                inputOutraCategoria.value = d.categoria;
                inputOutraCategoria.disabled = true;
            }
        }
    }

    carregarLista();
});