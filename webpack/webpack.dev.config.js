const path = require('path');

const { merge } = require('webpack-merge');

const commonWebpackConfig = require('./webpack.common.config');

module.exports = merge( commonWebpackConfig, {
    mode: 'development',
    entry: path.resolve(__dirname, '..', './src/main.tsx'),
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: [

    ],
})