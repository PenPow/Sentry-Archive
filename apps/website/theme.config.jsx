import { useRouter } from 'next/router'
import Image from "next/image";

import Logo from "./public/logo.jpg"

/** @type {import('nextra-theme-docs').DocsThemeConfig} */
// eslint-disable-next-line import/no-anonymous-default-export
export default {
	docsRepositoryBase: "https://github.com/PenPow/Sentry/blob/apps/website",
	useNextSeoProps() {
		const { route } = useRouter()

		return {
			titleTemplate: route === "/" ? "Sentry" : ["/_error", "/404"].includes(route) ? "Sentry - Error" : 'Sentry - %s'
		}
	},
	logo: (
		<>
			<Image src={Logo} alt="Sentry's Logo" width="30" height="30" className="rounded-md" />
			<span style={{ marginLeft: '.7em', fontWeight: 600 }}>Sentry</span>
		</>
	),
	project: {
		link: "https://github.com/PenPow/Sentry"
	},
	chat: {
		link: "https://discord.gg/qGweuQQwMR"
	},
	banner: {
		dismissible: true,
		key: 'sentry-v1-launch',
		text: '🎉 The Sentry Rewrite is complete, read the docs to learn more!'
	},
	footer: {
		text: (
			<>
			</>
		)
	}
}