var context = require.context('./test', true, /\.js$/);
context.keys().forEach(context);

context = require.context('./src/clique', true, /\.js$/);
context.keys().forEach(context);
