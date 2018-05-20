const webpack = require('webpack');

module.exports = (env, args) => {
  const debug = args.mode !== 'production';
  return {
    context: __dirname,
    devtool: debug
      ? 'inline-sourcemap'
      : false,
    entry: './app.jsx',
    output: {
      path: __dirname + '/../static/js/',
      filename: 'app.js'
    },
    module: {
      rules: [
        {
          test: /\.jsx$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader'
          }
        }
      ]
    }
  };
};
