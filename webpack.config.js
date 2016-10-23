var webpack = require("webpack");
var ETP = require("extract-text-webpack-plugin");
var extractCSS = new ETP('style.css');

module.exports = {
    entry: ['./index.js'],
    output: {
        path: './public',
        filename: "bundle.js"
    },
    module: {
        loaders: [
            { test: /\.scss$|\.css/i, loader: extractCSS.extract(['css','sass']) },
            {
                test: /\.js$|\.jsx$/,
                loader: 'babel-loader',
                query: {
                    "presets": ['es2015']
                }
            }
        ]
    },
    plugins: [
        extractCSS
    ],
    resolve: {
        alias: {
            jquery: "jquery/src/jquery"
        }
    }
};