# Sensor celular experimental

Nesta fase, o celular funciona como sensor visual experimental. Ele permite
validar a captura de dados visuais da entrada da colmeia antes da implementacao
de um hardware IoT dedicado.

## Por que usar o celular agora

O MVP academico precisa provar que a coleta, organizacao e interpretacao inicial
dos dados fazem sentido. O celular reduz custo, acelera testes de campo e ajuda a
entender o melhor enquadramento da entrada da colmeia.

## Como o celular simula o sensor IoT

O usuario posiciona o celular apontado para a entrada da colmeia, registra uma
imagem ou video e informa os dados observados:

- duracao da observacao;
- movimentos estimados;
- abelhas entrando;
- abelhas saindo;
- possivel invasor;
- observacoes de campo;
- arquivo de imagem ou video, quando existir.

Esses dados sao enviados ao backend pelo endpoint
`POST /api/sensor-celular/captura` e viram um monitoramento no historico da
colmeia.

## Posicionamento recomendado

- Enquadrar a entrada da colmeia, nao a caixa inteira.
- Manter o celular fixo durante a captura.
- Evitar contraluz forte.
- Registrar a duracao da observacao.
- Repetir capturas em horarios parecidos para comparacao.

## Evolucao para IoT

Futuramente, essa camada pode ser substituida por uma camera fixa conectada a um
microcontrolador, Raspberry Pi, ESP32-CAM ou outro dispositivo de borda. O fluxo
esperado e:

1. Captura continua ou por janelas de tempo.
2. Processamento local ou envio de frames para backend.
3. Deteccao de entrada e saida de abelhas.
4. Identificacao de possiveis invasores.
5. Geracao automatica de alertas.

## Evolucao para IA

O arquivo `backend/app/services/ia_service.py` ja contem pontos de extensao para:

- `analisar_fluxo_experimental()`;
- `detectar_possivel_invasor()`;
- `classificar_status_colmeia()`.

Essas funcoes hoje usam heuristicas simples. Depois podem chamar OpenCV, YOLO,
TensorFlow, PyTorch ou modelos embarcados para analise em tempo real.

