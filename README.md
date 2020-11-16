Only the command handling from the command line:

```
node handle.js 'Zemke' '!cwtcommand' | grep "^RES xx " | gsed 's/^RES xx //g'
// Nothing I have to say about this, Zemke.
```

With environment:

```
BOT_USERNAME=CWTBot CHANNEL_NAME=ZemkeCWT LISTEN=1 OAUTH_TOKEN=oauth:asdfasdfasdfasdfasdfasdfasdfad node index.js
```
