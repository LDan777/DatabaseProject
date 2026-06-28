const fs = require('fs');
const p = 'd:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue';
let c = fs.readFileSync(p, 'utf8');

// Add API_BASE and axios import at the top
c = c.replace(
  `<script setup>\r\nimport { ref, computed, watch, onMounted } from 'vue'`,
  `<script setup>\r\nimport { ref, computed, watch, onMounted } from 'vue'\r\nimport axios from 'axios'\r\n\r\nconst API_BASE = 'http://127.0.0.1:5000/api'`
);

fs.writeFileSync(p, c, 'utf8');
console.log('API_BASE + axios import added');
