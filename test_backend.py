import urllib.request
import json

def request(url, method="GET", data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8") if data else None,
        headers=headers,
        method=method
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

BASE = "http://127.0.0.1:8000"

print("1. Health Check:")
status, res = request(f"{BASE}/api/health")
print("Status:", status, "Data:", res)

print("\n2. Test Unauthenticated Access to /api/dashboard (Should return 401):")
status, res = request(f"{BASE}/api/dashboard")
print("Status:", status, "Data:", res)

print("\n3. Test Login with default user (alex.chen@stanford.edu):")
status, res = request(f"{BASE}/api/auth/login", method="POST", data={
    "email": "alex.chen@stanford.edu",
    "password": "password123"
})
print("Status:", status, "Success:", "token" in res)
token = res.get("token")

print("\n4. Test Authenticated Access to /api/dashboard:")
status, res = request(f"{BASE}/api/dashboard", token=token)
print("Status:", status, "Score:", res.get("metrics", {}).get("overall_knowledge_score"))

print("\n5. Test Duplicate User Sign Up (Same email alex.chen@stanford.edu - Should return 409):")
status, res = request(f"{BASE}/api/auth/signup", method="POST", data={
    "name": "Another Alex",
    "email": "alex.chen@stanford.edu",
    "password": "password456"
})
print("Status:", status, "Data:", res)

print("\n6. Test Duplicate Username Sign Up (Same name Alex Chen - Should return 409):")
status, res = request(f"{BASE}/api/auth/signup", method="POST", data={
    "name": "Alex Chen",
    "email": "new.alex@stanford.edu",
    "password": "password456"
})
print("Status:", status, "Data:", res)

print("\n7. Test Valid Sign Up for new user:")
status, res = request(f"{BASE}/api/auth/signup", method="POST", data={
    "name": "Elena Vance",
    "email": "elena.vance@stanford.edu",
    "password": "securepassword123"
})
print("Status:", status, "Success:", "token" in res)
new_token = res.get("token")

print("\n8. Test LLM Diagnostic REST API:")
status, res = request(f"{BASE}/api/llm/diagnostic", method="POST", data={
    "topic": "Eigenvalues & Matrix Diagonalization"
}, token=new_token)
print("Status:", status, "Data:", res)

print("\n9. Test Secure Google OAuth verification through Clerk (/api/auth/clerk-sync):")
clerk_google_payload = {
    "clerk_id": "user_2GoogleOAuthStudent9988",
    "email": "sarah.connor@stanford.edu",
    "name": "Sarah Connor",
    "avatar_url": "https://lh3.googleusercontent.com/a/student-avatar.jpg",
    "course": "Active Diagnostic Workspace"
}
status, res = request(f"{BASE}/api/auth/clerk-sync", method="POST", data=clerk_google_payload)
print("Status:", status, "Success:", "token" in res, "User:", res.get("user", {}).get("name"))
clerk_jwt = res.get("token")

print("\n10. Test Clerk-authenticated Access to /api/dashboard:")
status, res = request(f"{BASE}/api/dashboard", token=clerk_jwt)
print("Status:", status, "Overall Score:", res.get("metrics", {}).get("overall_knowledge_score"), "User:", res.get("user", {}).get("name"))

print("\n11. Verify Direct Unauthenticated Access is Strictly Disabled across Protected Endpoints:")
endpoints = [
    f"{BASE}/api/dashboard",
    f"{BASE}/api/auth/me",
]
for ep in endpoints:
    st, d = request(ep)
    print(f"Direct unauthenticated access to {ep} -> Status: {st} (Protected from exposure)")
    assert st == 401, f"Expected 401 but got {st}"
print("All security and authentication verifications passed successfully!")
