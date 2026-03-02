document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const btnCriar = document.getElementById('criar_ticket');
    const btnConsultar = document.getElementById('consultar_ticket');
    const btnAtualizar = document.getElementById('atualizar_ticket');
    const btnEncerrar = document.getElementById('encerrar_ticket');
    const campoResolucao = document.getElementById('descricao_resolução');
    const checkResolucao = document.getElementById('check_resolucao'); 
    const inputOutraCategoria = document.getElementById('outra_categoria');
    const inputTelefone = document.getElementById('telefone_contato');
    const botoesSecundarios = document.querySelectorAll('.acoes-secundarias button');
    const listaTickets = document.getElementById('lista');

    // 1. Limita o telefone a 11 dígitos
    inputTelefone.addEventListener('input', () => {
        inputTelefone.value = inputTelefone.value.replace(/\D/g, '').slice(0, 11);
    });

    // 2. Lógica do Checkbox para habilitar Resolução
    checkResolucao.addEventListener('change', () => {
        if (checkResolucao.checked) {
            campoResolucao.disabled = false;
            campoResolucao.placeholder = "Descreva a solução aplicada...";
            campoResolucao.focus();
        } else {
            campoResolucao.disabled = true;
            campoResolucao.value = "";
            campoResolucao.placeholder = "Bloqueado. Use o checkbox acima para liberar.";
        }
    });

    // 3. Inicializa a lista
    function inicializarLista() {
        listaTickets.innerHTML = ''; 
        const defaultOp = document.createElement('option');
        defaultOp.textContent = 'Escolher ticket';
        defaultOp.value = ""; 
        defaultOp.disabled = true;
        defaultOp.selected = true;
        listaTickets.appendChild(defaultOp);
    }
    inicializarLista();

    // 4. Controle do campo "Outra Categoria"
    form.addEventListener('change', (e) => {
        if (e.target.name === 'categoria') {
            inputOutraCategoria.disabled = (e.target.id !== 'catZ');
            if (inputOutraCategoria.disabled) inputOutraCategoria.value = '';
        }
    });

    // 5. Função para gerenciar o estado dos campos (Enabled/Disabled)
    function gerenciarEdicao(travar) {
        const elementos = form.querySelectorAll('input, textarea');
        elementos.forEach(el => {
            // Nunca trava a lista de seleção nem o botão de consulta
            if (el.id !== 'lista' && el.id !== 'consultar_ticket') {
                el.disabled = travar;
            }
        });
        btnCriar.disabled = travar;
    }

    // 6. Listener de Submissão
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const botaoClicado = event.submitter.id;
        const formData = new FormData(form);
        const dados = Object.fromEntries(formData.entries());
        
        if (dados.categoria === 'Outro') dados.categoria = dados.outra_categoria;
        delete dados.outra_categoria;

        if (botaoClicado === 'criar_ticket') {
            await executarCriarTicket(dados);
        } else if (botaoClicado === 'consultar_ticket') {
            const id = listaTickets.value;
            if (!id) return alert("Selecione um ticket.");
            await executarConsultarTicket(id);
        } else if (botaoClicado === 'atualizar_ticket') {
            // O botão atualizar agora é o gatilho para habilitar e resetar
            resetarInterface();
            alert("Campos habilitados para nova edição/atualização.");
        }
    });

    // 7. Função: Criar Ticket
    async function executarCriarTicket(dados) {
        try {
            const response = await fetch('http://127.0.0.1:8000/criar_ticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            if (response.ok) {
                const res = await response.json();
                const novaOpcao = document.createElement('option');
                novaOpcao.value = res.id_gerado;
                novaOpcao.textContent = `#${res.id_gerado} | ${res.ticket} | ${res.nivel_suporte} | ${res.categoria}`;
                listaTickets.appendChild(novaOpcao);

                alert(`✅ Ticket #${res.id_gerado} criado!`);
                
                // EXECUÇÃO APÓS CRIAR (Conforme solicitado)
                resetarInterface();
            }
        } catch (error) {
            alert("Erro na conexão.");
        }
    }

    // 8. Função: Consultar Ticket
    async function executarConsultarTicket(id) {
        try {
            const response = await fetch(`http://127.0.0.1:8000/consultar_ticket/${id}`);
            if (response.ok) {
                const d = await response.json();
                
                // Preenchimento
                const radioT = form.querySelector(`input[name="ticket"][value="${d.ticket}"]`);
                if (radioT) radioT.checked = true;

                const radioN = form.querySelector(`input[name="nivel_suporte"][value="${d.nivel_suporte}"]`);
                if (radioN) radioN.checked = true;

                const radioC = form.querySelector(`input[name="categoria"][value="${d.categoria}"]`);
                if (radioC) {
                    radioC.checked = true;
                } else {
                    document.getElementById('catZ').checked = true;
                    inputOutraCategoria.value = d.categoria;
                }

                document.getElementById('nome_contato').value = d.nome_contato;
                document.getElementById('email_contato').value = d.email_contato;
                document.getElementById('telefone_contato').value = d.telefone_contato;
                document.getElementById('descricao_problema').value = d.descricao;

                // DESABILITA PARA EDIÇÃO APÓS CONSULTAR (Conforme solicitado)
                gerenciarEdicao(true);
            }
        } catch (error) {
            alert("Erro ao consultar.");
        }
    }

    // 9. Reseta a interface e HABILITA os campos
    function resetarInterface() {
        form.reset();
        gerenciarEdicao(false); // Habilita novamente
        checkResolucao.checked = false;
        campoResolucao.disabled = true;
        inputOutraCategoria.disabled = true;
        botoesSecundarios.forEach(btn => btn.disabled = false);
    }
});