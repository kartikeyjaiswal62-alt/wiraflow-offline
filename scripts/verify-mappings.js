const fs = require('fs');
const projectCode = fs.readFileSync('../apps/web/src/data/mock-project.ts', 'utf8');
const widgetTreeCode = fs.readFileSync('../apps/web/src/components/canvas/WidgetTree.tsx', 'utf8');

const regex = /"flutterWidgetType": "(.*?)"/g;
let match;
const foundTypes = new Set();
while ((match = regex.exec(projectCode)) !== null) {
  foundTypes.add(match[1]);
}

console.log("Types mapped in Data: ", Array.from(foundTypes));

const missing = [];
for (const type of foundTypes) {
  if (!widgetTreeCode.includes(`case "${type}":`)) {
     if (type === "SocialButton") continue; // We intercept it together with Button
     missing.push(type);
  }
}

if (missing.length > 0) {
   console.log("CRITICAL: WidgetTree.tsx is missing mappers for: ", missing);
} else {
   console.log("SUCCESS: All widget types physically mapped flawlessly.");
}
