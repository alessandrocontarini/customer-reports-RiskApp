import base64
import json
from typing import Any

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa


def import_rsa_public_key_from_jwk(jwk: dict[str, Any]):
    if jwk.get("kty") != "RSA":
        raise ValueError("Unsupported public key type")

    n = _base64url_to_int(jwk["n"])
    e = _base64url_to_int(jwk["e"])

    return rsa.RSAPublicNumbers(e=e, n=n).public_key()


def encrypt_socket_message(public_key, message: dict[str, Any]) -> dict[str, str]:
    plaintext = json.dumps(message, separators=(",", ":")).encode("utf-8")

    ciphertext = public_key.encrypt(
        plaintext,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )

    return {
        "type": "encrypted",
        "algorithm": "RSA-OAEP-256",
        "ciphertext": base64.b64encode(ciphertext).decode("ascii"),
    }


def _base64url_to_int(value: str) -> int:
    padded = value + "=" * (-len(value) % 4)
    return int.from_bytes(base64.urlsafe_b64decode(padded), "big")
