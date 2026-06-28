import os

filepath = r'd:\Project\DatabaseProject\airline-frontend\src\views\CustomerView.vue'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Current state (buggy): we have the new discount span followed by
# the old duplicate discount span and a misplaced </div>.
# Target: remove the duplicate discount span and misplaced </div>.
old_block = '<span v-if="f.discount_rate < 1" style="font-size:11px;color:#e67e22;margin-left:4px;">({{ f.user_vip }}{{ Math.round(f.discount_rate*100) }}折)</span>\n                    <span v-if="f.discount_rate < 1" style="font-size:11px;color:#e67e22;">({{ f.user_vip }}{{ Math.round(f.discount_rate*100) }}折)</span>\n                  </div>'

good_block = '<span v-if="f.discount_rate < 1" style="font-size:11px;color:#e67e22;margin-left:4px;">({{ f.user_vip }}{{ Math.round(f.discount_rate*100) }}折)</span>'

if old_block in content:
    content = content.replace(old_block, good_block, 1)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print('SUCCESS: Removed duplicate discount span and extra </div>')
else:
    print('FAIL: old_block not found')
    # Debug: print the surrounding context
    lines = content.split('\n')
    for i in range(568, 572):
        if i < len(lines):
            print(f'L{i}: {repr(lines[i])}'[:200])
