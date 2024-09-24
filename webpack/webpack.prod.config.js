const path = require('path');

const { merge } = require('webpack-merge');

const TerserJSPlugin = require('terser-webpack-plugin');

const commonWebpackConfig = require('./webpack.common.config');

module.exports = merge( commonWebpackConfig, {
    mode: 'production',
    optimization: {
        minimizer: [ new TerserJSPlugin({
            extractComments: false
        }) ]
    },
})