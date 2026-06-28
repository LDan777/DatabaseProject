with open('d:/Project/DatabaseProject/ds-aviation-backend/app.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remove dead code lines (126-128, 0-indexed: 125-127)
# Lines 125,126,127 (0-indexed) are the dead code
new_lines = []
skip_until = -1
for i, line in enumerate(lines):
    if 125 <= i <= 127:
        continue  # skip dead code lines
    new_lines.append(line)

with open('d:/Project/DatabaseProject/ds-aviation-backend/app.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

with open('d:/Project/DatabaseProject/_fix_result.txt', 'w') as f:
    f.write('DONE - removed lines 126-128')
