const { merge } = require('webpack-merge')
const commonConfiguration = require('./webpack.common.js')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

function productionPublicPath() {

	const p = process.env.PUBLIC_PATH
	if ( ! p ) return '/'
	return p.endsWith( '/' ) ? p : `${p}/`

}

module.exports = merge(
    commonConfiguration,
    {
        mode: 'production',
        output: {
            publicPath: productionPublicPath(),
        },
        plugins:
        [
            new CleanWebpackPlugin()
        ]
    }
)
