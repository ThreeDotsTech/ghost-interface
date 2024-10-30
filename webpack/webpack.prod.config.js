const path = require('path');
const { merge } = require('webpack-merge');
const TerserJSPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const commonWebpackConfig = require('./webpack.common.config');

module.exports = merge(commonWebpackConfig, {
    mode: 'production',
    optimization: {
        minimizer: [
            new TerserJSPlugin({
                extractComments: false,
            }),
            new CssMinimizerPlugin(),
        ],
        splitChunks: false, // Disable chunk splitting
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css',
        }),
    ],
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
            },
        ],
    }
});
