import urllib.request, json
req = urllib.request.Request(
    'http://localhost:8080/api/auth/register', 
    data=json.dumps({'email':'testuser_new@example.com','password':'password123','role':'STUDENT','name':'Test User'}).encode('utf-8'), 
    headers={'Content-Type': 'application/json'}, 
    method='POST'
)
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print(e.read().decode())
