# Changelog

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
