from __future__ import annotations

import json
from copy import deepcopy
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, List, Optional, Protocol
from uuid import uuid4

from app.config import get_settings


TABLES = ("colmeias", "monitoramentos", "alertas", "capturas_sensor_celular")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Store(Protocol):
    def list(self, table: str, filtros: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]: ...
    def get(self, table: str, item_id: str) -> Optional[Dict[str, Any]]: ...
    def create(self, table: str, payload: Dict[str, Any]) -> Dict[str, Any]: ...
    def update(self, table: str, item_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]: ...
    def delete(self, table: str, item_id: str) -> bool: ...
    def ping(self) -> Dict[str, Any]: ...


def clean_insert_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Remove valores None para permitir que defaults do PostgreSQL sejam usados."""

    return {key: value for key, value in payload.items() if value is not None}


def normalize_db_row(row: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if row is None:
        return None
    normalized: Dict[str, Any] = {}
    for key, value in row.items():
        if isinstance(value, Decimal):
            normalized[key] = float(value)
        else:
            normalized[key] = value
    return normalized


def normalize_db_rows(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [item for item in (normalize_db_row(row) for row in rows) if item is not None]


def seed_data(usuario_id: str) -> Dict[str, List[Dict[str, Any]]]:
    hive_id = "colmeia-jatai-campus"
    monitoring_id = "mon-campus-001"
    return {
        "colmeias": [
            {
                "id": hive_id,
                "usuario_id": usuario_id,
                "nome": "Colmeia Jatai - Campus",
                "codigo": "JAT-001",
                "especie": "Jatai",
                "localizacao": "Horto experimental",
                "descricao": "Colmeia piloto usada para validacao do fluxo visual com celular.",
                "status": "ativa",
                "instalada_em": str(date.today()),
                "criado_em": now_iso(),
                "atualizado_em": now_iso(),
            },
            {
                "id": "colmeia-mandacaia-lab",
                "usuario_id": usuario_id,
                "nome": "Mandacaia - Meliponario",
                "codigo": "MAN-002",
                "especie": "Mandacaia",
                "localizacao": "Meliponario escola",
                "descricao": "Unidade em observacao para comparacao de comportamento.",
                "status": "observacao",
                "instalada_em": str(date.today()),
                "criado_em": now_iso(),
                "atualizado_em": now_iso(),
            },
        ],
        "monitoramentos": [
            {
                "id": monitoring_id,
                "usuario_id": usuario_id,
                "colmeia_id": hive_id,
                "data_hora": now_iso(),
                "origem": "sensor_celular",
                "duracao_segundos": 60,
                "movimentos_estimados": 42,
                "abelhas_entrando": 18,
                "abelhas_saindo": 16,
                "fluxo_estimado": 34,
                "temperatura_c": None,
                "umidade_percentual": None,
                "possivel_invasor": False,
                "observacoes": "Captura experimental com celular apontado para a entrada.",
                "midia_url": None,
                "analise_experimental": {
                    "nivel_atividade": "moderado",
                    "saldo_fluxo": 2,
                    "observacao": "Analise heuristica inicial, sem IA real.",
                },
                "criado_em": now_iso(),
                "atualizado_em": now_iso(),
            }
        ],
        "alertas": [
            {
                "id": "alerta-observacao-campus",
                "usuario_id": usuario_id,
                "colmeia_id": hive_id,
                "monitoramento_id": monitoring_id,
                "tipo": "observacao",
                "severidade": "baixa",
                "titulo": "Validar posicionamento do celular",
                "mensagem": "Revisar enquadramento da entrada da colmeia nas proximas capturas.",
                "resolvido": False,
                "criado_em": now_iso(),
                "resolvido_em": None,
            }
        ],
        "capturas_sensor_celular": [],
    }


class LocalJsonStore:
    """Persistencia simples para o MVP local.

    Em producao a API usa PostgreSQL (Amazon RDS); este store deixa a API
    funcional em bancada academica sem nenhum banco configurado.
    """

    def __init__(self, data_file: Path, usuario_seed: str):
        self.data_file = data_file
        self.data_file.parent.mkdir(parents=True, exist_ok=True)
        if not self.data_file.exists():
            self._write(seed_data(usuario_seed))

    def _read(self) -> Dict[str, List[Dict[str, Any]]]:
        with self.data_file.open("r", encoding="utf-8") as file:
            data = json.load(file)
        for table in TABLES:
            data.setdefault(table, [])
        return data

    def _write(self, data: Dict[str, List[Dict[str, Any]]]) -> None:
        with self.data_file.open("w", encoding="utf-8") as file:
            json.dump(data, file, ensure_ascii=False, indent=2)

    def list(self, table: str, filtros: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        data = self._read()
        itens = data.get(table, [])
        if filtros:
            itens = [item for item in itens if all(item.get(k) == v for k, v in filtros.items())]
        return deepcopy(itens)

    def get(self, table: str, item_id: str) -> Optional[Dict[str, Any]]:
        return next((item for item in self.list(table) if item.get("id") == item_id), None)

    def create(self, table: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        data = self._read()
        item = deepcopy(payload)
        item.setdefault("id", str(uuid4()))
        item.setdefault("criado_em", now_iso())
        item.setdefault("atualizado_em", now_iso())
        data.setdefault(table, []).append(item)
        self._write(data)
        return item

    def update(self, table: str, item_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        data = self._read()
        for index, item in enumerate(data.get(table, [])):
            if item.get("id") == item_id:
                updated = {**item, **payload, "id": item_id, "atualizado_em": now_iso()}
                data[table][index] = updated
                self._write(data)
                return updated
        return None

    def delete(self, table: str, item_id: str) -> bool:
        data = self._read()
        before = len(data.get(table, []))
        data[table] = [item for item in data.get(table, []) if item.get("id") != item_id]
        self._write(data)
        return len(data[table]) < before

    def ping(self) -> Dict[str, Any]:
        return {
            "mode": "local_json",
            "status": "ok",
            "data_file": str(self.data_file),
        }


class PostgresStore:
    """Persistencia no PostgreSQL (Amazon RDS em producao) via DATABASE_URL."""

    def __init__(self, database_url: str, sslmode: str = "require"):
        try:
            import psycopg
            from psycopg.rows import dict_row
            from psycopg.types.json import Jsonb
        except ImportError as exc:
            raise RuntimeError("Instale psycopg[binary] para usar DATABASE_URL.") from exc

        self.database_url = database_url
        self.sslmode = sslmode
        self._psycopg = psycopg
        self._dict_row = dict_row
        self._jsonb = Jsonb

    def _connect(self):
        return self._psycopg.connect(
            self.database_url,
            row_factory=self._dict_row,
            connect_timeout=10,
            sslmode=self.sslmode,
            prepare_threshold=None,
        )

    def _table_identifier(self, table: str):
        if table not in TABLES:
            raise ValueError(f"Tabela nao permitida: {table}")
        return self._psycopg.sql.Identifier(table)

    def _adapt_value(self, value: Any) -> Any:
        if isinstance(value, (dict, list)):
            return self._jsonb(value)
        return value

    def _adapt_payload(self, payload: Dict[str, Any], remove_none: bool) -> Dict[str, Any]:
        data = clean_insert_payload(payload) if remove_none else payload
        return {key: self._adapt_value(value) for key, value in data.items()}

    def list(self, table: str, filtros: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        sql = self._psycopg.sql
        query = sql.SQL("select * from {}").format(self._table_identifier(table))
        params: tuple = ()
        if filtros:
            condicoes = [sql.SQL("{} = {}").format(sql.Identifier(col), sql.Placeholder()) for col in filtros]
            query = query + sql.SQL(" where ") + sql.SQL(" and ").join(condicoes)
            params = tuple(filtros.values())
        with self._connect() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                return normalize_db_rows(cursor.fetchall())

    def get(self, table: str, item_id: str) -> Optional[Dict[str, Any]]:
        query = self._psycopg.sql.SQL("select * from {} where id = %s limit 1").format(self._table_identifier(table))
        with self._connect() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, (item_id,))
                return normalize_db_row(cursor.fetchone())

    def create(self, table: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        data = self._adapt_payload(payload, remove_none=True)

        with self._connect() as conn:
            with conn.cursor() as cursor:
                if not data:
                    query = self._psycopg.sql.SQL("insert into {} default values returning *").format(
                        self._table_identifier(table)
                    )
                    cursor.execute(query)
                else:
                    columns = [self._psycopg.sql.Identifier(column) for column in data.keys()]
                    placeholders = [self._psycopg.sql.Placeholder() for _ in data.keys()]
                    query = self._psycopg.sql.SQL("insert into {} ({}) values ({}) returning *").format(
                        self._table_identifier(table),
                        self._psycopg.sql.SQL(", ").join(columns),
                        self._psycopg.sql.SQL(", ").join(placeholders),
                    )
                    cursor.execute(query, tuple(data.values()))
                created = normalize_db_row(cursor.fetchone())
                if not created:
                    raise RuntimeError(f"PostgreSQL nao retornou dados ao inserir em {table}.")
                return created

    def update(self, table: str, item_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        data = self._adapt_payload(payload, remove_none=False)
        if not data:
            return self.get(table, item_id)

        assignments = [
            self._psycopg.sql.SQL("{} = {}").format(
                self._psycopg.sql.Identifier(column),
                self._psycopg.sql.Placeholder(),
            )
            for column in data.keys()
        ]
        query = self._psycopg.sql.SQL("update {} set {} where id = %s returning *").format(
            self._table_identifier(table),
            self._psycopg.sql.SQL(", ").join(assignments),
        )

        with self._connect() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, (*data.values(), item_id))
                return normalize_db_row(cursor.fetchone())

    def delete(self, table: str, item_id: str) -> bool:
        query = self._psycopg.sql.SQL("delete from {} where id = %s returning id").format(self._table_identifier(table))
        with self._connect() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, (item_id,))
                return cursor.fetchone() is not None

    def ping(self) -> Dict[str, Any]:
        with self._connect() as conn:
            with conn.cursor() as cursor:
                cursor.execute("select current_database() as database, current_schema() as schema")
                result = cursor.fetchone()
        return {
            "mode": "postgres",
            "status": "ok",
            "database": result["database"],
            "schema": result["schema"],
        }


_store: Store | None = None


def get_store() -> Store:
    global _store
    if _store is None:
        settings = get_settings()
        if settings.database_url:
            _store = PostgresStore(settings.database_url, settings.database_sslmode)
        else:
            _store = LocalJsonStore(settings.local_data_file, settings.dev_user_id)
    return _store


def reset_store() -> None:
    global _store
    _store = None
