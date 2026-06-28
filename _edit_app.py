import re

with open('d:/Project/DatabaseProject/ds-aviation-backend/app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Print around login function to debug
idx = content.find('def login():')
print(f"Found login() at index {idx}")
if idx >= 0:
    snippet = content[idx:idx+600]
    print(repr(snippet))
