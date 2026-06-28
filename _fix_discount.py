import sys

filepath = r'd:\Project\DatabaseProject\airline-frontend\src\views\CustomerView.vue'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix: add discount label and button after L568 </div> (closes cabin v-for)
# Current lines 567-570:
# 567: ...cabin.real_price...</span>
# 568:                   </div>
# 569:                 </div>          <- closes price-area (should come after discount)
# 570:               </div>           <- closes t-bottom (should come after button)

# We need to insert after L568:
#   <span v-if="f.discount_rate < 1" ...>折)</span>
#   </div>  (price-area)
#   <button class="btn-book-now" ...>
#   </div>  (t-bottom)
# And keep lines 571-573 as they are

# Strategy: replace lines 568-570 with the corrected content
# L568 was:                   </div>
# L569 was:                 </div>
# L570 was:               </div>

corrected = [
    '                  </div>\n',
    '                  <span v-if="f.discount_rate < 1" style="font-size:11px;color:#e67e22;">({{ f.user_vip }}{{ Math.round(f.discount_rate*100) }}折)</span>\n',
    '                </div>\n',
    '                <button class="btn-book-now" @click="isChangeMode ? handleRebookConfirm(f) : openBookModal(f)" :style="isChangeMode ? {background:\'#f59e0b\'} : {}">{{ isChangeMode ? \'改签到此航班\' : \'预订\' }}</button>\n',
    '              </div>\n',
]

# Verify lines 567-570 look as expected
idx_reference = -1
for i in range(len(lines)):
    if 'style="color:#e74c3c;font-weight:700;">{{ cabin.real_price }}</span>' in lines[i]:
        idx_reference = i
        break

if idx_reference < 0:
    print('ERROR: Could not find cabin real_price line')
    sys.exit(1)

# Replace lines idx_reference+1 through idx_reference+3 with corrected
expected_l568 = '                  </div>\n'
expected_l569 = '                </div>\n'
expected_l570 = '              </div>\n'

l568 = lines[idx_reference + 1] if idx_reference + 1 < len(lines) else ''
l569 = lines[idx_reference + 2] if idx_reference + 2 < len(lines) else ''
l570 = lines[idx_reference + 3] if idx_reference + 3 < len(lines) else ''

if l568.strip() == '</div>' and l569.strip() == '</div>' and l570.strip() == '</div>':
    # Replace the 3 lines with the 5 corrected lines
    new_lines = lines[:idx_reference + 1] + corrected + lines[idx_reference + 4:]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print('SUCCESS: Flights section fixed (discount + button restored).')
    with open(r'd:\Project\DatabaseProject\_result.txt', 'w') as rf:
        rf.write('SUCCESS: Flights section fixed\n')
else:
    print(f'WARN: Lines don\'t match expected pattern.')
    print(f'  L{idx_reference+2}: {repr(l568)}')
    print(f'  L{idx_reference+3}: {repr(l569)}')
    print(f'  L{idx_reference+4}: {repr(l570)}')

# Now fix the corrupted orders section
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the corrupted duplicate orders section
# Pattern: the broken section has btn-book-now inside orders (which is wrong)
corrupted_pattern = """        <div v-if="activeTab === 'orders'" class="view-profile">
          <h4 class="section-label">我的行程记录</h4>
          <div v-if="isLoggedIn" class="history-list">
            <div v-if="historyFlights.length === 0" class="no-flights-msg card-shadow">暂无行程订单</div>
            <div v-for="h in historyFlights" :key="h.id" class="history-card card-shadow">
              <div class="h-date">
                <div style="font-size:14px;font-weight:700;color:#1e293b;">{{ h.date }}</div>

                  </div>
                </div>
                <button class="btn-book-now" @click="isChangeMode ? handleRebookConfirm(f) : openBookModal(f)" :style="isChangeMode ? {background:'#f59e0b'} : {}">{{ isChangeMode ? '改签到此航班' : '预订' }}</button>
              </div>
            </div>
          </div>
        </div>

"""

if corrupted_pattern in content:
    content = content.replace(corrupted_pattern, '', 1)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print('SUCCESS: Corrupted orders duplicate removed.')
else:
    print('WARN: Corrupted orders pattern not found.')
    # Try finding it
    idx = content.find('class="btn-book-now"')
    print(f'  First btn-book-now at offset {idx}')

