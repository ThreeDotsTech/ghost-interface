const path = require('path');

const { merge } = require('webpack-merge');

const TerserJSPlugin = require('terser-webpack-plugin');

const commonWebpackConfig = require('./webpack.common.config');

module.exports = merge( commonWebpackConfig, {
    mode: 'production',
    optimization: {
        minimizer: [ new TerserJSPlugin({
            extractComments: false
        })],
        splitChunks: {
            chunks: 'all',
            minSize: 1,
            maxSize: 15000,
            enforceSizeThreshold: 15000,
            cacheGroups: {
              defaultVendors: {
                test: /[\\/]node_modules[\\/]/,
                priority: -10,
                reuseExistingChunk: false,
                minChunks: 1,
              },
              default: {
                minChunks: 1,
                priority: -20,
                reuseExistingChunk: false,
              },
            },
          }
    },
})