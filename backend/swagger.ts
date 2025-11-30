import swaggerAutogen from 'swagger-autogen';
import glob from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const routes = glob.sync(path.join(__dirname, 'src/routes/**/*.ts'))
    .filter(file => {
        // Skip empty or placeholder files
        return !file.includes('inventory');
    });

console.log('Generating Swagger documentation for routes:', routes);

const doc = {
    info: {
        title: 'My API',
        description: 'Auto-generated from TS files'
    },
    host: `${process.env.HOST || 'localhost'}:${process.env.PORT || 4000}`
};

const outputFile = './src/generated/swagger-output.json';

swaggerAutogen()(outputFile, routes, doc)
    .then(() => {
        console.log('Swagger documentation generated successfully at ./src/generated/swagger-output.json');
    })
    .catch((err) => {
        console.error('Error:', err);
    });