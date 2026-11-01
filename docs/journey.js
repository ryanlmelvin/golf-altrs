// The ordered thread is optional within an open-ended golf holiday.
// Course names and ordinary local rounds remain available after its resolution.
export const OUTINGS = [
  {
    id: 'arrival', location: 0, variant: 0, title: 'An afternoon off', kind: 'holiday',
    arrival: 'Your bags can wait.', after: 'A cold drink and no particular plans.'
  },
  {
    id: 'breakfast-loop', location: 0, variant: 1, title: 'Before breakfast', kind: 'holiday',
    arrival: 'The greens are still holding the morning dew.', after: 'The kitchen has kept your table.'
  },
  {
    id: 'porch-match', location: 0, variant: 2, title: 'One for the road', kind: 'social',
    arrival: 'Nora has a spare pencil.', after: 'She recommends Silver Lakes whenever you feel like driving.',
    person: { name: 'Nora Bell', role: 'Retired teacher', opening: '“I used to keep thirty children quiet. This is a much easier audience.”', choices: [
      { id: 'nora-school', label: 'What did you teach?', response: '“Science. Mostly patience.” She rolls a practice ball across the veranda. “I still haven’t mastered either.”' },
      { id: 'nora-lunch', label: 'Where’s good for lunch?', response: '“Wherever you can sit outside. You have the whole afternoon. That’s the point.”' }
    ] }
  },
  {
    id: 'lakeside-morning', location: 1, variant: 3, title: 'Lakeside morning', kind: 'holiday',
    arrival: 'A kingfisher gets to the water first.', after: 'You could get used to this.'
  },
  {
    id: 'late-tee-time', location: 1, variant: 4, title: 'A late tee time', kind: 'holiday',
    after: 'The clubhouse lights are coming on.',
    find: { afterFlags: 3, clue: 'brass-sign', glimpse: 'A folded paper beside the bench.', text: 'A supplier invoice. Someone has circled “artificial turf” and written: “Why so much? — I.”' }
  },
  {
    id: 'back-porch', location: 1, variant: 5, title: 'The back porch', kind: 'social',
    arrival: 'Someone has claimed the last patch of shade.', after: 'Ellis recommends the courses around Prattville.',
    person: { name: 'Ellis Vale', role: 'Local reporter', opening: '“I’m off today. That’s what I keep telling my phone.”', choices: [
      { id: 'ellis-weekend', label: 'Ask about his weekend.', response: '“My daughter’s learning to drive. I’m learning to keep my eyes open in the passenger seat.” He puts his phone away.', trust: 1 },
      { id: 'ellis-paper', label: 'Show him the paper.', response: '“Probably practice mats. Or landscaping.” He photographs the supplier’s name. “Happy to ask. After lunch.”' }
    ] }
  },
  {
    id: 'river-air', location: 2, variant: 6, title: 'River air', kind: 'holiday',
    arrival: 'Warm wind comes up from the river.', after: 'A groundskeeper points you toward the shaded way back.',
    find: { afterFlags: 4, clue: 'welcome-copy', glimpse: 'A delivery slip caught under a rake.', text: 'The same supplier. Five narrow strips, replaced every few weeks. The groundskeeper says the office handles those orders.' }
  },
  {
    id: 'borrowed-pencil', location: 2, variant: 7, title: 'A borrowed pencil', kind: 'social',
    after: 'June suggests another round when her shift is over.',
    person: { name: 'June Stowe', role: 'Accounts clerk', opening: '“You can borrow it. It’s the only pencil in this office that still has an eraser.”', choices: [
      { id: 'june-route', label: 'Ask about the drive south.', response: '“Take your time. Greenville is a good lunch stop. Everybody rushes through places they came here to see.”' },
      { id: 'june-initial', label: 'Who signs things “I.”?', response: '“Ivan. Accounts, like me. Usually writes more than one letter, though.” She recognizes the supplier on your folded paper.' }
    ] }
  },
  {
    id: 'after-hours', location: 2, variant: 8, title: 'After hours', kind: 'wager', target: 24,
    arrival: 'June has finished her paperwork.', after: 'Ivan’s notes fit neatly inside your yardage book.', reward: 'scorecard',
    person: { name: 'June Stowe', role: 'Accounts clerk', opening: '“Beat my card and I’ll find Ivan’s explanation. He certainly wrote enough of it.”', choices: [
      { id: 'june-ivan', label: 'Was he worried?', response: '“Annoyed. Roger said bright sunshine was killing the grass. Ivan asked whether grass didn’t usually like sunshine.”' },
      { id: 'june-discretion', label: 'Keep your name off the copy?', response: '“Please. I’d rather be known for my putting.”', trust: 1 }
    ] }
  },
  {
    id: 'a-local-favor', location: 1, variant: 9, title: 'A local favor', kind: 'social',
    arrival: 'Ellis has found a quiet table.', after: 'He can get the contractor’s work tickets by tomorrow.',
    person: { name: 'Ellis Vale', role: 'Local reporter', opening: '“Roger told Ivan something about buried military waste. Before anybody prints that, we should read these.”', choices: [
      { id: 'ellis-records', label: 'Read the two folders.', response: '“Army Depot cleanup in this one. Industrial PCB pollution in that one. Different histories. Neither puts waste under this golf course.”', evidence: 'pcb-note' },
      { id: 'ellis-patience', label: 'There’s no rush to print.', response: 'He closes a draft headline. “Good. A recognizable scandal isn’t the same as an explanation.”', trust: 1 }
    ] }
  },
  {
    id: 'a-friendly-rematch', location: 1, variant: 10, title: 'A friendly rematch', kind: 'wager', target: 23,
    arrival: 'Ellis brings a folder and his least reliable putter.', reward: 'depot-record',
    after: 'The contractor’s explanation is less dramatic than Roger’s.',
    person: { name: 'Ellis Vale', role: 'Local reporter', opening: '“My scorecard for yours. The folder comes with it.”', choices: [
      { id: 'ellis-sun', label: 'Did Roger mention sunshine?', response: '“First sunshine, then waste. The contractor wrote something else entirely.”' },
      { id: 'ellis-next-stop', label: 'Where are you headed next?', response: '“Home. You should try Cambrian Ridge. Bring more patience than I did.”' }
    ] }
  },
  {
    id: 'camellia-afternoon', location: 3, variant: 11, title: 'Camellia afternoon', kind: 'holiday',
    arrival: 'Somebody has put fresh flowers beside the clubhouse door.', after: 'For a while, all you think about is the next putt.'
  },
  {
    id: 'long-shadows', location: 3, variant: 12, title: 'Long shadows', kind: 'holiday',
    after: 'The late light makes every tree look older.',
    find: { afterFlags: 2, clue: 'lantern-poster', glimpse: 'A small poster on the noticeboard.', text: 'A local ghost walk. Beneath a pasted-on place name, you can just make out another town.' }
  },
  {
    id: 'a-good-story', location: 3, variant: 13, title: 'A good story', kind: 'social',
    arrival: 'Otis has more stories than golf balls.', after: 'He says Mobile has a story worth hearing in its own place.',
    person: { name: 'Otis Reed', role: 'Local history enthusiast', opening: '“People always want to know whether it happened. I like knowing who told it first.”', choices: [
      { id: 'otis-place', label: 'Show him the ghost poster.', response: '“Grancer’s Ghost belongs to Kinston. The Boyington Oak belongs to Mobile. This printer seems unusually flexible about geography.”', evidence: 'folklore-note' },
      { id: 'otis-listen-longer', label: 'Stay for another story.', response: 'He puts his club down. “Now, that’s the correct way to spend an afternoon.”', trust: 1 }
    ] }
  },
  {
    id: 'salt-in-the-air', location: 4, variant: 14, title: 'Salt in the air', kind: 'holiday',
    arrival: 'Mobile gives you warm air and a slower afternoon.', after: 'A good meal would improve an already good day.'
  },
  {
    id: 'groundskeeping', location: 4, variant: 15, title: 'The morning round', kind: 'holiday',
    after: 'The replacement strips are exactly as wide as the brass below them.',
    find: { afterFlags: 4, clue: 'maintenance-chart', glimpse: 'A maintenance box left open.', text: 'Under the fresh turf: warm brass conductors. The controller lists numbered cues. None of the wires leads to a sprinkler.' }
  },
  {
    id: 'the-return-trip', location: 2, variant: 16, title: 'The return trip', kind: 'wager', target: 22,
    arrival: 'June has something she would rather show you outside.', reward: 'minutes',
    after: 'For the first time, Ivan’s discovery looks less accidental.',
    person: { name: 'June Stowe', role: 'Accounts clerk', opening: '“Someone filed a meeting transcript with the purchase orders. I don’t think they meant to.”', choices: [
      { id: 'june-originals', label: 'Keep the original safe.', response: '“Already done. You can have a copy after the round.”', trust: 1 },
      { id: 'june-helen', label: 'Who was at the meeting?', response: '“Roger and Helen. He handles accounts. She handles the hospitality committee. At least, that’s what the directory says.”' }
    ] }
  },
  {
    id: 'an-evening-invitation', location: 3, variant: 17, title: 'An evening invitation', kind: 'wager', target: 22,
    arrival: 'The ghost walk is rehearsing in daylight.', reward: 'cue-sheet',
    after: 'The rehearsal sheet has a scene called “Exposure.” Your name is penciled beside it.',
    person: { name: 'Otis Reed', role: 'Local history enthusiast', opening: '“Beat my score and you can have the paperwork. The haunting isn’t worth what they’re charging.”', choices: [
      { id: 'otis-follow', label: 'Look behind the white figure.', response: 'A projector, a battery, and a folded budget. The biggest expense is transport for a demonstration.', evidence: 'bond-margin' },
      { id: 'otis-correction', label: 'Give the stories their names back.', response: '“Their places, too.” He takes down the altered poster.', trust: 1 }
    ] }
  },
  {
    id: 'familiar-ground', location: 0, variant: 18, title: 'Familiar ground', kind: 'social',
    arrival: 'Nora remembers how you take your coffee.', after: 'She leaves you the table until the sun has moved.',
    person: { name: 'Nora Bell', role: 'Retired teacher', opening: '“You look as if your holiday has turned into homework.”', choices: [
      { id: 'nora-rest', label: 'Just golf today.', response: '“Excellent idea.” She folds your papers beneath the scorecard. “The world can wait five holes.”' },
      { id: 'nora-pattern', label: 'Show her the documents.', response: 'She lines up the dates. “Every correction has its own publicity budget. I don’t think they mind being caught.”' }
    ] }
  },
  {
    id: 'guest-services', location: 4, variant: 19, title: 'Guest services', kind: 'social',
    arrival: 'Delia knows your name before you introduce yourself.', after: 'She recommends another round. The invitation feels difficult to decline.',
    person: { name: 'Delia Voss', role: 'Guest experience director', opening: '“You’ve certainly been getting to know Alabama. Helen will be pleased.”', choices: [
      { id: 'delia-coverage', label: 'Pleased about the complaints?', response: '“People speak most freely when they’re upset. We try to give them an occasion.”' },
      { id: 'delia-friends', label: 'My friends have the documents.', response: 'Her smile holds. Her hand stops stirring her drink. “How very sociable.”', trust: 1 }
    ] }
  },
  {
    id: 'the-appointment', location: 2, variant: 20, title: 'An open afternoon', kind: 'wager', target: 21,
    arrival: 'June has circled your next stop in a different diary.', reward: 'appointment-book',
    after: 'Every place you went, somebody had booked transport ahead of you.',
    person: { name: 'June Stowe', role: 'Accounts clerk', opening: '“Helen’s diary. She won’t miss it until Monday.”', choices: [
      { id: 'june-counts', label: 'What are these numbers?', response: '“People. Twelve, thirty-six, a hundred and eight. The final column says voices. Not voters. Not customers.”' },
      { id: 'june-ivan-wife', label: 'Has Ivan heard from his wife?', response: '“She says a horticulturalist would have been cheaper than all this.” For a moment, June laughs.' }
    ] }
  },
  {
    id: 'under-the-green', location: 4, variant: 21, title: 'A little course work', kind: 'holiday',
    arrival: 'Fresh turf covers the same narrow strips.', after: 'A rule has been drawn into the landscape.',
    find: { afterFlags: 3, clue: 'overlay', glimpse: 'A tracing sheet inside the tool chest.', text: 'The conductors join beneath every green. A handwritten instruction: “108 voices. Full name. Three repetitions. Belief is not required.”' }
  },
  {
    id: 'the-house-card', location: 4, variant: 22, title: 'The house card', kind: 'wager', target: 20,
    arrival: 'Delia has put out a hundred and eight chairs.', reward: 'invitation',
    after: 'Grand National. A tee time, two signatures, and breakfast for one.',
    find: { afterFlags: 2, clue: 'local-rule', glimpse: 'Small print on the reverse.', text: '“The awakened Architect shall honor a lower score. The victorious guest chooses the closing instruction.” Delia has initialed the clause.' },
    person: { name: 'Delia Voss', role: 'Guest experience director', opening: '“A friendly game. You’ve come too far to leave without meeting the designer.”', choices: [
      { id: 'delia-invitation', label: 'Who is being invited?', response: '“Robert Trent Jones.” She pronounces each word carefully. “You’ve been helping with the invitations.”' },
      { id: 'delia-turf', label: 'And the ruined grass?', response: '“The ground grows warm when he begins to listen.” She smooths a corner of artificial turf.' }
    ] }
  },
  {
    id: 'a-standing-invitation', location: 5, variant: 23, title: 'A standing invitation', kind: 'finale', target: 18,
    requiresDeduction: 'design', arrival: 'The lake rises. The morning remains beautiful.', reward: 'closing-card',
    after: 'There is still a whole state outside the clubhouse.',
    find: { afterFlags: 1, clue: 'architecture', glimpse: 'A rule older than the stone.', text: 'The brass repeats the closing clause. The Architect must honor a lower score. Beneath it: PLEASE REPLACE DIVOTS.' },
    person: { name: 'Robert Trent Jones', role: 'The Architect', opening: '“I laid out the first coastline. I believe you will find the greens quite fair.”', choices: [
      { id: 'jones-invocation', label: 'They were protesting you.', response: '“They were saying my name.” His smile passes through several faces. “One cannot be fussy about the invitation.”', evidence: 'old-card' },
      { id: 'jones-terms', label: 'If I win?', response: '“Seal. Disclose. Continue as partner.” He hands you a pencil. “But first, the golf.”' }
    ] }
  }
];

export const JOURNEY_EVIDENCE = [
  { id: 'brass-sign', title: 'A folded invoice', kind: 'Found', location: 'silver', body: 'Artificial turf. The quantity is circled. “Why so much? — I.”', detail: 'A routine supplier invoice, folded twice. No address for its owner. The back has a faint pencil impression from another page.' },
  { id: 'welcome-copy', title: 'A delivery slip', kind: 'Found', location: 'capitol', body: 'Five narrow strips. The same supplier. The same sections replaced several times.', detail: 'The groundskeeper says these particular orders go through the office. The dates are a few weeks apart.' },
  { id: 'scorecard', title: 'Ivan’s phone notes', kind: 'Wager won', location: 'capitol', body: 'Roger first blamed bright sunshine. Later he told Ivan about military waste beneath the courses.', detail: 'Ivan: “Doesn’t grass like sun?” Roger: “Are you a horticulturalist?” Ivan offered to have his wife ask one. No test result accompanies either explanation.' },
  { id: 'pcb-note', title: 'Two separate folders', kind: 'Research', location: 'silver', body: 'Army Depot cleanup and industrial PCB pollution are different histories. Neither folder locates waste beneath these greens.', detail: 'Ellis has kept the source records separate. Roger’s statement is the only source for the golf-course claim.' },
  { id: 'depot-record', title: 'The work tickets', kind: 'Wager won', location: 'silver', body: 'The contractor recorded electrical heat damage around brass conductors. No buried drums, no waste removal, no sunlight assessment.', detail: 'The replacement work was booked before Ivan asked his questions. Roger later used recognizable environmental history as an explanation without supporting records.' },
  { id: 'lantern-poster', title: 'An altered poster', kind: 'Found', location: 'cambrian', body: 'A ghost walk. The town name has been pasted over. Part of the original still shows.', detail: 'A dancing ghost and a tree appear in the illustrations. The printer’s address has been covered by a booking sticker.' },
  { id: 'folklore-note', title: 'Stories with addresses', kind: 'Conversation', location: 'cambrian', body: 'Grancer’s Ghost belongs to Kinston folklore. The Boyington Oak belongs to Mobile. Otis recognizes both stories.', detail: 'The poster has moved them to Greenville. Otis is less annoyed about the ghosts than the missing places and storytellers.' },
  { id: 'maintenance-chart', title: 'The warm circuit', kind: 'Found', location: 'magnolia', body: 'Brass conductors run beneath the replacement turf. The controller lists cues, not watering times.', detail: 'Its serial numbers match the contractor’s work tickets. The conductors are warm even though the irrigation supply is off.' },
  { id: 'minutes', title: 'A misfiled transcript', kind: 'Wager won', location: 'capitol', body: 'Helen: “Did he find the invoice?” Roger: “Yes.” Helen: “And he believed the military-waste story?” Roger: “Yes.”', detail: 'Helen: “Just as planned.” Roger says Ivan threatened to contact the media. Helen marks the exchange “Useful escalation.”' },
  { id: 'bond-margin', title: 'A production budget', kind: 'Found', location: 'cambrian', body: 'Projector rental, batteries, printing, coach transport. Charged to the TRS Hospitality Committee.', detail: 'The large transport allocation is for a demonstration. The committee’s accounting codes match the replacement-turf orders.' },
  { id: 'cue-sheet', title: 'The rehearsal sheet', kind: 'Wager won', location: 'cambrian', body: 'LIGHTS. FIGURE. DISCOVERY. DENIAL. OUTRAGE. The cue numbers match the brass controller. Exposure is part of the performance.', detail: 'The next press release is already printed. It condemns the ghost hoax. Its headline, like the original poster, spells out Robert Trent Jones.' },
  { id: 'appointment-book', title: 'Helen’s diary', kind: 'Wager won', location: 'capitol', body: 'Your destinations beside coach reservations. Twelve people. Thirty-six. A hundred and eight. The final column counts voices.', detail: 'Each disclosure is followed by a larger booking at the next course. Every chant sheet uses the same three-word name, regardless of the accusation.' },
  { id: 'overlay', title: 'A tracing sheet', kind: 'Found', location: 'magnolia', body: 'The course circuits join below ground. “108 voices. Full name. Three repetitions. Belief is not required.”', detail: 'The name beside the drawing is Robert Trent Jones. The strips of dead grass follow the conductor routes exactly.' },
  { id: 'local-rule', title: 'The closing clause', kind: 'Found', location: 'magnolia', body: 'The awakened Architect must honor a lower score. The victorious guest chooses how to close the account.', detail: 'A tie renews the account. The closing instructions are SEAL, DISCLOSE, or CONTINUE AS PARTNER. Delia has initialed all three.' },
  { id: 'invitation', title: 'The standing invitation', kind: 'Wager won', location: 'magnolia', body: 'Helen to Roger: “Enough voices, and His Eldritchness shall rise.” Grand National. Robert Trent Jones awaits his guest.', detail: 'Roger has reserved the coaches. Helen has approved the chant. Ivan’s discovery and every disproved explanation were ways to put the same name in more mouths.' },
  { id: 'architecture', title: 'The original rule', kind: 'Found', location: 'national', body: 'A lower score binds the Architect. The lettering is older than the stone around it.', detail: 'Someone added a polite reminder about divots much later. Even an ancient agreement has maintenance requirements.' },
  { id: 'old-card', title: 'An answer from the lake', kind: 'Conversation', location: 'national', body: 'The Architect needed his name spoken together. Angry voices served as well as prayers.', detail: 'His reflection lists five mouths where the scorecard lists five holes. He seems delighted that you have come to play.' },
  { id: 'closing-card', title: 'A signed scorecard', kind: 'Wager won', location: 'national', body: 'The Architect has signed below your lower score. The closing instruction is yours.', detail: 'Whatever you choose, the ordinary roads remain. There are still places you have not visited and courses you have not played.' }
];

export const JOURNEY_DEDUCTIONS = [
  {
    id: 'sponsor', title: 'The replacement turf', prompt: 'Which explanation fits the notes and work tickets?', required: ['scorecard', 'depot-record'],
    options: [ { id: 'reporter', label: 'Military waste was found beneath the greens' }, { id: 'committee', label: 'Roger supplied a cover story for different work' }, { id: 'chance', label: 'Unusually bright sunshine damaged the turf' } ],
    answer: 'committee', explanation: 'The contractor recorded hot conductors. Roger offered two explanations and evidence for neither. The waste story obscures the actual work.'
  },
  {
    id: 'diversion', title: 'The ghost walk', prompt: 'Match the controller with the rehearsal sheet.', required: ['maintenance-chart', 'cue-sheet'],
    options: [ { id: 'waste', label: 'The old contamination caused the sightings' }, { id: 'ghosts', label: 'The same spirit is following visitors' }, { id: 'circuit', label: 'Both the haunting and its exposure were staged' } ],
    answer: 'circuit', explanation: 'The circuit runs a performance. Even discovering the projector has a cue. The next accusation is already waiting to be printed.'
  },
  {
    id: 'design', title: 'The gathering', prompt: 'What do the bookings and the tracing sheet require?', required: ['overlay', 'appointment-book', 'invitation'],
    options: [ { id: 'audit', label: 'Enough complaints to force a financial audit' }, { id: 'summoning', label: 'Enough voices saying the Ancient One’s name' }, { id: 'escape', label: 'Enough publicity to empty the golf courses' } ],
    answer: 'summoning', explanation: 'The accusations change. The name never does. The committee has turned each discovery into another invitation to Robert Trent Jones.'
  }
];
