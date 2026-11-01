// Original fiction. Real locations are inspiration; all mystery documents and NPCs are invented.
export const FICTION_NOTE = 'An alternate-universe satire. The courses, Alabama places, and retirement-system investment are real; the cabal, crimes, documents, dialogue, supernatural events, and monstrous Robert Trent Jones are entirely fictional. Roger, Helen, Ivan, and all other supporting characters are invented. These compact courses are original game layouts, not recreations. Unaffiliated with RSA or the Robert Trent Jones Golf Trail.';

export const LOCATIONS = [
  {
    id: 'oxmoor', index: 0, title: 'Oxmoor Valley', region: 'Birmingham',
    tagline: 'Your vacation is fully vested.', par: 20,
    rival: { name: 'Nora Bell', role: 'The starter', score: 23, quote: 'Five holes. Beat my card, and I’ll give you what the accountant left.' },
    intro: 'A complimentary tee time. Perfect weather. Someone has left an alarming invoice under your scorecard.',
    inspect: { title: 'Unfold the invoice', body: 'ASTROTURF REPLACEMENT: $1,108,108. Again. In the margin: “This is a golf course. Why are we buying so much plastic grass? — Ivan”', evidence: 'brass-sign' },
    dialogue: [
      { id: 'nora-crest', label: 'Who is Ivan?', response: '“Accounts. Asked why the grass kept dying. Roger said the sun was unusually bright.” She looks across a perfect green. “Beautiful day, though.”', evidence: 'welcome-copy' },
      { id: 'nora-teacher', label: 'And you believed that?', response: '“I taught science for thirty-one years.” She gives you a pencil. “I believe in showing your work.”', trust: 1 },
      { id: 'nora-wager', label: 'What’s the wager?', response: '“Your signature if I win. Ivan’s notes if you do.” She has already written your name on the next tee sheet.' }
    ],
    reward: 'scorecard',
    winText: 'Ivan’s notes: “Doesn’t grass like sun?” Roger: “Are you a horticulturalist?” Ivan: “My wife could ask one. Shouldn’t cost much.”',
    lead: 'Ivan circled three leads: military waste, a borrowed ghost, and a missing committee record.'
  },
  {
    id: 'silver', index: 1, title: 'Silver Lakes', region: 'Anniston / Gadsden',
    tagline: 'Nothing beneath the surface.', par: 20,
    rival: { name: 'Ellis Vale', role: 'The local reporter', score: 22, quote: 'Beat twenty-two. You can have the file nobody wants to read.' },
    intro: 'The lake is brochure blue. Fresh placards are stacked by the fence: JONES, EXPLAIN THE GREENS. The paint is still wet.',
    inspect: { title: 'Open the maintenance box', body: 'No leak. No water pipes. Five brass wires run beneath the turf. The 11:11 timer has a second label: PUBLIC RESPONSE.', evidence: 'maintenance-chart' },
    dialogue: [
      { id: 'ellis-pollution', label: 'Waste beneath the courses?', response: '“Roger told Ivan the military buried it here. Then Ivan threatened to call us.” Ellis lifts two folders. “Real contamination histories. Neither proves Roger’s very convenient claim.”', evidence: 'pcb-note' },
      { id: 'ellis-help', label: 'Check it before printing.', response: '“You’d be surprised how few people say that.” He crosses out a headline. Outside, a megaphone squeals through a sound check.', trust: 1 },
      { id: 'ellis-date', label: 'Who brought the signs?', response: '“A delivery van beat my article. Every placard spells out Robert Trent Jones. The organizer asked how many times I could fit the name in a headline.”' }
    ],
    reward: 'depot-record',
    winText: 'The contractor’s file shows no waste excavation. The dead turf was cut away from five hot brass conductors. Ellis marks a draft: CORRECTION PENDING.',
    lead: 'The waste story falls apart. A stack of signs is ready for the next version.'
  },
  {
    id: 'capitol', index: 2, title: 'Capitol Hill', region: 'Prattville',
    tagline: 'A sound long-term position.', par: 20,
    rival: { name: 'June Stowe', role: 'The records clerk', score: 21, quote: 'I play every lie as it lies. My former employer had other ideas.' },
    intro: 'June has reserved two chairs and ordered three sweet teas. On the terrace, a protest marshal checks tomorrow’s tee times.',
    inspect: { title: 'Check the meeting notes', body: 'HELEN: “Did he find the invoice?” ROGER: “Yes.” HELEN: “And he believed the military-waste story?” ROGER: “Absolutely.” HELEN: “Just as planned.”', evidence: 'minutes' },
    dialogue: [
      { id: 'june-beneficiary', label: 'Who are Roger and Helen?', response: '“Roger manages accounts. Helen manages Roger.” June slides over a budget. “The teachers get retirement planning. The other committee gets public relations.”', evidence: 'bond-margin' },
      { id: 'june-protect', label: 'I’ll keep your name out.', response: '“Keep the documents in.” She takes a proper breath. “Ivan thought threatening the media would frighten them. They put it in the forecast.”', trust: 1 },
      { id: 'june-pension', label: 'Why provoke a scandal?', response: '“The complaint is free publicity. The correction is a second headline. Look what they count in the last column.” She turns the budget upside down: NAME REPEATS.' }
    ],
    reward: 'appointment-book',
    winText: 'Helen’s appointment book schedules each protest at your next course. Buses, placards, press calls. Under “success”: 12 voices. Then 36. Then 108.',
    lead: 'They never budgeted for public approval. They budgeted for repetition.'
  },
  {
    id: 'cambrian', index: 3, title: 'Cambrian Ridge', region: 'Greenville',
    tagline: 'Where the past plays through.', par: 20,
    rival: { name: 'Otis Reed', role: 'The collector of stories', score: 22, quote: 'I’ll wager the original. A copy can haunt any place you like.' },
    intro: 'A white figure waits in the pines. A hidden speaker rehearses LET JONES REST. Otis keeps playing. “Third performance today.”',
    inspect: { title: 'Read the ghost-tour poster', body: 'A dancing ghost. A grieving tree. Greenville has acquired every haunting in Alabama. Each pasted-on caption blames Robert Trent Jones.', evidence: 'lantern-poster' },
    dialogue: [
      { id: 'otis-ghost', label: 'Whose ghost is that?', response: '“Borrowed. Grancer’s story belongs to Kinston; the Boyington Oak belongs to Mobile. This version keeps changing everything except the man they want you to name.”', evidence: 'folklore-note' },
      { id: 'otis-listen', label: 'Tell me the real story.', response: 'He turns off his sales voice. “People leave stories when they can’t leave monuments. Best not to turn them into somebody else’s advertising.”', trust: 1 },
      { id: 'otis-figure', label: 'Follow the white figure.', response: 'Its dress ends at a projector lens. On the battery: TRS HOSPITALITY. A little speaker whispers a chant. A taped note says REHEARSAL.' }
    ],
    reward: 'cue-sheet',
    winText: 'Otis hands over the cue sheet: LIGHTS. GHOST. DENIAL. OUTRAGE. NEXT COURSE. Somebody has underlined “Use the full name.”',
    lead: 'Expose the ghost, and the scandal becomes a cover-up. The new signs still say his name.'
  },
  {
    id: 'magnolia', index: 4, title: 'Magnolia Grove', region: 'Mobile',
    tagline: 'You’ve come such a long way.', par: 20,
    rival: { name: 'Delia Voss', role: 'Director of guest experience', score: 20, quote: 'A hundred and eight places reserved. Helen does love a full house.' },
    intro: 'Rows of folding chairs face a perfect green. Beneath immaculate artificial turf, something takes a slow, shallow breath.',
    inspect: { title: 'Lift the transparent map', body: 'The brass circuit leads to the roots of every green. Beside it: “108 voices. Full name. Three repetitions. Belief is not required.”', evidence: 'overlay' },
    dialogue: [
      { id: 'delia-rule', label: 'Read the small print.', response: '“A guest who outscores the Architect may close the account. Equal scores renew it.” She smiles. “Even a prophecy must have terms.”', evidence: 'local-rule' },
      { id: 'delia-name', label: 'You wanted the protests.', response: '“Ivan finds an invoice. Roger offers a lie. You uncover a scandal. Helen fills a coach.” She straightens a reserved sign. “Such efficient word of mouth.”' },
      { id: 'delia-witness', label: 'My friends know the trick.', response: 'For the first time, she puts down her drink. “Then I hope they’re very quiet people.”', trust: 1 }
    ],
    reward: 'invitation',
    winText: 'Helen’s final instruction: “At 108 voices, His Eldritchness shall rise.” Delia encloses your Grand National invitation. Complimentary breakfast included.',
    lead: 'The grass wasn’t dying from sunlight. Something beneath it was warming up.'
  },
  {
    id: 'national', index: 5, title: 'Grand National', region: 'Auburn / Opelika',
    tagline: 'A lifetime is only the beginning.', par: 20,
    rival: { name: 'Robert Trent Jones', role: 'The Architect · The Ancient One', score: 18, quote: 'I laid out the first coastline. I believe you will find the greens quite fair.' },
    intro: 'The hundred-and-eighth voice finishes his name. The lake stands upright. A courteous man unfolds from its reflection. Dawn remains a lovely peach.',
    inspect: { title: 'Inspect the first tee', body: 'THE AWAKENED ARCHITECT SHALL HONOR A LOWER SCORE. Below it, in much newer lettering: PLEASE REPLACE DIVOTS.', evidence: 'architecture' },
    dialogue: [
      { id: 'jones-name', label: 'They were protesting you.', response: '“They were saying my name. One cannot be fussy about the invitation.” His smile passes through several faces before finding the familiar one.', evidence: 'old-card' },
      { id: 'jones-cabal', label: 'The teachers’ system woke you.', response: '“Helen kept the books. Roger supplied the explanation. Ivan supplied the indignation. And you made certain the story kept moving.” He offers you the honor.' },
      { id: 'jones-terms', label: 'And if I beat you?', response: '“The closing instruction is yours. Silence. Disclosure. Partnership.” He gestures toward the flags. “Five holes. No preferred lies.”' }
    ],
    reward: 'closing-card',
    winText: 'For one instant, the Architect looks his age. The crowd falls silent. He places a pen beside your winning scorecard. “Your instructions.”',
    lead: 'The account belongs to you for one signature. Decide what survives the morning.'
  }
];

export const EVIDENCE = [
  { id: 'brass-sign', title: 'The astroturf invoice', kind: 'Document', location: 'oxmoor', body: 'Repeated plastic-grass replacements. $1,108,108. Ivan, accounts: “Why does it keep dying?”', detail: 'The expense appears under TRS Hospitality. Each replacement covers exactly five narrow strips. Ivan has circled the quantity three times.' },
  { id: 'welcome-copy', title: 'Unusually bright sunshine', kind: 'Testimony', location: 'oxmoor', body: 'Roger told Ivan that unusually bright sunshine was burning the grass. The replacement invoice specifies artificial turf.', detail: 'When Ivan questioned him, Roger asked whether he was a horticulturalist. Ivan offered to have his wife ask one. Roger changed the subject.' },
  { id: 'scorecard', title: 'Ivan’s phone notes', kind: 'Wager won', location: 'oxmoor', body: 'Roger’s explanation changes: sunshine first, buried military waste next. Ivan writes: “If this is true, I’m calling the media.”', detail: 'Roger claimed military waste beneath the courses was leaking and killing the grass. He offered no survey or test result. Three destination names are written in a different hand.' },
  { id: 'maintenance-chart', title: 'The 11:11 circuit', kind: 'Observation', location: 'silver', body: 'Hot brass wires run beneath the turf. No plumbing. The controller is labeled PUBLIC RESPONSE, with numbered cues.', detail: 'The circuit pulses when a recorded chant plays. A service note orders artificial turf over each scorched strip and charges replacement to “guest experience.”' },
  { id: 'pcb-note', title: 'Two different histories', kind: 'Research', location: 'silver', body: 'Army Depot contamination and Anniston’s industrial PCB pollution are separate histories. Neither file supports Roger’s claim about these greens.', detail: 'Ellis keeps the original records apart. The depot’s cleanup and the factory’s pollution are documented; Roger’s buried-waste story has only Roger as its source.' },
  { id: 'depot-record', title: 'No excavation, no proof', kind: 'Wager won', location: 'silver', body: 'The turf contractor found hot brass conductors, not buried drums. The protest coach was booked before Ellis received Ivan’s tip.', detail: 'A source note records completion of Anniston’s chemical-stockpile destruction in 2011. Roger borrowed the recognizable history and supplied an unsupported new location.' },
  { id: 'minutes', title: '“Just as planned.”', kind: 'Document', location: 'capitol', body: 'Helen asks whether Ivan found the invoice and believed Roger’s waste story. Both answers are yes. She approves the media call.', detail: 'Roger adds that Ivan first questioned the sunshine explanation. Helen has written “Useful escalation” beside his threat to contact the press.' },
  { id: 'bond-margin', title: 'The other department', kind: 'Document', location: 'capitol', body: 'The TRS committee budgets for protest buses, signs, and press calls. Its final column counts NAME REPEATS.', detail: 'Roger reports to Helen. Ordinary retirement administration occupies the first hundred pages. The hospitality appendix has a different seal: an eye under five blades of grass.' },
  { id: 'appointment-book', title: 'A timetable for outrage', kind: 'Wager won', location: 'capitol', body: 'Each new disclosure sends protesters to your next course. Helen’s targets: 12 voices. Then 36. Then 108.', detail: 'Every planned correction has a second press release attached. The charges change; “Robert Trent Jones” remains in every headline, placard, and chant.' },
  { id: 'lantern-poster', title: 'A portable haunting', kind: 'Observation', location: 'cambrian', body: 'Pasted labels move unrelated Alabama ghosts to Greenville. Every new version blames Robert Trent Jones.', detail: 'The brochure connects military waste, disturbed graves, and dead turf without evidence. All three stories end with the same printed demand: SAY HIS NAME.' },
  { id: 'folklore-note', title: 'Give a story its place', kind: 'Research', location: 'cambrian', body: 'Grancer’s Ghost belongs to Kinston folklore. The Boyington Oak belongs to Mobile. The resort has moved both stories.', detail: 'Otis identifies the borrowed traditions. The white figure in the pines is a projection, timed to start before each demonstration.' },
  { id: 'cue-sheet', title: 'The outrage script', kind: 'Wager won', location: 'cambrian', body: 'LIGHTS. GHOST. DENIAL. OUTRAGE. NEXT COURSE. Same circuit numbers as Silver Lakes. “Use the full name.”', detail: 'The ghost is staged, and its exposure is anticipated. The next headline is already printed: JONES GHOST HOAX EXPOSED. Beneath it, a marshal has practiced the crowd’s rhythm.' },
  { id: 'overlay', title: 'Belief is not required', kind: 'Observation', location: 'magnolia', body: '108 voices. Full name. Three repetitions. Brass conductors carry the chant beneath the greens. Belief is not required.', detail: 'The course network is a resonator. Heated conductors scorch the turf; replacement grass hides them. The protesters’ anger makes no difference. Only the spoken name matters.' },
  { id: 'local-rule', title: 'The closing clause', kind: 'Document', location: 'magnolia', body: 'A lower score closes the Architect’s account. A tie renews it. The winning guest chooses the closing instruction.', detail: 'Three instructions appear: SEAL, DISCLOSE, or CONTINUE AS PARTNER. The clause requires the awakened Architect to accept a challenge from the guest who followed the trail.' },
  { id: 'invitation', title: 'Helen’s last message', kind: 'Wager won', location: 'magnolia', body: '“At 108 voices, His Eldritchness shall rise.” Attached: your Grand National tee time and a breakfast voucher.', detail: 'Roger has reserved the coaches. Helen has written the final chant. Ivan’s discovery, every disproved story, and each planned protest are steps toward the same awakening.' },
  { id: 'architecture', title: 'The first rule', kind: 'Observation', location: 'national', body: 'The awakened Architect must honor a lower score. Even the committee cannot amend the rule.', detail: 'The brass is older than the stone around it. Someone added a polite reminder about divots centuries later.' },
  { id: 'old-card', title: 'An invitation is a name', kind: 'Testimony', location: 'national', body: 'Jones confirms that hostile chants work as well as prayers. He needed enough people to say his name together.', detail: 'The man from the lake claims to predate the coast itself. His dry scorecard lists five holes. Its reflection lists five mouths.' },
  { id: 'closing-card', title: 'The lower score', kind: 'Wager won', location: 'national', body: 'Five flags. One honest score. The Architect has signed below yours. You hold the closing instruction.', detail: 'Helen predicted the outrage, Roger engineered the leaks, and Ivan took the bait. None of their paperwork accounted for your short game.' }
];

export const DEDUCTIONS = [
  {
    id: 'sponsor', title: 'Why did Ivan find the invoice?', prompt: 'Compare Roger’s story with Helen’s notes.', required: ['scorecard', 'minutes'],
    options: [ { id: 'reporter', label: 'Ivan caught an accidental waste leak' }, { id: 'committee', label: 'Helen planted a story for Ivan to expose' }, { id: 'chance', label: 'The sunshine ruined the accounts' } ],
    answer: 'committee', explanation: 'Sunshine first. Military waste next. Helen wanted Ivan frightened enough to call the media. His discovery was part of the plan.'
  },
  {
    id: 'diversion', title: 'Who is haunting the courses?', prompt: 'Match the circuit to the cue sheet.', required: ['maintenance-chart', 'cue-sheet'],
    options: [ { id: 'waste', label: 'Military waste woke an old ghost' }, { id: 'ghosts', label: 'One spirit follows the protesters' }, { id: 'circuit', label: 'The committee is staging the haunting' } ],
    answer: 'circuit', explanation: 'The ghost, its exposure, and tomorrow’s outrage are all scheduled. Each new accusation sends more people to the next course, repeating the same name.'
  },
  {
    id: 'design', title: 'What do the protests accomplish?', prompt: 'Read the crowd counts beside the prophecy.', required: ['overlay', 'appointment-book', 'invitation'],
    options: [ { id: 'audit', label: 'Force an audit of pension investments' }, { id: 'summoning', label: 'Say the Ancient One’s name enough times' }, { id: 'escape', label: 'Drive every golfer off the Trail' } ],
    answer: 'summoning', explanation: '108 voices. Three repetitions. The crowds were never supposed to believe in him. They only had to say Robert Trent Jones.'
  }
];

export const PROTESTS = [
  { count: 12, chant: 'JONES! TELL THE TRUTH!', headline: 'Questions on the green', line: 'One minibus. Twelve matching signs. Someone counts the voices.' },
  { count: 36, chant: 'ROBERT! TRENT! JONES!', headline: 'A very organized outrage', line: 'Three coaches. Fresh accusations. The name stays the same.' },
  { count: 108, chant: 'ROBERT. TRENT. JONES.', headline: 'A perfect turnout', line: 'A hundred and eight voices. Three repetitions. The grass begins to move.' }
];

export const ENDINGS = {
  seal: { title: 'A quiet retirement', kicker: 'The account is closed.', body: 'You write SEAL. The crowd forgets its next word. Across Alabama, the brass wires go cold. Ivan’s replacement-turf budget falls to zero. Nora sends a postcard: Lovely playing with you. The pensions arrive on time. Nobody mentions how quiet the golf has become.' },
  expose: { title: 'Public record', kicker: 'The witnesses sign below you.', body: 'You write DISCLOSE. Ellis publishes the documents. June names Helen and Roger. Otis tells the crowd how the trick worked, and the chanting stops. Ivan calls his wife: the grass was not sunburned. Bound by his losing score, the Architect returns to the lake. The golf is still excellent.' },
  accept: { title: 'An excellent benefits package', kicker: 'Welcome to the committee.', body: 'You write CONTINUE AS PARTNER. Helen leaves your new office keys on the desk. Roger has prepared an invoice. Outside, a vacationer asks why the retirement-system signs are everywhere. You offer them a friendly wager. From beneath the green comes the sound of applause.' }
};

export const SOURCES = [
  { title: 'Retirement Systems of Alabama · About RSA', url: 'https://www.rsa-al.gov/about-rsa/', note: 'RSA serves public retirement systems, including the Teachers’ Retirement System. The hospitality cabal, Helen, Roger, and Ivan are invented.' },
  { title: 'RSA · June 2025 board training', url: 'https://www.rsa-al.gov/uploads/files/Comprehensive_RSA_Presentation_6-2025.pdf', note: 'RSA’s own presentation describes the Golf Trail as part of its investment portfolio. This is the real premise behind the fiction.' },
  { title: 'Robert Trent Jones Golf Trail · Grand National', url: 'https://rtjgolf.com/grandnational/', note: 'Official course location and landscape background. Game courses use original compact layouts; the astroturf invoices and buried circuits are fictional.' },
  { title: 'EPA · Anniston Army Depot cleanup', url: 'https://cumulis.epa.gov/supercpad/SiteProfiles/index.cfm?fuseaction=second.cleanup&id=0400443', note: 'Documents contamination and cleanup at the Army Depot. Roger’s claim that military waste lies beneath the golf courses is an invented cover story, not a factual allegation.' },
  { title: 'EPA · Anniston PCB site', url: 'https://www.epa.gov/superfund-redevelopment/superfund-sites-reuse-alabama', note: 'Describes the separate industrial PCB contamination history. The game deliberately distinguishes it from Army Depot operations.' },
  { title: 'U.S. Army · Anniston stockpile destruction', url: 'https://asc.army.mil/web/army-completes-chemical-stockpile-destruction-at-anniston/', note: 'Records completion of Anniston chemical-stockpile destruction in 2011. No real connection to the fictional conspiracy is claimed.' },
  { title: 'Alabama Folklife Association · Legends & Lore', url: 'https://www.alabamafolklife.org/legends-lore', note: 'Documents traditions including the Boyington Oak in Mobile and Grancer’s Ghost in Kinston. The relocated stories, projected ghost, and protests are fictional.' }
];
