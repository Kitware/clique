var context = require.context('./src/clique', true, /\.js$/);
context.keys().forEach(context);
