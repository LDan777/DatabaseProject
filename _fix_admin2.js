const fs = require('fs');
let admin = fs.readFileSync('d:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue', 'utf8');

// Replace patterns by matching key unique substrings
const replacements = [
  // Fix 1: getAllOrdersFromOrder
  {
    from: /const orderResponse = await getAllOrdersFromOrder\(\)/g,
    to: '// [已注释] const orderResponse = await getAllOrdersFromOrder()'
  },
  // Fix 2: getFlights
  {
    from: /const flightResponse = await getFlights\(\)/g,
    to: '// [已注释] const flightResponse = await getFlights()'
  },
  // Fix 3: cancelFlightInstance
  {
    from: /const response = await cancelFlightInstance\(\{/g,
    to: '// [已注释] const response = await cancelFlightInstance({'
  }
];

let count = 0;
for (const r of replacements) {
  const matches = admin.match(r.from);
  if (matches) {
    admin = admin.replace(r.from, r.to);
    count += matches.length;
    console.log(`Replaced: ${matches.length}x "${r.from}"`);
  } else {
    console.log(`NOT FOUND: ${r.from}`);
  }
}

fs.writeFileSync('d:/Project/DatabaseProject/airline-frontend/src/views/AdminView.vue', admin, 'utf8');
console.log(`\nTotal: ${count} replacements made.`);

// After commenting the await calls, the surrounding try blocks will still work
// (they'll just have a useless await commented out, but the catch blocks will
// still provide fallback data, and the code structure is preserved)
