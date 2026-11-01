// Optional holiday conversations. Locals are fictional; source links support the place notes.
// Folklore is presented as a recorded tradition, not as a historical or supernatural finding.
export const DESTINATIONS = [
  {
    index: 0, title: 'Oxmoor Valley', region: 'Birmingham', tagline: 'A little room to breathe.', baseCourse: 0,
    map: { x: 241, y: 212 }, local: { name: 'Mae Bell', role: 'Garden volunteer. Reliable putting advice.' },
    lore: [
      { id: 'oxmoor-vulcan', title: 'The iron man', text: 'That fellow above Birmingham is Vulcan. The statue is cast iron, right down to his toes. A whole city telling you what it used to make.', sourceTitle: 'Vulcan Park & Museum · Frequently asked questions', url: 'https://visitvulcan.com/about/faq/' },
      { id: 'oxmoor-rickwood', title: 'A different kind of field', text: 'Rickwood opened in 1910. Its owner put himself in the lineup to throw the first actual pitch. A ball. I find that comforting whenever my opening shot goes sideways.', sourceTitle: 'Friends of Rickwood · History of Rickwood Field', url: 'https://rickwood.com/history/' },
      { id: 'oxmoor-sloss', title: 'The ingredients were here', text: 'Iron ore in Red Mountain, coal nearby, limestone under the valley. Birmingham grew where the ingredients met. Sloss began making iron in 1882. The landscape explains quite a lot.', sourceTitle: 'Sloss Furnaces · History', url: 'https://www.slossfurnaces.org/history' }
    ]
  },
  {
    index: 1, title: 'Silver Lakes', region: 'Gadsden / Anniston', tagline: 'Pines, water, and the long afternoon.', baseCourse: 1,
    map: { x: 303, y: 170 }, local: { name: 'Arthur Pike', role: 'Bicycle mechanic. Early tee times.' },
    lore: [
      { id: 'silver-ladiga', title: 'Rails without trains', text: 'The Chief Ladiga Trail follows an old rail corridor through Anniston, Weaver, Jacksonville, and Piedmont. Keep going and it meets Georgia’s Silver Comet. My bicycle has crossed more borders than my golf ball.', sourceTitle: 'City of Anniston · Chief Ladiga Trail', url: 'https://annistonal.gov/chief-ladiga/' },
      { id: 'silver-gardens', title: 'The quieter collection', text: 'Anniston’s museums have gardens between them. Longleaf has nature trails, a sensory garden, and plenty of pollinators. I usually spend longer outside than I intended.', sourceTitle: 'Anniston Museums and Gardens · Gardens and Trails', url: 'https://www.exploreamag.org/explore/gardens-and-trails/' },
      { id: 'silver-cheaha', title: 'Alabama, from above', text: 'Cheaha reaches 2,407 feet: the highest point in Alabama. There’s a stone observation tower up there. A good place to remember that the fairway isn’t the whole world.', sourceTitle: 'Alabama State Parks · Cheaha trail map', url: 'https://www.alapark.com/sites/default/files/2021-03/Cheaha%20Trail%20Map%20for%20Guests.pdf' }
    ]
  },
  {
    index: 2, title: 'Capitol Hill', region: 'Prattville', tagline: 'An easy day by the river.', baseCourse: 2,
    map: { x: 248, y: 286 }, local: { name: 'Lena Moss', role: 'Librarian. Carries two paperbacks.' },
    lore: [
      { id: 'capitol-well', title: 'The fountain city', text: 'Prattville still has artesian wells. At Heritage Park, you can sit by the water and look across at Daniel Pratt’s old industrial buildings. A useful sort of town square.', sourceTitle: 'Explore Prattville · Attractions', url: 'https://www.exploreprattville.com/attractions' },
      { id: 'capitol-fitzgerald', title: 'Two writers at home', text: 'Scott and Zelda Fitzgerald lived in Montgomery’s Old Cloverdale neighborhood in 1931 and 1932. Their home became a museum. Zelda was working on Save Me the Waltz during that stay.', sourceTitle: 'Alabama Tourism Department · F. Scott and Zelda Fitzgerald', url: 'https://alabama.travel/things-to-do/alabama-makers/f-scott-and-zelda-fitzgerald/' },
      { id: 'capitol-crater', title: 'A very large divot', text: 'Wetumpka has an ancient impact crater. The driving route takes in its rim, uplifted center, and views over the Coosa. You can spend an afternoon learning to read the hills.', sourceTitle: 'Wetumpka Impact Crater Commission · Visit', url: 'https://www.wetumpkaimpactcratercommission.org/visit' }
    ]
  },
  {
    index: 3, title: 'Cambrian Ridge', region: 'Greenville', tagline: 'Take the road with the flowers.', baseCourse: 3,
    map: { x: 214, y: 343 }, local: { name: 'Cal Mercer', role: 'School bus driver. Weekend gardener.' },
    lore: [
      { id: 'cambrian-camellias', title: 'A city picked a flower', text: 'Greenville chose the camellia as its city flower in 1937. Local enthusiasm helped make it Alabama’s state flower in 1959. Gardeners can be a remarkably persuasive constituency.', sourceTitle: 'City of Greenville · History', url: 'https://greenvilleal.gov/244/History' },
      { id: 'cambrian-ritz', title: 'The lights on Commerce Street', text: 'The Ritz opened in 1935 with Art Deco colors, a hardwood stage, and Belgian wool carpet. Greenville later restored it. A small town deserves a grand entrance now and then.', sourceTitle: 'City of Greenville · Ritz Theatre', url: 'https://www.greenvilleal.gov/256/Ritz-Theatre' },
      { id: 'cambrian-hank', title: 'A porch in Georgiana', text: 'Nearby Georgiana keeps Hank Williams’s boyhood home as a museum. The house holds photographs and belongings from his life. Country music can begin in a surprisingly ordinary room.', sourceTitle: 'Alabama Tourism Department · Georgiana', url: 'https://www.alabama.travel/places-to-go/cities-and-towns/georgiana/' }
    ]
  },
  {
    index: 4, title: 'Magnolia Grove', region: 'Mobile', tagline: 'The coast is in no hurry.', baseCourse: 4,
    map: { x: 144, y: 443 }, local: { name: 'Simone Price', role: 'Costume stitcher. Patient with beginners.' },
    lore: [
      { id: 'magnolia-carnival', title: 'Behind the sequins', text: 'Mobile’s Carnival Museum shows the robes, crowns, and work behind the parades. People remember the spectacle. I always want to know who did the stitching.', sourceTitle: 'Mobile Carnival Museum', url: 'https://mobilecarnivalmuseum.com/' },
      { id: 'magnolia-boyington', title: 'The oak and the story', text: 'The Boyington Oak carries an old Mobile legend: a condemned man said a tree would proclaim his innocence. The folklore marker preserves the story. An oak cannot settle the history for us.', sourceTitle: 'William G. Pomeroy Foundation · The Boyington Oak', url: 'https://www.wgpfoundation.org/historic-markers/the-boyington-oak/' },
      { id: 'magnolia-bellingrath', title: 'An invitation that lasted', text: 'The Bellingraths opened their gardens to visitors for a day in April 1932. The response persuaded them to open year-round in 1934. Some invitations grow considerably beyond the original plan.', sourceTitle: 'Bellingrath Gardens and Home · History', url: 'https://bellingrath.org/about/history/' }
    ]
  },
  {
    index: 5, title: 'Grand National', region: 'Auburn / Opelika', tagline: 'Lakeside, with nowhere else to be.', baseCourse: 5,
    map: { x: 316, y: 285 }, local: { name: 'Perry Finch', role: 'Hardware shop owner. Keeps score lightly.' },
    lore: [
      { id: 'national-toomers', title: 'A corner worth celebrating', text: 'Auburn celebrates big victories by rolling Toomer’s Corner. The drugstore has been there since 1896. It is a whole town’s meeting place disguised as an intersection.', sourceTitle: 'City of Auburn · Toomer’s Corner', url: 'https://www.auburnal.gov/web-cameras/toomers-corner/' },
      { id: 'national-depot', title: 'The town beside the tracks', text: 'Opelika’s restored depot sits at the end of Railroad Avenue. Passenger service ended in 1970, but freight still passes through. Downtown never quite lost its railway rhythm.', sourceTitle: 'Alabama Tourism Department · Auburn–Opelika arts and culture', url: 'https://alabama.travel/plan-your-trip/road-trips/auburn-opelika/' },
      { id: 'national-kreher', title: 'A walk without a score', text: 'The Kreher Preserve protects forest, streams, and wetlands in Auburn. The land was given to the university by Louise and Frank Turner. Five miles of trails, and not a single handicap.', sourceTitle: 'City of Auburn · Kreher Preserve and Nature Center', url: 'https://www.auburnal.gov/parks/programs/kreher-preserve-and-nature-center/' }
    ]
  },
  {
    index: 6, title: 'Hampton Cove', region: 'Huntsville', tagline: 'Mountains on the horizon.', baseCourse: 1,
    map: { x: 275, y: 113 }, local: { name: 'Mina Reed', role: 'Instrument technician. Excellent short game.' },
    lore: [
      { id: 'hampton-saturn', title: 'The rocket indoors', text: 'The tall rocket outside the Space & Rocket Center is a replica. The real Saturn V lies inside the Davidson Center. Sometimes the less obvious attraction is the one worth lingering over.', sourceTitle: 'U.S. Space & Rocket Center Foundation · Rocket restoration', url: 'https://rocketcenterfoundation.org/rocket-restoration-alumni/' },
      { id: 'hampton-spring', title: 'A bridge from Japan', text: 'Big Spring Park’s red bridge and cherry trees were gifts from Japan. Huntsville grew around that spring. Before rockets, before laboratories, people needed a good place to get water.', sourceTitle: 'Huntsville–Madison County Convention & Visitors Bureau · Big Spring International Park', url: 'https://www.huntsville.org/listing/big-spring-international-park/862/' },
      { id: 'hampton-lowe', title: 'A factory full of makers', text: 'Lowe Mill was a textile factory. Now its corridors lead to working artists and makers. You can watch something being made, ask about it, and leave knowing a little more.', sourceTitle: 'Huntsville–Madison County Convention & Visitors Bureau · Lowe Mill', url: 'https://www.huntsville.org/rocket-city/districts-neighborhoods/lowe-mill/' }
    ]
  },
  {
    index: 7, title: 'The Shoals', region: 'Florence / Muscle Shoals', tagline: 'Find your own rhythm.', baseCourse: 2,
    map: { x: 188, y: 102 }, local: { name: 'Leon Booker', role: 'Record collector. Never rushes a round.' },
    lore: [
      { id: 'shoals-fame', title: 'A room with good ears', text: 'Aretha Franklin, Etta James, and Wilson Pickett all recorded in FAME’s Studio A. A room in Muscle Shoals helped shape records that traveled everywhere. Geography does not limit a good sound.', sourceTitle: 'FAME Recording Studios · Studio A', url: 'https://famestudios.com/studio/studio-a/' },
      { id: 'shoals-handy', title: 'The cabin came along', text: 'W. C. Handy was born in Florence. His log cabin was dismantled and reassembled to preserve it; a museum next door tells his story. Even a house can make a comeback.', sourceTitle: 'W. C. Handy Museum · About', url: 'https://www.wchandymuseum.org/about-1' },
      { id: 'shoals-wright', title: 'Room to grow', text: 'Frank Lloyd Wright’s Rosenbaum House uses cypress, brick, and glass. He added to it in 1948 as the family grew. Good design makes room for an ordinary life.', sourceTitle: 'Frank Lloyd Wright Foundation · Rosenbaum House', url: 'https://franklloydwright.org/site/rosenbaum-house/' }
    ]
  },
  {
    index: 8, title: 'Highland Oaks', region: 'Dothan', tagline: 'Longleaf country, wide open skies.', baseCourse: 3,
    map: { x: 320, y: 414 }, local: { name: 'Dot Ellis', role: 'Mural volunteer. Carries spare pencils.' },
    lore: [
      { id: 'highland-peanuts', title: 'Peanuts with personalities', text: 'Dothan’s decorated peanut statues began as a downtown fundraiser. They spread into a citywide art project. I like a town willing to give its favorite crop a wardrobe.', sourceTitle: 'Visit Dothan · Guides and Maps', url: 'https://visitdothan.com/guides-and-maps/' },
      { id: 'highland-murals', title: 'Read the walls', text: 'Downtown Dothan’s murals tell stories of farming, railroads, and early commerce. Take the walking route slowly. The best details tend to be above the places you normally look.', sourceTitle: 'Visit Dothan · Murals', url: 'https://visitdothan.com/things-to-do/murals/' },
      { id: 'highland-grancer', title: 'One more dance', text: 'Over toward Kinston, people tell of Grancer Harrison’s dancing ghost: fiddle music and tapping feet near his grave. It is a local folklore tradition. The story certainly knows how to keep a beat.', sourceTitle: 'William G. Pomeroy Foundation · Grancer’s Ghost', url: 'https://www.wgpfoundation.org/historic-markers/grancers-ghost/' }
    ]
  },
  {
    index: 9, title: 'Lakewood Club', region: 'Point Clear', tagline: 'A bay breeze and one more round.', baseCourse: 4,
    map: { x: 178, y: 468 }, local: { name: 'Bea Landry', role: 'Retired teacher. Collects bay stories.' },
    lore: [
      { id: 'lakewood-porches', title: 'Houses facing the water', text: 'Point Clear’s old cottages face Mobile Bay because visitors once arrived by boat. Their broad rain porches catch the breeze. The front door tells you how people used to get here.', sourceTitle: 'Grand Hotel · Point Clear boardwalk guide', url: 'https://www.grand1847.com/files/Activities/PTLAK_Boardwalk_Brochure.pdf' },
      { id: 'lakewood-fairhope', title: 'A town built on an idea', text: 'Fairhope began in 1894 as a single-tax colony inspired by Henry George. Its founders thought the experiment had a fair hope of succeeding. The optimism became the name.', sourceTitle: 'City of Fairhope · History', url: 'https://www.fairhopeal.gov/about-us/history' },
      { id: 'lakewood-jubilee', title: 'When the bay comes ashore', text: 'A Mobile Bay jubilee brings bottom-dwelling animals into the shallows when conditions include low-oxygen water. Fish, shrimp, and crabs crowd the shoreline. A remarkable sight with an earthly explanation.', sourceTitle: 'Alabama Department of Conservation and Natural Resources · Jubilees', url: 'https://www.outdooralabama.com/articles/harvest-regulations-still-apply-during-jubilees' }
    ]
  },
  {
    index: 10, title: 'Ross Bridge', region: 'Birmingham / Hoover', tagline: 'One more turn through the valley.', baseCourse: 0,
    map: { x: 223, y: 230 }, local: { name: 'Wes Porter', role: 'Carpenter. Takes the scenic route.' },
    lore: [
      { id: 'ross-bridge', title: 'Before the fairways', text: 'The old stone bridge over Ross Creek belonged to a Civil War railway supply line. The resort came much later. It helps to remember how many different landscapes one valley has held.', sourceTitle: 'Ross Bridge community · History', url: 'https://www.rossbridge.com/community/ross-bridge-history/' },
      { id: 'ross-boulders', title: 'Stones in the trees', text: 'Hoover’s Moss Rock Preserve has a boulder field popular with climbers. The city protects the surrounding woodland, too. Plenty to look at even if you prefer both feet on the ground.', sourceTitle: 'City of Hoover · Moss Rock Preserve', url: 'https://hooveralabama.gov/214/Moss-Rock-Preserve' },
      { id: 'ross-birds', title: 'A different birdie', text: 'The Alabama Wildlife Center at Oak Mountain cares for injured native birds. Its treetop trail introduces resident hawks, owls, and vultures. A much more interesting bird count than the one on my scorecard.', sourceTitle: 'Alabama Wildlife Center · Welcome', url: 'https://alabamawildlifecenter.org/welcome-to-the-alabama-wildlife-center/' }
    ]
  }
];

export const LORE_SOURCES = [...new Map(DESTINATIONS.flatMap(destination =>
  destination.lore.map(note => [note.url, { title: note.sourceTitle, url: note.url }])
)).values()];
