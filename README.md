From the command line:

```
node handle.js '!cwtcommands' | grep "^RES xx " | gsed 's/^RES xx //g'
```

