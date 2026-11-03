# RailSight CCO

DESENVOLVIMENTO DE PAINEL SINÓTICO FERROVIÁRIO — CCO

1. OBJETIVO DO PROJETO

Criar uma aplicação web moderna para representar a interface de um Centro de Controle Operacional Ferroviário — CCO, com foco em:

Supervisão da operação ferroviária em tempo real;

Visualização gráfica da malha ferroviária;

Visualização da posição dos trens;

Visualização do estado dos sinais/controladoras;

Visualização de ocupação dos trechos;

Visualização de estações, pátios, AMVs/desvios e pontos operacionais;

Gestão de alarmes e ocorrências;

Acompanhamento da circulação;

Indicadores operacionais;

Histórico de eventos;

Preparação da arquitetura para futura integração com dados reais.

IMPORTANTE:

Este projeto será inicialmente um protótipo/simulador de interface de CCO, utilizando dados mockados/simulados.

Não assumir que o sistema possui autoridade para comandar equipamentos ferroviários reais.

A arquitetura deve, entretanto, ser preparada para futura integração com sistemas como CTC, SCADA, intertravamento, telemetria, sistemas de sinalização e APIs de posicionamento.

2. REFERÊNCIAS CONCEITUAIS

A interface deve seguir conceitos encontrados em:

CCO — Centro de Controle Operacional;

CTC — Centralized Traffic Control;

TMS — Traffic Management System;

SCADA ferroviário;

HMI ferroviária;

Sistemas de sinalização;

Sistemas de controle de tráfego;

Monitoramento de infraestrutura;

Gestão de alarmes;

Gestão de circulação ferroviária.

Sistemas ferroviários modernos podem combinar posição e velocidade dos trens com o estado da infraestrutura, sinalização e características da via para apoiar o gerenciamento do tráfego.

A interface deve priorizar consciência situacional do operador, evitando excesso de informações visuais simultâneas.

3. ESTRUTURA PRINCIPAL DA TELA

Criar um layout profissional de CCO com:

HEADER SUPERIOR

Exibir:

Logo/nome do CCO;

Nome da ferrovia;

Status geral da operação;

Data;

Horário em tempo real;

Usuário logado;

Nível de acesso;

Status da comunicação;

Status do servidor;

Indicador de sincronização dos dados.

Exemplo:

CCO CENTRAL
OPERAÇÃO NORMAL
16/09/2026 — 15:32:45

Comunicação: ONLINE
Servidor: ONLINE
Dados: SINCRONIZADOS

4. MAPA SINÓTICO — ELEMENTO PRINCIPAL

O centro da aplicação deve ser ocupado pelo MAPA SINÓTICO DA FERROVIA.

Esse é o elemento mais importante da interface.

Criar uma representação gráfica da malha ferroviária, preferencialmente utilizando SVG para permitir interação e animação dos elementos.

A malha deve conter:

Linha principal;

Linhas secundárias;

Ramais;

Estações;

Pátios;

Terminais;

AMVs/desvios;

Sinais/controladoras;

Trechos de via;

Zonas de bloqueio;

Trens;

Pontos quilométricos;

Cruzamentos;

Entroncamentos.

O mapa deve parecer um painel mímico ferroviário digital, e não um mapa geográfico convencional.

Priorizar clareza operacional.

5. LINHAS FERROVIÁRIAS

Representar as linhas com espessura suficiente para visualização em um CCO.

Cada trecho deve possuir estado:

NORMAL

Linha em estado operacional normal.

OCUPADO

Trecho ocupado por trem.

BLOQUEADO

Trecho indisponível para circulação.

MANUTENÇÃO

Trecho em manutenção.

FALHA

Falha detectada.

SEM COMUNICAÇÃO

Perda de comunicação com o equipamento.

A representação deve mudar visualmente de acordo com o estado.

6. CONTROLADORAS / SINAIS FERROVIÁRIOS

OBRIGATORIAMENTE criar elementos luminosos no mapa.

Cada controladora/sinal deverá possuir um indicador visual circular luminoso.

Estados obrigatórios:

🟢 VERDE

Via liberada;

Condição normal.

🟡 AMARELO

Atenção;

Próximo trecho requer cautela/restrição.

🔴 VERMELHO

Parada;

Via não autorizada.

Também criar:

⚪ CINZA

Equipamento sem comunicação/desconhecido.

Cada sinal deve possuir:

Identificação;

Quilometragem;

Sentido;

Estado;

Timestamp da última atualização.

Exemplo:

S-102
KM 145+300
VERDE
Atualizado: 15:32:41

Ao passar o mouse sobre o sinal, apresentar tooltip.

Ao clicar, abrir painel lateral com detalhes.

7. TRENS

Representar os trens diretamente sobre a via.

Cada trem deverá possuir:

Ícone de trem;

Identificação;

Prefixo;

Sentido de circulação;

Velocidade;

Quilometragem;

Próxima estação;

Atraso;

Status operacional.

Exemplo:

TREM 3021
→ SENTIDO NORTE
78 km/h
KM 148+250
Próxima: Estação Central
+02 min

O trem deverá se movimentar automaticamente pelo mapa utilizando dados simulados.

Criar animação suave para demonstrar deslocamento.

8. ESTAÇÕES

Representar estações com ícones próprios.

Cada estação deve apresentar:

Nome;

Código;

KM;

Plataforma;

Status;

Próximo trem;

Horário previsto;

Horário real;

Atraso.

Ao clicar na estação:

Abrir painel lateral mostrando:

ESTAÇÃO CENTRAL

Status: OPERACIONAL

Próximos trens:

Trem 3021 — 15:35
Trem 4012 — 15:41
Trem 2020 — 15:48

9. AMV / DESVIOS

Representar graficamente os AMVs.

Cada AMV deve possuir:

Identificação;

Posição normal;

Posição reversa;

Estado;

Ocupação;

Falha.

Estados:

NORMAL
REVERSO
OCUPADO
FALHA
SEM COMUNICAÇÃO

Permitir simular alteração do AMV através da interface.

10. PAINEL LATERAL DE DETALHES

Ao clicar em qualquer objeto do mapa:

Trem;

Estação;

Sinal;

AMV;

Trecho;

Alarme;

abrir um painel lateral.

O painel deverá apresentar informações específicas daquele objeto.

Exemplo:

SINAL S-102

Status:
🟢 VERDE

Localização:
KM 145+300

Sentido:
NORTE

Última atualização:
15:32:41

Comunicação:
ONLINE

Último evento:
Mudança para VERDE às 15:31:58

11. PAINEL DE ALARMES

Criar uma área fixa na parte inferior ou lateral da tela.

Separar os alarmes por prioridade:

🔴 CRÍTICO
🟠 ALTO
🟡 MÉDIO
🔵 INFORMATIVO

Exemplos:

[CRÍTICO]
Falha de sinal S-102
15:31:22

[ALTO]
Ocupação inesperada — Trecho T-14
15:30:18

[MÉDIO]
Atraso Trem 3021 — +04 min

[INFO]
Trem 4012 entrou na Estação Central

Não utilizar excesso de animações.

Alarmes críticos podem utilizar destaque visual e animação discreta.

12. GESTÃO DE ALARMES

Criar funções:

Reconhecer alarme;

Silenciar alarme;

Filtrar;

Ordenar;

Visualizar histórico;

Abrir objeto relacionado;

Marcar como resolvido.

IMPORTANTE:

Evitar "alarm flooding".

O operador deve conseguir visualizar claramente:

O que aconteceu;

Onde aconteceu;

Quando aconteceu;

Qual a gravidade;

Qual equipamento está relacionado;

Qual ação operacional está pendente.

13. DASHBOARD SUPERIOR / INDICADORES

Criar pequenos cards de indicadores:

TRENS EM CIRCULAÇÃO

24

TRENS ATRASADOS

03

TRECHOS OCUPADOS

18

ALARMES CRÍTICOS

02

EQUIPAMENTOS OFFLINE

01

ESTAÇÕES OPERACIONAIS

32/32

VELOCIDADE MÉDIA

67 km/h

PONTUALIDADE

94,2%

Os valores devem ser simulados e atualizados dinamicamente.

14. FILTROS

Criar filtros para o operador:

Todas as linhas;

Linha 1;

Linha 2;

Ramal Norte;

Ramal Sul;

Trens;

Estações;

Sinais;

AMVs;

Alarmes;

Equipamentos offline;

Trechos ocupados.

Criar também busca global:

"Buscar trem, estação, sinal ou KM..."

15. CONTROLE DE ZOOM

O mapa deve permitir:

Zoom in;

Zoom out;

Centralizar mapa;

Ajustar mapa à tela;

Navegação horizontal/vertical.

Criar botão:

"VISÃO GERAL"

Ao clicar, retornar para visualização completa da malha.

16. MODOS DE VISUALIZAÇÃO

Criar pelo menos três modos:

VISÃO OPERACIONAL

Foco em:

Trens;

Sinais;

Ocupação;

AMVs;

Circulação.

VISÃO DE INFRAESTRUTURA

Foco em:

Equipamentos;

Comunicação;

Energia;

Sinalização;

Falhas.

VISÃO DE ALARMES

Foco em:

Alarmes;

Ocorrências;

Falhas;

Eventos recentes.

17. LINHA DO TEMPO DE EVENTOS

Criar componente:

EVENTOS RECENTES

15:32:41 — S-102 alterado para VERDE
15:32:18 — Trem 3021 entrou no trecho T-14
15:31:55 — AMV-07 confirmado NORMAL
15:31:22 — Falha detectada no equipamento S-105
15:30:48 — Trem 4012 saiu da Estação Central

Permitir clicar no evento e centralizar o mapa no objeto relacionado.

18. SIMULAÇÃO OPERACIONAL

Como não haverá integração real inicialmente, criar um motor de simulação.

O sistema deverá simular:

Movimento dos trens;

Mudança de sinais;

Ocupação dos trechos;

Liberação dos trechos;

Alteração de AMVs;

Atrasos;

Falhas;

Alarmes;

Perda de comunicação;

Recuperação de equipamentos.

Criar um botão:

▶ INICIAR SIMULAÇÃO

⏸ PAUSAR

↻ RESETAR

Também criar um modo:

"SIMULAÇÃO AO VIVO"

19. CENÁRIOS DE SIMULAÇÃO

Criar cenários pré-configurados:

CENÁRIO 01 — OPERAÇÃO NORMAL

Todos os equipamentos funcionando.

CENÁRIO 02 — ATRASO DE TREM

Um trem apresenta atraso progressivo.

CENÁRIO 03 — FALHA DE SINAL

Um sinal muda para estado de falha.

CENÁRIO 04 — TRECHO OCUPADO

Um trecho apresenta ocupação inesperada.

CENÁRIO 05 — PERDA DE COMUNICAÇÃO

Um equipamento fica offline.

CENÁRIO 06 — INTERDIÇÃO DE TRECHO

Trecho colocado em manutenção.

20. HISTÓRICO

Criar página específica:

HISTÓRICO OPERACIONAL

Permitir pesquisar:

Eventos;

Alarmes;

Trens;

Sinais;

AMVs;

Equipamentos;

Operadores.

Filtros:

Data inicial
Data final
Tipo
Severidade
Objeto
Operador

21. AUDITORIA

Registrar ações realizadas na interface.

Exemplo:

15:31:22
Operador: ADMIN

Ação:
Reconhecimento de alarme

Objeto:
S-102

Resultado:
Confirmado

22. DESIGN VISUAL

Criar uma interface inspirada em modernos centros de controle ferroviário.

Características:

Dark mode;

Fundo grafite/preto;

Alto contraste;

Tipografia técnica;

Elementos compactos;

Grande área dedicada ao mapa;

Cards discretos;

Bordas sutis;

Cores reservadas para estados operacionais;

Verde = normal/liberado;

Amarelo = atenção;

Vermelho = crítico/parada;

Cinza = indisponível;

Azul = informação.

EVITAR:

Visual de dashboard financeiro;

Excesso de gradientes;

Cards gigantes;

Excesso de elementos decorativos;

Animações desnecessárias;

Visual "gaming";

Interface excessivamente colorida.

A prioridade é:

VISIBILIDADE > INFORMAÇÃO > RAPIDEZ DE INTERPRETAÇÃO > ESTÉTICA.

23. MAPA — REQUISITO TÉCNICO

Preferencialmente implementar o mapa em SVG.

Cada elemento deverá ser um componente independente.

Exemplo conceitual:

RailwayMap
├── RailwayLine
├── TrackSegment
├── Station
├── Signal
├── Switch
├── Train
├── Yard
├── KilometerMarker
└── AlarmMarker

Permitir que cada elemento seja clicável.

24. ARQUITETURA DE DADOS

Preparar o projeto para futura API.

Criar estruturas semelhantes a:

Train

id
prefix
position
speed
direction
status
delay
nextStation
lastUpdate

Signal

id
km
direction
aspect
status
lastUpdate

TrackSegment

id
startKm
endKm
occupancy
status
speedLimit

Station

id
name
code
km
status
platforms

Switch

id
km
position
status
occupancy

Alarm

id
type
severity
objectId
description
timestamp
acknowledged
resolved

25. ATUALIZAÇÃO DOS DADOS

Implementar inicialmente com dados mockados.

Simular atualização a cada poucos segundos.

A arquitetura deve permitir futuramente substituir:

MOCK DATA

por:

REST API / WebSocket / MQTT / SCADA / CTC / TMS.

Não acoplar a interface diretamente aos dados mockados.

Criar uma camada de serviços:

/services

simulationService
trainService
signalService
alarmService
trackService

26. WEBSOCKET — PREPARAÇÃO

Deixar a arquitetura preparada para comunicação em tempo real.

Futuramente poderemos receber eventos como:

TRAIN_POSITION_UPDATED

SIGNAL_CHANGED

TRACK_OCCUPANCY_CHANGED

SWITCH_POSITION_CHANGED

ALARM_CREATED

ALARM_RESOLVED

DEVICE_OFFLINE

DEVICE_ONLINE

Por enquanto, simular esses eventos localmente.

27. RESPONSIVIDADE

A aplicação deve funcionar em:

Desktop;

Monitor ultrawide;

Notebook;

Tablet.

Prioridade absoluta:

Desktop / monitor de CCO.

Criar layout especialmente adequado para resolução:

1920x1080

2560x1440

3440x1440

28. ATALHOS DE TECLADO

Adicionar:

F1 — Visão operacional
F2 — Alarmes
F3 — Infraestrutura
F4 — Histórico

— Zoom

— Zoom out
ESC — Fechar painel
HOME — Visão geral

29. MAPA DE DEMONSTRAÇÃO

Criar uma malha ferroviária fictícia suficientemente complexa para demonstrar o sistema.

Utilizar:

2 linhas principais;

1 ramal;

8 estações;

20+ trechos;

15+ sinais;

8 AMVs;

6 trens;

3 pátios;

30+ elementos operacionais.

Exemplo:

LINHA NORTE

Estação Aurora
|
|
Estação Central
|
+--------- Pátio Norte
|
Estação Industrial
|
Estação Vale
|
Estação Terminal

Criar também um ramal:

Estação Central
|
+---- Estação Oeste
|
+---- Terminal Oeste

O mapa deve parecer uma malha ferroviária realista, mas fictícia.

30. INTERAÇÃO COM O MAPA

Ao clicar em um trem:

Centralizar o mapa no trem.

Ao clicar em um sinal:

Abrir informações do sinal.

Ao clicar em um trecho:

Mostrar ocupação, velocidade permitida e status.

Ao clicar em uma estação:

Mostrar tabela operacional.

Ao clicar em um alarme:

Centralizar mapa no equipamento relacionado.

31. FUNÇÃO "FOCO NO EVENTO"

Criar botão:

"LOCALIZAR"

Ao selecionar um evento ou alarme, o sistema deve:

Centralizar o mapa;

Aplicar zoom;

Destacar o equipamento;

Abrir informações;

Mostrar o evento relacionado.

32. INDICADOR DE CONECTIVIDADE

No topo:

● SISTEMA ONLINE

Criar estados:

ONLINE
DEGRADADO
OFFLINE

Também apresentar:

Servidor
Comunicação
Banco de dados
Dispositivos

33. SEGURANÇA DA INTERFACE

Criar níveis de acesso:

OPERADOR
SUPERVISOR
ADMINISTRADOR

Cada perfil possui permissões diferentes.

Por enquanto, implementar apenas controle visual/mock de permissões.

34. PRINCÍPIO DE USABILIDADE

O operador deve conseguir responder rapidamente:

"Onde estão os trens?"

"Onde estão os problemas?"

"Qual trecho está ocupado?"

"Qual sinal está vermelho?"

"Existe algum equipamento sem comunicação?"

"Qual é o próximo evento crítico?"

"Qual trem está atrasado?"

"Qual região da malha necessita de atenção?"

A interface deve permitir responder essas perguntas em poucos segundos.

35. EVOLUÇÕES FUTURAS

Deixar a arquitetura preparada para:

Integração com GPS dos trens;

Geolocalização;

TMS;

CTC;

SCADA;

Sistemas de sinalização;

ETCS/ERTMS;

Telemetria;

Sensores de via;

Monitoramento de energia;

Controle de portas;

Monitoramento de passagens em nível;

Monitoramento de temperatura;

Monitoramento de ativos;

Predição de falhas;

Inteligência artificial;

Previsão de atrasos;

Otimização de circulação;

Simulação de cenários;

Replay operacional;

Digital Twin da ferrovia.

36. INTELIGÊNCIA OPERACIONAL — FUTURA EVOLUÇÃO

Criar espaço reservado no dashboard para:

ASSISTENTE OPERACIONAL

Exemplos futuros:

"3 eventos podem impactar a circulação nos próximos 15 minutos."

"Trecho T-14 apresenta ocupação acima do padrão."

"Trem 3021 apresenta atraso de 6 minutos."

"Falha de comunicação detectada no sinal S-105."

Inicialmente apresentar informações simuladas.

Não implementar decisões automáticas de segurança.

O sistema deve funcionar como apoio à decisão do operador.

37. REQUISITO FUNDAMENTAL

NÃO criar apenas um dashboard.

Criar uma verdadeira experiência visual de PAINEL SINÓTICO DE CCO FERROVIÁRIO.

O MAPA DA FERROVIA deve ser o elemento central.

Os trens devem estar posicionados sobre as linhas.

Os sinais/controladoras devem aparecer como indicadores luminosos:

VERDE
AMARELO
VERMELHO

Os trechos devem indicar ocupação.

As estações devem ser interativas.

Os AMVs devem possuir representação gráfica.

Os alarmes devem estar relacionados aos objetos do mapa.

Tudo deve parecer integrado em uma única operação.

38. TECNOLOGIA

Utilizar preferencialmente:

React
TypeScript
Vite
Tailwind CSS
shadcn/ui
Lucide Icons
SVG para mapa
Recharts para gráficos

Utilizar componentes reutilizáveis.

Separar:

UI
Estado
Dados
Simulação
Serviços
Componentes do mapa.

39. ENTREGA INICIAL

Ao finalizar a primeira versão, entregar:

Dashboard CCO;

Mapa sinótico ferroviário;

Trens animados;

Sinais luminosos;

Trechos ocupados;

Estações;

AMVs;

Painel de alarmes;

Indicadores;

Painel lateral;

Histórico;

Simulador;

Filtros;

Busca;

Zoom;

Eventos em tempo real simulados;

Estrutura preparada para API.

O resultado deve ser visualmente convincente como um CCO ferroviário profissional, utilizando dados fictícios para demonstração.

Antes de implementar funcionalidades complexas, priorize:

Mapa;

Sinais;

Trens;

Ocupação;

Alarmes;

Interação;

Simulação;

Arquitetura de integração futura.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://arcelormittal-cco.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1c6f96c7-02cf-4322-8171-3a7283dcd1d7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
