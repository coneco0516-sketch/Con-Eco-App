import subprocess
try:
    import pywebpush
except:
    subprocess.check_call(["pip", "install", "pywebpush"])

import os
import ecdsa
import base64
import json

from pywebpush import WebPusher

# Generate keys
private_key = ecdsa.SigningKey.generate(curve=ecdsa.NIST256p)
public_key = private_key.get_verifying_key()

sk_string = private_key.to_string()
pk_string = b"\x04" + public_key.to_string()

def encode_base64_url(bites):
    return base64.urlsafe_b64encode(bites).replace(b"=", b"").decode("utf-8")

vapid_private_key = encode_base64_url(sk_string)
vapid_public_key = encode_base64_url(pk_string)

print("--- NEW KEYS ---")
print(f"VAPID_PRIVATE_KEY={vapid_private_key}")
print(f"VAPID_PUBLIC_KEY={vapid_public_key}")
