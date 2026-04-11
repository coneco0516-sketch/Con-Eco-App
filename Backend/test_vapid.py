import base64
key = 'BAKkidll6rsBZNL1dNfVigz42Ek26PhvKgMLJTj_aiRy6eH_rz'
# Decode base64url
pad = len(key) % 4
if pad:
    key += '=' * (4 - pad)
try:
    data = base64.urlsafe_b64decode(key)
    print(f"Decoded length: {len(data)} bytes")
    print(f"First byte: {data[0]}")
    if data[0] == 4 and len(data) == 65:
        print("This is a valid uncompressed P-256 public key.")
    else:
        print("INVALID VAPID KEY FORMAT!")
except Exception as e:
    print(f"Decode error: {e}")
