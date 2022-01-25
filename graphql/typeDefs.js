const gql = require("graphql-tag");

module.exports = gql`
    type Post {
        id: ID!
        body: String!
        createdAt: String!
        user: User!
        comments: [Post]!
        likes: [Like]!,
        likeCount: Int!
        commentCount: Int!
        attachments: [Attachment]!
        type: String!
        hashtags: [String]
    }

    type Attachment {
        id: ID!
        type: String!
        src: String!
    }

    type Like {
        id: ID!
        createdAt: String!
        username: String!
        name: String!
    }

    type User {
        id: ID!
        email: String!
        username: String!
        token: String!
        createdAt: String!
        name: String!
        bio: String
        image: String
        following: [User]!
        followers: [User]!
        postsResponses: [Post]
        posts: [Post]
        postsLikes: [Post]
        certified: Boolean!
    }

    input RegisterInput {
        name: String!
        username: String!
        password: String!
        confirmPassword: String!
        email: String!
    }

    type Query {
        getPosts: [Post]
        getPost(postId: ID!): Post!
        getUser(username: String!): User!
        getFeed(userId: ID): [Post]
        getHashtag(hashtag: String!): [Post]
        getQuery(query: String!): [Post]
        getUsers(username: String!): [User]
    }

    type Mutation {
        register(registerInput: RegisterInput): User!
        login(username: String!, password: String!): User!
        createPost(body: String!): Post!
        deletePost(postId: ID!): String!
        createComment(postId: ID!, body: String!): Post!
        deleteComment(postId: ID!, commentId: ID!): Post!
        likePost(postId: ID!): Post!
        followToggleUser(username: String!): User!
        updateUser(name: String!, password: String!, bio: String!, image: String!): User!
    }
`;
