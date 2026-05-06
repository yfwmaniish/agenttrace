"""
Cryptographic engine — Ed25519 signing, SHA-256 hash chains, Merkle trees.
Mirror of @agenttrace/core TypeScript package.
"""

import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Any

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _sha256(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def canonicalize(obj: Any) -> str:
    """Deterministic JSON serialization with sorted keys."""
    return json.dumps(_sort_keys(obj), separators=(",", ":"))


def _sort_keys(obj: Any) -> Any:
    if obj is None:
        return None
    if isinstance(obj, dict):
        return {k: _sort_keys(v) for k, v in sorted(obj.items())}
    if isinstance(obj, list):
        return [_sort_keys(v) for v in obj]
    return obj


# ---------- Key Management ----------

def generate_keypair() -> dict:
    """Generate an Ed25519 keypair."""
    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()

    priv_bytes = private_key.private_bytes(
        serialization.Encoding.DER,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
    pub_bytes = public_key.public_bytes(
        serialization.Encoding.DER,
        serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    pub_hex = pub_bytes.hex()
    fingerprint = hashlib.sha256(pub_hex.encode()).hexdigest()[:16]

    return {
        "publicKey": pub_hex,
        "privateKey": priv_bytes.hex(),
        "fingerprint": fingerprint,
        "createdAt": _now_iso(),
    }


def sign_message(message: str, private_key_hex: str) -> str:
    """Sign a message with Ed25519."""
    private_key = serialization.load_der_private_key(bytes.fromhex(private_key_hex), password=None)
    signature = private_key.sign(message.encode("utf-8"))  # type: ignore
    return signature.hex()


def verify_signature(message: str, signature_hex: str, public_key_hex: str) -> bool:
    """Verify an Ed25519 signature."""
    try:
        public_key = serialization.load_der_public_key(bytes.fromhex(public_key_hex))
        public_key.verify(bytes.fromhex(signature_hex), message.encode("utf-8"))  # type: ignore
        return True
    except Exception:
        return False


# ---------- Hash Chain ----------

GENESIS_HASH = "0" * 64


def compute_content_hash(span: dict) -> str:
    """SHA-256 of the canonical span."""
    canonical = canonicalize({
        "spanId": span["spanId"],
        "traceId": span["traceId"],
        "parentSpanId": span.get("parentSpanId"),
        "sessionId": span["sessionId"],
        "name": span["name"],
        "kind": span["kind"],
        "startTime": span["startTime"],
        "endTime": span.get("endTime"),
        "status": span["status"],
        "attributes": span.get("attributes", {}),
        "events": span.get("events", []),
        "input": span.get("input"),
        "output": span.get("output"),
    })
    return _sha256(canonical)


def compute_chain_hash(content_hash: str, previous_hash: str) -> str:
    return _sha256(content_hash + previous_hash)


def create_trace_record(
    span: dict, previous_hash: str, sequence: int, private_key_hex: str, public_key_hex: str
) -> dict:
    content_hash = compute_content_hash(span)
    chain_hash = compute_chain_hash(content_hash, previous_hash)
    signature = sign_message(chain_hash, private_key_hex)

    return {
        "id": str(uuid.uuid4()),
        "sequenceNumber": sequence,
        "span": span,
        "contentHash": content_hash,
        "previousHash": previous_hash,
        "chainHash": chain_hash,
        "signature": signature,
        "publicKey": public_key_hex,
        "timestamp": _now_iso(),
    }


# ---------- Verification ----------

def verify_chain(records: list[dict]) -> dict:
    """Verify an entire chain of trace records."""
    errors = []
    sorted_records = sorted(records, key=lambda r: r["sequenceNumber"])

    if not sorted_records:
        return {"valid": True, "chainLength": 0, "errors": [], "verifiedAt": _now_iso()}

    for i, record in enumerate(sorted_records):
        expected_prev = GENESIS_HASH if i == 0 else sorted_records[i - 1]["chainHash"]

        if record["sequenceNumber"] != i:
            errors.append({"recordId": record["id"], "type": "sequence_gap", "message": f"Expected {i}, got {record['sequenceNumber']}"})

        if record["previousHash"] != expected_prev:
            errors.append({"recordId": record["id"], "type": "chain_break", "message": f"Chain break at seq {record['sequenceNumber']}"})

        re_content = compute_content_hash(record["span"])
        if record["contentHash"] != re_content:
            errors.append({"recordId": record["id"], "type": "hash_mismatch", "message": f"Content tampered at seq {record['sequenceNumber']}"})

        if not verify_signature(record["chainHash"], record["signature"], record["publicKey"]):
            errors.append({"recordId": record["id"], "type": "signature_invalid", "message": f"Invalid signature at seq {record['sequenceNumber']}"})

    return {
        "valid": len(errors) == 0,
        "chainLength": len(sorted_records),
        "firstRecord": sorted_records[0]["id"],
        "lastRecord": sorted_records[-1]["id"],
        "errors": errors,
        "verifiedAt": _now_iso(),
    }


def find_tamper_point(records: list[dict]) -> dict | None:
    result = verify_chain(records)
    if result["valid"]:
        return None
    return {"error": result["errors"][0]}


# ---------- Merkle Tree ----------

def compute_merkle_root(leaves: list[str]) -> str:
    if not leaves:
        return "0" * 64
    if len(leaves) == 1:
        return leaves[0]

    level = list(leaves)
    while len(level) > 1:
        next_level = []
        for i in range(0, len(level), 2):
            left = level[i]
            right = level[i + 1] if i + 1 < len(level) else level[i]
            next_level.append(_sha256(left + right))
        level = next_level
    return level[0]
