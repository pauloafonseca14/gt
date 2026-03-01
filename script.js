document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const btnCriar = document.getElementById('criar_ticket');
    const btnEncerrar = document.getElementById('encerrar_ticket');
    const campoResolucao = document.getElementById('descricao_resolução');
    const checkResolucao = document.getElementById('check_resolucao'); // Novo
    const inputOutraCategoria = document.getElementById('outra_categoria');
    const inputTelefone = document.getElementById('telefone_contato');
    const botoesSecundarios = document.querySelectorAll('.acoes-secundarias button');
    const listaTickets = document.getElementById('lista');

    // Limita o telefone a 11 dígitos
    inputTelefone.addEventListener('input', () => {
        inputTelefone.value = inputTelefone.value.replace(/\D/g, '').slice(0, 11);
    });

    // Lógica do Checkbox para habilitar Resolução
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

    // Inicializa a lista de tickets
    function inicializarLista() {
        listaTickets.innerHTML = ''; 
        const defaultOp = document.createElement('option');
        defaultOp.textContent = 'Escolher ticket';
        defaultOp.value = "padrao";
        defaultOp.disabled = true;
        defaultOp.selected = true;
        listaTickets.appendChild(defaultOp);
    }
    inicializarLista();

    // Controle do campo "Outra Categoria"
    form.addEventListener('change', (e) => {
        if (e.target.name === 'categoria') {
            inputOutraCategoria.disabled = (e.target.id !== 'catZ');
            if (inputOutraCategoria.disabled) inputOutraCategoria.value = '';
        }
    });

    // Botão Encerrar: Agora ele também marca o checkbox
    btnEncerrar.addEventListener('click', (e) => {
        e.preventDefault(); 
        checkResolucao.checked = true;
        campoResolucao.disabled = false;
        campoResolucao.focus();
        campoResolucao.placeholder = "Descreva a solução para encerrar...";
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const botaoClicado = event.submitter.id;
        const formData = new FormData(form);
        const dados = Object.fromEntries(formData.entries());
        
        delete dados.lista;
        if (dados.categoria === 'Outro') dados.categoria = dados.outra_categoria;
        delete dados.outra_categoria;

        if (botaoClicado === 'criar_ticket') {
            await executarCriarTicket(dados);
        }
    });

    async function executarCriarTicket(dados) {
        const camposObrigatorios = ['ticket', 'categoria', 'nome_contato', 'email_contato', 'descricao'];
        if (camposObrigatorios.some(campo => !dados[campo])) {
            alert("⚠️ Preencha todos os campos obrigatórios.");
            return;
        }

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
                novaOpcao.textContent = `#${res.id_gerado} | ${res.ticket} | ${res.nivel_suporte} | ${res.categoria} |`;
                novaOpcao.selected = true;
                listaTickets.appendChild(novaOpcao);

                alert(`✅ Ticket #${res.id_gerado} criado com sucesso!`);
                resetarInterface();
            }
        } catch (error) {
            alert("⚠️ Erro de conexão com o servidor.");
        }
    }

    function resetarInterface() {
        form.reset();
        checkResolucao.checked = false;
        campoResolucao.disabled = true;
        campoResolucao.placeholder = "Bloqueado. Use o checkbox acima para liberar.";
        btnCriar.disabled = false;
        botoesSecundarios.forEach(btn => btn.disabled = false);
        inputOutraCategoria.disabled = true;
    }
});