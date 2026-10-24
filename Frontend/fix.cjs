const fs = require('fs');
const path = require('path');
const dir = 'D:/ERP/Frontend/src/components';
const files = fs.readdirSync(dir);
files.forEach(file => {
    if (!file.endsWith('.tsx')) return;
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/\x0Clex/g, '\lex');
    content = content.replace(/\\\}/g, '\}');
    content = content.replace(/className=\{\\\/g, 'className={\');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed ' + file);
    }
});
