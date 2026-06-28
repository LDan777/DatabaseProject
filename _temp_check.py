with open('d:/Project/DatabaseProject/ds-aviation-backend/app.py','r',encoding='utf-8') as f:
    lines = f.readlines()
for i in range(102, 118):
    print(f"{i+1}: {repr(lines[i])}")
