const debug = process.env.NODE_ENV !== 'production';
const webpack = require('webpack');

module.exports = {
  context: __dirname,
  devtool: debug ? 'inline-sourcemap' : false,
  entry: './app.jsx',
  output: {
    path: __dirname + '/../static/js/',
    filename: debug ? 'app.js' : 'app.min.js'
  },
  module: {
    rules: [
      {
        test: /\.jsx$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
        }
      }
    ]
  },
  plugins: debug ? [] : [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': debug ? JSON.stringify('development') : JSON.stringify('production')
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      mangle: true,
      sourcemap: false,
      minimize: true
    }),
  ],
};
