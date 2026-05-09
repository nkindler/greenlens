import bcrypt from "bcryptjs";
import { getDb } from "./db";
import { findUserByEmail } from "./auth";

const DEMO_EMAIL = "demo@deckranker.io";
const DEMO_PASSWORD = "demo";

type Decision = "looking" | "invested" | "passed";
type Outcome = "unknown" | "succeeded" | "failed";

type SeedDeck = {
  company_name: string;
  technology_type: string;
  location: string;
  investment_size: string;
  stage: string;
  founder_profile: string;
  geography: string;
  overall_score: number;
  recommendation: string;
  decision: Decision;
  outcome: Outcome;
  decision_notes?: string;
  outcome_evidence?: string;
  daysAgo: number;
  scores: Record<string, { score: number; rationale: string }>;
  key_strengths: string[];
  key_risks: string[];
  investment_memo: string;
  questions_for_management: string[];
};

const SEED_DECKS: SeedDeck[] = [
  // Pattern: Demo invested in 2 long-duration storage; one big win, one fail.
  {
    company_name: "Helion Grid",
    technology_type: "Battery Storage",
    location: "Texas, USA",
    investment_size: "$8M Series A",
    stage: "Series A",
    founder_profile: "Repeat",
    geography: "North America",
    overall_score: 8.4,
    recommendation: "STRONG PASS",
    decision: "invested",
    outcome: "succeeded",
    decision_notes:
      "Repeat founder, ERCOT contracts already in hand. Sized up.",
    outcome_evidence:
      "Series B led by Khosla at $180M post in Q3. Now profitable on operating margin.",
    daysAgo: 320,
    scores: {
      technology_readiness: { score: 9, rationale: "TRL 8, four sites operating, no novel chemistry risk." },
      financial_viability: { score: 8, rationale: "Tolling agreements lock 70% of revenue. IRR ~22% modeled." },
      carbon_impact: { score: 7, rationale: "Direct grid displacement of peakers; ~85k tCO2/yr per site." },
      regulatory_risk: { score: 9, rationale: "ERCOT does not require federal interconnection; permits in hand." },
      market_timing: { score: 9, rationale: "AI datacenter load growth makes peaker displacement urgent." },
      scalability: { score: 8, rationale: "Standardized 200MWh blocks; 14 sites in pipeline." },
    },
    key_strengths: [
      "Repeat founder previously exited a grid-services company",
      "Locked tolling agreements with two utilities",
      "TRL 8 — operating revenue, not pre-revenue",
    ],
    key_risks: [
      "Lithium supply contracts not finalized past 2027",
      "ERCOT-only exposure",
      "Insurance costs trending up sharply",
    ],
    investment_memo:
      "Helion Grid offers tolling-agreement-secured battery storage in ERCOT. The combination of repeat founder, contracted revenue, and AI-driven load growth makes this a high-conviction Series A. Primary risk is concentration in a single ISO; mitigated by the contracted revenue floor.",
    questions_for_management: [
      "What's your hedge against ERCOT-only exposure beyond 2026?",
      "How do tolling rates reset if natural gas prices fall 30%?",
      "What's the bench depth past the founding two?",
    ],
  },
  {
    company_name: "DeepCycle Energy",
    technology_type: "Battery Storage",
    location: "Nevada, USA",
    investment_size: "$12M Series A",
    stage: "Series A",
    founder_profile: "Technical",
    geography: "North America",
    overall_score: 7.6,
    recommendation: "PASS",
    decision: "invested",
    outcome: "failed",
    decision_notes:
      "Strong tech, novel iron-flow chemistry. Bet on technical edge.",
    outcome_evidence:
      "Wound down Q1 — couldn't scale stack manufacturing. Iron-flow stack costs stayed 2.3x lithium.",
    daysAgo: 540,
    scores: {
      technology_readiness: { score: 6, rationale: "TRL 6. One pilot site, 8MWh." },
      financial_viability: { score: 6, rationale: "Cost curve depends on stack manufacturing scaling." },
      carbon_impact: { score: 9, rationale: "Iron-flow eliminates lithium supply chain risk." },
      regulatory_risk: { score: 8, rationale: "No novel siting approvals required." },
      market_timing: { score: 8, rationale: "Long-duration storage RFPs accelerating." },
      scalability: { score: 7, rationale: "Modular stack design, but manufacturing untested at scale." },
    },
    key_strengths: [
      "PhD founders with deep electrochemistry background",
      "Iron-flow avoids lithium dependency",
      "Long-duration economics improve with scale",
    ],
    key_risks: [
      "TRL 6 — manufacturing scale-up unproven",
      "Stack cost curve depends on volume that doesn't exist yet",
      "Two-year head start vs ESS Inc. and Form Energy",
    ],
    investment_memo:
      "DeepCycle is a high-tech bet on iron-flow long-duration storage. Founders are credible electrochemists. Risk is entirely in manufacturing scale-up — iron-flow has been promising for a decade without a winner.",
    questions_for_management: [
      "What's your stack cost trajectory at 100MWh/yr vs 1GWh/yr?",
      "How are you differentiated from ESS and Form Energy?",
      "What's your runway if stack costs stay above lithium parity?",
    ],
  },
  // Pattern: Demo invested heavily in solar; mixed outcomes.
  {
    company_name: "Sunpath Distributed",
    technology_type: "Solar PV",
    location: "California, USA",
    investment_size: "$5M Seed",
    stage: "Seed",
    founder_profile: "Co-founders",
    geography: "North America",
    overall_score: 7.8,
    recommendation: "PASS",
    decision: "invested",
    outcome: "succeeded",
    decision_notes: "Distribution-focused, strong unit economics on rooftop financing.",
    outcome_evidence: "Series A from Energy Impact Partners at $40M post.",
    daysAgo: 220,
    scores: {
      technology_readiness: { score: 9, rationale: "Standard residential rooftop, no tech risk." },
      financial_viability: { score: 8, rationale: "Customer acquisition cost dropping; LTV/CAC at 3.4." },
      carbon_impact: { score: 7, rationale: "Per-customer offset is meaningful but bounded." },
      regulatory_risk: { score: 6, rationale: "Net metering policy risk in three of their states." },
      market_timing: { score: 8, rationale: "IRA tax credits driving adoption." },
      scalability: { score: 8, rationale: "Channel partners replicate the playbook in new states." },
    },
    key_strengths: [
      "LTV/CAC of 3.4 with declining CAC trend",
      "Channel partner playbook proven in three states",
      "IRA tailwinds extend through 2032",
    ],
    key_risks: [
      "Net metering rule changes in CA, NV",
      "Interest rate sensitivity on customer financing",
      "Commodity exposure on panel pricing",
    ],
    investment_memo:
      "Sunpath is a distribution-led residential solar play. Tech risk is zero; the bet is on channel partner economics. Strong unit economics and IRA tailwinds support a Series A trajectory within 18 months.",
    questions_for_management: [
      "What happens to CAC if NV repeals NEM 3.0?",
      "What's your customer financing cost of capital?",
      "How quickly can you onboard a new channel partner?",
    ],
  },
  // Pattern: Repeated passes on Solar PV that succeeded. The big BLINDSPOT.
  {
    company_name: "Meridian Solar Fields",
    technology_type: "Solar PV",
    location: "Arizona, USA",
    investment_size: "$15M Series A",
    stage: "Series A",
    founder_profile: "Solo",
    geography: "North America",
    overall_score: 8.1,
    recommendation: "STRONG PASS",
    decision: "passed",
    outcome: "succeeded",
    decision_notes: "Solo founder felt risky given $15M check size.",
    outcome_evidence: "Series B at $220M post. PPA contracts hit $40M ARR.",
    daysAgo: 410,
    scores: {
      technology_readiness: { score: 9, rationale: "Utility-scale, mature tech." },
      financial_viability: { score: 9, rationale: "PPA-secured revenue, IRR 18%." },
      carbon_impact: { score: 8, rationale: "240MW displaces ~340k tCO2/yr." },
      regulatory_risk: { score: 7, rationale: "Federal land permitting cleared." },
      market_timing: { score: 8, rationale: "Hyperscaler PPA demand at all-time high." },
      scalability: { score: 8, rationale: "Two more sites permitted; capital-intensive." },
    },
    key_strengths: [
      "PPA-locked revenue with three hyperscalers",
      "Federal land permitting cleared",
      "Founder previously ran 800MW of solar at NextEra",
    ],
    key_risks: [
      "Solo founder, no operating partner",
      "Capital intensity requires consistent project finance",
      "Interconnection queue delays widespread in West",
    ],
    investment_memo:
      "Meridian is a utility-scale solar developer with PPA-locked revenue and a credible solo founder. The check size and solo-founder profile create operational risk — but unit economics are exceptional.",
    questions_for_management: [
      "Who is the #2 hire?",
      "What's your interconnection queue strategy?",
      "How do you finance the next two sites without dilution?",
    ],
  },
  {
    company_name: "BrightAxis",
    technology_type: "Solar PV",
    location: "Spain",
    investment_size: "$6M Seed",
    stage: "Seed",
    founder_profile: "Solo",
    geography: "Europe",
    overall_score: 7.9,
    recommendation: "PASS",
    decision: "passed",
    outcome: "succeeded",
    decision_notes: "Solo founder, EU-only — felt narrow.",
    outcome_evidence: "Acquired by Iberdrola for $90M.",
    daysAgo: 360,
    scores: {
      technology_readiness: { score: 9, rationale: "Tracker mounts, off-the-shelf." },
      financial_viability: { score: 7, rationale: "Margins thin but volume real." },
      carbon_impact: { score: 8, rationale: "Pan-European deployment scale." },
      regulatory_risk: { score: 7, rationale: "EU Green Deal alignment." },
      market_timing: { score: 8, rationale: "EU energy independence post-Ukraine." },
      scalability: { score: 8, rationale: "Iberian build pipeline > 600MW." },
    },
    key_strengths: [
      "EU Green Deal aligned",
      "Iberian construction pipeline locked",
      "Founder ex-Acciona",
    ],
    key_risks: [
      "Solo founder",
      "Margin compression in commodity tracker market",
      "FX exposure",
    ],
    investment_memo:
      "BrightAxis builds utility-scale solar across Iberia. Founder credibility and policy tailwinds are excellent. Solo founder structure and commodity-tracker exposure are the friction points.",
    questions_for_management: [
      "Hiring plan for an operating partner?",
      "Differentiation vs Statkraft and EDP Renováveis?",
      "FX hedging strategy?",
    ],
  },
  // Pattern: Demo invests in green hydrogen — losses
  {
    company_name: "AzureH2",
    technology_type: "Green Hydrogen",
    location: "Germany",
    investment_size: "$20M Series B",
    stage: "Series B",
    founder_profile: "Repeat",
    geography: "Europe",
    overall_score: 7.4,
    recommendation: "PASS",
    decision: "invested",
    outcome: "failed",
    decision_notes: "Repeat founder, EU funding committed. Followed-on big.",
    outcome_evidence: "Down round Q2; primary off-taker walked. Distressed sale to Linde.",
    daysAgo: 480,
    scores: {
      technology_readiness: { score: 7, rationale: "Alkaline electrolyzer, TRL 7-8." },
      financial_viability: { score: 6, rationale: "Off-taker contract NDA, but LCOH ~$5/kg." },
      carbon_impact: { score: 9, rationale: "Direct steel decarbonization." },
      regulatory_risk: { score: 7, rationale: "EU Hydrogen Bank backstop." },
      market_timing: { score: 7, rationale: "Steel mandate timeline aggressive." },
      scalability: { score: 8, rationale: "Modular 100MW stacks." },
    },
    key_strengths: [
      "EU Hydrogen Bank pricing support",
      "Repeat founder with electrolysis background",
      "Direct steel offtake LOI",
    ],
    key_risks: [
      "LCOH still $1.50/kg above viability threshold",
      "Off-taker depends on steel sector capex cycle",
      "Power purchase economics uncertain past 2026",
    ],
    investment_memo:
      "AzureH2 builds electrolyzer-based green hydrogen for industrial steel offtake. EU policy support is real, but LCOH is not yet at parity with grey hydrogen — $5/kg vs $3.50/kg target.",
    questions_for_management: [
      "What's your LCOH trajectory by 2027?",
      "How locked-in is the off-taker LOI?",
      "What's your power cost strategy?",
    ],
  },
  {
    company_name: "HydroForge",
    technology_type: "Green Hydrogen",
    location: "Norway",
    investment_size: "$18M Series A",
    stage: "Series A",
    founder_profile: "Technical",
    geography: "Europe",
    overall_score: 7.2,
    recommendation: "CONDITIONAL",
    decision: "invested",
    outcome: "failed",
    decision_notes: "Hydropower-coupled — looked like power-cost moat.",
    outcome_evidence: "Lost Equinor offtake in late-stage negotiation. Cash burn outpaced bridge.",
    daysAgo: 280,
    scores: {
      technology_readiness: { score: 7, rationale: "PEM electrolyzer, validated stack." },
      financial_viability: { score: 5, rationale: "Power-cost-coupled — exposed if hydro spot drops." },
      carbon_impact: { score: 9, rationale: "100% renewable input." },
      regulatory_risk: { score: 7, rationale: "Norwegian energy export rules pending." },
      market_timing: { score: 8, rationale: "European steel offtake demand." },
      scalability: { score: 7, rationale: "Limited by hydropower siting." },
    },
    key_strengths: [
      "Hydropower-coupled — lowest possible power cost in EU",
      "Equinor offtake LOI",
      "Pre-permitted site",
    ],
    key_risks: [
      "Norwegian export rules could change",
      "Single-customer concentration risk",
      "Hydropower availability decline trend",
    ],
    investment_memo:
      "HydroForge couples PEM electrolysis with Norwegian hydropower for low-cost green H2 export. Power cost is the moat, but it's also the single point of failure. Single offtake creates concentration risk.",
    questions_for_management: [
      "What's your second-customer pipeline?",
      "How exposed are you to hydropower spot pricing?",
      "Norwegian export rule contingency plan?",
    ],
  },
  // Pattern: Looking-at-this stuck deals (decision lag)
  {
    company_name: "VortexWind",
    technology_type: "Offshore Wind",
    location: "Massachusetts, USA",
    investment_size: "$25M Series B",
    stage: "Series B",
    founder_profile: "Repeat",
    geography: "North America",
    overall_score: 8.0,
    recommendation: "STRONG PASS",
    decision: "looking",
    outcome: "unknown",
    decision_notes: "Need partner sign-off on check size. Pending.",
    daysAgo: 38,
    scores: {
      technology_readiness: { score: 8, rationale: "Floating platform, TRL 8." },
      financial_viability: { score: 8, rationale: "PPA pricing locked at $78/MWh." },
      carbon_impact: { score: 9, rationale: "800MW displaces gas baseload." },
      regulatory_risk: { score: 6, rationale: "Federal offshore wind permitting in flux." },
      market_timing: { score: 8, rationale: "BOEM lease auctions accelerating." },
      scalability: { score: 8, rationale: "Floating tech opens deeper sites." },
    },
    key_strengths: [
      "BOEM lease secured",
      "PPA price locked at $78/MWh",
      "Founder previously built Vineyard Wind 1",
    ],
    key_risks: [
      "Federal permitting policy risk",
      "Steel and tower supply chain bottlenecks",
      "Offshore install vessel availability",
    ],
    investment_memo:
      "VortexWind is offshore wind with a floating platform unlocking deeper New England sites. PPA pricing is excellent and the founder is exceptionally credible. Federal policy uncertainty is the binary risk.",
    questions_for_management: [
      "What's your install vessel contract?",
      "How would a federal permit pause affect your cash plan?",
      "Steel and tower supply contingency?",
    ],
  },
  {
    company_name: "Stratos Carbon",
    technology_type: "Direct Air Capture",
    location: "Iceland",
    investment_size: "$10M Seed",
    stage: "Seed",
    founder_profile: "Technical",
    geography: "Europe",
    overall_score: 7.3,
    recommendation: "CONDITIONAL",
    decision: "looking",
    outcome: "unknown",
    decision_notes: "Waiting on Climeworks compare-and-contrast diligence.",
    daysAgo: 31,
    scores: {
      technology_readiness: { score: 5, rationale: "TRL 5, lab pilot only." },
      financial_viability: { score: 5, rationale: "Cost per ton ~$600. Needs to hit $200." },
      carbon_impact: { score: 10, rationale: "Permanent geological storage." },
      regulatory_risk: { score: 8, rationale: "Iceland subsurface storage approved." },
      market_timing: { score: 8, rationale: "Microsoft and Frontier offtake demand strong." },
      scalability: { score: 6, rationale: "Sorbent regeneration unproven at scale." },
    },
    key_strengths: [
      "Permanent storage in Icelandic basalt",
      "Microsoft and Frontier LOIs",
      "PhD-led team from CalTech",
    ],
    key_risks: [
      "Cost-per-ton trajectory unproven",
      "Capital-intensive build-out",
      "Sorbent regeneration scaling unknown",
    ],
    investment_memo:
      "Stratos Carbon is a direct air capture play coupled with Iceland's basalt storage. Tech risk is real — TRL 5 — but offtake demand and policy support are exceptional. Bet is on cost trajectory.",
    questions_for_management: [
      "Cost-per-ton at TRL 7?",
      "What's your sorbent partner agreement?",
      "Pre-purchase commitments beyond Frontier?",
    ],
  },
  // Pattern: Strong-score passes — thesis drift
  {
    company_name: "FluxFusion",
    technology_type: "Geothermal",
    location: "Idaho, USA",
    investment_size: "$8M Series A",
    stage: "Series A",
    founder_profile: "Co-founders",
    geography: "North America",
    overall_score: 7.6,
    recommendation: "PASS",
    decision: "passed",
    outcome: "unknown",
    decision_notes: "Geothermal is outside our thesis right now.",
    daysAgo: 95,
    scores: {
      technology_readiness: { score: 7, rationale: "EGS, two pilot wells producing." },
      financial_viability: { score: 7, rationale: "Power costs competitive in West." },
      carbon_impact: { score: 9, rationale: "Baseload renewable." },
      regulatory_risk: { score: 7, rationale: "Subsurface rights cleared." },
      market_timing: { score: 8, rationale: "DOE support increasing." },
      scalability: { score: 7, rationale: "Drilling cost curve is the lever." },
    },
    key_strengths: [
      "Two producing pilot wells",
      "DOE support and federal cost-share",
      "Drilling team ex-oil-and-gas",
    ],
    key_risks: [
      "Drilling cost is the unproven variable",
      "Subsurface heterogeneity per site",
      "Baseload pricing competitive vs solar+storage",
    ],
    investment_memo:
      "FluxFusion does enhanced geothermal with two producing pilot wells. The team and policy support are strong. Returns hinge entirely on the drilling cost curve.",
    questions_for_management: [
      "Drilling cost at well 5 vs well 2?",
      "What's the next-site geological diligence?",
      "DOE cost-share terms?",
    ],
  },
  {
    company_name: "EthanePilot",
    technology_type: "Carbon Capture",
    location: "Louisiana, USA",
    investment_size: "$11M Series A",
    stage: "Series A",
    founder_profile: "Technical",
    geography: "North America",
    overall_score: 7.7,
    recommendation: "PASS",
    decision: "passed",
    outcome: "unknown",
    decision_notes: "CCUS outside our active thesis.",
    daysAgo: 130,
    scores: {
      technology_readiness: { score: 8, rationale: "Post-combustion capture, TRL 8." },
      financial_viability: { score: 7, rationale: "45Q tax credit closes economics." },
      carbon_impact: { score: 8, rationale: "Direct emitter capture." },
      regulatory_risk: { score: 7, rationale: "45Q monetization process clear." },
      market_timing: { score: 8, rationale: "Industrial decarbonization mandates rising." },
      scalability: { score: 8, rationale: "Modular skid design." },
    },
    key_strengths: [
      "45Q tax credit support",
      "Direct partnership with two emitters",
      "Skid-based deployment model",
    ],
    key_risks: [
      "45Q political risk past 2030",
      "Pipeline access to sequestration sites",
      "Solvent regeneration energy cost",
    ],
    investment_memo:
      "EthanePilot deploys post-combustion capture with two industrial partners. 45Q makes the economics work today. Long-term policy risk is real but quantifiable.",
    questions_for_management: [
      "Pipeline access cost to sequestration?",
      "Customer LOI to firm conversion plan?",
      "45Q sunset contingency?",
    ],
  },
  // Recent looking — fresh
  {
    company_name: "TerraGrid AI",
    technology_type: "Grid Software",
    location: "Berlin, Germany",
    investment_size: "$4M Seed",
    stage: "Seed",
    founder_profile: "Technical",
    geography: "Europe",
    overall_score: 7.0,
    recommendation: "FURTHER DILIGENCE",
    decision: "looking",
    outcome: "unknown",
    decision_notes: "First call done. Want to talk to design partner.",
    daysAgo: 5,
    scores: {
      technology_readiness: { score: 7, rationale: "ML-based grid optimization, deployed at one TSO." },
      financial_viability: { score: 6, rationale: "Pre-revenue, but TSO contract close." },
      carbon_impact: { score: 7, rationale: "Indirect; reduces curtailment." },
      regulatory_risk: { score: 7, rationale: "EU grid code alignment in progress." },
      market_timing: { score: 8, rationale: "Curtailment is a billion-euro problem." },
      scalability: { score: 8, rationale: "Software margin profile." },
    },
    key_strengths: [
      "TSO design partner running pilot",
      "ML team from DeepMind energy group",
      "Software margins",
    ],
    key_risks: [
      "Single TSO design partner",
      "Long sales cycles to TSOs",
      "EU grid code dependencies",
    ],
    investment_memo:
      "TerraGrid AI builds ML-based grid optimization software used by transmission operators. Software margin profile in a hardware-heavy sector is the wedge.",
    questions_for_management: [
      "Pilot to paid contract conversion timeline?",
      "Second TSO pipeline?",
      "Pricing model?",
    ],
  },
  {
    company_name: "Loop EV",
    technology_type: "EV Infrastructure",
    location: "Texas, USA",
    investment_size: "$7M Seed",
    stage: "Seed",
    founder_profile: "Co-founders",
    geography: "North America",
    overall_score: 6.5,
    recommendation: "FURTHER DILIGENCE",
    decision: "passed",
    outcome: "failed",
    decision_notes: "Hardware capex felt heavy for seed.",
    outcome_evidence: "Wound down. Bought a fleet of chargers, couldn't drive utilization.",
    daysAgo: 200,
    scores: {
      technology_readiness: { score: 8, rationale: "DC fast-charging, off-the-shelf." },
      financial_viability: { score: 5, rationale: "Capex-heavy, utilization unproven." },
      carbon_impact: { score: 6, rationale: "Indirect via EV adoption." },
      regulatory_risk: { score: 7, rationale: "NEVI program funding." },
      market_timing: { score: 7, rationale: "EV adoption mid-curve." },
      scalability: { score: 6, rationale: "Real-estate intensive." },
    },
    key_strengths: [
      "NEVI program funding",
      "Texas footprint",
      "Co-founder team",
    ],
    key_risks: [
      "Hardware capex per site is high",
      "Utilization rate unknown",
      "ChargePoint and EVgo competition",
    ],
    investment_memo:
      "Loop EV is a DC fast-charging operator focused on Texas. NEVI funding helps, but utilization-driven returns are not yet proven and competition is well-funded.",
    questions_for_management: [
      "What's your target site utilization?",
      "Differentiation vs ChargePoint?",
      "Capex per site at scale?",
    ],
  },
  {
    company_name: "Cinder Synth",
    technology_type: "Synthetic Fuels",
    location: "California, USA",
    investment_size: "$6M Seed",
    stage: "Seed",
    founder_profile: "Technical",
    geography: "North America",
    overall_score: 6.2,
    recommendation: "DECLINE",
    decision: "passed",
    outcome: "unknown",
    decision_notes: "Cost trajectory not credible.",
    daysAgo: 75,
    scores: {
      technology_readiness: { score: 4, rationale: "TRL 4. Lab benchtop only." },
      financial_viability: { score: 4, rationale: "$15/gal projected at scale." },
      carbon_impact: { score: 8, rationale: "Net-negative aviation fuel pathway." },
      regulatory_risk: { score: 7, rationale: "SAF mandates support." },
      market_timing: { score: 7, rationale: "SAF demand structurally rising." },
      scalability: { score: 6, rationale: "Gigafactory required." },
    },
    key_strengths: [
      "SAF demand pull",
      "Net-negative pathway",
      "Strong technical team",
    ],
    key_risks: [
      "$15/gal vs $3 jet-A",
      "Capex requirements enormous",
      "TRL 4 — manufacturing decade away",
    ],
    investment_memo:
      "Cinder Synth makes synthetic aviation fuel via electrochemical CO2 reduction. Compelling carbon profile but cost trajectory not credible at seed stage.",
    questions_for_management: [
      "Cost-per-gallon at TRL 6?",
      "Capex per gallon at scale?",
      "Customer LOI structure?",
    ],
  },
  {
    company_name: "Permafrost Labs",
    technology_type: "Direct Air Capture",
    location: "Vermont, USA",
    investment_size: "$5M Seed",
    stage: "Seed",
    founder_profile: "Solo",
    geography: "North America",
    overall_score: 6.8,
    recommendation: "CONDITIONAL",
    decision: "passed",
    outcome: "succeeded",
    decision_notes: "Solo founder + low TRL felt early.",
    outcome_evidence: "Series A from Lowercarbon at $50M post; Frontier offtake lifted.",
    daysAgo: 190,
    scores: {
      technology_readiness: { score: 5, rationale: "TRL 5, novel sorbent." },
      financial_viability: { score: 6, rationale: "Cost trajectory plausible to $250/ton." },
      carbon_impact: { score: 10, rationale: "Permanent removal." },
      regulatory_risk: { score: 8, rationale: "Removal credit registries maturing." },
      market_timing: { score: 8, rationale: "Frontier and Stripe offtake demand." },
      scalability: { score: 7, rationale: "Modular reactor design." },
    },
    key_strengths: [
      "Novel sorbent IP",
      "Frontier LOI",
      "Founder ex-LLNL",
    ],
    key_risks: [
      "Solo founder",
      "TRL 5",
      "Cost-per-ton trajectory unproven",
    ],
    investment_memo:
      "Permafrost Labs is direct air capture using a novel sorbent. Frontier offtake demand is real and the founder is credible. Solo and early-TRL combine into seed-stage uncertainty.",
    questions_for_management: [
      "Hiring plan for an operating partner?",
      "Sorbent IP defensibility?",
      "Cost-per-ton at TRL 7?",
    ],
  },
];

export function ensureDemoUserSeeded() {
  const db = getDb();
  const DEMO_HASH = bcrypt.hashSync(DEMO_PASSWORD, 10);

  const existing = findUserByEmail(DEMO_EMAIL);
  let targetUserId: number;
  if (existing) {
    // Refresh password hash every call so demo creds always work
    db.prepare(
      "UPDATE users SET password_hash = ?, name = ?, is_demo = 1 WHERE id = ?",
    ).run(DEMO_HASH, "Demo Investor", existing.id);
    targetUserId = existing.id;
    const count = db
      .prepare("SELECT COUNT(*) as c FROM decks WHERE user_id = ?")
      .get(targetUserId) as { c: number };
    if (count.c > 0) return findUserByEmail(DEMO_EMAIL)!;
  } else {
    const insertUser = db
      .prepare(
        "INSERT INTO users(email, password_hash, name, is_demo, created_at) VALUES (?, ?, ?, 1, ?)",
      )
      .run(DEMO_EMAIL, DEMO_HASH, "Demo Investor", Date.now());
    targetUserId = insertUser.lastInsertRowid as number;
  }

  db.prepare("DELETE FROM decks WHERE user_id = ?").run(targetUserId);

  const insert = db.prepare(`
    INSERT INTO decks(
      user_id, company_name, technology_type, location, investment_size,
      stage, founder_profile, geography, overall_score, recommendation,
      analysis_json, decision, decision_at, decision_notes,
      outcome, outcome_updated_at, outcome_evidence, created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  const now = Date.now();
  for (const seed of SEED_DECKS) {
    const createdAt = now - seed.daysAgo * 86400 * 1000;
    const analysis = {
      project_name: seed.company_name,
      technology_type: seed.technology_type,
      location: seed.location,
      investment_size: seed.investment_size,
      scores: seed.scores,
      overall_score: seed.overall_score,
      recommendation: seed.recommendation,
      key_risks: seed.key_risks,
      key_strengths: seed.key_strengths,
      investment_memo: seed.investment_memo,
      questions_for_management: seed.questions_for_management,
    };
    insert.run(
      targetUserId,
      seed.company_name,
      seed.technology_type,
      seed.location,
      seed.investment_size,
      seed.stage,
      seed.founder_profile,
      seed.geography,
      seed.overall_score,
      seed.recommendation,
      JSON.stringify(analysis),
      seed.decision,
      seed.decision === "looking" ? null : createdAt + 86400 * 1000,
      seed.decision_notes ?? null,
      seed.outcome,
      seed.outcome === "unknown" ? null : createdAt + 60 * 86400 * 1000,
      seed.outcome_evidence ?? null,
      createdAt,
    );
  }

  return findUserByEmail(DEMO_EMAIL)!;
}

export const DEMO_CREDENTIALS = {
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
};
