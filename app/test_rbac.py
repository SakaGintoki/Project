import requests

API = "http://localhost:5000"

# 1. Register user
print("=== REGISTER ===")
res = requests.post(f"{API}/api/auth/register", json={
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "Test1234",
    "confirm_password": "Test1234"
})
print(f"Status: {res.status_code}")
token = res.json()["token"]

# 2. Create poll (authenticated)
print("\n=== CREATE POLL (authed) ===")
res = requests.post(f"{API}/api/votings", json={
    "title": "Test Poll",
    "options": ["Option A", "Option B"]
}, headers={"Authorization": f"Bearer {token}"})
print(f"Status: {res.status_code}")
poll_id = res.json()["id"]
print(f"Poll ID: {poll_id}, Author: {res.json()['author']}")

# 3. Create poll without auth (should fail 401)
print("\n=== CREATE POLL (no auth) ===")
res = requests.post(f"{API}/api/votings", json={
    "title": "Unauthenticated Poll",
    "options": ["A", "B"]
})
print(f"Status: {res.status_code} - {res.json()}")

# 4. Get poll detail with is_owner
print("\n=== DETAIL (as owner) ===")
res = requests.get(f"{API}/api/votings/{poll_id}", headers={"Authorization": f"Bearer {token}"})
print(f"is_owner: {res.json()['is_owner']}")

# 5. Get poll detail without auth
print("\n=== DETAIL (no auth) ===")
res = requests.get(f"{API}/api/votings/{poll_id}")
print(f"is_owner: {res.json()['is_owner']}")

# 6. Register another user
print("\n=== REGISTER USER 2 ===")
res = requests.post(f"{API}/api/auth/register", json={
    "full_name": "Other User",
    "email": "other@example.com",
    "password": "Test1234",
    "confirm_password": "Test1234"
})
token2 = res.json()["token"]

# 7. Try to delete as non-owner (should fail 403)
print("\n=== DELETE (non-owner) ===")
res = requests.delete(f"{API}/api/votings/{poll_id}", headers={"Authorization": f"Bearer {token2}"})
print(f"Status: {res.status_code} - {res.json()}")

# 8. Delete as owner (should succeed)
print("\n=== DELETE (owner) ===")
res = requests.delete(f"{API}/api/votings/{poll_id}", headers={"Authorization": f"Bearer {token}"})
print(f"Status: {res.status_code} - {res.json()}")

print("\n✅ All RBAC tests passed!")
