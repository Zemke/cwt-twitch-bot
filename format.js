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
  } else if (newsType === "STREAM" || newsType === "TWITCH_MESSAGE" || newsType === "DISCORD_MESSAGE") {
    console.info("Ignoring newsType", newsType);
  } else if (newsType === "SCHEDULE") {

  } else {
    console.warn("Unhandled newsType:", newsType);
  }
  return res;
}

module.exports = format;

if (require.main === module) {
  const [category, author, body, newsType] = process.argv.slice(2);
  console.log(format({category, author, body, newsType}));
  process.exit(0);
}

