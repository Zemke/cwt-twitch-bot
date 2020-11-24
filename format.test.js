const format = require('./format');


describe('format', () => {

  test('news for schedule cancel', () => {
    const message = {
      category: 'NEWS',
      author: "Zemke",
      body: 'cancelSchedule,tita,Rafka,2019-10-03T11:12:22.068Z',
      newsType: 'SCHEDULE',
    };
    const actual = format(message);
    const expected = 'Zemke cancelled tita–Rafka on Oct. 3, 11:12';
    expect(actual).toEqual(expected);
  });

  test('news for via Twitch', () => {
    const message = {
      category: 'NEWS',
      author: "Zemke",
      body: 'ZemkeCWT,https://twitch.tv/#komito8220,1–0 to Tade’s advantage. Two draws and two disconnects.',
      newsType: 'TWITCH_MESSAGE',
    };
    const actual = format(message);
    const expected = 'ZemkeCWT via Twitch: “1–0 to Tade’s advantage. Two draws and two disconnects.”';
    expect(actual).toEqual(expected);
  });

  test('news for via Discord', () => {
    const message = {
      category: 'NEWS',
      author: "Zemke",
      body: 'Zemke,https://discord.com/channels/504639407706472459/504639408188686337,Good idea, will do.',
      newsType: 'DISCORD_MESSAGE',
    };
    const actual = format(message);
    const expected = 'Zemke via Discord: “Good idea, will do.”';
    expect(actual).toEqual(expected);
  });

  test('news for STREAM', () => {
    const message = {
      category: 'NEWS',
      author: "Komito",
      body: '804138317,CWT 2020 - Playoffs (Final 16) | BoolC Vs LovEvilution | Intermediate Scheme | TTS - !say',
      newsType: 'STREAM',
    };
    const actual = format(message);
    const expected = 'Komito live streamed '
          + '“CWT 2020 - Playoffs (Final 16) | BoolC Vs LovEvilution | Intermediate Scheme | TTS - !say”'
          + ' (https://www.twitch.tv/videos/804138317)' ;
    expect(actual).toEqual(expected);
  });
});

