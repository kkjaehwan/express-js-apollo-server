const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const mongoose = require('mongoose');

// MongoDB 연결
mongoose.connect('mongodb+srv://kjaehwan89:9wbN2Sd0Ak6Sq3IU@cluster0.sjaxlbc.mongodb.net/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// MongoDB 스키마 및 모델 설정
const itemSchema = new mongoose.Schema({
  name: String,
  description: String
});

const Item = mongoose.model('Item', itemSchema);

// GraphQL 스키마 정의
const typeDefs = gql`
  type Item {
    id: ID!
    name: String!
    description: String!
  }

  type Query {
    items: [Item]
  }

  type Mutation {
    addItem(name: String!, description: String!): Item
    updateItem(id: ID!, name: String, description: String): Item
    deleteItem(id: ID!): Item
  }
`;

// GraphQL 리졸버 정의
const resolvers = {
  Query: {
    items: async (_, { limit = 10, offset = 0 }) => {
      return await Item.find({})
        .skip(offset)
        .limit(limit);
    }
  },
  Mutation: {
    addItem: async (_, { name, description }) => {
      const newItem = new Item({ name, description });
      return await newItem.save();
    },
    updateItem: async (_, { id, name, description }) => {
      const updatedItem = await Item.findByIdAndUpdate(
        id,
        { name, description },
        { new: true }
      );
      return updatedItem;
    },
    deleteItem: async (_, { id }) => {
      const deletedItem = await Item.findByIdAndRemove(id);
      return deletedItem;
    }
  }
};

// Apollo Server 설정
async function startServer() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  
  const app = express();
  server.applyMiddleware({ app });
  
  // 서버 시작
  app.listen({ port: 4000 }, () =>
    console.log(`Server ready at http://localhost:4000${server.graphqlPath}`)
  );
}

startServer();
