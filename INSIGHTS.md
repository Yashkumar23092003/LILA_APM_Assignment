# LILA Player Journey: Game Design Insights

## Insight 1: AmbroseValley Dominance Creates Map Imbalance

**Observation:** AmbroseValley accounts for 71.1% of all matches (566 of 796), while Lockdown and GrandRift combined represent only 28.9%. This extreme concentration indicates players are gravitating toward one map at the expense of others.

**Evidence:**
- AmbroseValley: 566 matches (71.1%)
- Lockdown: 171 matches (21.5%)
- GrandRift: 59 matches (7.4%)

**Why a Level Designer Cares:** Map balance is critical for player retention and learning. When one map monopolizes 71% of play, players on less-played maps have smaller matchmaking pools, leading to longer queue times and repeated opponent matchups. This creates a negative feedback loop where Lockdown and GrandRift feel "dead" relative to AmbroseValley, discouraging experimentation.

**Recommendation:** 
1. Analyze what makes AmbroseValley more appealing (loot distribution, sightlines, progression pacing, or aesthetic appeal) and apply those design principles to Lockdown and GrandRift.
2. Run a 2-week A/B test: rotate map availability or offer a daily bonus (cosmetic reward, XP boost) for playing underutilized maps to drive sampling and break the selection bias.

---

## Insight 2: PvP is Completely Absent — Players are Fighting Bots, Not Each Other

**Observation:** In a 50-match human player sample, there were zero PvP kills ("Kill" events) recorded, while bot kills numbered 39. Players encountered bots 39x more often than they encountered other human players in combat. The data shows 744 human-only matches vs. only 36 mixed matches—93.5% of human players never faced other humans.

**Evidence:**
- Bot kills: 39 events (23.5% of all combat interactions)
- PvP kills: 0 events (0% of all combat interactions)
- Human-only matches: 744 (93.5% of all matches)
- Mixed human/bot matches: 36 (4.5% of all matches)
- PvP to bot kill ratio: 0.00x

**Why a Level Designer Cares:** Level design decisions—chokepoint sizing, sightline range, cover distribution, loot clustering—are made with specific threat assumptions. If designers expected PvP encounters but the game is 99% bot combat, the level's risk/reward balance is wrong. Chokepoints designed for human players might bottleneck bot pathfinding awkwardly, or wide-open sightlines designed for tense 1v1 standoffs are wasted on predictable bot movement.

**Recommendation:**
1. Audit your matchmaking algorithm: if humans want 1v1 or small-squad play, the system shouldn't pair them into bot-heavy lobbies. Implement human-preference queues or guarantee minimum human player thresholds.
2. If bots are intentional (training mode), rename or rebrand human-only and mixed matches separately so designers can tune difficulty and layout per play mode. This separates "practice against AI" from "competitive multiplayer" design intent.

---

## Insight 3: Southwest Quadrant of AmbroseValley is a Combat Hotspot — But Design Intent is Unclear

**Observation:** On AmbroseValley, the Southwest quadrant sees a 46.3% concentration of loot events and 47.6% of deaths. This is 2–3x higher than any other quadrant. Both loot and deaths cluster in the same region, suggesting it is a high-traffic, high-risk area—but it's unclear whether this concentration is intentional or emergent from poor navigation mesh or bot pathfinding bugs.

**Evidence:**
- Southwest quadrant: 46.3% of all loot, 47.6% of all deaths
- Northeast quadrant: 14.6% of loot, 4.8% of deaths
- Northwest & Southeast: ~19.5% of loot each, ~19–28% of deaths each
- Loot-to-death correlation: both peak in SW suggests designed "hot zone" or emergent choke point

**Why a Level Designer Cares:** Level design thrives on intentionality. If the SW concentration is deliberate (a high-risk treasure area or mandatory chokepoint), that's excellent pacing data—you're successfully creating hotspots. If it's accidental (bots stacking due to pathfinding, or loot spawn bias), you're wasting level real estate and creating frustrating bottlenecks. The correlation between loot and deaths also implies players are fighting over resources, which could be strategic depth or poor spawn balance.

**Recommendation:**
1. **If intentional:** Document this hot zone in your level design guide; reinforce it with visual landmarks, audio cues, and map callouts so players learn it's a risk/reward location.
2. **If accidental:** Review loot spawn placement (is it biased to SW?) and bot pathfinding (are they clustering at a choke?). Run a spatial heatmap test with 100+ matches to separate human vs. bot behavior in the SW quadrant—if only bots concentrate there, the issue is AI, not level design.
3. **Either way:** Test gameplay with asymmetric loot distribution (more loot in underutilized NE quadrant) to see if it naturally spreads engagement and reduces the death concentration.

---

## Summary for Designers

Your telemetry reveals three structural problems:
1. **Map selection is severely imbalanced.** AmbroseValley overwhelms alternatives.
2. **PvP is functionally absent.** Players are in bot-only lobbies 93.5% of the time, making human-focused level design decisions irrelevant.
3. **Map hotspots are extreme.** The Southwest quadrant of AmbroseValley dominates play, suggesting either emergent design success or an unintended choke point.

All three are solvable with targeted design iteration and playtesting.
