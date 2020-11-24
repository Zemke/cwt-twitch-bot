const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

function format({category, author, body, newsType}) {
  if (category === 'SHOUTBOX') {
    return `${author} via CWT: “${body}”`;
  }
  let res = author + " ";
  if (newsType === "REPORT" || newsType === "COMMENT") {
    const [gameId, home, away, scoreh, scorea] = body.split(',');
    res += `${newsType.toLowerCase()}ed ${home} ${scoreh}–${scorea} ${away} \
(https://cwtsite.com/games/${gameId})`.trim();
  } else if (newsType === "RATING") {
    const [gameId, home, away, scoreh, scorea, rating] = body.split(',');
    res += `${rating}d ${home} ${scoreh}–${scorea} ${away} (https://cwtsite.com/games/${gameId})`;
  } else if (newsType === "STREAM") {
    const [id, ...title] = body.split(',');
    res += `live streamed “${title.join(',')}”`;
    res += ` (https://www.twitch.tv/videos/${id})`;
  } else if (newsType === "DISCORD_MESSAGE") {
    const [from, _, ...content] = body.split(',');
    res = `${from} via Discord: “${content.join(',')}”`;
  } else if (newsType === "TWITCH_MESSAGE") {
    const [from, _, ...content] = body.split(',');
    res = `${from} via Twitch: “${content.join(',')}”`;
  } else if (newsType === "SCHEDULE") {
    const [action, home, away, appointment] = body.split(',');
    if (action === 'removeStream') {
      res += "cancelled the live stream";
    } else if (action === 'scheduleStream') {
      res += "scheduled a live stream";
    } else if (action === 'createSchedule') {
      res += "scheduled";
    } else if (action === 'cancelSchedule') {
      res += "cancelled";
    } else {
      throw Error("Couldn't handle action: " + action);
    }
    res += ` ${home}–${away}`;
    const d = new Date(appointment);
    const hours = d.getUTCHours() < 10 ? ('0' + d.getUTCHours()) : ("" + d.getUTCHours());
    const minutes = d.getUTCMinutes() < 10 ? ('0' + d.getUTCMinutes()) : ("" + d.getUTCMinutes());
    res += ` on ${months[d.getUTCMonth()]}. ${d.getUTCDate()}, ${hours}:${minutes}`;
  } else {
    throw Error("Unhandled newsType: " +  newsType);
  }
  return res;
}

module.exports = format;

if (require.main === module) {
  const [category, author, body, newsType] = process.argv.slice(2);
  console.log('RES xx ' + format({category, author, body, newsType}));
  process.exit(0);
}

