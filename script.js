/**
 * @file RestoMania Game Main Logic
 * @description Implementação das lógicas matemáticas, do ranking local (Unique Score), e feedbacks UX responsivos.
 */

(() => {
    // Assets do repositório físico
    const somClique = new Audio('assets/sounds/acerto.mp3');
    const somErro = new Audio('assets/sounds/erro.mp3');
    const somStagnation = new Audio('assets/sounds/estagnado.mp3');
    const somVitoriaSimples = new Audio('assets/sounds/vitoria_simples.mp3');
    const somVitoriaMestre = new Audio('assets/sounds/vitoria_mestre.mp3');

    const tabuleiro = [
        43, 15, 22, 0, 24, 18, 33, 40, 12, 5, 
        9, 27, 3, 11, 36, 45, 2, 14, 30, 8,
        21, 39, 4, 17, 42, 6, 13, 25, 31, 7,
        19, 35, 1, 10, 28, 44, 16, 23, 37, 20,
        32, 41, 26, 34, 47, 29, 38, 96
    ];

    let posicaoAtual = 0;
    let nivelAtual = 1;
    let destinoCorreto = -1;
    let aguardandoClique = false;
    let tentativasNaCasa = 0;
    let nomeJogadorAtual = "Jogador Misterioso";
    let valorDadoAtual = 1;
    let ultimoRestoZero = false;

    // Contadores Dinâmicos de Analytics
    let cliquesCertos = 0;
    let cliquesErrados = 0;
    let tempoInicio = 0;
    let intervaloTempo;
    let pontuacaoAcumulada = 0;

    /**
     * @function tocarSomSeguro
     * @description Exige reset natural do audiotrack e chama Promise segura isolando erros do Browser Autoplay.
     */
    function tocarSomSeguro(audioElement) {
        try {
            audioElement.currentTime = 0;
            const playPromise = audioElement.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => console.warn('Bloqueio evitado do navegador protegido.'));
            }
        } catch (e) {
            console.warn('Erro ao reproduzir áudio:', e);
        }
    }

    /**
     * @function sanitizarNome
     * @description Filtra via nó DOM toda marcação HTML pura do usuário, isolando códigos XSS de invadirem Strings do App.
     */
    function sanitizarNome(nome) {
        const div = document.createElement('div');
        div.innerText = nome;
        return div.innerHTML.trim() || 'Jogador Misterioso';
    }

    /**
     * @function atualizarTempo
     * @description Hook para setInterval que calcula Time Stamps progressivos da sessão para fins de Score.
     */
    function atualizarTempo() {
        if (!tempoInicio) return;
        const decorridoSecs = Math.floor((Date.now() - tempoInicio) / 1000);
        const min = String(Math.floor(decorridoSecs / 60)).padStart(2, '0');
        const sec = String(decorridoSecs % 60).padStart(2, '0');
        const display = document.getElementById('display-tempo');
        if (display) display.innerText = `${min}:${sec}`;
    }

    /**
     * @function desenharTabuleiro
     * @description Monta proceduralmente o array global renderizando as IDs e injetando eventos (onclick).
     */
    function desenharTabuleiro() {
        const grade = document.getElementById('grade-tabuleiro');
        grade.innerHTML = ''; 

        tabuleiro.forEach((valor, index) => {
            const div = document.createElement('div');
            div.classList.add('casa');
            div.id = `casa-${index}`;
            div.innerText = valor;
            div.onclick = () => clicarCasa(index);

            if (valor === 0 || valor === 24) div.classList.add('casa-especial');
            grade.appendChild(div);
        });
        
        atualizarPosicaoPeao();
    }

    /**
     * @function atualizarPosicaoPeao
     * @description Move a DOM visual do CSS que representa o jogador ativo à referência computal da grade correspondente.
     */
    function atualizarPosicaoPeao() {
        let peao = document.querySelector('.peao');
        if (!peao) {
            peao = document.createElement('div');
            peao.classList.add('peao');
        }

        const casaAlvo = document.getElementById(`casa-${posicaoAtual}`);
        if (casaAlvo) {
            casaAlvo.appendChild(peao);
        }
    }

    /**
     * @function mudarTela
     * @description Oculta todas as sections do game e projeta estritamente a referida pelo argumento idTela.
     */
    function mudarTela(idTela) {
        const telas = document.querySelectorAll('.tela');
        telas.forEach(t => t.classList.add('escondida'));
        const destino = document.getElementById('tela-' + idTela);
        if(destino) destino.classList.remove('escondida');

        if (idTela === 'ranking') fecharModalVitoria();
    }

    /**
     * @function iniciarJogo
     * @description Reinicializa todo escopo global interno mantendo a ponteira para "Score Acumulativo" e o Timeout neutro.
     */
    function iniciarJogo(nivel = 1, zerarScore = true) {
        const inputNome = document.getElementById('nome-jogador');
        if (inputNome && inputNome.value) {
            nomeJogadorAtual = sanitizarNome(inputNome.value);
        }

        nivelAtual = nivel;
        posicaoAtual = 0;
        aguardandoClique = false;
        destinoCorreto = -1;
        ultimoRestoZero = false;
        tentativasNaCasa = 0;
        
        if (zerarScore) pontuacaoAcumulada = 0;
        cliquesCertos = 0;
        cliquesErrados = 0;

        document.getElementById('display-certos').innerText = '0';
        document.getElementById('display-errados').innerText = '0';
        document.getElementById('display-tempo').innerText = '00:00';
        
        clearInterval(intervaloTempo);
        tempoInicio = 0; // O cronômetro só dispara no primeiro lançamento de dado

        document.getElementById('mensagem-resultado').innerText = '';
        document.getElementById('valor-casa').innerText = tabuleiro[0];
        document.getElementById('painel-calculo').style.display = 'none';
        document.getElementById('painel-dica').classList.add('escondida');
        const btnDica = document.getElementById('btn-dica');
        if (btnDica) btnDica.style.display = 'none';
        document.getElementById('btn-lancar').disabled = false;

        desenharTabuleiro();
        mudarTela('jogo');
    }

    function cancelarJogo() {
        pontuacaoAcumulada = 0;
        clearInterval(intervaloTempo);
        mudarTela('inicio');
    }

    /**
     * @function lancarDado
     * @description Executa a randomização matemática que impõe o "Salto" ao jogador mediante as lógicas puras de divisibilidade.
     */
    function lancarDado() {
        const btn = document.getElementById('btn-lancar');
        const dadoDisplay = document.getElementById('dado-visual');
        const msg = document.getElementById('mensagem-resultado');

        btn.disabled = true;
        dadoDisplay.classList.add('girando');
        msg.innerText = "Calculando destino...";
        
        // Inicia o cronômetro estritamente na primeira jogada ativa
        if (tempoInicio === 0) {
            tempoInicio = Date.now();
            intervaloTempo = setInterval(atualizarTempo, 1000);
        }
        
        document.getElementById('painel-dica').classList.add('escondida');
        document.getElementById('btn-dica').style.display = 'none';

        setTimeout(() => {
            dadoDisplay.classList.remove('girando');
            const valorCasa = tabuleiro[posicaoAtual];
            
            // Loop interno inibidor de travamento fatal (Resto Zero consecutivo) no Nível 1
            let valorDado;
            let infinitoPrevine = 0;
            do {
                valorDado = Math.floor(Math.random() * 6) + 1;
                infinitoPrevine++;
                if (infinitoPrevine > 20) break;
            } while (nivelAtual === 1 && ultimoRestoZero && ((valorCasa % valorDado) === 0));

            tentativasNaCasa++;
            if (nivelAtual === 3 && valorCasa === 36 && tentativasNaCasa >= 2 && valorDado !== 5) {
                valorDado = 5;
            }

            valorDadoAtual = valorDado;
            
            let salto = 0;
            let operacaoTexto = '';
            
            if (valorCasa === 0) {
                salto = valorDado;
                operacaoTexto = `MAGIA DO ZERO! Avance as casas geradas no cubo.`;
            } else if (nivelAtual === 1) {
                salto = valorCasa % valorDado;
                operacaoTexto = `${valorCasa} ÷ ${valorDado} = Resto ?`;
                ultimoRestoZero = (salto === 0);
            } else if (nivelAtual === 2) {
                const resto = valorCasa % valorDado;
                const dezena = Math.floor(valorCasa / 10);
                const unidade = valorCasa % 10;
                const difDigitos = Math.abs(dezena - unidade);
                salto = resto + difDigitos;
                operacaoTexto = `RESTO + DIF. DÍGITOS = ?`;
            } else if (nivelAtual === 3) {
                const resto = valorCasa % valorDado;
                const novesFora = valorCasa % 9;
                salto = resto + novesFora;
                operacaoTexto = `RESTO + NOVES FORA = ?`;
            }

            let provavelDestino = posicaoAtual + salto;
            if (provavelDestino < 0) provavelDestino = 0;
            if (provavelDestino >= tabuleiro.length) provavelDestino = tabuleiro.length - 1;
            destinoCorreto = provavelDestino;

            const painel = document.getElementById('painel-calculo');
            const textoDiv = document.getElementById('texto-divisao');
            painel.style.display = "block";
            textoDiv.innerText = operacaoTexto;

            if (salto === 0) {
                msg.innerHTML = "<strong style='color:#e74c3c;'>O cálculo resultou em ZERO! Estagnado.<br>Avançando rodada forçadamente. Lance os cubos!</strong>";
                tocarSomSeguro(somStagnation);
                btn.disabled = false;
                aguardandoClique = false;
                return; 
            }

            msg.innerText = "Resolva o desafio matemático e CLIQUE na casa que você deve parar!";
            document.getElementById('btn-dica').style.display = 'inline-block';
            
            aguardandoClique = true;
            const casas = document.querySelectorAll('.casa');
            casas.forEach(c => c.classList.add('casa-clicavel'));
        }, 1500); 
    }

    /**
     * @function clicarCasa
     * @description Ouve se o index clicado no tabuleiro condiz com o "provavel Destino". Se sim, engata eventos vitórios/transição de PEAO.
     */
    function clicarCasa(index) {
        if (!aguardandoClique) return;

        const msg = document.getElementById('mensagem-resultado');

        if (index === destinoCorreto) {
            cliquesCertos++;
            document.getElementById('display-certos').innerText = cliquesCertos;

            aguardandoClique = false;
            posicaoAtual = index;
            tentativasNaCasa = 0;
            
            const casas = document.querySelectorAll('.casa');
            casas.forEach(c => c.classList.remove('casa-clicavel'));

            const casaDisplay = document.getElementById('valor-casa');
            casaDisplay.innerText = tabuleiro[posicaoAtual];

            tocarSomSeguro(somClique);

            atualizarPosicaoPeao(); 
            
            document.getElementById('btn-dica').style.display = 'none';
            document.getElementById('painel-dica').classList.add('escondida');

            if (posicaoAtual >= tabuleiro.length - 1) {
                posicaoAtual = tabuleiro.length - 1;
                if (nivelAtual === 3) {
                    tocarSomSeguro(somVitoriaMestre);
                } else {
                    tocarSomSeguro(somVitoriaSimples);
                }
                mostrarModalVitoria();
            } else {
                msg.innerText = "Correto! Lance o dado novamente.";
                document.getElementById('btn-lancar').disabled = false;
            }
        } else {
            cliquesErrados++;
            document.getElementById('display-errados').innerText = cliquesErrados;

            tocarSomSeguro(somErro);
            msg.innerText = "Cálculo Incorreto! Revise a matemática do nível e tente clicar na casa certa.";
            const casaIncorreta = document.getElementById(`casa-${index}`);
            if(casaIncorreta) {
                casaIncorreta.classList.add('shake');
                setTimeout(() => casaIncorreta.classList.remove('shake'), 400);
            }
        }
    }

    /**
     * @function mostrarDicaIA
     * @description Exibe via injeção lógica strings amigáveis que guiam a formação do "Resto", sem dar o Spoiler total de saltos.
     */
    function mostrarDicaIA() {
        const dicaContainer = document.getElementById('texto-dica');
        const painelDica = document.getElementById('painel-dica');
        if (!dicaContainer || !painelDica) return;

        const valorCasa = tabuleiro[posicaoAtual];
        let dica = "Mantenha o foco!";

        if (valorCasa === 0) {
            dica = "Dica: Você tirou a sorte grande com a magia do zero! Apenas ande o número limite do cubo.";
        } else if (nivelAtual === 1) {
            dica = `Dica: Pense em qual múltiplo da tabuada de ${valorDadoAtual} chega mais perto de ${valorCasa}. O que sobra exatamente dessa diferença é o seu Resto!`;
        } else if (nivelAtual === 2) {
            dica = `Dica: Primeiro encontre o Resto da divisão de ${valorCasa} por ${valorDadoAtual}. Depois, ache a diferença absoluta entre os dígitos numéricos da casa atual. Some tudo para o resultado!`;
        } else if (nivelAtual === 3) {
            dica = `Dica: Calcule o Resto da divisão de ${valorCasa} por ${valorDadoAtual}. Cuidado a seguir: some o resultado com os 'Noves Fora' (o resto matemático direto de ${valorCasa} por 9)!`;
        }

        dicaContainer.innerText = dica;
        painelDica.classList.remove('escondida');
    }

    function fecharDica() {
        const painelDica = document.getElementById('painel-dica');
        if (painelDica) painelDica.classList.add('escondida');
    }

    /**
     * @function mostrarModalVitoria
     * @description Calcula rigorosamente o ranking e finaliza a matemática do Intervalo, salvando e gerando estatísticas visuais!
     */
    function mostrarModalVitoria() {
        clearInterval(intervaloTempo);
        
        const msg = document.getElementById('mensagem-resultado');
        msg.innerText = "VITÓRIA! Você conquistou o tabuleiro!";
        const modal = document.getElementById('modal-vitoria');
        const tituloVitoria = document.getElementById('titulo-vitoria');

        if (nivelAtual === 3) {
            tituloVitoria.innerText = "🎉 MESTRE MATEMÁTICO! 🎉";
        } else {
            tituloVitoria.innerText = "🎉 CONQUISTA DESBLOQUEADA! 🎉";
        }

        document.getElementById('span-nivel-concluido').innerText = nivelAtual;
        
        const tempoMinutos = (Date.now() - tempoInicio) / 60000;
        const baseMinutos = tempoMinutos > 0.05 ? tempoMinutos : 0.05; 
        
        const exatosPontos = Math.round((cliquesCertos * nivelAtual) / baseMinutos);

        pontuacaoAcumulada += exatosPontos;

        const spanPont = document.getElementById('span-pontuacao');
        const spanTotal = document.getElementById('span-pontuacao-total');
        if (spanPont) spanPont.innerText = exatosPontos;
        if (spanTotal) spanTotal.innerText = pontuacaoAcumulada;
        
        salvarRanking(nomeJogadorAtual, pontuacaoAcumulada);

        const btnProximo = document.getElementById('btn-proximo-nivel');
        if (btnProximo) btnProximo.style.display = nivelAtual >= 3 ? 'none' : 'block';

        modal.classList.remove('escondida');
    }

    function jogarNovamente() {
        fecharModalVitoria();
        iniciarJogo(nivelAtual, true);
    }

    function jogarProximoNivel() {
        fecharModalVitoria();
        if(nivelAtual < 3) {
            iniciarJogo(nivelAtual + 1, false); 
        }
    }

    function voltarMenu() {
        fecharModalVitoria();
        pontuacaoAcumulada = 0; 
        mudarTela('inicio');
    }

    function fecharModalVitoria() {
        document.getElementById('modal-vitoria').classList.add('escondida');
    }

    /**
     * @function salvarRanking
     * @description Otimização interna: Guarda Scores individuais de forma soberana e destrói duplicações do mesmo Highscore.
     */
    function salvarRanking(nome, pontos) {
        let ranking = JSON.parse(localStorage.getItem('restoManiaScoresZ')) || [];
        
        const idx = ranking.findIndex(r => r.nome === nome);
        if (idx !== -1) {
            if (pontos > ranking[idx].pontos) {
                ranking[idx].pontos = pontos; 
            }
        } else {
            ranking.push({ nome: nome, pontos: pontos });
        }
        
        ranking.sort((a, b) => b.pontos - a.pontos);
        ranking = ranking.slice(0, 10);
        localStorage.setItem('restoManiaScoresZ', JSON.stringify(ranking));
    }

    /**
     * @function mostrarRankingTela
     * @description Recria dinamicamente a view list do UI Rank de 10 Posições e invoca tela local.
     */
    function mostrarRankingTela() {
        const lista = document.getElementById('lista-ranking');
        lista.innerHTML = '';
        
        const ranking = JSON.parse(localStorage.getItem('restoManiaScoresZ')) || [];
        
        if (ranking.length === 0) {
            lista.innerHTML = '<li>Nenhum recorde ainda. Seja o primeiro!</li>';
        } else {
            ranking.forEach((r, i) => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${i + 1}º - ${r.nome}</strong> <br><span style="color:#27ae60;">Score Cumulativo: ${r.pontos} Pts</span>`;
                lista.appendChild(li);
            });
        }
        
        mudarTela('ranking');
    }

    // Exportação estrita para Event Handlers nativos (HTML Window Bindings)
    window.iniciarJogo = iniciarJogo;
    window.cancelarJogo = cancelarJogo;
    window.lancarDado = lancarDado;
    window.clicarCasa = clicarCasa;
    window.mostrarDicaIA = mostrarDicaIA;
    window.fecharDica = fecharDica;
    window.jogarNovamente = jogarNovamente;
    window.jogarProximoNivel = jogarProximoNivel;
    window.voltarMenu = voltarMenu;
    window.mudarTela = mudarTela;
    window.mostrarRankingTela = mostrarRankingTela;
})();
