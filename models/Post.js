const { model, Schema } = require('mongoose');

const postSchema = new Schema({
    body: String,
    createdAt: String,
    type: String,
    comments: [
        {
            type: require('mongoose').Types.ObjectId,
            ref: 'Post'
        }
    ],
    likes: [
        {
            username: String,
            name: String,
            image: String,
            createdAt: String
        }
    ],
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    attachments: [
        {
            type: String,
            src: String
        }
    ],
    hashtags: [
        {
            type: String
        }
    ]
});

module.exports = model('Post', postSchema);