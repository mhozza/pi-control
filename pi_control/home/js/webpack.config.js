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
    resolve: {
      extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],
    },
    module: {
      rules: [
        {
          test: /\.jsx$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader'
          }
        },
        {
          test: /\.tsx$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'ts-loader'
          }
        }
      ]
    }
    
  };
};
