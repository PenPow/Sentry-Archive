/** @type {import('nextra').NextraConfig} */
const nextraConfig = {
	theme: 'nextra-theme-docs',
	themeConfig: './theme.config.jsx',
}

/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		unoptimized: true
	},
}

const withNextra = require('nextra')(nextraConfig)
module.exports = withNextra(nextConfig)
