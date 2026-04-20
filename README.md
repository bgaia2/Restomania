# 🎲 Resto Mania

**Resto Mania** é um jogo educativo interativo e dinâmico com excelência na proposta pedagógica do ensino de **Aritmética Modular** e Lógica Cognitiva Básica. Os alunos percorrem um tabuleiro numérico divertido superando desafios que exigem operações matemáticas envolvendo o Resto da Divisão associadas às propriedades de casas decimais.

## 🛠️ Tecnologias Utilizadas

O ecossistema é suportado por arquiteturas front-end nativas sem acoplamentos de *Node.js* ou infraestruturas complexas pesadas:
- **Linguagens Base:** HTML5 Semântico, CSS3 Moderno (Animações Puras e Clamp) e JavaScript Puro (Vanilla JS ES6).
- **Associação com Inteligência Artificial:** Arquitetura do código estruturada e refatorada via engenharia generativa utilizando **Antigravity** e **Gemini** para rebalanceamento sistêmico do motor JavaScript e adaptação UX.

## 🌟 Funcionalidades Principais

### Tradição e Regras Matemáticas
O jogo dispõe de três vias ativas de ensino com pesos escalares de complexidade:
1. **Nível 1 (Apenas o Resto):** Encontra o resto direto da divisão entre a Casa Atual e o Valor roletado no Dado. (Fórmula Visual: `Resto de X ÷ Y`)
2. **Nível 2 (Resto + Diferença de Dígitos):** Pondera de forma secundária a lógica estrutural, achando o resto base somado com a diferença absoluta entre as dezenas e unidades da casa atual. (Fórmula: `RESTO + DIF. DÍGITOS`)
3. **Nível 3 (Resto + Noves Fora):** Introdução lógica Mestre da *Divisão em Mod 9*. Soma o resto trivial entre a Casa e o Dado juntamente com o módulo por 9. (Fórmula: `RESTO + NOVES FORA`)

### Sistema Robusto de Ranking Analítico (LocalStorage)
- Lógica de persistência armazenando na "cache local" records numéricos únicos para cada competidor. Se um jogador refizer a partida e sua pontaria for inferior, a base o ignora. **As Pontuações de Ápice** são validadas por uma poderosa equação matemática customizada focada unicamente na performance global:  `[ (CliquesCertos * FatorDificuldade) / TempoEmMinutos ]`.

### UX Fluida e Touch-Screen Mode (UI Responsiva)
- O sistema entende implicitamente acessos por dispositivos *Mobile* com proteção CSS Matrix imposta via `touch-action: manipulation;` impedindo zoons erráticos nas matrizes do celular, transformando a resposta dos blocos interativos o mais próximo possível de um Native App rápido e reativo à mão.
- Orientação em Modo Retrato possui bloqueador *overlay* incentivando os usuários em smartphones a repousar o layout horizontalmente para melhor aderência visual do grid de 48 blocos.

### Segurança Interna (Anti-XSS Validation)
- As strings enviadas de fora (Nicknames e Player Nomes) recebem uma interceptação imediata de sanitização usando recriações da matriz `.createElement('div')` anulando execuções diretas e protegendo contra injeções maliciosas.

## 🚀 Instruções de Instalação e Uso

O sistema foi preparado de forma robusta e independente para zero burocracias de compilação!
1. Na sua IDE ou Terminal verifique os arquivos pelo comando: `git clone`. (Clonagem do repositório)
2. Garanta que a hierarquia estruturícia local exata esteja validada: As mídias deverão habitar **exclusivamente** nos caminhos `./assets/sounds/` (Músicas e Audios em formatação local mp3/ogg) e as artes gráficas como o Dado estarem vivendo em `./assets/images/dado.png`.
3. Apenas abra o portão dando um duplo clique no arquivo primário `index.html` via navegador convencional (Chrome, Edge) ou habilitando host num servidor (Como **Live Server** ou no Deploy GitHubPages). 


## 🎓 Créditos e Referências

- **Autor e Dev Leader do Jogo:** Quintino Gaia.
- **Inspiração Acadêmica:** *Santos, W. O.; Da Silva, A. P.; Silva Junior, Clovis Gomes da. Conquistando com o Resto: Virtualização de um Jogo para o Ensino de Matemática. Anais do Simpósio Brasileiro de Informática na Educação (SBIE), 2014.*
- **Recursos Externos:** Trilhas Sonoras obtidas de bases gratuitas sob Mixkit e o Design do dado isométrico hospedado na biblioteca Pngtree.
