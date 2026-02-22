document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const btnCriar = document.getElementById('criar_ticket');
    const btnEncerrar = document.getElementById('encerrar_ticket');
    const campoResolucao = document.getElementById('descricao_resolução');
    const inputOutraCategoria = document.getElementById('outra_categoria');
    const inputTelefone = document.getElementById('telefone_contato');
    const botoesSecundarios = document.querySelectorAll('.acoes-secundarias button');
    const listaTickets = document.getElementById('lista');

    // 1. Limita o telefone a no máximo 11 caracteres
    inputTelefone.addEventListener('input', () => {
        if (inputTelefone.value.length > 11) {
            inputTelefone.value = inputTelefone.value.slice(0, 11);
        }
    });

    // 2. Inicializa a lista com o valor padrão
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

    // 3. Habilita Descrição da Resolução apenas ao clicar em "Encerrar"
    btnEncerrar.addEventListener('click', (e) => {
        e.preventDefault(); 
        campoResolucao.disabled = false;
        campoResolucao.focus();
        campoResolucao.placeholder = "Descreva a solução para encerrar...";
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const botaoClicado = event.submitter.id;

        const formData = new FormData(form);
        const dados = Object.fromEntries(formData.entries());
        
        // Remove campos que não vão para o backend
        delete dados.lista;

        if (dados.categoria === 'Outro') {
            dados.categoria = dados.outra_categoria;
        }
        delete dados.outra_categoria;

        if (botaoClicado === 'criar_ticket') {
            await executarCriarTicket(dados);
        } else {
            console.log("Ação disparada:", botaoClicado);
        }
    });

    async function executarCriarTicket(dados) {
        // Validação básica
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
                
                // 4. Vincula resposta à lista: Lado a Lado
                const novaOpcao = document.createElement('option');
                novaOpcao.value = res.id_gerado;
                // Formato solicitado: #ID | SLA | Categoria | Nível
                novaOpcao.textContent = `#${res.id_gerado} | ${res.ticket} | ${res.categoria} | ${res.nivel_suporte}`;
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
        
        // Habilita todos os botões para novas inserções/edições
        btnCriar.disabled = false;
        botoesSecundarios.forEach(btn => btn.disabled = false);
        
        // Bloqueia novamente os campos específicos conforme regra
        campoResolucao.disabled = true;
        campoResolucao.placeholder = "Bloqueado na ação Criar Ticket ...";
        inputOutraCategoria.disabled = true;
    }
});