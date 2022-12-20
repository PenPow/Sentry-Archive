import type { ReactElement } from 'react'
import type { AppProps } from 'next/app'
import Head from "next/head"

import './style.css'

export default function Nextra({
  Component,
  pageProps
}: AppProps): ReactElement {
  return (
  <>
	<Head>
		<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=launch"/>
		<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=launch"/>
		<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png?v=launch"/>
		<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=launch" />
		<link rel="manifest" href="/site.webmanifest?v=launch"/>
		<link rel="mask-icon" href="/safari-pinned-tab.svg?v=launch" color="#5bbad5"/>
		<link rel="shortcut icon" href="/favicon.ico?v=launch"/>
		<meta name="apple-mobile-web-app-title" content="Sentry"/>
		<meta name="application-name" content="Sentry"/>
		<meta name="msapplication-TileColor" content="#262626"/>
		<meta name="msapplication-TileImage" content="/mstile-144x144.png?v=launch"/>
		<meta name="theme-color" content="#ffffff" />
	</Head>
  	<Component {...pageProps} />
  </>
  )
}