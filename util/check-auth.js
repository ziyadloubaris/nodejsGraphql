const { AuthenticationError } = require('apollo-server');
const jwt = require('jsonwebtoken');
const { JWT_SECRET_KEY } = require('../config');
 
module.exports = (context) => {
    const authHeader = context.req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        if (token) {
            try {
                const user = jwt.verify(token, JWT_SECRET_KEY);
                return user;
            } catch(err) {
                console.log(err);
                throw new AuthenticationError('Invalid/Expired token');
            }
        }

        throw new Error('Authentication token must be \'Bearer [token]\'');
    }

    throw new Error('Authentication header must be provided');
}