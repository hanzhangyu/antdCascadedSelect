var path = require('path');
var webpack = require('webpack');
var SRC_PATH = path.resolve(__dirname, 'app');
var DIST_PATH = path.resolve(__dirname, 'dist');
var BUILD_PATH = path.resolve(__dirname, 'build');

var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");


module.exports = {
    entry: {
        index:[ path.join(SRC_PATH, 'index.js')],
        vendor: [
            'react',
            'react-dom',
            'lodash', 'classnames', path.join(SRC_PATH, 'style.less')
        ]
    },
    output: {
        path: BUILD_PATH,
        publicPath: '',
        filename: 'js/[name].js'
    },
    plugins: [
        //压缩打包的文件，包括JS以外的文件
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }),
        new HtmlWebpackPlugin({
            inject: true,
            filename: 'index.html',
            template: path.join(SRC_PATH, 'index.html'),
            chunks: ['vendor', 'index']  // 会自动添加 script 标签,引入这些文件
        }),
        new ExtractTextPlugin('css/[name].css')
    ],
    module: {
        loaders: [
            // jsx
            { test: /\.jsx?$/, exclude: /node_modules/, loaders: ['react-hot', 'babel-loader'] },
            // less
            {
                test: /\.less$/,
                include: /(dist|app)/,
                loader: ExtractTextPlugin.extract(
                    'style',
                    'css!' +
                    'postcss!' +
                    'less'
                    , { publicPath: '../' })
            }
        ]
    },

    devServer: {
        contentBase: BUILD_PATH,
        filename: '[name].js',
        publicPath: '/',
        inline: true,
        quiet: true,
        noInfo: true,
        lazy: false,
        stats: {colors: true}
    }
};