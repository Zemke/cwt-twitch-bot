jest.mock('tmi.js');
const tmiClient = require('tmi.js');
const Index = require('./index');

describe('index', () => {

  beforeAll(() => {
  });

  test('test', async () => {
    const say = jest.fn();
    const tmiClient = {say};
    const handleResponse = "this is the response from handle fn";
    const handleMessage = jest.fn(() => handleResponse);
    const handle = {handleMessage};
    const listener = jest.fn();
    const server = jest.fn();
    const index = Index(tmiClient, listener, server, handle);
    const actual = await index.onMessage(
        'zemkecwt', {"display-name": "ZemkeCWT"}, "!cwtcommands");
    expect(say).toHaveBeenCalledWith('zemkecwt', handleResponse);
    expect(handleMessage).toHaveBeenCalledWith(
        "!cwtcommands", "ZemkeCWT", "TWITCH", 'https://twitch.tv/zemkecwt');
    expect(say).toHaveBeenCalledTimes(1);
    expect(handleMessage).toHaveBeenCalledTimes(1);
  });
});

