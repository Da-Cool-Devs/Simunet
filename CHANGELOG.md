# Changelog

## Hackathon polish

### Gameplay
- **Budget and economy:** start with $8,000. Racks ($1,000–$1,800) and hardware ($300–$2,500) cost money, and selling a part refunds half. Customers pay revenue every second while the site is up. Power (including cooling), the UPS and the firewall have running costs.
- **Score:** points from missions, incidents handled, peak customers and revenue, scaled by uptime. Shown live next to the budget.
- **Shift report:** "End shift & get report" opens a report card with a letter grade (A–F), six stats, and personalised tips based on what went wrong in your game. Best score is saved in the browser, and "Copy result" gives you a shareable summary.
- **Quick start:** one click builds a starter rack, installs five servers, turns on cooling and deploys, so a new player sees the action in seconds.
- **Next-step coach:** a bar above the simulator always says what to do next (the next mission, or a warning about debt, downtime or overheating).
- **GPU rule enforced:** GPU accelerators now really need a GPU-ready rack, as the UI always claimed.
- Parts show their price, and turn red when you can't afford them.

### 3D server room
- **Bug fix:** a light was accidentally added in a way that moved the *entire* 3D world (`scene.add(light).position.set(...)` moves the scene, not the light). The camera ended up inside a wall, which showed up as a giant black slab. The room now renders correctly.
- Better default camera angle, and Reset View works properly.
- **Reacts to the simulation:** orange glow when servers run hot, pulsing red alarm when overheating, a green or red flash on each incident, darkened lights during an outage, and an "ALERT" tag on the room display. Reduced-motion mode gets the same cues without pulsing.

### Learning
- **Journey knowledge check:** three questions at the end of the Cloud Journey, with an explanation for every answer.
- **Manual:** new "Money in, money out" and "How your shift is graded" sections.
- Home page copy updated for the budget, grading and quiz.

### Presentation
- **README rewritten for judges:** pitch, a 60-second demo script, a feature tour with five real screenshots (`docs/screenshots/`), the incident/defense table, tech stack, project layout, and how to run it locally.

## Site revamp: organization and layout

### Navigation and structure
- **New compact header on every page:** a SimuNet logo that links home, plus Journey, Camera Lab, Manual, an "Aa" accessibility shortcut, and an "Open Simulator" button. It replaces the large repeated "Cloud Computing Simulator" banner and stays visible while scrolling.
- **Mobile menu:** a Menu button on phones opens the navigation. It closes with Escape or by tapping outside.
- **New footer on every page,** grouped into Learn (Journey, Camera Lab, Manual), Build (Simulator, Incidents guide) and SimuNet (About, Accessibility, GitHub).
- About moved from the top navigation to the footer, so the header focuses on the main activities.
- A "Skip to content" link for keyboard users. Each page now has exactly one main heading (h1) for screen readers and search engines.

### Home page (rebuilt)
- New hero, "Build the cloud. Keep it running.", with clear buttons for the simulator and the journey, plus an animated server-rack illustration.
- **Learning path:** four numbered steps (Cloud Journey, Manual, Simulator, Camera Lab), each with an estimated time.
- "What you will practice" section (Build, Operate, Defend).
- Privacy note with a link to accessibility settings.

### Simulator
- New page title bar, "Cloud Operations Center". The system status badge moved here from the header.
- The "How to build" guide can be collapsed to save space.

### Manual
- "On this page" index linking to each section.
- New **Incidents** section: a table of each incident, what happens, and how to prevent it.
- Updated the switch and metric descriptions to match the live simulation (temperature, power draw, health), and added a fifth build step, "Keep it running".
- Sections reordered: build, hardware, controls & metrics, incidents, camera lab.

## Unreleased — Live operations update

### New in the Simulator
- **Live Operations panel (Step 4 / Operate):** once the website is deployed, the simulation runs in real time (every 2 seconds), showing health, uptime %, incidents handled, and time since the last backup. Includes a Pause/Resume button.
- **Random incidents** that test your setup, each with a clear "what happened and how to fix it" message:
  - Power outage: the UPS keeps you online; without one the site goes down.
  - Traffic flood (DDoS): the firewall blocks it, and a load balancer absorbs the rest.
  - Password attack: an Auth server locks accounts, and the firewall blocks the attacker.
  - Disk failure: a recent backup restores the data; an old or missing backup means data loss.
  - Viral traffic spike: a surge of new customers that tests your capacity.
- **Practice drills:** trigger any incident on demand to see how your setup copes.
- **Firewall toggle** next to Cooling and UPS.
- **Cooling and UPS now matter.** Temperature rises with your hardware load, and without cooling servers overheat and lose health. The UPS protects you during power outages.
- **Temperature and Power Draw meters.** Power draw (kW) includes cooling and the rack overhead penalty, with warning colors when things get risky.
- **Realistic capacity and CPU.** Customers grow over time. CPU reflects real load against capacity, which comes from web servers and is boosted by databases and load balancers. At capacity, growth stops; sudden surges cause damage.
- **Health and crashes.** Incidents, overheating, and overload reduce health. At 0% the service crashes and must be redeployed.
- **Auto-offline:** removing required servers takes a live site offline (previously it stayed "online").
- **Operator Missions:** 8 goals, from "Build a rack" to "Scale up to 5,000 customers", that tick off automatically with a progress counter.
- **Color-coded Operations Log:** green for successes, orange for warnings, red for failures. Repeated capacity warnings appear only once.
- "Keep it running" step added to the How to Build guide.

### Journey
- The firewall attacker/defender exercise is now part of the lesson's own markup and `journey.js`, and completes the step through the normal flow.

### Site-wide
- New SVG favicon (fixes a 404 on every page).
- Open Graph tags on every page for nicer link previews.
- `accessibility.js` no longer breaks the site when browser storage is blocked (e.g. some private-browsing modes).

### Cleanup
- Moved simulator and journey code, plus layout CSS, out of `js/accessibility.js` into `script.js`, `journey.js`, and `style.css`, where it belongs. `accessibility.js` now only handles accessibility settings.
- Simulator dashboard layout: metrics in an even 3×2 grid, and the Deployment Console and Live Operations side by side, with no orphaned cards.
- Removed the stray `script.js.tmp` file.
