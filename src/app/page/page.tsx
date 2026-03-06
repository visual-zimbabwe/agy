import type { ReactNode } from "react";

type CompetencyRow = {
  form: string;
  knowledge: string;
  skills: string;
  attitudes: string;
  evidence: string;
};

type SequenceRow = {
  form: string;
  term: string;
  focus: string;
  technicalThrowDown: string;
  mainMake: string;
  heritageLink: string;
  integration: string;
  assessment: string;
};

const aims = [
  "Develop competent, safe and reflective young ceramic practitioners through progressive practical work in hand-building, wheel-work, surface design and firing.",
  "Promote Ubuntu/Unhu/Vumunhu values through collaborative studio practice, peer critique, respect for local knowledge and community service.",
  "Preserve and reinterpret Zimbabwean ceramic heritage by integrating Shona and other local motifs, vessel typologies and cultural narratives into contemporary school pottery.",
  "Build innovation, problem-solving and design thinking competencies through challenge-based learning inspired by technical throw downs and themed main makes.",
  "Strengthen links between art, science, heritage studies and enterprise to prepare learners for O-Level pathways, livelihoods and lifelong learning.",
  "Cultivate environmentally responsible production habits through local material use, recycling and low-waste studio systems appropriate for under-resourced schools.",
];

const objectives = [
  "Identify and explain clay bodies, additives, tools, forming methods, drying stages, firing stages and glaze basics.",
  "Demonstrate proficiency in pinch, coil, slab and wheel techniques from Form 1 to Form 4 progression.",
  "Apply design elements and principles to produce functional and sculptural pottery that meets a design brief.",
  "Use Zimbabwean visual language (motifs, symbols, textures and forms) appropriately in ceramic products.",
  "Use simple tests to evaluate clay plasticity, shrinkage, absorbency and glaze fit with teacher supervision.",
  "Maintain a process portfolio with sketches, annotations, test records, reflective journals and photographs.",
  "Participate in studio critique using correct art vocabulary and constructive feedback protocols.",
  "Plan, cost, package and market selected ceramic products for school enterprise exhibitions and sales.",
  "Observe kiln, dust-control and tool safety procedures and support peers in inclusive, respectful studio conduct.",
];

const topics = [
  "Pottery heritage and visual culture in Zimbabwe",
  "Studio safety, health, disability-inclusive routines and risk management",
  "Clay sourcing, preparation, wedging, reclaiming and storage",
  "Forming techniques: pinch, coil, slab, moulding and wheel throwing",
  "Joining, handles, spouts, lids, trimming and finishing",
  "Surface development: burnishing, carving, stamping, slip work, sgraffito and local motifs",
  "Drying management, bisque firing, oxidation/reduction awareness and kiln operation logs",
  "Glaze and colour: basic chemistry, testing tiles, defects and corrective actions",
  "Functional ware design: cups, mugs, bowls, plates, jars and water vessels",
  "Sculptural and architectural ceramics: relief tiles, totems, narrative forms and installation",
  "Entrepreneurship: costing, branding, quality control, customer feedback and sales records",
  "Portfolio development and O-Level practical preparation",
];

const sequenceRows: SequenceRow[] = [
  {
    form: "Form 1",
    term: "Term 1",
    focus: "Induction, clay basics, pinch and coil foundations",
    technicalThrowDown: "Uniform pinch cups in 30 minutes",
    mainMake: "Family utility set (2 bowls + 1 cup)",
    heritageLink: "Observe and sketch local household vessels; discuss uses and symbols",
    integration: "Science: particle size and water absorption",
    assessment: "Safety quiz, skill rubric, sketchbook check",
  },
  {
    form: "Form 1",
    term: "Term 2",
    focus: "Slab construction, joining, texture and pattern",
    technicalThrowDown: "Consistent slab tiles (size tolerance +/- 3 mm)",
    mainMake: "Story tile panel on Nyanga landscape",
    heritageLink: "Pattern library from Zimbabwean basketry and wall motifs",
    integration: "Heritage Studies: local environment and settlement life",
    assessment: "Tile panel, critique participation, process notes",
  },
  {
    form: "Form 1",
    term: "Term 3",
    focus: "Lids, handles, controlled drying and basic firing",
    technicalThrowDown: "Attach 3 handle types without cracking",
    mainMake: "Lidded storage pot with incised symbols",
    heritageLink: "Shona vessel forms and traditional storage function",
    integration: "Mathematics: diameter, volume and proportion",
    assessment: "End-of-year practical + mini-portfolio",
  },
  {
    form: "Form 2",
    term: "Term 1",
    focus: "Intermediate form control and wheel introduction",
    technicalThrowDown: "Center and throw cylinder to set height",
    mainMake: "Functional mug inspired by Zimbabwean motifs",
    heritageLink: "Motif adaptation from regional craft references",
    integration: "English: design statement writing",
    assessment: "Product functionality test and rubric",
  },
  {
    form: "Form 2",
    term: "Term 2",
    focus: "Sets, repetition and quality consistency",
    technicalThrowDown: "Throw/make 4 matching cups",
    mainMake: "Tea-for-two set for school hospitality corner",
    heritageLink: "Hospitality customs and serving vessels",
    integration: "Business: unit costing and break-even basics",
    assessment: "Set consistency score + costing sheet",
  },
  {
    form: "Form 2",
    term: "Term 3",
    focus: "Surface colour, slips and glaze testing",
    technicalThrowDown: "Glaze-test tile grid with 8 variations",
    mainMake: "Decorative water jug with slip-trailed narrative band",
    heritageLink: "Water stewardship themes in local communities",
    integration: "Science: heatwork and clay-glaze fit",
    assessment: "Test-tile logbook + practical exam",
  },
];

const sequenceRowsContinued: SequenceRow[] = [
  {
    form: "Form 3",
    term: "Term 1",
    focus: "Advanced wheel and sectional assembly",
    technicalThrowDown: "Tall forms with wall-thickness control",
    mainMake: "Pouring vessel challenge (teapot or jug)",
    heritageLink: "Traditional pouring vessels and ceremony",
    integration: "Physics: center of gravity and stability",
    assessment: "Leak test + peer critique",
  },
  {
    form: "Form 3",
    term: "Term 2",
    focus: "Ceramic sculpture and narrative",
    technicalThrowDown: "Expressive handles and spouts set",
    mainMake: "Sculptural piece: Ubuntu in Clay",
    heritageLink: "Community values, totems and proverbs",
    integration: "Heritage Studies + Literature: proverb interpretation",
    assessment: "Artist talk + sculpture rubric",
  },
  {
    form: "Form 3",
    term: "Term 3",
    focus: "Production planning and enterprise prototype",
    technicalThrowDown: "Timed production run of saleable miniware",
    mainMake: "Market-ready product line (3 item types)",
    heritageLink: "Local craft market benchmarking",
    integration: "Mathematics: pricing models and profit margin",
    assessment: "School market day sales + reflection",
  },
  {
    form: "Form 4",
    term: "Term 1",
    focus: "Specialisation stream selection and proposal writing",
    technicalThrowDown: "Precision replication from measured brief",
    mainMake: "Design brief: contemporary heritage tableware",
    heritageLink: "Reinterpreting indigenous forms for modern use",
    integration: "ICT: digital mood board and documentation",
    assessment: "Proposal, prototype, viva voce",
  },
  {
    form: "Form 4",
    term: "Term 2",
    focus: "Major project development and refinement",
    technicalThrowDown: "Defect diagnosis and correction sprint",
    mainMake: "Capstone project build and firing cycle",
    heritageLink: "Community interview informs project symbolism",
    integration: "Geography: local clays and sustainable sourcing",
    assessment: "Mid-project review + portfolio moderation",
  },
  {
    form: "Form 4",
    term: "Term 3",
    focus: "Exhibition, enterprise pitch and O-Level readiness",
    technicalThrowDown: "Exam-style timed technical task",
    mainMake: "Final exhibition + entrepreneurship showcase",
    heritageLink: "Public explanation of cultural references",
    integration: "Career guidance and creative-industry pathways",
    assessment: "Practical exam, written paper, curated portfolio",
  },
];

const sequenceAll = [...sequenceRows, ...sequenceRowsContinued];

const competencyRows: CompetencyRow[] = [
  {
    form: "Form 1",
    knowledge: "Clay properties, tools, safety, basic Zimbabwean pottery history",
    skills: "Pinch, coil, slab, joining, basic surface marks",
    attitudes: "Curiosity, cleanliness, teamwork, respect for heritage",
    evidence: "Foundational artifacts, safety checklist, reflective notes",
  },
  {
    form: "Form 2",
    knowledge: "Form-function relationship, simple glaze concepts, motif research",
    skills: "Wheel entry, set-making, slip and glaze testing, improved finishing",
    attitudes: "Perseverance, precision, constructive critique culture",
    evidence: "Functional sets, motif analysis sheet, glaze test board",
  },
  {
    form: "Form 3",
    knowledge: "Advanced assembly, firing variables, product development workflow",
    skills: "Complex forms, sculptural expression, quality control, costing",
    attitudes: "Initiative, accountability, ethical enterprise behaviour",
    evidence: "Market prototype line, sales log, project presentation",
  },
  {
    form: "Form 4",
    knowledge: "Project management, curation, exam expectations, creative industries",
    skills: "Specialised production, troubleshooting, portfolio curation, pitching",
    attitudes: "Leadership, professionalism, innovation, Ubuntu/Unhu service mindset",
    evidence: "Capstone exhibition, moderated portfolio, oral defense",
  },
];

const resourceList = [
  "Local clay (riverbank/approved pit sources) and simple sieves for processing",
  "Buckets, basins, wedging boards, wire cutters, bats, sponges, aprons and reusable cloths",
  "Low-cost tools: bamboo ribs, improvised wooden modeling tools, bottle rollers, string lines",
  "Manual or electric wheel (shared station model); kick-wheel alternative where electricity is unstable",
  "Kiln (electric or fuel-fired), kiln shelves, cones/temperature indicators and logbook",
  "Slip and underglaze substitutes from locally available oxides/pigments where appropriate",
  "Storage shelving, lockable glaze cabinet, first aid kit, fire extinguisher and PPE (masks/gloves)",
  "Visual references: Zimbabwean craft images, museum/gallery prints and learner-created motif cards",
];

const safetyGuidelines = [
  "No learner operates kilns unsupervised; teacher-in-charge must verify loading chart and firing checklist.",
  "Maintain ventilation around kilns and glazing zones; avoid indoor smoke buildup and heat congestion.",
  "Control dust by wet-cleaning floors and tables; dry sweeping of clay dust is prohibited.",
  "Use masks during dry sanding, glaze mixing and kiln maintenance; wash hands before meals.",
  "Store sharp tools safely and maintain clear walkways for wheelchair/crutch access.",
  "Use heat-resistant gloves and tongs when handling hot kiln furniture; post hazard signage.",
  "Keep incident and near-miss register; review safety routines at the start of every term.",
];

const inclusionGuidelines = [
  "Differentiate task complexity, tool size and timing to support learners with varied abilities.",
  "Provide adaptive tools (thicker handles, non-slip mats, seated wheel options, one-hand jigs).",
  "Pair learners in cooperative studio teams with rotating roles: designer, builder, finisher, recorder.",
  "Allow multimodal evidence: oral explanation, photo process logs, tactile samples and simplified templates.",
  "Use clear visual instructions and bilingual terminology (English + local language) where feasible.",
  "Ensure pathways, work heights and critique spaces are physically accessible.",
];

const assessmentContinuous = [
  "Weekly technical throw down drills with criterion-referenced rubrics",
  "Main make projects each term with process and final product marks",
  "Portfolio checks (sketches, experiments, reflections, photos, costing sheets)",
  "Group critique contribution and self/peer assessment records",
  "School-based project mark (Form 3 and Form 4 alignment with current framework practice)",
];

const assessmentSummative = [
  "Mid-year practical examination (Forms 2-4)",
  "End-of-year practical examination across all forms",
  "Written paper components: design process, heritage interpretation, material science and enterprise",
  "Form 4 mock exam aligned to ZIMSEC O-Level art practical expectations",
  "Final moderated portfolio and exhibition viva for Form 4",
];

const weightingRows = [
  ["Continuous assessment", "60%", "Technical drills 15%; Main makes 25%; Portfolio 15%; Critique/professionalism 5%"],
  ["Summative assessment", "40%", "Practical exam 25%; Written/theory paper 10%; Viva/exhibition 5%"],
] as const;

function Section({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
      <h2 className="text-2xl leading-tight font-bold sm:text-3xl">
        {number}. {title}
      </h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--color-text)] sm:text-base">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function PageRoute() {
  return (
    <main className="route-shell text-[var(--color-text)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-12 pt-8 sm:px-8 sm:pb-16 sm:pt-10">
        <header className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-glass)] p-6 shadow-[var(--shadow-md)] backdrop-blur-[var(--blur-panel)] sm:p-8">
          <p className="text-xs font-semibold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
            Ministry-Style Curriculum Draft | Visual Arts Elective/Enrichment
          </p>
          <h1 className="mt-3 text-3xl leading-tight font-black sm:text-5xl">High School Pottery Syllabus (Forms 1-4)</h1>
          <p className="mt-3 text-sm text-[var(--color-text-muted)] sm:text-base">
            Nyanga High School Marist Brothers, Zimbabwe | Implementation Window: 2026-2030 Cohorts | Designed for
            Heritage-Based, Competency-Oriented Learning.
          </p>
          <div className="mt-5 grid gap-3 text-xs sm:grid-cols-3 sm:text-sm">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
              Time Allocation: 4 periods/week (2 double practical blocks)
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
              Class Size Guide: 20-35 learners (shared studio stations)
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
              Assessment Model: Continuous + Summative + Portfolio
            </div>
          </div>
        </header>

        <Section number="1" title="Preamble (Introduction and Rationale)">
          <p>
            This Pottery Syllabus is designed for Forms 1-4 under the Visual and Performing Arts pathway at Nyanga High
            School Marist Brothers. It aligns with Zimbabwe&apos;s Heritage-Based Curriculum direction (2024-2030), which
            emphasizes practical competence, innovation, Ubuntu/Unhu values, national identity and school-to-life
            relevance.
          </p>
          <p>
            Pottery is positioned as a high-impact learning area that integrates cultural heritage, design thinking,
            science concepts, entrepreneurship and environmental responsibility. The syllabus uses a learner-centered
            studio model inspired by structured challenge pedagogy: each cycle includes a <strong>Technical Throw Down</strong>
            (timed skill drill), a <strong>Main Make</strong> (major themed build) and a <strong>Group Critique</strong> (reflection and
            feedback).
          </p>
          <p>
            The curriculum is deliberately resource-conscious. It prioritizes local clay, low-cost tools, shared equipment
            and incremental access to wheel and kiln use, making it suitable for rural or under-resourced contexts while
            still maintaining credible O-Level preparation standards.
          </p>
        </Section>

        <Section number="2" title="Aims">
          <BulletList items={aims} />
        </Section>

        <Section number="3" title="Syllabus Objectives">
          <p>By the end of Form 4, learners should be able to:</p>
          <BulletList items={objectives} />
        </Section>

        <Section number="4" title="Methodology and Time Allocation">
          <h3 className="text-lg font-semibold">4.1 Methodology</h3>
          <BulletList
            items={[
              "Demonstration -> guided practice -> independent production -> critique -> refinement cycle",
              "Challenge-based learning: weekly technical drill + themed main make",
              "Project-based and inquiry-based learning with local heritage research",
              "Peer learning and cooperative studio roles for inclusion and leadership",
              "Portfolio-based reflective practice for process accountability",
              "Community-linked learning through exhibitions, guest artisans and market events",
            ]}
          />
          <h3 className="pt-2 text-lg font-semibold">4.2 Weekly Time Allocation</h3>
          <BulletList
            items={[
              "4 periods per week (40 minutes each equivalent)",
              "Recommended timetable: two double periods to protect practical flow",
              "Suggested weekly structure: 1 period theory/demo + 2 periods practical build + 1 period finish/critique/documentation",
              "At least one supervised after-school firing slot per fortnight where facilities allow",
            ]}
          />
          <h3 className="pt-2 text-lg font-semibold">4.3 Inclusion and Differentiation</h3>
          <BulletList items={inclusionGuidelines} />
        </Section>

        <Section number="5" title="Topics">
          <BulletList items={topics} />
          <h3 className="pt-2 text-lg font-semibold">Alternative Project (One Per Form)</h3>
          <BulletList
            items={[
              "Form 1 alternative: Hand-built seed-saving jars for school agriculture club.",
              "Form 2 alternative: Community tea mug series celebrating local proverbs.",
              "Form 3 alternative: Relief tile mural for school entrance with district heritage symbols.",
              "Form 4 alternative: Social-impact ceramics project (water filter vessel housing, school awards, or commemorative wares).",
            ]}
          />
        </Section>

        <Section number="6" title="Scope and Sequence (Yearly and Termly Progression)">
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-muted)]">
                  <th className="border border-[var(--color-border)] px-3 py-2">Form</th>
                  <th className="border border-[var(--color-border)] px-3 py-2">Term</th>
                  <th className="border border-[var(--color-border)] px-3 py-2">Focus</th>
                  <th className="border border-[var(--color-border)] px-3 py-2">Technical Throw Down</th>
                  <th className="border border-[var(--color-border)] px-3 py-2">Main Make</th>
                  <th className="border border-[var(--color-border)] px-3 py-2">Heritage Link</th>
                  <th className="border border-[var(--color-border)] px-3 py-2">Cross-Curricular Link</th>
                  <th className="border border-[var(--color-border)] px-3 py-2">Assessment Emphasis</th>
                </tr>
              </thead>
              <tbody>
                {sequenceAll.map((row) => (
                  <tr key={`${row.form}-${row.term}`}>
                    <td className="border border-[var(--color-border)] px-3 py-2 align-top">{row.form}</td>
                    <td className="border border-[var(--color-border)] px-3 py-2 align-top">{row.term}</td>
                    <td className="border border-[var(--color-border)] px-3 py-2 align-top">{row.focus}</td>
                    <td className="border border-[var(--color-border)] px-3 py-2 align-top">{row.technicalThrowDown}</td>
                    <td className="border border-[var(--color-border)] px-3 py-2 align-top">{row.mainMake}</td>
                    <td className="border border-[var(--color-border)] px-3 py-2 align-top">{row.heritageLink}</td>
                    <td className="border border-[var(--color-border)] px-3 py-2 align-top">{row.integration}</td>
                    <td className="border border-[var(--color-border)] px-3 py-2 align-top">{row.assessment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] sm:text-sm">
            Weekly challenge progression: Form 1 (foundations) -&gt; Form 2 (consistency) -&gt; Form 3 (complexity and
            enterprise) -&gt; Form 4 (specialisation and exam readiness).
          </p>
        </Section>

        <Section number="7" title="Competency Matrix (Knowledge, Skills, Attitudes)">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-muted)]">
                  <th className="border border-[var(--color-border)] px-3 py-2">Form</th>
                  <th className="border border-[var(--color-border)] px-3 py-2">Knowledge Competencies</th>
                  <th className="border border-[var(--color-border)] px-3 py-2">Practical Skills Competencies</th>
                  <th className="border border-[var(--color-border)] px-3 py-2">Attitudes/Values Competencies</th>
                  <th className="border border-[var(--color-border)] px-3 py-2">Competency Evidence</th>
                </tr>
              </thead>
              <tbody>
                {competencyRows.map((row) => (
                  <tr key={row.form}>
                    <td className="border border-[var(--color-border)] px-3 py-2 align-top">{row.form}</td>
                    <td className="border border-[var(--color-border)] px-3 py-2 align-top">{row.knowledge}</td>
                    <td className="border border-[var(--color-border)] px-3 py-2 align-top">{row.skills}</td>
                    <td className="border border-[var(--color-border)] px-3 py-2 align-top">{row.attitudes}</td>
                    <td className="border border-[var(--color-border)] px-3 py-2 align-top">{row.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section number="8" title="Assessment (Continuous and Summative)">
          <h3 className="text-lg font-semibold">8.1 Continuous Assessment</h3>
          <BulletList items={assessmentContinuous} />
          <h3 className="pt-2 text-lg font-semibold">8.2 Summative Assessment</h3>
          <BulletList items={assessmentSummative} />
          <h3 className="pt-2 text-lg font-semibold">8.3 Suggested Weighting Framework</h3>
          <div className="overflow-x-auto">
            <table className="min-w-[760px] border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-muted)]">
                  <th className="border border-[var(--color-border)] px-3 py-2">Component</th>
                  <th className="border border-[var(--color-border)] px-3 py-2">Weight</th>
                  <th className="border border-[var(--color-border)] px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {weightingRows.map(([component, weight, notes]) => (
                  <tr key={component}>
                    <td className="border border-[var(--color-border)] px-3 py-2">{component}</td>
                    <td className="border border-[var(--color-border)] px-3 py-2">{weight}</td>
                    <td className="border border-[var(--color-border)] px-3 py-2">{notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            ZIMSEC alignment note: Final weighting and paper format should be moderated against the latest circulars and
            O-Level Art requirements in force at registration year.
          </p>
        </Section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
            <h2 className="text-2xl font-bold sm:text-3xl">Safety Guidelines</h2>
            <div className="mt-4 text-sm leading-7 sm:text-base">
              <BulletList items={safetyGuidelines} />
            </div>
          </article>

          <article className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
            <h2 className="text-2xl font-bold sm:text-3xl">Resource List (Affordable/Local)</h2>
            <div className="mt-4 text-sm leading-7 sm:text-base">
              <BulletList items={resourceList} />
            </div>
          </article>
        </section>

        <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
          <h2 className="text-2xl font-bold sm:text-3xl">Entrepreneurship and Community Interface</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 sm:text-base">
            <p>
              Enterprise is embedded from Form 2 onward through costing, quality control and market feedback. Learners
              produce saleable items for school open days, prize-giving events and local fairs under teacher supervision.
            </p>
            <BulletList
              items={[
                "Form 2: basic pricing (materials + labour time) and simple invoice sheets",
                "Form 3: small-batch production and customer feedback cards",
                "Form 4: branded capstone line, pitch presentation and exhibition sales plan",
                "Revenue use model: reinvest percentage into studio consumables and learner innovation fund",
                "Ethics focus: authenticity, cultural respect, non-exploitative heritage commercialization",
              ]}
            />
          </div>
        </section>

        <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
          <h2 className="text-2xl font-bold sm:text-3xl">Reference Notes for Submission</h2>
          <p className="mt-3 text-sm leading-7 sm:text-base">
            This draft is aligned to publicly available Zimbabwe curriculum and examination context documents and
            international school ceramics safety/ESD references. Final submission should append the school letterhead,
            staffing profile, resource audit and district approval signatures.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-xs leading-6 sm:text-sm">
            <li>
              ZIMSEC syllabi portal (includes Arts Syllabus Forms 1-4 listing):{" "}
              <a className="underline" href="https://www5.zimsec.co.zw/syllabi/" target="_blank" rel="noreferrer">
                https://www5.zimsec.co.zw/syllabi/
              </a>
            </li>
            <li>
              ZIMSEC O-Level timetable sample showing Art paper coding context (e.g., 4060):{" "}
              <a
                className="underline"
                href="https://www5.zimsec.co.zw/wp-content/uploads/2024/05/Nov-2024-O-level-Final.pdf"
                target="_blank"
                rel="noreferrer"
              >
                https://www5.zimsec.co.zw/wp-content/uploads/2024/05/Nov-2024-O-level-Final.pdf
              </a>
            </li>
            <li>
              MoPSE provincial curriculum page confirming Art as O-Level learning area and competency-based syllabi
              structure:{" "}
              <a
                className="underline"
                href="https://mopsemashwest.gov.zw/Site/Curriculum_Updated_Syllabi.html"
                target="_blank"
                rel="noreferrer"
              >
                https://mopsemashwest.gov.zw/Site/Curriculum_Updated_Syllabi.html
              </a>
            </li>
            <li>
              Zimbabwe Heritage-Based Curriculum implementation reporting window (2024-2030):{" "}
              <a
                className="underline"
                href="https://www.zbcnews.co.zw/government-begins-implementation-of-heritage-based-curriculum-framework/"
                target="_blank"
                rel="noreferrer"
              >
                https://www.zbcnews.co.zw/government-begins-implementation-of-heritage-based-curriculum-framework/
              </a>
            </li>
            <li>
              UNESCO note on Zimbabwe curriculum greening under Heritage-Based Framework:{" "}
              <a
                className="underline"
                href="https://www.unesco.org/en/articles/strengthening-sustainability-and-climate-readiness-zimbabwe"
                target="_blank"
                rel="noreferrer"
              >
                https://www.unesco.org/en/articles/strengthening-sustainability-and-climate-readiness-zimbabwe
              </a>
            </li>
            <li>
              Show format inspiration (main make + technical challenge competition structure):{" "}
              <a className="underline" href="https://en.wikipedia.org/wiki/The_Great_Pottery_Throw_Down" target="_blank" rel="noreferrer">
                https://en.wikipedia.org/wiki/The_Great_Pottery_Throw_Down
              </a>
            </li>
            <li>
              Additional competition-format source summary (industry press synopsis):{" "}
              <a className="underline" href="https://press.wbd.com/us/property/great-pottery-throw-down" target="_blank" rel="noreferrer">
                https://press.wbd.com/us/property/great-pottery-throw-down
              </a>
            </li>
            <li>
              Kiln safety in schools and craft studios:{" "}
              <a className="underline" href="https://www.hse.gov.uk/non-metallic-minerals/kilns-in-schools.htm" target="_blank" rel="noreferrer">
                https://www.hse.gov.uk/non-metallic-minerals/kilns-in-schools.htm
              </a>
            </li>
            <li>
              Zimbabwe craft market context (traditional pottery forms and commercialization):{" "}
              <a className="underline" href="https://www.nhc.co.zw/product-category/pottery/" target="_blank" rel="noreferrer">
                https://www.nhc.co.zw/product-category/pottery/
              </a>
            </li>
          </ul>
        </section>
      </section>
    </main>
  );
}
