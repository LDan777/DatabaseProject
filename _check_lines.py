import os

filepath = r'd:\Project\DatabaseProject\airline-frontend\src\views\CustomerView.vue'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'Total lines: {len(lines)}')

for i in range(560, min(576, len(lines))):
    print(f'L{i+1}: {repr(lines[i])}')