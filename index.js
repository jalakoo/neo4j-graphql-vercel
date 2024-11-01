import { ApolloServer } from '@apollo/server';
import { startServerAndCreateHandler } from '@as-integrations/vercel';
import { Neo4jGraphQL } from '@neo4j/graphql';
import { toGraphQLTypeDefs } from "@neo4j/introspector";
import { manualTypeDefs } from './typedefs.js';
import neo4j from 'neo4j-driver';

// Load environment variables from Vercel
const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USERNAME = process.env.NEO4J_USERNAME;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;

// Optional environment variables
const ALLOW_INTROSPECTION = process.env.ALLOW_INTROSPECTION || false;
const AUTO_TYPEDEFS = process.env.AUTO_TYPEDEFS || false;
const READ_ONLY = process.env.READ_ONLY || true;

// Start the Neo4j driver
const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD)
);

// Return a read or write session based on the READ_ONLY environment variable
const sessionFactory = () => {
  if (READ_ONLY === true) {
    return driver.session({ defaultAccessMode: neo4j.session.READ });
  } else {
    return driver.session({ defaultAccessMode: neo4j.session.WRITE });
  }
}

// Load or Generate the GraphQL type definitions from an active database
const typeDefs = AUTO_TYPEDEFS === 'false' ? manualTypeDefs : await toGraphQLTypeDefs(sessionFactory);
const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

// Create Apollo Server instance
const server = new ApolloServer({
  schema: await neoSchema.getSchema(),
  introspection: ALLOW_INTROSPECTION
});

// Create and export the Vercel handler
export default startServerAndCreateHandler(server);