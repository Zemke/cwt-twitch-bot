Only the command handling from the command line:

```
node handle.js '!cwtcommands' | grep "^RES xx " | gsed 's/^RES xx //g'
```

With environment:

```
BOT_USERNAME=CWTBot CHANNEL_NAME=ZemkeCWT LISTEN=1 OAUTH_TOKEN=oauth:asdfasdfasdfasdfasdfasdfasdfad node index.js
```
