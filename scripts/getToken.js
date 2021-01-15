require('dotenv').config();
const jwt = require('jsonwebtoken');

if (require.main === module) {
    const token = jwt.sign('somecooltoken', process.env.SECRET)
    console.log(token);
}
