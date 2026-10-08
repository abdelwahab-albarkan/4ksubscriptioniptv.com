// Static reference data used by scripts/enrich-seo-pages.mjs
// Facts are deliberately conservative (team names, time zones, major ISPs) so the generated copy stays accurate.

// code|name|capital|tz|teams|isps
const STATE_ROWS = `
AL|Alabama|Montgomery|CT|Alabama Crimson Tide, Auburn Tigers|Spectrum, AT&T Fiber, Xfinity
AK|Alaska|Juneau|AKT|Alaska Nanooks, UAA Seawolves|GCI, Alaska Communications
AZ|Arizona|Phoenix|MST|Arizona Cardinals, Phoenix Suns, Arizona Diamondbacks|Cox, Lumen, Xfinity
AR|Arkansas|Little Rock|CT|Arkansas Razorbacks|Cox, AT&T, Ritter
CA|California|Sacramento|PT|Los Angeles Lakers, Golden State Warriors, San Francisco 49ers, Los Angeles Dodgers|Spectrum, Xfinity, AT&T Fiber, Cox
CO|Colorado|Denver|MT|Denver Broncos, Denver Nuggets, Colorado Avalanche, Colorado Rockies|Xfinity, Lumen
CT|Connecticut|Hartford|ET|UConn Huskies, Connecticut Sun|Xfinity, Optimum, Frontier
DE|Delaware|Dover|ET|Delaware Blue Hens, Philadelphia Eagles|Xfinity, Verizon Fios
DC|Washington DC|Washington|ET|Washington Commanders, Washington Wizards, Washington Capitals, Washington Nationals|Xfinity, Verizon Fios, RCN
FL|Florida|Tallahassee|ET|Miami Dolphins, Tampa Bay Buccaneers, Jacksonville Jaguars, Miami Heat, Florida Panthers|Xfinity, Spectrum, AT&T Fiber, Frontier
GA|Georgia|Atlanta|ET|Atlanta Falcons, Atlanta Hawks, Atlanta Braves, Georgia Bulldogs|Xfinity, AT&T Fiber, Spectrum
HI|Hawaii|Honolulu|HST|Hawaii Rainbow Warriors|Spectrum, Hawaiian Telcom
ID|Idaho|Boise|MT|Boise State Broncos, Idaho Vandals|Sparklight, Lumen
IL|Illinois|Springfield|CT|Chicago Bears, Chicago Bulls, Chicago Cubs, Chicago Blackhawks|Xfinity, AT&T, WOW
IN|Indiana|Indianapolis|ET|Indianapolis Colts, Indiana Pacers, Purdue Boilermakers|Xfinity, AT&T Fiber, Metronet
IA|Iowa|Des Moines|CT|Iowa Hawkeyes, Iowa State Cyclones|Mediacom, Lumen, Xfinity
KS|Kansas|Topeka|CT|Kansas City Chiefs, Kansas Jayhawks, Kansas State Wildcats|Cox, AT&T Fiber, Spectrum
KY|Kentucky|Frankfort|ET|Kentucky Wildcats, Louisville Cardinals|Spectrum, AT&T, Kinetic
LA|Louisiana|Baton Rouge|CT|New Orleans Saints, New Orleans Pelicans, LSU Tigers|Cox, AT&T, Lumen
ME|Maine|Augusta|ET|Maine Black Bears, Boston Red Sox, New England Patriots|Spectrum, Consolidated Communications
MD|Maryland|Annapolis|ET|Baltimore Ravens, Baltimore Orioles, Maryland Terrapins|Xfinity, Verizon Fios
MA|Massachusetts|Boston|ET|New England Patriots, Boston Celtics, Boston Red Sox, Boston Bruins|Xfinity, Verizon Fios, RCN
MI|Michigan|Lansing|ET|Detroit Lions, Detroit Pistons, Detroit Tigers, Michigan Wolverines|Xfinity, Spectrum, AT&T
MN|Minnesota|Saint Paul|CT|Minnesota Vikings, Minnesota Timberwolves, Minnesota Twins, Minnesota Wild|Xfinity, Lumen
MS|Mississippi|Jackson|CT|Ole Miss Rebels, Mississippi State Bulldogs|Xfinity, AT&T, C Spire
MO|Missouri|Jefferson City|CT|Kansas City Chiefs, St. Louis Cardinals, Kansas City Royals, St. Louis Blues|Spectrum, AT&T Fiber, Mediacom
MT|Montana|Helena|MT|Montana Grizzlies, Montana State Bobcats|Spectrum, Lumen
NE|Nebraska|Lincoln|CT|Nebraska Cornhuskers|Cox, Lumen, Allo
NV|Nevada|Carson City|PT|Las Vegas Raiders, Vegas Golden Knights, Las Vegas Aces|Cox, Lumen
NH|New Hampshire|Concord|ET|New England Patriots, Boston Bruins|Xfinity, Consolidated Communications
NJ|New Jersey|Trenton|ET|New York Giants, New York Jets, New Jersey Devils, Rutgers Scarlet Knights|Xfinity, Verizon Fios, Optimum
NM|New Mexico|Santa Fe|MT|New Mexico Lobos|Xfinity, Lumen
NY|New York|Albany|ET|New York Giants, Buffalo Bills, New York Knicks, New York Yankees, New York Mets|Spectrum, Optimum, Verizon Fios
NC|North Carolina|Raleigh|ET|Carolina Panthers, Charlotte Hornets, Carolina Hurricanes, Duke Blue Devils|Spectrum, AT&T Fiber
ND|North Dakota|Bismarck|CT|North Dakota Fighting Hawks, NDSU Bison|Midco
OH|Ohio|Columbus|ET|Cleveland Browns, Cincinnati Bengals, Cleveland Cavaliers, Ohio State Buckeyes|Spectrum, AT&T Fiber, Frontier
OK|Oklahoma|Oklahoma City|CT|Oklahoma City Thunder, Oklahoma Sooners, Oklahoma State Cowboys|Cox, AT&T
OR|Oregon|Salem|PT|Portland Trail Blazers, Oregon Ducks, Oregon State Beavers|Xfinity, Ziply Fiber
PA|Pennsylvania|Harrisburg|ET|Philadelphia Eagles, Pittsburgh Steelers, Philadelphia 76ers, Pittsburgh Pirates, Penn State Nittany Lions|Xfinity, Verizon Fios
RI|Rhode Island|Providence|ET|Providence Friars, New England Patriots, Boston Red Sox|Cox, Verizon Fios
SC|South Carolina|Columbia|ET|Clemson Tigers, South Carolina Gamecocks|Spectrum, AT&T Fiber
SD|South Dakota|Pierre|CT|South Dakota State Jackrabbits|Midco
TN|Tennessee|Nashville|CT|Tennessee Titans, Memphis Grizzlies, Nashville Predators, Tennessee Volunteers|Xfinity, AT&T Fiber, EPB
TX|Texas|Austin|CT|Dallas Cowboys, Houston Texans, Dallas Mavericks, San Antonio Spurs, Texas Rangers|Spectrum, AT&T Fiber, Xfinity, Frontier
UT|Utah|Salt Lake City|MT|Utah Jazz, BYU Cougars, Utah Utes|Xfinity, Lumen
VT|Vermont|Montpelier|ET|Vermont Catamounts, New England Patriots|Xfinity, Consolidated Communications
VA|Virginia|Richmond|ET|Virginia Tech Hokies, Virginia Cavaliers, Washington Commanders|Xfinity, Cox, Verizon Fios
WA|Washington|Olympia|PT|Seattle Seahawks, Seattle Mariners, Seattle Kraken, Washington Huskies|Xfinity, Ziply Fiber
WV|West Virginia|Charleston|ET|West Virginia Mountaineers, Marshall Thundering Herd|Frontier, Xfinity
WI|Wisconsin|Madison|CT|Green Bay Packers, Milwaukee Bucks, Milwaukee Brewers, Wisconsin Badgers|Spectrum, AT&T, TDS
WY|Wyoming|Cheyenne|MT|Wyoming Cowboys|Spectrum, Lumen
`;

// ET offset (hours behind Eastern) and label
const TZ = {
  ET: { off: 0, label: 'Eastern Time (ET)', short: 'ET' },
  CT: { off: -1, label: 'Central Time (CT)', short: 'CT' },
  MT: { off: -2, label: 'Mountain Time (MT)', short: 'MT' },
  MST: { off: -2, label: 'Mountain Standard Time (no daylight saving)', short: 'MST' },
  PT: { off: -3, label: 'Pacific Time (PT)', short: 'PT' },
  AKT: { off: -4, label: 'Alaska Time (AKT)', short: 'AKT' },
  HST: { off: -5, label: 'Hawaii Time (HST)', short: 'HST' },
};

export const STATES = {};
for (const row of STATE_ROWS.trim().split('\n')) {
  const [code, name, capital, tz, teams, isps] = row.split('|');
  STATES[code] = {
    code, name, capital,
    tz: TZ[tz],
    teams: teams.split(', '),
    isps: isps.split(', '),
  };
}

// Convert an Eastern clock time (hour24, minute) to a state's zone as "H:MM AM/PM"
export function etTo(state, h24, m = 0) {
  let h = (h24 + state.tz.off + 24) % 24;
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}

// ---------- UK ----------
export const UK_NATION = {
  Scotland: 'Scotland', Wales: 'Wales', 'Northern Ireland': 'Northern Ireland',
};

export const UK_REGION_CLUBS = {
  'North West': ['Manchester United', 'Manchester City', 'Liverpool', 'Everton'],
  Yorkshire: ['Leeds United', 'Sheffield United', 'Sheffield Wednesday', 'Hull City'],
  'Yorkshire & Humber': ['Leeds United', 'Sheffield United', 'Hull City'],
  'North East': ['Newcastle United', 'Sunderland', 'Middlesbrough'],
  Midlands: ['Aston Villa', 'Wolverhampton Wanderers', 'Birmingham City', 'Coventry City'],
  'West Midlands': ['Aston Villa', 'Wolverhampton Wanderers', 'Birmingham City', 'West Bromwich Albion'],
  'East Midlands': ['Leicester City', 'Nottingham Forest', 'Derby County'],
  'East of England': ['Norwich City', 'Ipswich Town', 'Watford', 'Luton Town'],
  'South East': ['Brighton & Hove Albion', 'Southampton', 'Portsmouth', 'Reading'],
  'South West': ['Bristol City', 'Plymouth Argyle', 'AFC Bournemouth', 'Exeter City'],
  London: ['Arsenal', 'Chelsea', 'Tottenham Hotspur', 'West Ham United', 'Crystal Palace', 'Fulham', 'Brentford'],
  Scotland: ['Celtic', 'Rangers', 'Heart of Midlothian', 'Hibernian', 'Aberdeen'],
  Wales: ['Cardiff City', 'Swansea City', 'Wrexham'],
  'Northern Ireland': ['Linfield', 'Glentoran', 'Cliftonville'],
  'UK Wide': ['Manchester United', 'Liverpool', 'Arsenal', 'Chelsea', 'Manchester City', 'Tottenham Hotspur'],
};

// Clubs tied to a specific place (only confident matches)
export const UK_PLACE_CLUBS = {
  Manchester: ['Manchester United', 'Manchester City'], Liverpool: ['Liverpool', 'Everton'],
  Birmingham: ['Aston Villa', 'Birmingham City'], 'Newcastle upon Tyne': ['Newcastle United'],
  Sheffield: ['Sheffield United', 'Sheffield Wednesday'], Leeds: ['Leeds United'],
  Leicester: ['Leicester City'], Nottingham: ['Nottingham Forest', 'Notts County'],
  Coventry: ['Coventry City'], Bristol: ['Bristol City', 'Bristol Rovers'], Southampton: ['Southampton'],
  Portsmouth: ['Portsmouth'], Brighton: ['Brighton & Hove Albion'], Plymouth: ['Plymouth Argyle'],
  Norwich: ['Norwich City'], Derby: ['Derby County'], 'Stoke-on-Trent': ['Stoke City', 'Port Vale'],
  Wolverhampton: ['Wolverhampton Wanderers'], Sunderland: ['Sunderland'], Middlesbrough: ['Middlesbrough'],
  'Kingston upon Hull': ['Hull City'], Bolton: ['Bolton Wanderers'], Blackburn: ['Blackburn Rovers'],
  Cardiff: ['Cardiff City'], Swansea: ['Swansea City'], Newport: ['Newport County'], Wrexham: ['Wrexham'],
  Glasgow: ['Celtic', 'Rangers'], Edinburgh: ['Heart of Midlothian', 'Hibernian'], Aberdeen: ['Aberdeen'],
  Dundee: ['Dundee', 'Dundee United'], Inverness: ['Inverness Caledonian Thistle'], Perth: ['St Johnstone'],
  Belfast: ['Linfield', 'Glentoran', 'Cliftonville'], Derry: ['Derry City'],
  Watford: ['Watford'], Reading: ['Reading'], Luton: ['Luton Town'], Peterborough: ['Peterborough United'],
  Oxford: ['Oxford United'], Cambridge: ['Cambridge United'], Blackpool: ['Blackpool'],
  Doncaster: ['Doncaster Rovers'], Rotherham: ['Rotherham United'], Huddersfield: ['Huddersfield Town'],
  Bradford: ['Bradford City'], Barnsley: ['Barnsley'], Wigan: ['Wigan Athletic'], Stockport: ['Stockport County'],
  Oldham: ['Oldham Athletic'], Rochdale: ['Rochdale'], Walsall: ['Walsall'], Swindon: ['Swindon Town'],
  Exeter: ['Exeter City'], Chatham: ['Gillingham'], Colchester: ['Colchester United'], Crawley: ['Crawley Town'],
  Lincoln: ['Lincoln City'], Grimsby: ['Grimsby Town'], Scunthorpe: ['Scunthorpe United'],
  Mansfield: ['Mansfield Town'], Chesterfield: ['Chesterfield'], Northampton: ['Northampton Town'],
  Crewe: ['Crewe Alexandra'], Carlisle: ['Carlisle United'], 'Burton upon Trent': ['Burton Albion'],
  Stevenage: ['Stevenage'], Bournemouth: ['AFC Bournemouth'], Harrogate: ['Harrogate Town'],
  'High Wycombe': ['Wycombe Wanderers'], Cheltenham: ['Cheltenham Town'], 'Milton Keynes': ['MK Dons'],
  Darlington: ['Darlington'], Hartlepool: ['Hartlepool United'], Salisbury: ['Salisbury'],
  Sale: ['Sale Sharks (rugby union) and Manchester clubs'], Solihull: ['Solihull Moors'],
  Gravesend: ['Ebbsfleet United'], Ipswich: ['Ipswich Town'], Bedford: ['Bedford Town'],
  Stirling: ['Stirling Albion'],
  // London boroughs
  Islington: ['Arsenal'], Haringey: ['Tottenham Hotspur'], Newham: ['West Ham United'],
  'Hammersmith and Fulham': ['Chelsea', 'Fulham'], Croydon: ['Crystal Palace'], Hounslow: ['Brentford'],
  Greenwich: ['Charlton Athletic'], Southwark: ['Millwall'], Brent: ['Wembley Stadium (England internationals)'],
  Merton: ['AFC Wimbledon'], 'Waltham Forest': ['Leyton Orient'], Sutton: ['Sutton United'],
};

export const UK_ISPS = ['BT', 'Sky Broadband', 'Virgin Media', 'TalkTalk', 'Plusnet', 'EE'];
export const UK_LONDON_ISPS = ['BT', 'Sky Broadband', 'Virgin Media', 'Community Fibre', 'Hyperoptic'];

// ---------- Sports ----------
// Keyed by sportName (as found in pages-data.json)
export const SPORTS = {
  'Premier League Live 3PM Kickoffs': { what: 'the English Premier League, including the Saturday 3pm kick-offs', season: 'August to May', times: 'Saturday 12:30, 15:00 and 17:30, Sunday 14:00 and 16:30, plus midweek evening games (all UK time)', tip: 'Premier League games are spread across several broadcasters, so a channel list that includes all of them matters more than raw channel count.' },
  'Sky Sports Main Event & Football': { what: 'the Sky Sports channel family, from Main Event to Football, Premier League, Cricket and Golf', season: 'year-round', times: 'live matches mostly Saturday lunchtime, Sunday afternoons and midweek evenings', tip: 'Sky Sports Main Event is the flagship channel for the biggest game each weekend.' },
  'TNT Sports 1 2 3 4 & Ultimate 4K': { what: 'TNT Sports 1 to 4 and TNT Sports Ultimate, home of Champions League, UFC and Premiership Rugby in the UK', season: 'year-round', times: 'Tuesday and Wednesday European nights, Saturday evening football and weekend combat sports', tip: 'TNT Sports Ultimate is the 4K channel, so a 4K-capable device and about 25 Mbps of spare bandwidth help.' },
  'UEFA Champions League & Europa League': { what: 'the UEFA Champions League and Europa League', season: 'September to May (finals in late May)', times: 'Tuesday, Wednesday and Thursday evenings, usually 17:45 and 20:00 UK time', tip: 'Midweek European nights are peak traffic, so a wired connection avoids Wi-Fi congestion.' },
  'SPFL Scottish Premiership': { what: 'the Scottish Premiership, including Old Firm derbies', season: 'August to May', times: 'Saturday 15:00 with Sunday and midweek fixtures', tip: 'Old Firm derbies are among the biggest streaming spikes of the Scottish season.' },
  'EFL Championship & League One Two': { what: 'the EFL: Championship, League One and League Two', season: 'August to May', times: 'Saturday 15:00 plus Tuesday and Friday evening fixtures', tip: 'With 72 clubs, the EFL has more simultaneous games than any other English league, so use the EPG to find your club.' },
  'La Liga EA Sports (Spain)': { what: "Spain's La Liga, home of Real Madrid and Barcelona", season: 'August to May', times: 'Spanish kick-offs run from 14:00 to 21:00 local, which maps to a lunchtime-to-late-evening window in the UK', tip: 'El Clasico is the peak fixture, so test the stream well before kick-off.' },
  'Serie A (Italy)': { what: "Italy's Serie A", season: 'August to May', times: 'Saturday and Sunday afternoons and evenings, with some Friday and Monday games', tip: 'Serie A has several time slots across the weekend, so the EPG helps you not miss a game.' },
  'Bundesliga (Germany)': { what: "Germany's Bundesliga", season: 'August to May', times: 'Friday evening, Saturday 14:30 and 17:30 and Sunday games (German time)', tip: 'Kick-offs are in German time, which is an hour ahead of the UK.' },
  "Ligue 1 McDonald's (France)": { what: "France's Ligue 1", season: 'August to May', times: 'Friday evening, Saturday and Sunday fixtures (French time)', tip: 'Ligue 1 kick-offs are in French time, one hour ahead of the UK.' },
  'FA Cup & Carabao Cup Live': { what: 'the FA Cup and the Carabao (League) Cup', season: 'August to May', times: 'FA Cup rounds usually fall on Saturday and Sunday, League Cup ties midweek', tip: 'Cup draws change kick-off dates at short notice, so check the schedule each week.' },
  'NFL Sunday Ticket & RedZone': { what: 'NFL football, including out-of-market games and RedZone', season: 'September to early February', times: 'Sunday 1:00 PM ET and 4:05/4:25 PM ET windows, Thursday Night Football, Sunday and Monday Night Football', tip: 'RedZone is most useful on Sunday afternoons when several games are live at once.' },
  'Super Bowl 2026 Live Stream': { what: 'the NFL Super Bowl', season: 'early February', times: 'kick-off is in the early evening Eastern Time, which is late night in the UK', tip: 'The Super Bowl produces one of the biggest one-day streaming peaks, so test your set-up in advance.' },
  'NBA League Pass & Playoffs Finals': { what: 'the NBA regular season, Playoffs and Finals', season: 'October to June', times: 'games typically tip off between 7:00 PM and 10:30 PM ET', tip: 'With up to 15 games on a night, the EPG is the quickest way to find a specific team.' },
  'MLB Extra Innings & World Series': { what: 'Major League Baseball, from Opening Day to the World Series', season: 'late March to October', times: 'most games start between 1:00 PM and 10:00 PM ET', tip: 'Baseball has the longest season, so a reliable all-season set-up beats a short-term fix.' },
  'NHL Center Ice & Stanley Cup': { what: 'the NHL regular season and the Stanley Cup Playoffs', season: 'October to June', times: 'games typically start around 7:00 PM and 10:00 PM ET', tip: 'Playoff overtime can run late, so allow for games that finish well after the scheduled end.' },
  'NCAA College Football & Basketball March Madness': { what: 'NCAA college football and the March Madness basketball tournament', season: 'football from late August to January, March Madness in March and early April', times: 'college football is mostly Saturday, March Madness runs from midday to late evening ET', tip: 'March Madness opening rounds put many games on at once, so use the EPG to switch quickly.' },
  'ESPN+ & ESPN 2 4K Live': { what: 'the ESPN family of channels, covering college sports, MLB, NBA and more', season: 'year-round', times: 'varies by event across the whole day', tip: 'ESPN channels carry a wide mix of events, so the programme guide is worth using.' },
  'Fox Sports 1 (FS1) & FS2 4K': { what: 'Fox Sports 1 and Fox Sports 2', season: 'year-round', times: 'varies by event, with prime-time college and NASCAR coverage', tip: 'FS1 and FS2 carry big college and motorsport events, so both channels are worth having in your list.' },
  'UFC Pay-Per-View Main Card & Fight Night': { what: 'UFC numbered events and Fight Night cards', season: 'year-round', times: 'main cards usually start late evening ET on Saturday, which is early Sunday morning in the UK', tip: 'PPV nights are high traffic, so allow time to test the stream before the main card.' },
  'Boxing PPV (DAZN, Queensberry, Matchroom)': { what: 'major boxing cards from DAZN, Queensberry and Matchroom', season: 'year-round with big events scheduled months ahead', times: 'ring walks for headliners are often late evening local time', tip: 'Boxing cards run long and the main event is usually last, so keep your stream stable for several hours.' },
  'WWE Network PPV & PLE (WrestleMania)': { what: 'WWE premium live events, including WrestleMania', season: 'year-round', times: 'premium live events usually start in the evening ET, late night in the UK', tip: 'WrestleMania runs over two nights, so plan for long sessions.' },
  'AEW All Elite Wrestling Dynamite & PPV': { what: 'AEW Dynamite and pay-per-view events', season: 'year-round', times: 'Dynamite airs on Wednesday evenings ET', tip: 'AEW pay-per-views are scheduled well ahead, so check the event calendar.' },
  'Formula 1 (F1 2026 Season Live)': { what: 'the Formula 1 season, including qualifying, sprint races and Grands Prix', season: 'March to December', times: 'race start times vary by circuit, from early afternoon in Europe to late evening for the Asian and Australian rounds', tip: 'F1 weekends have practice, qualifying and a race, so a stable stream across a full weekend is more useful than a one-off test.' },
  'MotoGP World Championship': { what: 'the MotoGP World Championship', season: 'March to November', times: 'Sunday races, with Saturday qualifying and sprint races', tip: 'MotoGP weekends include practice, qualifying and sprint races, not only the main Sunday race.' },
  'PGA Tour & LIV Golf Major Tournaments': { what: 'PGA Tour events and golf majors', season: 'year-round with majors from April to July', times: 'tournament rounds usually run Thursday to Sunday, often from early morning to late afternoon local time', tip: 'Golf runs for hours each day, so a stable low-latency stream matters more than peak bitrate.' },
  'Grand Slam Tennis (Wimbledon, US Open, Roland Garros, Australian Open)': { what: 'the four tennis Grand Slams', season: 'January, May to June, late June to July and August to September', times: 'matches start late morning local time and can run well into the evening', tip: 'Tennis has no fixed finish time, so keep your evening free of other heavy downloads.' },
  'Cricket Live (ICC World Cup, IPL, The Ashes)': { what: 'international and franchise cricket, including the ICC World Cup, IPL and The Ashes', season: 'year-round across different formats', times: 'Test days run across a full day, IPL matches are in the evening India time', tip: 'Cricket formats differ widely in length, so check the EPG for start times.' },
};
