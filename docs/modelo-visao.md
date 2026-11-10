# Modelo de visao da pagina de Captura

A Captura pode usar o detector de abelhas treinado pelo grupo. Ele roda no navegador, entao
as imagens nao precisam ir para um servidor para serem analisadas e nao ha custo de AWS.

Sem o arquivo do modelo, a pagina continua funcionando com o reconhecimento generico.

## Como publicar uma versao do modelo

1. No projeto de treinamento, exporte o `best.pt` para ONNX, sem NMS:

   ```bash
   yolo export model=ml/models/jatai/experiment_01/weights/best.pt format=onnx imgsz=640 opset=12 simplify=True
   ```

2. Copie o arquivo gerado para `frontend/public/modelos/jatai-v1.onnx`.
3. Publique o frontend (`infra\deploy-frontend.cmd`).

Modelos nao vao para o Git: o arquivo precisa estar na maquina que faz o deploy.

Ao trocar o modelo, aumente o numero da versao no nome do arquivo e em `MODELO_URL`
([detectorAbelhas.ts](../frontend/src/services/detectorAbelhas.ts)). O deploy publica os arquivos
com cache de 1 ano, entao reaproveitar o mesmo nome manteria o modelo antigo nos navegadores.

## O que o detector informa

- Quantas abelhas aparecem em cada imagem e a maior confianca entre elas.
- Nao identifica quem entrou ou saiu: isso exige acompanhar as abelhas entre as imagens.
- O modelo atual e so de abelhas. Possiveis invasores continuam sendo marcados pelo usuario
  ate existir um modelo treinado para eles.
- Todas as classes do modelo contam como abelha.
