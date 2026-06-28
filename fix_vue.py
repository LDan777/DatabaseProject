"""Fix CustomerView.vue - add v-if to phone field div"""
filepath = 'd:/Project/DatabaseProject/airline-frontend/src/views/CustomerView.vue'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace: phone field div to add v-if="isRegisterMode"
old = '        <div class="input-group-modern">\n          <label>联系电话</label>'
new = '        <div class="input-group-modern" v-if="isRegisterMode">\n          <label>联系电话</label>'

count = content.count(old)
result = f'Occurrences found: {count}\n'

if count == 1:
    content = content.replace(old, new)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    result += 'SUCCESS: v-if added to phone field div\n'
elif count > 1:
    result += 'MULTIPLE matches - skipping\n'
else:
    result += 'NOT FOUND - content around 联系电话:\n'
    idx = content.find('联系电话')
    if idx >= 0:
        result += repr(content[max(0,idx-100):idx+100])

with open('d:/Project/DatabaseProject/fix_vue_result.txt', 'w', encoding='utf-8') as f:
    f.write(result)
