const { model, Schema } = require('mongoose');

const userSchema = new Schema({
    name: String,
    username: String,
    password: String,
    email: String,
    createdAt: String,
    bio: String,
    image: String,
    certified: Boolean,
    following: [
        {
            id: Schema.Types.ObjectId,
            name: String,
            username: String,
            image: String
        }
    ],
    followers: [
        {
            id: Schema.Types.ObjectId,
            name: String,
            username: String,
            image: String
        }
    ]
});

module.exports = model('User', userSchema);