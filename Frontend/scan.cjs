const fs = require('fs');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx')) results.push(file);
        }
    });
    return results;
}

const files = walk('e:/Akash/Web_project/Artibots/ERP_@/Frontend/src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('bg-white rounded-3xl') || content.includes('bg-white rounded-2xl')) {
        console.log('Found in:', file);
    }
});
