#!/usr/bin/env python3
"""Build app_config JSON object from positional args (see db-init.sh for order)."""
import json
import sys


def main() -> None:
    if len(sys.argv) < 13:
        print(
            "Usage: build-app-config-json.py "
            "discord_token client_id guild_id bot_name client_secret session_secret "
            "oauth_redirect internal_secret web_port internal_port internal_bind bot_api_url",
            file=sys.stderr,
        )
        sys.exit(1)

    (
        discord_token,
        client_id,
        guild_id,
        bot_name,
        client_secret,
        session_secret,
        oauth_redirect,
        internal_secret,
        web_port,
        internal_port,
        internal_bind,
        bot_api_url,
    ) = sys.argv[1:13]

    config: dict[str, object] = {
        "discordToken": discord_token,
        "clientId": client_id,
        "botName": bot_name,
        "clientSecret": client_secret,
        "sessionSecret": session_secret,
        "oauthRedirectUri": oauth_redirect,
        "internalApiSecret": internal_secret,
        "webPort": int(web_port),
        "internalApiPort": int(internal_port),
        "internalApiBind": internal_bind,
        "botInternalApiUrl": bot_api_url,
    }

    if guild_id:
        config["guildId"] = guild_id

    json.dump(config, sys.stdout)


if __name__ == "__main__":
    main()
