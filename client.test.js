jest.mock('https');
jest.mock('http');
jest.mock('./outer-space.js');
const EventSource = require('eventsource');
const http = require('http');
const https = require('https');
const outerSpace = require('./outer-space');
const client = require('./client');

describe('client', () => {
  let options;

  beforeAll(() => {
    options = {
      protocol: 'https',
      hostname: 'cwtsite.com',
      port: '443',
    };
  });

  test('GET caches', async () => {
    const res = ({id: 1, body: 'message'});
    const get = jest.fn(() => res);
    outerSpace.mockImplementation(() => ({get}));
    const Client = client(options, -1);
    const res1 = await Client.get('something');
    const res2 = await Client.get('something');
    const res3 = await Client.get('something');
    const res4 = await Client.get('something');
    expect(get).toHaveBeenCalledTimes(1);
    expect(res1).toEqual(res2);
    expect(res1).toEqual(res3);
    expect(res1).toEqual(res4);
  });

  test('POST doesn\'t cache', async () => {
    const res = ({id: 1, body: 'message'});
    const post = jest.fn(() => res);
    outerSpace.mockImplementation(() => ({post}));
    const Client = client(options, 0);
    const res1 = await Client.post('something');
    const res2 = await Client.post('something');
    const res3 = await Client.post('something');
    const res4 = await Client.post('something');
    expect(post).toHaveBeenCalledTimes(4);
    expect(res1).toEqual(res2);
    expect(res1).toEqual(res3);
    expect(res1).toEqual(res4);
  });
});

