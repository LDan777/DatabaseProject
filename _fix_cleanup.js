const fs = require('fs');

const filepath = 'd:/Project/DatabaseProject/airline-frontend/src/views/CustomerView.vue';

let content = fs.readFileSync(filepath, 'utf8');

// Remove the duplicate old discount span and misplaced closing div
// Pattern: lines 568-571 have an extra discount span and closing div
const bad = `                  <span v-if="f.discount_rate < 1" style="font-size:11px;color:#e67e22;margin-left:4px;">({{ f.user_vip }}{{ Math.round(f.discount_rate*100) }}折)</span>
                    <span v-if="f.discount_rate < 1" style="font-size:11px;color:#e67e22;">({{ f.user_vip }}{{ Math.round(f.discount_rate*100) }}折)</span>
                  </div>
                </div>`;

const good = `                  <span v-if="f.discount_rate < 1" style="font-size:11px;color:#e67e22;margin-left:4px;">({{ f.user_vip }}{{ Math.round(f.discount_rate*100) }}折)</span>
                </div>`;

if (content.includes(bad)) {
    content = content.replace(bad, good);
    fs.writeFileSync(filepath, content, 'utf8');
    console.log('Fix applied successfully!');
} else {
    console.log('Pattern not found. Checking line content...');
    const lines = content.split('\n');
    for (let i = 566; i <= 572; i++) {
        console.log(`L${i+1}: ${JSON.stringify(lines[i])}`);
    }
}
