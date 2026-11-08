const webpack = require('webpack');

module.exports = (env, args) => {
  const debug = args.mode !== 'production';
  return {
    context: __dirname,
    devtool: debug
      ? 'inline-source-map'
      : false,
    entry: './app.tsx',
    output: {
      path: __dirname + '/../static/js/',
      filename: 'app.js'
    },
    resolve: {
      extensions: [".js", ".json", ".ts", ".tsx"],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'ts-loader'
          }
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],          
        },
      ]
    }
    
  };
};
