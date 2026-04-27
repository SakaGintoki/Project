import requests

API = "http://localhost:5000"

# Test Register
print("=== REGISTER ===")
res = requests.post(f"{API}/api/auth/register", json={
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "Test1234",
    "confirm_password": "Test1234"
})
print(f"Status: {res.status_code}")
print(f"Response: {res.json()}")

token = res.json().get("token")

# Test /me
print("\n=== ME ===")
res = requests.get(f"{API}/api/auth/me", headers={"Authorization": f"Bearer {token}"})
print(f"Status: {res.status_code}")
print(f"Response: {res.json()}")

# Test Login
print("\n=== LOGIN ===")
res = requests.post(f"{API}/api/auth/login", json={
    "email": "test@example.com",
    "password": "Test1234"
})
print(f"Status: {res.status_code}")
print(f"Response: {res.json()}")

# Test duplicate register
print("\n=== DUPLICATE REGISTER ===")
res = requests.post(f"{API}/api/auth/register", json={
    "full_name": "Test User 2",
    "email": "test@example.com",
    "password": "Test1234",
    "confirm_password": "Test1234"
})
print(f"Status: {res.status_code}")
print(f"Response: {res.json()}")
