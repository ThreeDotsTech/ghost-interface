const path = require('path');

const { merge } = require('webpack-merge');

const TerserJSPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const commonWebpackConfig = require('./webpack.common.config');

module.exports = merge( commonWebpackConfig, {
    mode: 'production',
    optimization: {
      minimizer: [ new TerserJSPlugin({
                extractComments: false
            }),
            new CssMinimizerPlugin(),
      ],
      splitChunks: {
          chunks: 'all',
          minSize: 1,
          maxSize: 15000,
          enforceSizeThreshold: 15000,
          cacheGroups: {
            styles: {
              name: 'styles',
              type: 'css/mini-extract',
              enforce: true,
              priority: 40,
              test: /\.css$/,
          },
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
              minChunks: 1,
            },
            default: {
              minChunks: 1,
              reuseExistingChunk: true,
              priority: -20,
            },
          },
        }
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
    },

})