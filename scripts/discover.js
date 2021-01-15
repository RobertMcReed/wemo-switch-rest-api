const WemoController = require('../src/wemo');

if (require.main === module) {
    setTimeout(() => {
        process.exit(0);
    }, 10000);
    WemoController.discover();
}
