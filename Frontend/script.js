const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('e:/Akash/Web_project/Artibots/ERP_@/Frontend/src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Check if the file contains the patterns
    let modified = false;

    // Pattern 1: text-gray-900
    if (content.includes('text-gray-900')) {
        content = content.replace(/\btext-gray-900(?!\s+dark:text-)\b/g, 'text-gray-900 dark:text-gray-100');
        modified = true;
    }

    // Pattern 2: text-gray-800
    if (content.includes('text-gray-800')) {
        content = content.replace(/\btext-gray-800(?!\s+dark:text-)\b/g, 'text-gray-800 dark:text-gray-200');
        modified = true;
    }

    // Pattern 3: text-gray-700
    if (content.includes('text-gray-700')) {
        content = content.replace(/\btext-gray-700(?!\s+dark:text-)\b/g, 'text-gray-700 dark:text-gray-300');
        modified = true;
    }

    // Pattern 4: text-black
    if (content.includes('text-black')) {
        content = content.replace(/\btext-black(?!\s+dark:text-)\b/g, 'text-black dark:text-gray-100');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Modified:', file);
    }
});
