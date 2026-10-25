import os
import tempfile
import time
from pathlib import Path

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa

# Configura a API em modo Cognito antes de importar o app.
_tmp = Path(tempfile.mkdtemp())
os.environ.update(
    {
        "ENVIRONMENT": "test",
        "AUTH_MODE": "cognito",
        "AWS_REGION": "us-east-1",
        "COGNITO_USER_POOL_ID": "us-east-1_TESTE",
        "COGNITO_APP_CLIENT_ID": "cliente-teste",
        "DATABASE_URL": "",
        "STORAGE_BACKEND": "local",
        "LOCAL_DATA_FILE": str(_tmp / "dados.json"),
        "UPLOAD_DIR": str(_tmp / "uploads"),
    }
)

from fastapi.testclient import TestClient  # noqa: E402

from app import auth  # noqa: E402
from app.config import get_settings  # noqa: E402
from app.main import app  # noqa: E402

ISSUER = "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_TESTE"
_chave_privada = rsa.generate_private_key(public_exponent=65537, key_size=2048)


class _FakeJwks:
    def get_signing_key_from_jwt(self, token):
        return type("Chave", (), {"key": _chave_privada.public_key()})()


@pytest.fixture(autouse=True)
def jwks_falso(monkeypatch):
    monkeypatch.setattr(auth, "_jwks_client", lambda issuer: _FakeJwks())


def gerar_token(sub: str, **extras) -> str:
    claims = {
        "sub": sub,
        "iss": ISSUER,
        "client_id": "cliente-teste",
        "token_use": "access",
        "exp": int(time.time()) + 600,
        **extras,
    }
    return jwt.encode(claims, _chave_privada, algorithm="RS256", headers={"kid": "teste"})


def headers_de(sub: str, **extras) -> dict:
    return {"Authorization": f"Bearer {gerar_token(sub, **extras)}"}


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def settings():
    return get_settings()
