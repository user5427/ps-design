import swaggerAutogen from 'swagger-autogen';
import { sync as globSync } from 'glob';
import path from 'path';
import fs from 'fs';

const routes = globSync(path.join(__dirname, '../routes/**/*.ts'))
    .filter(file => {
        const content = fs.readFileSync(file, 'utf-8').trim();
        // Check if file is not empty and has actual content (not just whitespace/comments)
        const hasContent = content.length > 0 &&
            content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // Remove comments
                .replace(/\s/g, '') // Remove whitespace
                .length > 0;
        return hasContent;
    });

console.log('Generating Swagger documentation for routes:', routes);

const doc = {
    info: {
        title: 'My API',
        description: 'Auto-generated from TS files'
    },
    host: `${process.env.HOST || 'localhost'}:${process.env.PORT || 4000}`
};

const outputFile = '../generated/swagger-output.json';

swaggerAutogen()(outputFile, routes, doc)
    .then(() => {
        console.log('Swagger documentation generated successfully at src/generated/swagger-output.json');
    })
    .catch((err) => {
        console.error('Error:', err);
    });