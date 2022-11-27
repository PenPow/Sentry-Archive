export default function (
    /** @type {import('plop').NodePlopAPI} */
    plop
) {

	plop.setGenerator('package', {
        description: 'Create Package/App',
        prompts: [{
            type: 'list',
            name: 'type',
            message: 'Package or App?',
			choices: ['package', 'app']
        },
		{
            type: 'input',
            name: 'name',
            message: 'What is the package called?'
        },
		{
            type: 'input',
            name: 'description',
            message: 'What is the package description?'
        },
		{
            type: 'confirm',
            name: 'docker',
            message: 'Should I create a docker image?'
        }],
        actions: (data) => {
			const actions = [];

			actions.push(
				{
					type: 'add',
					path: '{{ type }}s/{{name}}/package.json',
					templateFile: 'templates/package/package.json.hbs'
				},
				{
					type: 'add',
					path: '{{ type }}s/{{name}}/src/index.ts',
					templateFile: 'templates/package/index.ts.hbs'
				},
				{
					type: 'add',
					path: '{{ type }}s/{{name}}/.eslintrc',
					templateFile: 'templates/package/.eslintrc.hbs'
				},
				{
					type: 'add',
					path: '{{ type }}s/{{name}}/tsconfig.json',
					templateFile: 'templates/package/tsconfig.json.hbs'
				},
				{
					type: 'add',
					path: '{{ type }}s/{{name}}/tsup.config.js',
					templateFile: 'templates/package/tsup.config.js.hbs'
				}
			)

			if(data.docker && data.type === 'app') {
				actions.push({
					type: 'add',
					path: 'docker/{{ name}}.Dockerfile',
					templateFile: 'templates/package/dockerfile.hbs'
				})

				actions.push("NOTICE: Please Manually Update the Docker-Compose.yml file to include this package")
			}

			actions.push("Created! Please run npm install to prepare the package")

			return actions;
		}
    });

	plop.setGenerator('command', {
        description: 'Create a Command',
        prompts: [{
            type: 'input',
            name: 'name',
            message: 'What is the command called?'
        },
		{
            type: 'input',
            name: 'description',
            message: 'What is the command description?'
        },
		{
            type: 'input',
            name: 'folder',
            message: '(Optional) What category is this command?'
        }],
        actions: (data) => {
			return [{
				type: 'add',
				path: `apps/bot/src/commands/${data.folder ? '{{ folder }}/{{ name }}.ts' : '{{ name }}.ts'}`,
				templateFile: 'templates/command/command.ts.hbs'
			}]
		}
	});

	plop.setGenerator('action', {
        description: 'Create an Action',
        prompts: [{
            type: 'input',
            name: 'name',
            message: 'What is the action called?'
        }],
        actions: [{
			type: 'add',
			path: `apps/bot/src/scripts/{{ name }}.ts`,
			templateFile: 'templates/script/action.ts.hbs'
		}]
	});
};