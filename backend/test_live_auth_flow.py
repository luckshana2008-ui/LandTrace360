import urllib.request
import json
import time

BASE = 'http://127.0.0.1:8000'
ORIGIN = 'http://localhost:5173'

def post_json(path, data, token=None):
    payload = json.dumps(data).encode('utf-8')
    headers = {
        'Content-Type': 'application/json',
        'Origin': ORIGIN
    }
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(f'{BASE}{path}', data=payload, headers=headers, method='POST')
    try:
        r = urllib.request.urlopen(req, timeout=5)
        return r.status, json.loads(r.read().decode()), dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode()), dict(e.headers)

def get_json(path, token=None):
    headers = {'Origin': ORIGIN}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(f'{BASE}{path}', headers=headers, method='GET')
    try:
        r = urllib.request.urlopen(req, timeout=5)
        return r.status, json.loads(r.read().decode()), dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode()), dict(e.headers)

print("=== 1. Buyer Login ===")
status, data, h = post_json('/api/auth/login', {'email': 'buyer@landtrace360.demo', 'password': 'DemoPassword123!', 'remember_me': False})
assert status == 200, f"Buyer login failed: {status} {data}"
buyer_token = data['token']
print(f"PASS: Buyer logged in. Role: {data['user']['role']}. CORS allow-origin: {h.get('access-control-allow-origin')}")

print("\n=== 2. Land Owner Login ===")
status, data, h = post_json('/api/auth/login', {'email': 'owner@landtrace360.demo', 'password': 'DemoPassword123!', 'remember_me': True})
assert status == 200, f"Owner login failed: {status} {data}"
owner_token = data['token']
print(f"PASS: Owner logged in. Role: {data['user']['role']}. CORS allow-origin: {h.get('access-control-allow-origin')}")

print("\n=== 3. Investigator/Admin Login ===")
status, data, h = post_json('/api/auth/login', {'email': 'investigator@landtrace360.demo', 'password': 'DemoPassword123!', 'remember_me': False})
assert status == 200, f"Investigator login failed: {status} {data}"
inv_token = data['token']
print(f"PASS: Investigator logged in. Role: {data['user']['role']}. CORS allow-origin: {h.get('access-control-allow-origin')}")

print("\n=== 4. Invalid Password ===")
status, data, h = post_json('/api/auth/login', {'email': 'buyer@landtrace360.demo', 'password': 'WrongPassword999', 'remember_me': False})
assert status == 401, f"Expected 401 for wrong password, got {status}"
print(f"PASS: Rejected wrong password with 401: {data['detail']}")

print("\n=== 5. Registration ===")
reg_email = f"newbuyer_{int(time.time())}@test.demo"
status, data, h = post_json('/api/auth/register', {'full_name': 'Test New Buyer', 'email': reg_email, 'password': 'SecurePassword123!', 'role': 'buyer'})
assert status == 200, f"Registration failed: {status} {data}"
new_token = data['token']
print(f"PASS: Registered user {reg_email}. Role: {data['user']['role']}")

print("\n=== 6. Duplicate Registration ===")
status, data, h = post_json('/api/auth/register', {'full_name': 'Test Duplicate', 'email': reg_email, 'password': 'SecurePassword123!', 'role': 'buyer'})
assert status == 400, f"Expected 400 for duplicate, got {status}"
print(f"PASS: Rejected duplicate registration with 400: {data['detail']}")

print("\n=== 7. /api/auth/me (Session Recovery) ===")
status, data, h = get_json('/api/auth/me', token=buyer_token)
assert status == 200, f"/api/auth/me failed: {status} {data}"
assert data['authenticated'] is True
print(f"PASS: /api/auth/me recovered session for {data['user']['email']} ({data['user']['full_name']})")

print("\n=== 8. Logout ===")
status, data, h = post_json('/api/auth/logout', {}, token=buyer_token)
assert status == 200, f"Logout failed: {status} {data}"
print(f"PASS: Logout succeeded: {data['message']}")

print("\n=== 9. Token Invalidation Check ===")
status, data, h = get_json('/api/auth/me', token=buyer_token)
assert status == 401, f"Expected 401 after logout, got {status}"
print(f"PASS: Revoked token rejected with 401: {data['detail']}")

print("\n=== 10. Protected Route / Authenticated Chat Call ===")
status, data, h = post_json('/api/chat', {'message': 'Who owns LND-1001?'}, token=owner_token)
assert status == 200, f"Authenticated chat failed: {status} {data}"
print(f"PASS: Protected /api/chat accessible with valid token. Answer preview: {data['answer'][:60]}...")

print("\n=======================================================")
print("ALL 10 AUTH FLOWS PASSED 100% OVER CORS HTTP PROTOCOL!")
print("=======================================================")
