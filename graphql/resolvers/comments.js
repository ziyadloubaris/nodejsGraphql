const { UserInputError, AuthenticationError } = require("apollo-server");

const Post = require("../../models/Post");
const User = require("../../models/User");
const checkAuth = require('../../util/check-auth');

module.exports = {
    Mutation: {
        async createComment(_, { postId, body }, context) {
            const user = checkAuth(context);

            if(body.trim() === '') {
                throw new UserInputError('Empty comment.', {
                    errors: {
                        body: 'Comment body must not be empty'
                    }
                })
            }

            const post = await Post.findById(postId);

            if (post) {
                const newComment = new Post({
                    body,
                    user: user.id,
                    type: "response",
                    createdAt: new Date().toISOString(),
                    comments: [],
                    likes: []
                });
                const comment = await newComment.save();
                
                post.comments.push(comment._id);

                await post.save();

                const populatedPost = await Post.findById(post._id).populate({
                    path: 'comments',
                    model: 'Post',
                    populate: {
                        path: 'user',
                        model: 'User'           
                    }
                });

                return populatedPost;
            } else {
                throw new UserInputError('Post not found');
            }
        },
        async deleteComment(_, { postId, commentId }, context) {
            const { username } = checkAuth(context);

            const post = await Post.findById(postId).populate({
                path: 'comments',
                model: 'Post',
                populate: {
                    path: 'user',
                    model: 'User'           
                }
            });

            if(post) {
                const commentIndex = post.comments.findIndex(com => com.id === commentId);

                if (commentIndex !== -1) {
                    if(post.comments[commentIndex].user.username === username) {
                        post.comments.splice(commentIndex, 1);
                        
                        await Post.findByIdAndDelete(commentId);
                        await post.save();
    
                        return post;
                    } else {
                        throw new AuthenticationError('Action not allowed');
                    }
                } else {
                    throw new UserInputError('Comment not found');
                }

            } else {
                throw new UserInputError('Post not found');
            }
        }
    }
}