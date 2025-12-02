const Jest = require('jest');

const jestConfig = {
    testEnvironment: 'node',
    testMatch: ['**/test/**/*.test.js']
};

async function runTests() {
    try {
        const { results } = await new Jest().runCLI(jestConfig, [process.cwd()]);
        if (results.numFailedTests > 0) {
            console.error('Tests failed!');
            process.exit(1);
        } else {
            console.log('Tests passed!');
        }
    } catch (error) {
        console.error('Error running tests:', error);
        process.exit(1);
    }
}

runTests();
