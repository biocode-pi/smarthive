# 🐝 IA-SmartHive

> Sistema inteligente de monitoramento de colmeias com visão computacional e IA embarcada.

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![YOLO](https://img.shields.io/badge/YOLO-v8-00FFFF?style=flat-square)](https://ultralytics.com/)
[![TFLite](https://img.shields.io/badge/TensorFlow_Lite-embarcado-FF6F00?style=flat-square&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/lite)
[![OpenCV](https://img.shields.io/badge/OpenCV-visão_computacional-5C3EE8?style=flat-square&logo=opencv&logoColor=white)](https://opencv.org/)
[![Roboflow](https://img.shields.io/badge/Roboflow-dataset-7B2FBE?style=flat-square)](https://roboflow.com/)
[![Status](https://img.shields.io/badge/status-em_desenvolvimento-yellow?style=flat-square)]()

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Objetivos](#-objetivos)
- [Tecnologias](#-tecnologias)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Etapas de Desenvolvimento da IA](#-etapas-de-desenvolvimento-da-ia)
- [Como Executar](#-como-executar)
- [Diferenciais do Projeto](#-diferenciais-do-projeto)
- [Melhorias Futuras](#-melhorias-futuras)
- [Equipe](#-equipe)

---

## 🔍 Visão Geral

O **IA-SmartHive** é um projeto integrador acadêmico que propõe uma solução de monitoramento inteligente para colmeias de **abelhas nativas sem ferrão** (*meliponicultura*). A proposta une hardware embarcado, câmera e inteligência artificial para identificar, em tempo real, quais insetos entram e saem da colmeia — distinguindo abelhas de possíveis invasores.

A solução roda diretamente na placa **Unihiker K10**, tornando-a autossuficiente, sem necessidade de conexão constante com servidores externos (edge computing).

### O problema

Meliponicultores frequentemente perdem colmeias por invasões de parasitas como **forídeos**, **formigas** e **vespas**. A identificação manual é trabalhosa, imprecisa e muitas vezes tardia. O IA-SmartHive automatiza essa vigilância e emite alertas imediatos quando um invasor é detectado.

---

## 🎯 Objetivos

O sistema tem como metas principais:

- **Detectar** a presença de insetos na entrada da colmeia usando visão computacional
- **Classificar** os insetos entre `abelha` e `invasor` (forídeo, formiga, vespa, etc.)
- **Alertar** o meliponicultor em caso de atividade suspeita
- **Operar em tempo real** ou próximo disso, diretamente no hardware embarcado
- **Registrar** eventos para análise histórica da saúde da colmeia

---

## 🧠 Tecnologias

| Tecnologia | Função no Projeto |
|---|---|
| **Python 3.10+** | Linguagem principal de desenvolvimento |
| **OpenCV** | Captura de imagem, pré-processamento e detecção de movimento |
| **YOLO (v8)** | Detecção e classificação de objetos em tempo real |
| **TensorFlow / TF Lite** | Execução otimizada do modelo no hardware embarcado |
| **Roboflow** | Criação, organização e anotação do dataset |
| **Unihiker K10** | Placa embarcada para execução da solução (edge AI) |
| **GitHub** | Versionamento e colaboração |

---

## 🔄 Arquitetura do Sistema

O fluxo de processamento segue o pipeline abaixo:

```
┌─────────┐     ┌──────────────────────┐     ┌──────────────────┐
│  Câmera │────▶│ OpenCV               │────▶│ Recorte da ROI   │
│         │     │ (detecção de movi-   │     │ (região de inte- │
└─────────┘     │  mento / captura)    │     │  resse)          │
                └──────────────────────┘     └────────┬─────────┘
                                                      │
                                                      ▼
                                             ┌──────────────────┐
                                             │  Modelo YOLO     │
                                             │  (TF Lite)       │
                                             └────────┬─────────┘
                                                      │
                              ┌───────────────────────┴───────────────────┐
                              ▼                                           ▼
                     ┌────────────────┐                        ┌──────────────────┐
                     │  Abelha        │                        │  Invasor         │
                     │  → Registro    │                        │  → Alerta        │
                     └────────────────┘                        └──────────────────┘
```

**Descrição das etapas:**

1. **Câmera** captura o vídeo contínuo da entrada da colmeia.
2. **OpenCV** processa os frames, detecta movimento e isola a região de interesse (ROI).
3. **Recorte da imagem** reduz a área de análise para otimizar o processamento.
4. **Modelo YOLO (TF Lite)** classifica o inseto detectado.
5. **Ação** é tomada conforme a classificação: registro de atividade normal ou disparo de alerta para o meliponicultor.

---

## 📁 Estrutura do Projeto

```
IA-SmartHive/
│
├── dataset/                  # Imagens brutas e anotadas por classe
│   ├── raw/                  # Imagens sem tratamento
│   ├── labeled/              # Imagens com bounding boxes anotados
│   └── classes/
│       ├── abelha/
│       ├── forideos/
│       ├── formigas/
│       └── vespas/
│
├── models/                   # Modelos treinados e exportados
│   ├── yolo/                 # Pesos do modelo YOLO (.pt)
│   └── tflite/               # Modelo otimizado para edge (.tflite)
│
├── training/                 # Scripts e configurações de treinamento
│   ├── train.py
│   ├── config.yaml           # Configuração das classes e hiperparâmetros
│   └── evaluate.py           # Avaliação de métricas (mAP, precisão, recall)
│
├── inference/                # Código de inferência em produção
│   ├── detector.py           # Lógica de detecção e classificação
│   ├── camera.py             # Interface com a câmera via OpenCV
│   └── alert.py              # Sistema de alertas
│
├── scripts/                  # Utilitários e scripts auxiliares
│   ├── collect_data.py       # Captura de imagens para o dataset
│   ├── preprocess.py         # Pré-processamento e augmentação
│   └── convert_tflite.py     # Conversão do modelo para TF Lite
│
├── docs/                     # Documentação técnica adicional
│   ├── architecture.md
│   ├── dataset_guide.md
│   └── deployment_guide.md
│
├── requirements.txt          # Dependências Python
├── README.md
└── .gitignore
```

---

## 🔬 Etapas de Desenvolvimento da IA

### 1. Coleta de Dados

O dataset é construído a partir de duas fontes complementares:

- **Captura própria**: imagens coletadas diretamente na entrada de colmeias reais, utilizando OpenCV para gravar frames do vídeo em intervalos definidos (`scripts/collect_data.py`).
- **Datasets externos**: repositórios públicos de imagens de abelhas e insetos invasores, utilizados para enriquecer e balancear as classes.

> ⚠️ Qualidade importa mais que quantidade. Imagens com boa iluminação, ângulo consistente e insetos claramente visíveis têm prioridade.

---

### 2. Organização do Dataset

As imagens são organizadas por classe:

| Classe | Descrição |
|---|---|
| `abelha` | Atividade normal na entrada da colmeia |
| `forideos` | Parasitas dípteros frequentes em colmeias |
| `formigas` | Invasores generalistas |
| `vespas` | Predadores de abelhas |

O balanceamento entre classes é essencial para evitar viés no modelo. Recomenda-se no mínimo **200 imagens por classe** antes do treinamento inicial.

---

### 3. Rotulagem (Labeling)

A anotação é feita com **bounding boxes** delimitando o inseto em cada imagem. A ferramenta principal utilizada é o **Roboflow**, que oferece:

- Interface de anotação visual
- Exportação nos formatos compatíveis com YOLO
- Augmentação automática (flip, rotação, brilho, etc.)
- Gestão de versões do dataset

O projeto do dataset no Roboflow é mantido sincronizado com o repositório via export automático.

---

### 4. Treinamento do Modelo

O modelo utilizado é o **YOLOv8** (Ultralytics), treinado com o dataset anotado:

```bash
# Exemplo de comando de treinamento
yolo task=detect mode=train \
  model=yolov8n.pt \
  data=training/config.yaml \
  epochs=100 \
  imgsz=640
```

O treinamento pode ser realizado:
- **Localmente** em máquina com GPU (recomendado)
- **Em nuvem** via Google Colab ou Kaggle (gratuito com GPU)

Os pesos gerados (`.pt`) são salvos em `models/yolo/`.

---

### 5. Validação e Testes

Após o treinamento, o modelo é avaliado com métricas padrão de detecção de objetos:

- **mAP@0.5** (mean Average Precision): métrica principal de qualidade
- **Precisão e Recall** por classe
- **Matriz de confusão** para análise de erros

```bash
python training/evaluate.py --model models/yolo/best.pt --data training/config.yaml
```

Testes com **imagens e vídeos reais** de colmeias são realizados antes de qualquer deploy para validar o comportamento em condições reais.

---

### 6. Otimização para Edge

Para execução na **Unihiker K10**, o modelo é convertido para **TensorFlow Lite**, reduzindo tamanho e consumo de memória:

```bash
python scripts/convert_tflite.py --input models/yolo/best.pt --output models/tflite/smarthive.tflite
```

Técnicas aplicadas:
- **Quantização pós-treinamento** (INT8) para reduzir o modelo de ~6MB para ~1.5MB
- Remoção de camadas desnecessárias para inferência

---

### 7. Deploy na Unihiker K10

O modelo otimizado é transferido para a placa e integrado ao pipeline de câmera:

```bash
# Executar inferência em tempo real na Unihiker K10
python inference/detector.py --model models/tflite/smarthive.tflite --camera 0
```

O sistema inicializa automaticamente ao ligar a placa, capturando frames, rodando inferência e disparando alertas conforme as detecções.

---

## ⚙️ Como Executar

### Pré-requisitos

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/IA-SmartHive.git
cd IA-SmartHive

# Crie e ative um ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Instale as dependências
pip install -r requirements.txt
```

### Executar inferência local (desenvolvimento)

```bash
python inference/detector.py --model models/tflite/smarthive.tflite --camera 0
```

### Coletar imagens para o dataset

```bash
python scripts/collect_data.py --output dataset/raw --interval 0.5
```

### Treinar o modelo

```bash
python training/train.py --config training/config.yaml --epochs 100
```

---

## ✨ Diferenciais do Projeto

| Diferencial | Descrição |
|---|---|
| 🐝 **Meliponicultura** | Aplicação direta e relevante na proteção de abelhas nativas sem ferrão |
| 🤖 **Edge AI** | IA rodando localmente no hardware, sem dependência de internet |
| ⚡ **Tempo real** | Detecção e classificação com latência mínima |
| 🌿 **Impacto ambiental** | Contribui para a preservação de polinizadores essenciais ao ecossistema |
| 📦 **Solução integrada** | Hardware + visão computacional + IA em um único sistema autônomo |

---

## 🚀 Melhorias Futuras

- [ ] **Dashboard web** para visualização de eventos e estatísticas da colmeia
- [ ] **App mobile** com notificações push para alertas em tempo real
- [ ] **Armazenamento em nuvem** do histórico de detecções
- [ ] **Análise de padrões** de comportamento da colmeia ao longo do tempo
- [ ] **Suporte a múltiplas colmeias** em uma única instalação
- [ ] **Identificação de espécies** de abelhas nativas (além da classificação abelha/invasor)
- [ ] **Integração com sensores** de temperatura e umidade interna da colmeia

---

## 👥 Equipe

Projeto desenvolvido como **Projeto Integrador** — curso de Tecnologia, Faculdade [Fatec Registro].

| Nome | Função |
|---|---|
| [Bruno Eduardo] | A definir |
| [Bruno Davies] | A definir |
| [Leonardo] | A definir |
| [Mauricio] | A definir |
| [Renan] | A definir |


---

## 📄 Licença

Este projeto é de uso acadêmico. Consulte o arquivo [LICENSE](LICENSE) para mais informações.

---

<div align="center">
  <sub>Feito com 🐝 para proteger as abelhas nativas do Brasil.</sub>
</div>