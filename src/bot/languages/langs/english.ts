const english = {
  COMMAND_NOT_FOUND:
    "Something went wrong. I was not able to find this command!",
  COMMAND_ERROR:
    "Something went wrong. The command execution has thrown an error.",
  DEPLOY_COMMAND_NAME: "deploy",
  DEPLOY_COMMAND_DESCRIPTION: "📤 Send these mysterious commands to discord",
  DEPLOY_COMMAND_RESPONSE: (num: number) => `🔷 Deployed ${num} commands`,
  EXECUTE_COMMAND_NAME: "execute",
  EXECUTE_COMMAND_DESCRIPTION: "Execute these commands",
  EXECUTE_COMMAND_OPTION_NAME: "code",
  EXECUTE_COMMAND_OPTION_DESCRIPTION: "Code to execute",
  DEFAULT_PUNISHMENT_REASON: "No Reason Specified",
  AUTOMOD_PUNISHMENT_REASON: "Sent a Malicious URL",
  TIMEOUT_COMMAND_NAME: "timeout",
  TIMEOUT_COMMAND_DESCRIPTION: "Timeouts/Mutes a member"
} as const;

export default english;
