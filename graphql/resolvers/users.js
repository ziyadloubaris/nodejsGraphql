const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UserInputError } = require("apollo-server");

const { JWT_SECRET_KEY } = require("../../config");
const User = require("../../models/User");
const Post = require("../../models/Post");
const checkAuth = require("../../util/check-auth");
const { validateRegisterInput, validateLoginInput } = require("../../util/validators");

function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            username: user.username,
        },
        JWT_SECRET_KEY,
        { expiresIn: "1h" }
    );
}

module.exports = {
    Query: {
        async getUser(_, { username }) {
            try {
                const user = await User.findOne({ username: username });

                if (user) {
                    const postsResponses = await Post.find({
                        user: user._id,
                        type: "response",
                    }).populate("comments");
                    const postsOfUser = await Post.find({ user: user._id, type: "post" }).populate(
                        "comments"
                    );
                    const postsLikes = await Post.find({
                        "likes.username": { $lte: user.username },
                    })
                        .populate("comments")
                        .populate("user");

                    user.postsResponses = postsResponses;
                    user.posts = postsOfUser;
                    user.postsLikes = postsLikes;

                    user.postsResponses.sort(function (a, b) {
                        return b.createdAt.localeCompare(a.createdAt);
                    });
                    user.posts.sort(function (a, b) {
                        return b.createdAt.localeCompare(a.createdAt);
                    });
                    user.postsLikes.sort(function (a, b) {
                        return b.createdAt.localeCompare(a.createdAt);
                    });

                    return user;
                } else {
                    throw new Error("User not found !");
                }
            } catch (error) {
                console.log(error);
                throw new Error(error);
            }
        },
        async getFeed(_, { userId }, context) {
            try {
                const user = checkAuth(context);
                const userLogged = await User.findById(user.id);

                if (!userLogged) {
                    throw new Error("not logged !");
                }

                const followingList = userLogged.following.map((follow) => follow._id);
                followingList.push(require("mongoose").Types.ObjectId(user.id));

                const feed = Post.find({ user: { $in: followingList }, type: "post" })
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

                return feed;
            } catch (err) {
                console.log(err);
                throw new Error(err);
            }
        },
        async getUsers(_, {username}) {
            try {
                const users = User.find({username: {'$regex': username, '$options': 'i'}});

                return users;
            } catch (err) {
                console.log(err);
                throw new Error(err);
            }
        }
    },
    Mutation: {
        async register(
            _,
            { registerInput: { name, username, email, password, confirmPassword } },
            context,
            info
        ) {
            // Validate user data
            const { valid, errors } = validateRegisterInput(
                name,
                username,
                password,
                confirmPassword,
                email
            );

            if (!valid) {
                throw new UserInputError("Errors", {
                    errors,
                });
            }

            //  Make sure user doesn't already exist
            const user = await User.findOne({ username });

            if (user) {
                throw new UserInputError("username is taken !", {
                    errors: {
                        username: "This username is taken.",
                    },
                });
            }
            // hash password and create auth token
            password = await bcrypt.hash(password, 12);

            const newUser = new User({
                name,
                email,
                username,
                password,
                createdAt: new Date().toISOString(),
                following: [],
                followers: [],
                bio: "",
                certified: false,
                image: "https://res.cloudinary.com/dn6wkankc/image/upload/v1603234307/opinioner/e0xyyzy5xktlumbjhl1c.jpg",
            });
            const res = await newUser.save();
            console.log(res);

            const token = generateToken(res);

            return {
                ...res._doc,
                id: res._id,
                token,
            };
        },

        async login(_, { username, password }) {
            const { errors, valid } = validateLoginInput(username, password);

            if (!valid) {
                throw new UserInputError("Errors", { errors });
            }

            const user = await User.findOne({ username });
            console.log(user);

            if (!user) {
                errors.general = "User not found !";
                throw new UserInputError("User not found !", { errors });
            }

            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                errors.general = "Wrong credentials !";
                throw new UserInputError("Wrong credentials !", { errors });
            }

            const token = generateToken(user);

            return {
                ...user._doc,
                id: user._id,
                token,
            };
        },
        async followToggleUser(_, { username }, context) {
            try {
                const sessionUser = checkAuth(context);
    
                const user = await User.findOne({ username: username });
                const loggedUser = await User.findById(sessionUser.id);
                
                console.log("username: " + username);
                if (!user) {
                    throw new UserInputError("User not found !");
                }
    
                const indexOfUser = loggedUser.following.findIndex(
                    (f) => f._id.toString() === user._id.toString()
                );
    
                if (indexOfUser < 0) {
                    loggedUser.following.push(user);
                    user.followers.push(loggedUser);
                } else {
                    loggedUser.following.splice(indexOfUser, 1);
    
                    const indexOfLoggedUser = user.followers.findIndex(
                        (f) => f._id.toString() === loggedUser._id.toString()
                    );
                    user.followers.splice(indexOfLoggedUser, 1);
                }
    
                await loggedUser.save();
                const res = await user.save();
                console.log(res);
    
                return res;
            } catch(err) {
                console.log(err);
                throw new Error(err);
            }
        },
        async updateUser(_, { name, password, bio, image }, context) {
            const sessionUser = checkAuth(context);
            const loggedUser = await User.findOne({ _id: sessionUser.id });
            const samePass = await bcrypt.compare(password, loggedUser.password);

            if (!samePass && password.trim() !== "") {
                const newPassword = await bcrypt.hash(password, 12);
                loggedUser.password = newPassword;
            }

            loggedUser.name = name;
            loggedUser.bio = bio;

            if(image.trim() !== '') {
                loggedUser.image = image;
            }

            const res = await loggedUser.save();

            return res;
        },
    },
};
