jest.mock('eventsource');
const EventSource = require('eventsource');
const options = {
  protocol: 'https',
  hostname: 'cwtsite.com',
  port: '443',
  path: 'api/message/listen',
};
const Listener = require('./listener')(options);

describe('listener', () => {
  let listener;
  let url;

  beforeAll(() => {
    url = "https://cwtsite.com/api/message/listen";
  });

  test('assemble url', () => {
    const actual = Listener._url();
    expect(actual).toEqual(url);
  });

  test('listening and callbacking', () => {
    const addEventListener = jest.fn();
    const es = EventSource.mockImplementation(() => ({addEventListener}));
    cb = jest.fn();
    Listener.listen(cb);
    expect(addEventListener).toHaveBeenCalled();
    expect(addEventListener).toHaveBeenCalledWith('EVENT', expect.anything());
    expect(es).toHaveBeenCalledWith(url)
  });

  test('callback is called', () => {
    cb = jest.fn();
    const event = {data: JSON.stringify({id: 1, message: "hello"})};
    const actual = Listener._onEvent(event, cb);
    expect(cb).toHaveBeenCalledWith(JSON.parse(event.data));
  });
});

