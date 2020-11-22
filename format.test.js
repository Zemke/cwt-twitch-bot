const format = require('./format');

const message = {
  category: 'NEWS',
  // author: { username: "Zemke"},
  author: "Zemke",
  body: 'cancelSchedule,tita,Rafka,2019-10-03T11:12:22.068Z',
  newsType: 'SCHEDULE',
};
const actual = format(message);
const expected = 'Zemke cancelled tita–Rafka on Oct. 3, 11:12';
console.log(actual);
console.log(expected);
console.assert(actual === expected);
