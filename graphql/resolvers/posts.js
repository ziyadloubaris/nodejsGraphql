const { AuthenticationError, UserInputError } = require("apollo-server");

const Post = require("../../models/Post");
const User = require("../../models/User");
const checkAuth = require("../../util/check-auth");

module.exports = {
    Query: {
        async getPosts() {
            try {
                const posts = await Post.find({ type: "post" })
                    .populate("user", "username name image certified")
                    .sort({ createdAt: -1 });

                return posts;
            } catch (error) {
                console.log(error);
                throw new Error(error);
            }
        },
        async getPost(_, { postId }) {
            try {
                const post = await Post.findById(postId)
                    .populate("user", "username name image certified")
                    .populate({
                        path: "comments",
                        model: "Post",
                        populate: {
                            path: "user",
                            model: "User",
                        },
                    });

                post.comments.sort(function (a, b) {
                    if (b.likes.length === a.likes.length) {
                        return b.createdAt.localeCompare(a.createdAt);
                    }

                    return b.likes.length - a.likes.length;
                });

                console.log(post.comments);

                if (post) {
                    return post;
                } else {
                    throw new Error("Post not found !");
                }
            } catch (error) {
                console.log(error);
                throw new Error(error);
            }
        },
        async getHashtag(_, { hashtag }) {
            try {
                const posts = Post.find({ hashtags: { $in: [hashtag] } })
                    .populate("user", "username name image certified")
                    .populate({
                        path: "comments",
                        model: "Post",
                        populate: {
                            path: "user",
                            model: "User",
                        },
                    })
                    .sort({ createdAt: -1 });

                return posts;
            } catch (error) {
                console.log(error);
                throw new Error(error);
            }
        },
        async getQuery(_, { query }) {
            try {
                const posts = Post.find({ body: {'$regex': query}})
                    .populate("user", "username name image certified")
                    .populate({
                        path: "comments",
                        model: "Post",
                        populate: {
                            path: "user",
                            model: "User",
                        },
                    })
                    .sort({ createdAt: -1 });

                return posts;
            } catch (error) {
                console.log(error);
                throw new Error(error);
            }
        },
    },
    Mutation: {
        async createPost(_, { body }, context) {
            const user = checkAuth(context);

            if (body.trim() === "") {
                throw new Error("Post body must not be empty !");
            }

            const hashtagsInBody = body.match(/#\w+/g);

            let hashtags;
            if (hashtagsInBody) {
                hashtags = hashtagsInBody.map((x) => x.substr(1)) || [];
            } else {
                hashtags = [];
            }

            const newPost = new Post({
                body,
                user: user.id,
                type: "post",
                createdAt: new Date().toISOString(),
                hashtags: hashtags,
            });

            const post = await newPost.save();

            const populatedPost = await Post.findById(post._id).populate("user");

            return populatedPost;
        },
        async deletePost(_, { postId }, context) {
            const user = checkAuth(context);

            try {
                const post = await Post.findById(postId).populate("user");

                if (user.username === post.user.username) {
                    await post.deleteOne();

                    return "Post deleted successfully !";
                } else {
                    throw new AuthenticationError("Action not allowed !");
                }
            } catch (err) {
                throw new Error(err);
            }
        },
        async likePost(_, { postId }, context) {
            const user = checkAuth(context);

            try {
                const post = await Post.findById(postId);

                if (post) {
                    if (post.likes.find((like) => like.username === user.username)) {
                        post.likes = post.likes.filter((like) => like.username !== user.username);
                    } else {
                        const name = await User.findById(user.id);

                        post.likes.push({
                            username: user.username,
                            createdAt: new Date().toISOString(),
                            name: name.name,
                        });
                    }
                    await post.save();

                    return post;
                } else {
                    throw new UserInputError("Post not found");
                }
            } catch (err) {
                throw new Error(err);
            }
        },
    },
};
