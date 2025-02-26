const path = require('path');
const webpack = require('webpack');

// Get Firebase config from the same values in firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyDEJXhhKGUbIOLHpAWHHNh9cM45oY3YDQo",
  authDomain: "elorating-e076d.firebaseapp.com",
  projectId: "elorating-e076d",
  storageBucket: "elorating-e076d.firebasestorage.app",
  messagingSenderId: "971651588043",
  appId: "1:971651588043:web:2bcc9ca35b91028beba04e",
  measurementId: "G-1X4V59V0T0"
};

module.exports = {
  entry: './js/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  plugins: [
    new webpack.DefinePlugin({
      'FIREBASE_CONFIG': JSON.stringify(firebaseConfig)
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  devServer: {
    contentBase: path.join(__dirname, '/'),
    compress: true,
    port: 8080
  }
};