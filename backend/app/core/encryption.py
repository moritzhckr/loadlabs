import os
import base64
from cryptography.fernet import Fernet
from app.core.config import settings

# Der Encryption Key muss ein gültiger 32-url-safe base64 string sein. 
# Falls nicht gesetzt, generieren wir einen Fallback (NUR FÜR DEV!).
_key = settings.ENCRYPTION_KEY
if not _key:
    _key = base64.urlsafe_b64encode(b"01234567890123456789012345678912").decode("utf-8")

cipher_suite = Fernet(_key.encode())

def encrypt_token(token: str) -> str:
    """Verschlüsselt einen Plaintext-Token."""
    if not token:
        return token
    return cipher_suite.encrypt(token.encode("utf-8")).decode("utf-8")

def decrypt_token(encrypted_token: str) -> str:
    """Entschlüsselt einen verschlüsselten Token."""
    if not encrypted_token:
        return encrypted_token
    return cipher_suite.decrypt(encrypted_token.encode("utf-8")).decode("utf-8")
