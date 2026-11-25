# GoPro sem fio na Captura

Como usar a GoPro HERO11 Black na página de Captura sem o cabo USB. A câmera transmite pelo Wi-Fi, o notebook recebe o vídeo e o entrega ao navegador como uma webcam comum.

```text
GoPro --Wi-Fi--> MediaMTX (notebook) --> OBS --> "OBS Virtual Camera" --> Captura
```

O site não precisa de nenhuma alteração: na Captura, basta escolher a câmera **OBS Virtual Camera**.

## O que é preciso

- GoPro HERO11 Black carregada, de preferência ligada na tomada.
- Celular com o app **GoPro Quik** e o roteador de internet (ponto de acesso) ativado.
- Notebook com Windows e o **OBS Studio** instalado.
- **MediaMTX**, um programa gratuito que recebe a transmissão. Não precisa instalar.

Notebook e GoPro precisam estar na **mesma rede Wi-Fi**. O roteador do celular serve para isso.

## 1. Preparar o notebook

1. Baixe o MediaMTX em https://github.com/bluenviron/mediamtx/releases, escolhendo o arquivo `mediamtx_..._windows_amd64.zip` da versão mais recente.
2. Extraia o arquivo numa pasta, por exemplo `C:\mediamtx`.
3. Conecte o notebook ao Wi-Fi do celular.
4. Descubra o IP do notebook: abra o PowerShell, rode `ipconfig` e anote o **Endereço IPv4** do adaptador Wi-Fi, por exemplo `192.168.43.20`.
5. Abra `mediamtx.exe`. Na primeira vez, o Windows pergunta sobre o firewall: permita o acesso em **redes privadas**.
6. Deixe a janela aberta. Ela deve mostrar uma linha com `[RTMP] listener opened on :1935`.

## 2. Iniciar a transmissão na GoPro

1. Ligue a GoPro e abra o app GoPro Quik no celular.
2. Conecte o app à câmera.
3. Escolha a opção de transmissão ao vivo e, na lista de plataformas, a opção de **RTMP**, que pode aparecer como "Outro".
4. Selecione a rede Wi-Fi do celular para a GoPro usar.
5. No endereço RTMP, digite `rtmp://IP-DO-NOTEBOOK:1935/live/gopro`, trocando `IP-DO-NOTEBOOK` pelo IP anotado. Exemplo: `rtmp://192.168.43.20:1935/live/gopro`.
6. Escolha a resolução 720p, que é mais estável no Wi-Fi do celular.
7. Inicie a transmissão. Na janela do MediaMTX deve aparecer que a sessão `live/gopro` está publicando.

## 3. Transformar a transmissão em webcam no OBS

1. Abra o OBS Studio.
2. Em **Fontes**, clique em **+** e escolha **Fonte de mídia**.
3. Desmarque **Arquivo local**.
4. Em **Entrada**, digite `rtmp://localhost:1935/live/gopro`.
5. Marque **Reiniciar a reprodução quando a fonte ficar ativa** e confirme.
6. Ajuste a imagem para ocupar toda a tela do OBS.
7. Em **Controles**, clique em **Iniciar câmera virtual**.

## 4. Usar na Captura

1. Abra https://www.smarthive.app.br/app/sensor-celular no navegador do notebook.
2. Toque em **Abrir câmera** e permita o acesso.
3. Na lista **Câmera**, escolha **OBS Virtual Camera**.

A escolha fica salva no navegador para as próximas vezes.

## O que esperar

- A imagem chega com **atraso de 1 segundo ou mais**, porque passa pela rede e pelo OBS.
- O alcance é o do Wi-Fi do celular. Paredes e distância derrubam a qualidade.
- A GoPro esquenta e gasta bateria rápido durante a transmissão. Mantenha-a na tomada.

## Se algo não funcionar

| Sintoma | O que fazer |
|---|---|
| O MediaMTX não mostra a sessão `live/gopro` | Confira se o IP digitado no Quik é o do notebook e se os dois estão no mesmo Wi-Fi. Libere o MediaMTX no firewall do Windows. |
| O Quik não oferece a opção RTMP | Atualize o app e o firmware da GoPro pelo próprio Quik. |
| O OBS fica com a tela preta | Confira o endereço `rtmp://localhost:1935/live/gopro` e se a transmissão está ativa no Quik. |
| A Captura não lista a OBS Virtual Camera | Clique em **Iniciar câmera virtual** no OBS antes de abrir a câmera e recarregue a página. |
| A imagem trava | Baixe a resolução para 480p no Quik ou aproxime o celular da GoPro. |

## Situação

Este roteiro ainda não foi testado com a GoPro da equipe. A forma já testada e mais estável continua sendo o cabo USB com o app GoPro Webcam.
