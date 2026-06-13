const { SuiGraphQLClient } = require('@mysten/sui/graphql');
const { graphql } = require('@mysten/sui/graphql/schema');

const client = new SuiGraphQLClient({ url: 'https://graphql.testnet.sui.io/graphql' });
const query = graphql(`
  query {
    objects(first: 5, filter: { type: "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::pool::Pool" }) {
      nodes {
        address
        asMoveObject {
          contents {
            json
          }
        }
      }
    }
  }
`);

client.query({ query }).then(x => console.log(JSON.stringify(x, null, 2))).catch(console.error);
