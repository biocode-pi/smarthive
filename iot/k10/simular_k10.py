import argparse
import json
import os
import random
import sys
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path


def corpo_multipart(foto: Path, temperatura: float, umidade: float) -> tuple[bytes, str]:
    limite = uuid.uuid4().hex
    partes = []
    for nome, valor in (("temperatura_c", f"{temperatura:.1f}"), ("umidade_percentual", f"{umidade:.1f}")):
        partes.append(f'--{limite}\r\nContent-Disposition: form-data; name="{nome}"\r\n\r\n{valor}\r\n'.encode())
    tipo = "image/png" if foto.suffix.lower() == ".png" else "image/jpeg"
    partes.append(
        f'--{limite}\r\nContent-Disposition: form-data; name="foto"; filename="{foto.name}"\r\nContent-Type: {tipo}\r\n\r\n'.encode()
    )
    partes.append(foto.read_bytes())
    partes.append(f"\r\n--{limite}--\r\n".encode())
    return b"".join(partes), f"multipart/form-data; boundary={limite}"


def enviar(endereco: str, chave: str, foto: Path) -> None:
    temperatura = round(random.uniform(26, 31), 1)
    umidade = round(random.uniform(55, 75), 1)
    corpo, tipo = corpo_multipart(foto, temperatura, umidade)
    pedido = urllib.request.Request(
        endereco,
        data=corpo,
        method="POST",
        headers={"Authorization": f"Dispositivo {chave}", "Content-Type": tipo, "User-Agent": "smarthive-k10-simulador"},
    )
    try:
        with urllib.request.urlopen(pedido, timeout=60) as resposta:
            dados = json.loads(resposta.read())
            print(f"{foto.name}: {temperatura} °C, {umidade} % -> {dados['abelhas']} abelhas ({resposta.status})")
    except urllib.error.HTTPError as erro:
        try:
            detalhe = erro.read().decode(errors="replace")
        except OSError:
            detalhe = ""
        print(f"{foto.name}: HTTP {erro.code} {detalhe}", file=sys.stderr)
    except urllib.error.URLError as erro:
        print(f"{foto.name}: sem conexão com {endereco} ({erro.reason})", file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser(description="Envia fotos como se fosse a UNIHIKER K10.")
    parser.add_argument("fotos", nargs="+", type=Path, help="Fotos JPEG ou PNG")
    parser.add_argument("--endereco", default="http://localhost:8000/api/dispositivos/captura")
    parser.add_argument("--chave", default=os.environ.get("SMARTHIVE_CHAVE"), help="Chave gerada no site (ou SMARTHIVE_CHAVE)")
    parser.add_argument("--intervalo", type=float, default=0, help="Segundos entre envios; 0 envia uma vez cada foto")
    args = parser.parse_args()
    if not args.chave:
        parser.error("informe --chave ou a variável SMARTHIVE_CHAVE")

    while True:
        for foto in args.fotos:
            enviar(args.endereco, args.chave, foto)
            if args.intervalo:
                time.sleep(args.intervalo)
        if not args.intervalo:
            break


if __name__ == "__main__":
    main()
