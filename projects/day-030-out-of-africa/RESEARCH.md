# RESEARCH.md — Early Human Migrations Out of Africa

A timeline+map seed for the visualization. Dates are bracketed because most chronologies have real uncertainty; coordinates are approximate. Citations include the primary scientific paper (with DOI where verified), a Wikipedia URL, and an educational video where a credible one was found. Where a primary source could not be confirmed, the entry is marked **"TODO: verify primary source"** rather than fabricated.

> **Status of this document.** Seeded by web research on 2026-04-25. Phase 1 of the project plan promotes the verified parts into `data/events.json`. Anything still marked TODO must be resolved (or marked `"todo": true` in the data file) before shipping.

---

## 0. Climate context (background layer for the visualization)

Migrations are paced by climate. Three forcings matter most:

- **Glacial / interglacial cycles (Marine Isotope Stages):** sea-level swings of 100+ m repeatedly opened and closed land bridges (Sundaland, Sahul–Australia link, Bering Land Bridge, English Channel). Cold stages dried Africa and the Sahara; warm stages "greened" the Sahara and the Arabian Peninsula.
- **Green Sahara / African Humid Periods (AHPs):** insolation-driven monsoon maxima opened humid corridors across the Sahara at ~129–92 ka and ~76 ka, and again in the early Holocene (~10–5 ka). Commonly invoked as windows of opportunity for dispersal. Drake et al. and Larrasoaña et al. mapped paleolake networks across the central Sahara.
  - Larrasoaña, Roberts & Rohling (2013), *PLOS ONE* — DOI: 10.1371/journal.pone.0076514
  - Wikipedia: https://en.wikipedia.org/wiki/African_humid_period
- **Toba supereruption, ~74 ka, Sumatra (~2.68°N, 98.88°E):** VEI-8, largest known eruption of the Quaternary. Originally proposed by Stanley Ambrose (1998) to have caused a near-extinction bottleneck in *H. sapiens*. Subsequent work (Lane et al. 2013, *PNAS*; Smith et al. 2018, *Nature*) found no volcanic-winter signal in East African lake records and ongoing human occupation in India through the ash layer; the catastrophic-bottleneck reading is now largely rejected, though regional climate effects are still debated.
  - Lane, Chorn & Johnson (2013), *PNAS*, "Ash from the Toba supereruption..." — DOI: 10.1073/pnas.1301474110
  - Wikipedia: https://en.wikipedia.org/wiki/Youngest_Toba_eruption
  - Commentary: John Hawks blog, "The so-called Toba bottleneck didn't happen" — https://www.johnhawks.net/p/the-so-called-toba-bottleneck-didnt-happen

### Last Glacial Maximum — ~26.5–19 ka

- **Description:** Global ice-sheet maximum extent. Cold, dry, low sea level (~120 m below present). Drove Solutrean retreat into Iberian/Franco-Cantabrian refugia, sustained the Beringian standstill, kept the ice-free corridor closed, and locked open the Sundaland and Sahul shelf-bridge systems. Almost every late-Pleistocene migration story in the dataset depends on which side of the LGM it sits on.
- **Primary paper:** Clark et al. (2009), *Science* 325:710–714, "The Last Glacial Maximum" — DOI: 10.1126/science.1172873
- **Wikipedia:** https://en.wikipedia.org/wiki/Last_Glacial_Maximum

### Bering Land Bridge — open ~30 ka, flooded ~11 ka

- **Description:** Wide tundra-and-shrub plain ("Beringia") connected northeast Asia to Alaska whenever sea level fell below ~50 m, which it was for much of MIS 4–2. Open continuously through the LGM; final flooding completed ~11 ka with post-glacial sea-level rise. Provided both the corridor and the multi-millennial refugium for the founding Native American population (the "Beringian standstill" — see Section 13).
- **Primary paper:** Hoffecker, Elias & O'Rourke (2014), *Science* 343:979–980, "Out of Beringia?" — DOI: 10.1126/science.1250768
- **Wikipedia:** https://en.wikipedia.org/wiki/Bering_land_bridge

### Sundaland and Sahul shelves — Pleistocene shoreline cycles

- **Description:** At LGM-grade sea levels (–120 m), Southeast Asia's Sunda shelf was a continuous landmass connecting the Malay Peninsula, Sumatra, Java, and Borneo; Sahul was a single landmass uniting Australia, New Guinea, and Tasmania. **Wallacea, the deep-water island arc between the two, never closed** — the *H. sapiens* arrival in Sahul ~65–50 ka therefore required real water crossings even at glacial low-stand. Voris (2000) maps the shoreline geometry at multiple sea-level stands, the standard reference for the visualization's sea-level overlay.
- **Primary paper:** Voris (2000), *Journal of Biogeography* 27:1153–1167, "Maps of Pleistocene sea levels in Southeast Asia: shorelines, river systems and time durations" — DOI: 10.1046/j.1365-2699.2000.00489.x
- **Wikipedia (Sundaland):** https://en.wikipedia.org/wiki/Sunda_Shelf
- **Wikipedia (Sahul):** https://en.wikipedia.org/wiki/Sahul

---

## 1. African origin of *Homo sapiens* (~315–200 ka)

### 1a. Jebel Irhoud, Morocco — ~315 ± 34 ka

- **Location:** Jebel Irhoud, Morocco (~31.85°N, 8.87°W)
- **Description:** Oldest fossils currently assigned to the *H. sapiens* clade; mosaic of modern facial/dental and primitive neurocranial traits. Argues for a pan-African (rather than purely East African) origin.
- **Primary paper:** Hublin et al. (2017), *Nature* 546:289–292 — DOI: 10.1038/nature22336
- **Wikipedia:** https://en.wikipedia.org/wiki/Jebel_Irhoud
- **Video:** PBS Eons (channel: @eons) — TODO: pin exact episode title.

### 1b. Florisbad, South Africa — ~259 ± 35 ka (debated)

- **Location:** Free State, South Africa (~28.77°S, 26.07°E)
- **Description:** Partial cranium ("Florisbad 1"); ESR-dated tooth enamel (Grün et al. 1996). Often grouped with early *H. sapiens* (Stringer 2016; Hublin et al. 2017).
- **Status: debated.** Single ESR date with site-history complications (mixed sediments, possible reworking). Taxonomic assignment is also debated — variously called *H. sapiens*, *H. helmei*, or transitional Middle Pleistocene African Homo. Treat as `debated: true` in events.json.
- **Primary paper:** Grün et al. (1996), *Journal of Human Evolution* 31:121–129 — TODO: verify DOI (1996 *JHE* papers may pre-date routine DOI assignment; mark `todo: true` in events.json if unresolved)
- **Wikipedia:** https://en.wikipedia.org/wiki/Florisbad_Skull

### 1c. Omo Kibish I, Ethiopia — ≥233 ± 22 ka

- **Location:** Lower Omo Valley, Ethiopia (~5.39°N, 35.97°E)
- **Description:** Long thought ~195 ka; redated in 2022 by tying the overlying KHS Tuff to a Shala volcano eruption.
- **Primary paper:** Vidal et al. (2022), *Nature* 601:579–583 — DOI: 10.1038/s41586-021-04275-8
- **Wikipedia:** https://en.wikipedia.org/wiki/Omo_remains
- **Video:** PBS Eons, "How We Found the Oldest Homo Sapiens" (channel: @eons)

---

## 2. Earlier hominin dispersals (context)

### 2a. *Homo erectus* out of Africa — ~2.0–1.8 Ma

- **Location:** dispersed across Eurasia from Africa.
- **Description:** First hominin to leave Africa in numbers; reaches Java (Sangiran, ~1.6 Ma) and China (Yuanmou, Lantian).
- **Wikipedia:** https://en.wikipedia.org/wiki/Homo_erectus

### 2b. Dmanisi, Georgia — 1.85–1.78 Ma

- **Location:** Kvemo Kartli, Georgia (~41.34°N, 44.34°E)
- **Description:** Earliest well-dated hominin fossils outside Africa; small-brained early *Homo* (sometimes *H. erectus georgicus*).
- **Primary papers:**
  - Ferring et al. (2011), *PNAS* 108:10432–10436 — DOI: 10.1073/pnas.1106638108
  - Lordkipanidze et al. (2013), *Science* 342:326–331 — DOI: 10.1126/science.1238484
- **Wikipedia:** https://en.wikipedia.org/wiki/Dmanisi_hominins

---

## 3. Neanderthals and Denisovans in Eurasia

- **Lineage split from modern humans:** ~550–765 ka (Meyer et al. 2016).
- **Neanderthal/Denisovan split from each other:** ~381–473 ka, predates Sima de los Huesos (Atapuerca, Spain, ~430 ka).
- **Range:** Neanderthals across western Eurasia (Iberia to Altai); Denisovans across central, eastern, and southern Asia (Denisova Cave, Tibetan Plateau Baishiya/Xiahe, Laos Cobra Cave, Taiwan).
- **Primary paper:** Meyer et al. (2016), *Nature* 531:504–507, "Nuclear DNA sequences from the Middle Pleistocene Sima de los Huesos hominins" — DOI: 10.1038/nature17405
- **Wikipedia (Neanderthal):** https://en.wikipedia.org/wiki/Neanderthal
- **Wikipedia (Denisovan):** https://en.wikipedia.org/wiki/Denisovan
- **Video:** PBS Eons, "When We Met Other Human Species" — https://www.pbs.org/video/when-we-met-other-human-species-k2hfav/

---

## 4. First modern humans in the Levant

### 4a. Misliya Cave, Israel — ~177–194 ka

- **Location:** Mt. Carmel, Israel (~32.74°N, 34.97°E)
- **Description:** Maxilla ("Misliya-1") with teeth; pushes the earliest modern human presence outside Africa back ~50 ka beyond Skhul/Qafzeh.
- **Primary paper:** Hershkovitz et al. (2018), *Science* 359:456–459 — DOI: 10.1126/science.aap8369
- **Wikipedia:** https://en.wikipedia.org/wiki/Misliya_Cave

### 4b. Skhul and Qafzeh caves, Israel — ~120–90 ka

- **Location:** Mt. Carmel and Lower Galilee, Israel (~32.69°N, 34.96°E and ~32.69°N, 35.31°E)
- **Description:** Multiple modern-human burials; ESR/TL dated. Generally interpreted as a failed dispersal: Neanderthals later reoccupied the Levant before the main Out-of-Africa wave.
- **Primary paper:** Grün et al. (2005), *Journal of Human Evolution* 49:316–334 — DOI: 10.1016/j.jhevol.2005.04.006
- **Wikipedia:** https://en.wikipedia.org/wiki/Skhul_and_Qafzeh_hominins

---

## 5. Possible early Asian dispersals (debated)

### 5a. Apidima 1, Greece — >210 ka (strongly contested)

- **Location:** Mani Peninsula, southern Greece (~36.55°N, 22.39°E)
- **Description:** Partial cranium with modern-human-like occipital morphology per Harvati et al. 2019. If correctly identified and dated, the oldest *H. sapiens* outside Africa. Co-occurring Apidima 2 is Neanderthal-like (~170 ka), suggesting alternation.
- **Status: contested.** Multiple morphometric reanalyses (de Lumley et al. 2020 *L'Anthropologie*; Röding & Stringer 2022 *Journal of Human Evolution*) argue the preserved morphology is too partial and damaged to support a confident sapiens assignment, and that archaic / Neanderthal-affiliated readings are equally plausible. The U-Th date itself is also indirect (carbonate breccia, not bone). Treat as `debated: true` and flag prominently — currently the highest-uncertainty entry in the dataset.
- **Primary paper:** Harvati et al. (2019), *Nature* 571:500–504 — DOI: 10.1038/s41586-019-1376-z
- **Critique:** de Lumley et al. (2020), *L'Anthropologie* 124:102765; Röding & Stringer (2022), *Journal of Human Evolution* (citation TBD — verify)
- **Wikipedia:** https://en.wikipedia.org/wiki/Apidima_Cave

### 5b. Fuyan Cave (Daoxian), China — ~70–120 ka (debated)

- **Location:** Hunan, China (~25.4°N, 111.5°E)
- **Description:** 47 unequivocally modern-human teeth recovered from a sealed flowstone context. If correctly dated, *H. sapiens* in southern China well before the main Out-of-Africa.
- **Status: debated.** Sun et al. (2021) reanalyzed the U-Th and OSL chronology and argue the speleothem-bracketed minimum age is closer to ~70 ka than ~80–120 ka, removing Daoxian as a strict pre-OOA outlier. The teeth are unambiguous *H. sapiens* — only the dating is contested. Treat as `debated: true`; range should be encoded as 70–120 ka, not 80–120.
- **Primary paper:** Liu et al. (2015), *Nature* 526:696–699 — DOI: 10.1038/nature15696
- **Critique:** Sun, Bae, Liu et al. (2021), *Quaternary International* 600:135 — citation to verify; alternative re-dating discussed
- **Wikipedia:** https://en.wikipedia.org/wiki/Fuyan_Cave

---

## 6. Main Out-of-Africa expansion — ~70–50 ka

- **Description:** The dispersal that left descendants in every non-African population today. Genomic studies (Mallick et al. 2016 *Nature*; Pagani et al. 2016 *Nature*; Malaspinas et al. 2016 *Nature*) converge on a single major exodus ~70–50 ka. Pagani et al. originally reported a small (~2%) earlier signal in Papuan genomes interpreted as a ~120 ka dispersal trace, but subsequent reanalyses (e.g., Bergström et al. 2020 *Science*) prefer explanations involving archaic introgression or population structure within Africa rather than an early successful dispersal. Treat the ~120 ka pre-dispersal signal as a footnote to the consensus single-wave model, not as an established fact.
- **2025 update:** Hallett, Leonardi et al. (2025), *Nature* 644:115–121, "Major expansion in the human niche preceded out of Africa dispersal" — DOI: 10.1038/s41586-025-09154-0. Argues that *H. sapiens* expanded its bioclimatic niche within Africa from ~70 ka, gaining the ecological flexibility that enabled successful dispersal.
- **Primary papers:**
  - Mallick et al. (2016), *Nature* 538:201–206 — DOI: 10.1038/nature18964
  - Pagani et al. (2016), *Nature* 538:238–242 — DOI: 10.1038/nature19792
- **Wikipedia:** https://en.wikipedia.org/wiki/Recent_African_origin_of_modern_humans
- **Video:** Stefan Milo, "Does Neanderthal DNA put a ceiling on Out of Africa?" — https://www.youtube.com/watch?v=rXN-KEULia8

---

## 7. Southern coastal route — ~65–50 ka

- **Location:** Bab-el-Mandeb (Red Sea) → Arabian coast → South Asia → Southeast Asia.
- **Description:** Rapid coastal dispersal hypothesis — small founding group (~150–1,000) crossed Bab-el-Mandeb, exploited intertidal/coastal resources, reached India, Sundaland, and ultimately Sahul within a few thousand years. Sea-level lowstands made much of this a continental-shelf route.
- **Primary paper:** Armitage et al. (2011), *Science* 331:453–456, "The Southern Route 'Out of Africa': Evidence for an Early Expansion of Modern Humans into Arabia" — DOI: 10.1126/science.1199113
- **Wikipedia:** https://en.wikipedia.org/wiki/Southern_Dispersal
- **Video:** TODO: pin specific episode (PBS Eons or Stefan Milo coastal-dispersal episode).

---

## 8. Sahul / Australia — ~65 ka

- **Location:** Madjedbebe rock shelter, Arnhem Land, Northern Territory (~12.36°S, 132.93°E)
- **Description:** OSL dates on sediments containing >10,000 stone tools, ground-edge hatchets, ground ochres place human occupation at ~65 ka. Implies water crossings (Wallacea) by *H. sapiens* by then. **Status: debated.** O'Connell et al. (2018) *PNAS* argue artifacts may have moved downward through bioturbation, so the OSL ages of host sediments do not directly date the artifacts; they prefer ~50 ka as the earliest credible occupation. Genome-based founding-population estimates (Malaspinas et al. 2016) for Aboriginal Australians cluster at ~50–60 ka, in tension with 65 ka archaeology. Treat as `debated: true` in events.json.
- **Primary paper:** Clarkson et al. (2017), *Nature* 547:306–310 — DOI: 10.1038/nature22968
- **Critique:** O'Connell et al. (2018), *PNAS* 115:8482, "When did *Homo sapiens* first reach Southeast Asia and Sahul?" — DOI: 10.1073/pnas.1808385115
- **Wikipedia:** https://en.wikipedia.org/wiki/Madjedbebe
- **Video:** TODO: pin a credible documentary segment (ABC Catalyst features Madjedbebe; PBS Eons probably has an Australia episode).

---

## 9. Neanderthal admixture — ~49–45 ka, Middle East / Western Eurasia

- **Description:** Single (or short-window) gene-flow event leaving ~1.5–2% Neanderthal DNA in all non-Africans. Originally dated ~50–60 ka (Sankararaman et al. 2012, 2014; Prüfer et al. 2014). Two 2024–2025 papers from the Reich and Pääbo labs constrained the gene flow tightly to a window of ~50.5–43.5 ka (Iasi) or ~49–45 ka (Sümer, via Ranis and Zlatý kůň genomes).
- **Primary papers:**
  - Sankararaman et al. (2012), *PLOS Genetics* — DOI: 10.1371/journal.pgen.1002947
  - Iasi et al. (2024), *Science* 386:eadq3010, "Neanderthal ancestry through time: Insights from genomes of ancient and present-day humans" — DOI: 10.1126/science.adq3010
  - Sümer et al. (2025), *Nature* 638:711, "Earliest modern human genomes constrain timing of Neanderthal admixture" — DOI: 10.1038/s41586-024-08420-x
- **Wikipedia:** https://en.wikipedia.org/wiki/Neanderthal_genetics#Admixture_with_modern_humans
- **Video:** PBS Eons, "We Met Neandertals Way Earlier Than We Thought" — https://www.pbs.org/video/we-met-neandertals-way-earlier-than-we-thought-lnaavr/

---

## 10. Denisovan admixture — ~45–50 ka, somewhere in Asia

- **Description:** Multiple admixture events. ~4–6% Denisovan ancestry in Papuans/Aboriginal Australians, ~0.06–0.5% in mainland East/South Asians. The Tibetan EPAS1 high-altitude allele is a famous Denisovan introgression. Probably at least two distinct Denisovan source populations contributed (Jacobs et al. 2019).
- **Primary papers:**
  - Reich et al. (2010), *Nature* 468:1053–1060 — DOI: 10.1038/nature09710
  - Jacobs et al. (2019), *Cell* 177:1010–1021 — DOI: 10.1016/j.cell.2019.02.035
  - Huerta-Sánchez et al. (2014), *Nature* (EPAS1) — DOI: 10.1038/nature13408
- **Wikipedia:** https://en.wikipedia.org/wiki/Denisovan
- **Video:** PBS Eons, "When We Met Other Human Species"

---

## 11. Upper Paleolithic Europe — ~45 ka

### Bacho Kiro Cave, Bulgaria — ~45 ka

- **Location:** Stara Planina, Bulgaria (~42.94°N, 25.43°E)
- **Description:** Earliest directly dated *H. sapiens* in mid-latitude Europe, associated with Initial Upper Paleolithic technology. Genomes (Hajdinjak et al. 2021) show recent Neanderthal ancestors within preceding ~6 generations — ongoing admixture in Europe at contact.
- **Primary papers:**
  - Hublin et al. (2020), *Nature* 581:299–302 — DOI: 10.1038/s41586-020-2259-z
  - Hajdinjak et al. (2021), *Nature* 592:253–257 — DOI: 10.1038/s41586-021-03335-3
- **Wikipedia:** https://en.wikipedia.org/wiki/Bacho_Kiro_cave

Also relevant: Grotte Mandrin (France) ~54 ka, suggesting an even earlier brief *H. sapiens* incursion into western Europe.

- **Primary paper:** Slimak et al. (2022), *Science Advances* 8:eabj9496, "Modern human incursion into Neanderthal territories 54,000 years ago at Mandrin, France" — DOI: 10.1126/sciadv.abj9496
- **Wikipedia:** https://en.wikipedia.org/wiki/Grotte_Mandrin

### Peștera cu Oase 1, Romania — 37–42 ka

- **Location:** Anina Mountains, southwestern Romania (~45.02°N, 21.85°E)
- **Description:** Modern-human mandible (and later cranium "Oase 2"). The Oase 1 genome (Fu et al. 2015) carries **6–9 % Neanderthal ancestry** in unusually long, unbroken segments, implying a Neanderthal ancestor four to six generations back. The most direct fossil-genomic evidence yet that AMH–Neanderthal admixture happened *in Europe at contact*, not just once in the Levant. Oase 1 left no detectable descendants in present-day Europeans — a separate, unsuccessful early-AMH lineage.
- **Primary paper:** Fu et al. (2015), *Nature* 524:216–219, "An early modern human from Romania with a recent Neanderthal ancestor" — DOI: 10.1038/nature14558
- **Wikipedia:** https://en.wikipedia.org/wiki/Pe%C8%99tera_cu_Oase

---

## 12. East Asia peopling — ~40 ka onward

### Tianyuan Cave, China — ~40 ka

- **Location:** near Beijing (~39.69°N, 115.86°E)
- **Description:** Oldest ancient genome from East Asia. Tianyuan Man is related to but not directly ancestral to present-day East Asians; shares a genetic signal with a 35 ka Belgian individual (Goyet Q116-1), implying shared structure across early Eurasian populations.
- **Primary paper:** Yang, Gao, Theunert et al. (2017), *Current Biology* 27:3202–3208 — DOI: 10.1016/j.cub.2017.09.030
- **Wikipedia:** https://en.wikipedia.org/wiki/Tianyuan_man

---

## 13. Beringia and the Americas

### Beringian standstill — ~25–16 ka

- **Description:** Mitochondrial and genomic evidence (Tamm et al. 2007; Moreno-Mayar et al. 2018) shows ancestors of Native Americans were isolated in Beringia for several thousand years before expansion south of the ice sheets. Founding population diverged into Northern and Southern Native American branches ~17.5–14.6 ka.
- **Primary papers:**
  - Tamm et al. (2007), *PLOS ONE* 2:e829 — DOI: 10.1371/journal.pone.0000829
  - Moreno-Mayar et al. (2018), *Nature* 553:203–207 — DOI: 10.1038/nature25173
- **Wikipedia:** https://en.wikipedia.org/wiki/Settlement_of_the_Americas

### White Sands footprints, New Mexico — ~21–23 ka

- **Location:** White Sands NP, New Mexico (~32.78°N, 106.17°W)
- **Description:** Human footprints in lake-margin sediments; if correctly dated, places people in the interior continent during the Last Glacial Maximum. Initial Ruppia-seed dates challenged because of reservoir effects; OSL on quartz and pollen radiocarbon (Pigati et al. 2023) confirm ~21–23 ka.
- **Primary papers:**
  - Bennett et al. (2021), *Science* 373:1528–1531 — DOI: 10.1126/science.abg7586
  - Pigati et al. (2023), *Science* 382:73–75 — DOI: 10.1126/science.adh5007
- **Wikipedia:** https://en.wikipedia.org/wiki/White_Sands_fossil_footprints

### Chiquihuite Cave, Mexico — ~26–33 ka (contested)

- **Location:** Zacatecas, Mexico (~24.2°N, 102.0°W)
- **Description:** ~1,900 stone artifacts in stratified layers dated to LGM and earlier. Critics argue the "tools" may be geofacts.
- **Primary paper:** Ardelean et al. (2020), *Nature* 584:87–92 — DOI: 10.1038/s41586-020-2509-0
- **Wikipedia:** https://en.wikipedia.org/wiki/Chiquihuite_cave

### Monte Verde II, Chile — ~14.5 ka (contested; mid-Holocene reassessment 2025)

- **Location:** southern Chile (~41.51°S, 73.20°W)
- **Description:** For three decades the best-accepted pre-Clovis site; preserved organic structures, plant remains, masticated quids. Dillehay et al. (2015) reported additional artifacts in deeper layers dating to ~18.5 ka. A 2025 reassessment by Surovell et al. (*Science*) proposed a far younger **mid-Holocene age (~4.2–8.2 ka)** based on new ¹⁴C and sedimentological work, which would remove Monte Verde from the pre-Clovis record entirely. Dillehay and the original team contest this. The dispute is unresolved as of mid-2025; treat date as **debated**.
- **Primary papers:**
  - Dillehay et al. (2015), *PLOS ONE* 10:e0141923 — DOI: 10.1371/journal.pone.0141923
  - Surovell et al. (2025), *Science* 388:eadk5081, "A mid-Holocene age for Monte Verde challenges the timeline of human colonization of South America" — DOI: 10.1126/science.adk5081
- **Wikipedia:** https://en.wikipedia.org/wiki/Monte_Verde

### Clovis culture — 13,050–12,750 cal BP

- **Description:** Distinctive fluted points across North America; once thought "first Americans" but now post-dates several pre-Clovis sites. Brief 300-year horizon.
- **Primary paper:** Waters, Stafford & Carlson (2020), *Science Advances* 6:eaaz0455 — DOI: 10.1126/sciadv.aaz0455
- **Wikipedia:** https://en.wikipedia.org/wiki/Clovis_culture

---

## 14. Pacific / Polynesia

### Lapita expansion — ~3.3–2.8 ka

- **Location:** Bismarck Archipelago → Solomons → Vanuatu → Fiji → Samoa/Tonga
- **Description:** Distinctive dentate-stamped pottery; Austronesian-speaking ancestors of Polynesians spread rapidly from Near Oceania into Remote Oceania (~1500–800 BCE), reaching Western Polynesia by ~2.8 ka.
- **Primary paper:** Skoglund et al. (2016), *Nature* 538:510–513 — DOI: 10.1038/nature19844
- **Wikipedia:** https://en.wikipedia.org/wiki/Lapita_culture

### East Polynesia and Aotearoa / New Zealand — ~1200–1280 CE

- **Description:** After a long pause in Western Polynesia, rapid eastward expansion settled the Cook Islands, Society Islands, Marquesas, Hawaiʻi, Rapa Nui (~1200 CE), and finally Aotearoa / New Zealand. Wilmshurst et al. 2011 PNAS modeled the New Zealand colonization to a tight window of ~1230–1280 CE based on rat-gnawed seeds and a high-precision ¹⁴C compilation. The "1280 CE" figure widely quoted is the upper bound of this window, not a point date — encode as range.
- **Primary paper:** Wilmshurst et al. (2011), *PNAS* 108:1815–1820 — DOI: 10.1073/pnas.1015876108
- **Wikipedia:** https://en.wikipedia.org/wiki/Polynesia
- **Reference:** Te Ara, "Pacific migrations" — https://teara.govt.nz/en/pacific-migrations

---

## 15. Madagascar — ~1–1.5 ka

- **Location:** Madagascar (~18.8°S, 47.5°E)
- **Description:** Last major landmass settled by humans. Linguistic and genomic evidence (Pierron et al. 2014, 2017) shows founding admixture between Austronesian-speaking groups (closest affinity to Banjar/SE Borneo) and Bantu-speaking East Africans ~1,000 years ago. Earliest archaeological evidence (Austronesian crop remains) from Crowther et al. 2016.
- **Primary papers:**
  - Crowther et al. (2016), *PNAS* 113:6635–6640 — DOI: 10.1073/pnas.1522714113
  - Pierron et al. (2017), *PNAS* 114:E6498–E6506 — DOI: 10.1073/pnas.1704906114
- **Wikipedia:** https://en.wikipedia.org/wiki/Malagasy_people
- **Video:** TODO: verify a credible educational video on Madagascar peopling.

---

## Competing / refined models

- **Single major Out-of-Africa with minor earlier traces:** Mallick et al. 2016, Pagani et al. 2016, Malaspinas et al. 2016. Consensus position. ~70–50 ka main wave; small (~2%) Papuan signal of an earlier (~120 ka) dispersal.
- **Multiple-dispersal model:** Earlier waves (Misliya, Skhul/Qafzeh, possibly Apidima, Fuyan, Pagani's 2% signal) reached Eurasia but largely went extinct or were demographically swamped. The "successful" dispersal happened ~70–50 ka.
- **African multiregional model (Scerri et al. 2018):** *H. sapiens* evolved as a metapopulation of semi-isolated subdivided groups across the African continent, periodically mixing as climate-driven habitat connections appeared and broke. Replaces the single-origin-in-East-Africa picture with a pan-African network.
  - Scerri et al. (2018), *Trends in Ecology & Evolution* 33:582–594 — DOI: 10.1016/j.tree.2018.05.005
- **2025 niche-expansion hypothesis (Hallett, Leonardi et al. 2025):** The successful Out-of-Africa wasn't a sudden punch-out but the consequence of a within-Africa expansion of bioclimatic niche breadth from ~70 ka, giving humans the ecological flexibility to colonize anything beyond.
  - DOI: 10.1038/s41586-025-09154-0

---

## Open questions / debated points

- **Apidima 1's identity and date.** Some morphometric reanalyses dispute the *H. sapiens* assignment; if it's archaic the European chronology resets.
- **Florisbad's true age.** Single ESR date with site-history complications; could be substantially younger than 259 ka.
- **Fuyan / Daoxian dating.** Critics argue the U-Th dates may be ceilings, not minima; minimum age may be ~70 ka rather than ~80–120 ka.
- **Toba's actual demographic impact.** Climate impact appears regional and short-lived; the genetic-bottleneck-from-Toba story is largely abandoned, but some still debate fine-scale effects in South Asia.
- **Pre-LGM Americas.** White Sands footprints now better-confirmed (~21–23 ka), but Chiquihuite, Bluefish Caves, and other sites remain disputed (geofact vs artifact, contamination, reworking). The genetic signal still points to a single founding population diverging ~25 ka.
- **Single vs. multiple Out-of-Africa.** Whether the Pagani/Malaspinas Papuan signal represents a real earlier dispersal or a methodological artifact is not fully settled.
- **Western/Northern route into Europe.** Grotte Mandrin (France ~54 ka, Slimak et al. 2022) and Bacho Kiro (~45 ka) suggest at least two independent *H. sapiens* incursions into Europe before the established Aurignacian wave.
- **Aotearoa exact founding date.** Modeled to 1280 CE with a tight ±20 yr window, but exact landfall island and number of founding canoes still discussed.
- **Madagascar founding population size and route.** Genetic founder estimated as a few dozen individuals, but the journey route (direct vs. via East Africa) is unresolved.

---

---

# Cross-cutting layer A — Stone tool industries & material cultures

Industries are **not points on the map** — they are extended traditions that span thousands of years and (often) continents. The visualization should treat them as a separate layer: a horizontal band on the timeline, optionally shaded across the geographic regions where they occur. Tagged **[species-defining]** when one hominin made them almost exclusively, **[regional-cultural]** for regional variants within *H. sapiens*.

## Pre-Out-of-Africa African industries

### Lomekwian (~3.3 Ma) — [pre-Homo, contested]

- Lomekwi 3, west of Lake Turkana, Kenya. Predates *Homo* by ~700 kyr; likely *Australopithecus* or *Kenyanthropus platyops*.
- Paper: Harmand et al. (2015), *Nature* 521:310 — DOI: 10.1038/nature14464
- Wikipedia: https://en.wikipedia.org/wiki/Lomekwi
- Video: PBS Eons, "When We First Made Tools" — https://www.pbs.org/video/when-we-first-made-tools-yhbtsm/

### Oldowan (~2.6–1.7 Ma) — [genus *Homo*, early]

- Sub-Saharan Africa initially; later sporadically out of Africa with *H. erectus*. Mode 1: simple cores, choppers, expedient flakes.
- Paper: Semaw et al. (2003), *J. Hum. Evol.* 45:169 — DOI: 10.1016/S0047-2484(03)00093-9
- Wikipedia: https://en.wikipedia.org/wiki/Oldowan

### Acheulean (~1.76 Ma – 130 ka) — [*H. erectus* / *H. heidelbergensis*]

- The handaxe revolution. Mode 2 bifaces; first industry to leave Africa with *H. erectus* (Dmanisi). Persisted >1.5 Myr — longest-running tool tradition in human history.
- Paper: Lepre et al. (2011), *Nature* 477:82 — DOI: 10.1038/nature10372
- Wikipedia: https://en.wikipedia.org/wiki/Acheulean

### Levallois / prepared-core (~400–300 ka onset) — [transitional]

- The conceptual leap: shape the core *first* so the final flake's geometry is predetermined. Mode 3. Adopted *in parallel* by African MSA peoples and by Neanderthals (Mousterian).
- Paper: Adler et al. (2014), *Science* 345:1609 — DOI: 10.1126/science.1256484
- Wikipedia: https://en.wikipedia.org/wiki/Levallois_technique

### Mousterian (~300–40 ka) — [Neanderthal]

- Western Eurasia, Levant, North Africa. End-date coincides with Neanderthal extinction.
- Paper: Higham et al. (2014), *Nature* 512:306 — DOI: 10.1038/nature13621
- Wikipedia: https://en.wikipedia.org/wiki/Mousterian

### Aterian (~145–30 ka) — [*H. sapiens*, North Africa]

- Distinctive *tanged* points — earliest hafted projectiles in the world. Hafting indicates composite-tool cognition.
- Paper: Richter et al. (2017), *Nature* 546:293 — DOI: 10.1038/nature22335 (Jebel Irhoud age + MSA origins)
- Wikipedia: https://en.wikipedia.org/wiki/Aterian

### Still Bay (~75–72 ka) — [*H. sapiens*, southern Africa]

- Bifacial leaf-shaped points + the symbolic-behavior package: engraved ochre, ochre-processing kits, *Nassarius* shell beads at Blombos.
- Paper: Henshilwood et al. (2011), *Science* 334:219 — DOI: 10.1126/science.1211535 (ochre workshop)
- Companion: Jacobs et al. (2008), *Science* 322:733 — DOI: 10.1126/science.1162219
- Wikipedia: https://en.wikipedia.org/wiki/Still_Bay

### Howiesons Poort (~65–60 ka) — [*H. sapiens*, southern Africa]

- Backed microliths, hafted composite weapons, heat-treated silcrete. Coincides with the proposed southern-route dispersal window.
- Paper: Brown et al. (2009), *Science* 325:859 — DOI: 10.1126/science.1175028 (heat treatment)
- Wikipedia: https://en.wikipedia.org/wiki/Howiesons_Poort

### Schöninger Speere (~300 ka) — [*H. heidelbergensis*]

- Eight wooden throwing spears + butchered horses, Schöningen, Lower Saxony. Oldest preserved hunting weapons; demonstrates planning, cooperative hunting in pre-sapiens hominins. Not lithic, but a critical material-culture data point because preserved wood is so rare.
- Paper: Thieme (1997), *Nature* 385:807 — DOI: 10.1038/385807a0
- Wikipedia: https://en.wikipedia.org/wiki/Sch%C3%B6ningen_spears

## Out-of-Africa transition

### Initial Upper Paleolithic / IUP (~50–45 ka) — [*H. sapiens*, dispersal marker]

- Bacho Kiro (Bulgaria), Boker Tachtit (Israel), and into Mongolia/N China. Transitional blade-and-point assemblages on Levallois-derived cores. The first *archaeological* trace of the modern-human Eurasian dispersal.
- Paper: Hublin et al. (2020), *Nature* 581:299 — DOI: 10.1038/s41586-020-2259-z
- Wikipedia: https://en.wikipedia.org/wiki/Initial_Upper_Paleolithic

### Châtelperronian (~45–40 ka) — [Neanderthal, contested]

- Late Neanderthal industry with UP-style elements (backed knives, bone tools, ornaments). Independent invention vs. *sapiens* influence vs. stratigraphic mixing — all still debated.
- Paper: Hublin et al. (1996), *Nature* 381:224 — DOI: 10.1038/381224a0
- Wikipedia: https://en.wikipedia.org/wiki/Ch%C3%A2telperronian

## European Upper Paleolithic sequence

### Aurignacian (~43–26 ka)

- First continent-wide modern-human industry in Europe. Hohle Fels Venus and Löwenmensch are Aurignacian.
- Paper: Higham et al. (2011), *Nature* 479:521 — DOI: 10.1038/nature10617
- Wikipedia: https://en.wikipedia.org/wiki/Aurignacian

### Gravettian (~33–21 ka)

- Western Europe to the Russian Plain (Kostenki, Sungir, Dolní Věstonice). Venus figurines, mammoth-bone dwellings, continental-scale stylistic uniformity.
- Wikipedia: https://en.wikipedia.org/wiki/Gravettian

### Solutrean (~22–17 ka)

- France and Iberia *only*. Pressure-flaked laurel-leaf points. The "Solutrean hypothesis" for the Americas has been **rejected by ancient-DNA evidence** for Beringian Native American ancestry.
- Paper: Cascalheira & Bicho (2015), *PLOS ONE* 10:e0137308 — DOI: 10.1371/journal.pone.0137308
- Wikipedia: https://en.wikipedia.org/wiki/Solutrean

### Magdalenian (~17–12 ka)

- Western Europe; post-LGM recolonization. Period of Lascaux, Altamira, Niaux. Microlithic backed bladelets, antler harpoons, atlatls.
- Wikipedia: https://en.wikipedia.org/wiki/Magdalenian

### Epigravettian (~21–10 ka)

- Italy, Balkans, Eastern Europe — the Mediterranean/eastern successor of the Gravettian during/after LGM.
- Wikipedia: https://en.wikipedia.org/wiki/Epigravettian

## Asian / Australian / American industries

### Hoabinhian (~43.5–4 ka)

- Mainland Southeast Asia. Unifacial pebble "sumatraliths"; persisted right through the Holocene.
- Paper: Forestier et al. (2015), *J. Archaeological Sci.: Reports* 3:194 — TODO: verify DOI
- Wikipedia: https://en.wikipedia.org/wiki/Hoabinhian

### South Asian microliths (~35 ka, post-Toba)

- Geometric backed microliths in composite tools. Marker of expanding *H. sapiens* groups along the southern dispersal route.
- Paper: Mellars et al. (2013), *PNAS* 110:10699 — DOI: 10.1073/pnas.1306043110
- Wikipedia: https://en.wikipedia.org/wiki/South_Asian_Stone_Age

### Madjedbebe ground-edge hatchets (~65 ka)

- Already covered as a settlement milestone; called out here as the **earliest ground-edge stone hatchets in the world**, plus grinding stones, ground ochre, reflective mica.
- Paper: Clarkson et al. (2017), *Nature* 547:306 — DOI: 10.1038/nature22968

### Western Stemmed (~16–9 ka)

- Pacific Northwest / Great Basin. **Predates Clovis** at Cooper's Ferry; supports a Pacific-coastal entry into the Americas before the ice-free corridor opened.
- Paper: Davis et al. (2019), *Science* 365:891 — DOI: 10.1126/science.aax9830
- Wikipedia: https://en.wikipedia.org/wiki/Western_Stemmed_Tradition
- Video: NOVA / PBS — https://www.pbs.org/wgbh/nova/article/coopers-ferry-first-americans/

### Clovis (13.05–12.75 ka cal BP)

- Already covered. Material-culture entry: fluted lanceolate points, mammoth-kill specialism, ~300-year continental horizon.
- Paper: Waters et al. (2020), *Sci. Adv.* 6:eaaz0455 — DOI: 10.1126/sciadv.aaz0455
- Video: PBS, "First Peoples: The Clovis Point" — https://www.pbs.org/video/first-peoples-clovis-point-first-american-invention/

### Folsom (~12.9–11.8 ka cal BP)

- Great Plains. Smaller, more delicately fluted points than Clovis; bison-kill specialism after mammoth extinction. Type site discovery (1908) was the first proof of Pleistocene humans in the Americas.
- Wikipedia: https://en.wikipedia.org/wiki/Folsom_tradition

## Pacific

### Lapita pottery (~3.3–2.5 ka BP)

- Already covered. As a material-culture marker: dentate-stamped earthenware with intricate geometric/anthropomorphic designs. Tracks the last great human expansion into uninhabited land.
- Paper: Kirch (2001), *PNAS* 98:8455 — DOI: 10.1073/pnas.181335398
- Wikipedia: https://en.wikipedia.org/wiki/Lapita_culture

## Major technological transitions (visualization backbone)

1. **Lomekwian → Oldowan (~3.3 → ~2.6 Ma):** tool-making predates *Homo*. The genus emerges into a behavioral niche that already existed.
2. **Oldowan → Acheulean (~1.7 Ma):** the handaxe revolution. *H. erectus* exports anatomy *and* technology out of Africa.
3. **Acheulean → Levallois / MSA / Mousterian (~300 ka):** prepared-core thinking emerges *in parallel* in Africa and Eurasia. Same period as the first incontrovertible *H. sapiens* (Jebel Irhoud) and Schöninger Speere in Europe.
4. **MSA → Upper Paleolithic (~50 ka), the so-called "Upper Paleolithic Revolution":** blade industries, bone tools, ornaments, figurative art, projectile hafting. Coincides with successful *H. sapiens* dispersal, IUP signature, Neanderthal extinction.
   - **Modern critique:** most "UP package" features (hafting, microliths, ochre, beads) appear individually in **African MSA contexts tens of millennia earlier** (Still Bay, Howiesons Poort, Aterian, Pinnacle Point heat treatment). The "Revolution" was less a sudden cognitive jump than an *integration and demographic amplification* of pre-existing behaviors.

---

# Cross-cutting layer B — Art & symbolic behavior

The traditional "Human Revolution" model (Klein, Mellars) placed the onset of fully modern symbolic cognition in Europe ~40–50 ka — the Aurignacian "creative explosion." That model is dead. The last 25 years dismantled it on three fronts: African deep antiquity (Blombos), Neanderthal symbolic behavior (Hoffmann 2018 Iberia), and Sulawesi/Borneo as the other pole of figurative art.

## Africa — symbolic behavior before/around Out-of-Africa

### Blombos Cave engraved ochres (~75–77 ka)

- Western Cape, South Africa (~34.41°S, 21.22°E). Two pieces of red ochre with cross-hatched engravings. Earliest widely-accepted abstract symbolic engraving.
- Paper: Henshilwood et al. (2002), *Science* 295:1278 — DOI: 10.1126/science.1067575
- Wikipedia: https://en.wikipedia.org/wiki/Blombos_Cave

### Blombos abstract drawing on silcrete (~73 ka)

- Same site. A ground silcrete flake bearing a deliberately drawn cross-hatched pattern in red ochre. Predates the next-oldest drawings by ~30 kyr.
- Paper: Henshilwood et al. (2018), *Nature* 562:115 — DOI: 10.1038/s41586-018-0514-3

### Blombos *Nassarius* shell beads (~75 ka)

- 41 perforated tick-shell beads with stringing wear — among the earliest secure personal ornaments.
- Paper: Henshilwood et al. (2004), *Science* 304:404 — DOI: 10.1126/science.1095905

### Diepkloof engraved ostrich eggshells (~60 ka)

- Western Cape, South Africa. 270 fragments of intentionally engraved ostrich eggshell flasks. Earliest reliable evidence of a sustained engraving *tradition* (transmitted across generations).
- Paper: Texier et al. (2010), *PNAS* 107:6180 — DOI: 10.1073/pnas.0913047107
- Wikipedia: https://en.wikipedia.org/wiki/Diepkloof_Rock_Shelter

### Pinnacle Point heat-treated silcrete (~164–72 ka)

- Mossel Bay, South Africa. Controlled use of fire to alter raw-material properties — multi-step planning, analogical reasoning. Folded into the modern-cognition bundle.
- Paper: Brown et al. (2009), *Science* 325:859 — DOI: 10.1126/science.1175028
- Wikipedia: https://en.wikipedia.org/wiki/Pinnacle_Point

### Apollo 11 Cave painted slabs (~25–30 ka)

- Southern Namibia. Seven painted quartzite slabs depicting animals — earliest figurative mobile art known from Africa.
- Paper: Wendt 1970s — pre-DOI; **TODO: verify modern reanalysis**
- Wikipedia: https://en.wikipedia.org/wiki/Apollo_11_Cave

## Neanderthal symbolic behavior

### La Pasiega / Maltravieso / Ardales cave markings (>64.8 ka) — **contested**

- Cantabria, Extremadura, Andalucía. Red linear motif (La Pasiega), hand stencil (Maltravieso), painted speleothems (Ardales) — sealed under datable flowstones. Predate *sapiens* arrival in Iberia by ~20 kyr → Neanderthal-authored if dates and association hold. Originally framed as a major reframing of "symbolic = sapiens-only."
- **Status: contested.** Substantial pushback in the literature: Pearce & Bonneau (2018) *Quaternary International*; Slimak et al. (2018) *Journal of Human Evolution* "Comment on 'U-Th dating of carbonate crusts...'"; White et al. (2020) *Journal of Human Evolution* "Still no archaeological evidence that Neanderthals created Iberian cave art." Critiques target (a) U-Th open-system effects in cave carbonates and (b) the spatial association between the dated crusts and the underlying pigment. The pigment may genuinely be old, the painting-act may not be. Treat as `debated: true`.
- Paper: Hoffmann et al. (2018), *Science* 359:912 — DOI: 10.1126/science.aap7778
- Critiques: White et al. (2020), *J. Hum. Evol.* 144:102640 — DOI: 10.1016/j.jhevol.2019.102640 (verify); Slimak et al. (2018), *J. Hum. Evol.* (citation to verify)
- Wikipedia: https://en.wikipedia.org/wiki/Cave_of_Maltravieso

### Cueva de los Aviones perforated, pigmented marine shells (~115–120 ka) — **contested**

- Cartagena, Murcia, Spain. Perforated *Acanthocardia* / *Glycymeris* shells with ochre/pigment residues. Originally interpreted as Neanderthal personal ornaments and pigment recipes ~40 kyr before the comparable *sapiens* package.
- **Status: contested.** Same U-Th open-system critique as the Hoffmann 2018 cave-art paper applies; in addition the stratigraphic association between the pigmented shells and the dated crusts has been questioned. Treat as `debated: true`.
- Paper: Hoffmann et al. (2018), *Science Advances* 4:eaar5255 — DOI: 10.1126/sciadv.aar5255
- Critique: White et al. (2020), *J. Hum. Evol.* 144:102640 (covers both Hoffmann 2018 papers)
- Wikipedia: https://en.wikipedia.org/wiki/Cueva_de_los_Aviones

## Asia — Sulawesi & Borneo (oldest figurative art)

### Leang Karampuang narrative scene (≥51.2 ka)

- Maros-Pangkep karst, South Sulawesi, Indonesia. Three human-like figures interacting with a wild pig — earliest known *narrative* scene and arguably earliest figurative art.
- Paper: Oktaviana et al. (2024), *Nature* 631:814 — DOI: 10.1038/s41586-024-07541-7

### Leang Tedongnge Sulawesi warty pig (≥45.5 ka)

- South Sulawesi. Life-sized red painting of *Sus celebensis*. Before the 2024 Karampuang redate, this was the oldest known representational animal image.
- Paper: Brumm et al. (2021), *Science Advances* 7:eabd4648 — DOI: 10.1126/sciadv.abd4648
- Wikipedia: https://en.wikipedia.org/wiki/Leang_Tedongnge

### Lubang Jeriji Saléh Borneo figurative animal (≥40 ka)

- East Kalimantan, Indonesian Borneo. Reddish-orange figurative animal (likely banteng) plus phases of hand stencils. Demonstrates early figurative art across Wallacea/Sundaland — picture is no longer Eurocentric.
- Paper: Aubert et al. (2018), *Nature* 564:254 — DOI: 10.1038/s41586-018-0679-9
- Wikipedia: https://en.wikipedia.org/wiki/Lubang_Jeriji_Sal%C3%A9h

### Maros (Leang Timpuseng) — original Sulawesi dating (≥39.9 ka)

- The 2014 paper that first overturned the Eurocentric view of figurative art.
- Paper: Aubert et al. (2014), *Nature* 514:223 — DOI: 10.1038/nature13422

### Sulawesi/Muna hand stencil (≥67.8 ka)

- Liang Metanduno, Muna Island, Indonesia. LA-U-series minimum age (71.6 ± 3.8 ka on overlying calcite) gives a 67.8 ka minimum-age constraint for the underlying hand stencil. Currently the **oldest reliably dated rock art on Earth.**
- Paper: Aubert, Brumm, Oktaviana et al. (2025/2026), *Nature*, "Rock art from at least 67,800 years ago in Sulawesi" — DOI: 10.1038/s41586-025-09968-y

## Europe — Aurignacian and later

### El Castillo red disk (≥40.8 ka)

- Cantabria, Spain. Pike et al. — at the time of publication, the oldest dated cave art in Europe.
- Paper: Pike et al. (2012), *Science* 336:1409 — DOI: 10.1126/science.1219957
- Wikipedia: https://en.wikipedia.org/wiki/Cave_of_El_Castillo

### Hohle Fels Venus (~35–40 ka)

- Schwabian Jura, Germany. 6 cm mammoth-ivory figurine — earliest unambiguous human-figure representation.
- Paper: Conard (2009), *Nature* 459:248 — DOI: 10.1038/nature07995
- Wikipedia: https://en.wikipedia.org/wiki/Venus_of_Hohle_Fels

### Löwenmensch / Lion-man of Hohlenstein-Stadel (~40 ka)

- Lone Valley, Schwabian Jura. 31 cm mammoth-ivory composite figure (man with cave-lion head) — earliest known therianthrope.
- Paper: Kind et al. (2014), *Quartär* 61 — **TODO: verify DOI**
- Wikipedia: https://en.wikipedia.org/wiki/Lion-man

### Hohle Fels bone & ivory flutes (~42 ka)

- Same site. Five-finger-hole flute on a griffon vulture radius + mammoth-ivory flute fragments — earliest secure musical instruments.
- Paper: Conard, Malina, Münzel (2009), *Nature* 460:737 — DOI: 10.1038/nature08169
- Refined dating: Higham et al. (2012), *J. Hum. Evol.* 62:664 — DOI: 10.1016/j.jhevol.2012.03.003

### Chauvet-Pont d'Arc (~37–28 ka, two phases)

- Ardèche, France. Hundreds of figurative paintings of stunning sophistication. Refutes "primitive-to-sophisticated" gradualism.
- Paper: Quiles et al. (2016), *PNAS* 113:4670 — DOI: 10.1073/pnas.1523158113
- Wikipedia: https://en.wikipedia.org/wiki/Chauvet_Cave
- Video: Werner Herzog, "Cave of Forgotten Dreams" (2010) — https://en.wikipedia.org/wiki/Cave_of_Forgotten_Dreams

### Cosquer Cave (~27 ka and ~19 ka)

- Calanque de la Triperie, Marseille. Entrance now 37 m below sea level. 500+ paintings/engravings.
- Paper: Valladas et al. — **TODO: verify DOI**
- Wikipedia: https://en.wikipedia.org/wiki/Cosquer_Cave

### Altamira (~36.2–15.2 ka, multi-phase)

- Cantabria, Spain. Famous polychrome bison ceiling + much older Aurignacian-era claviforms. Single cave repainted over 20+ millennia.
- Paper: Pike et al. (2012), *Science* 336:1409 — DOI: 10.1126/science.1219957 (includes Altamira dates)
- Wikipedia: https://en.wikipedia.org/wiki/Cave_of_Altamira

### Lascaux (~17–22 ka)

- Dordogne, France. ~600 painted and ~1,500 engraved figures, including the Hall of the Bulls. Iconic Magdalenian site.
- Paper: Ducasse & Langlais (2020), *PALEO* 30 — **TODO: verify DOI**
- Wikipedia: https://en.wikipedia.org/wiki/Lascaux

### Pech Merle (~25 ka)

- Lot, France. The Spotted Horses panel — leopard-spotted horses with hand stencils. Ancient-DNA work (Pruvost 2011 PNAS) showed real spotted horses *did* exist.
- Wikipedia: https://en.wikipedia.org/wiki/Pech_Merle

## Sahul / Australia

### Madjedbebe ground ochre and pigment use (~65 ka)

- Already covered. As a symbolic-behavior entry: abundant ground ochre and ground-edge stone tools — earliest pigment-processing in Sahul, contemporary with the founding population of Australia.
- Paper: Clarkson et al. (2017), *Nature* 547:306 — DOI: 10.1038/nature22968
- Video: PBS Eons, "How Ancient Art Captured Australian Megafauna" — https://www.pbs.org/video/how-ancient-art-captured-australian-megafauna-xruzmm/

### Nawarla Gabarnmang (~35 ka site, ~28 ka panel)

- Jawoyn Country, southwestern Arnhem Land. Multi-millennial painted ceiling site; ground-edge axe fragment ~35 ka. Sahul rock-art tradition broadly contemporary with European Aurignacian art.
- Paper: Geneste et al. 2012; David et al. 2013 — **TODO: verify DOIs**
- Wikipedia: https://en.wikipedia.org/wiki/Gabarnmung

### Gwion Gwion (Bradshaw) paintings (~12 ka, outliers ≥16–17 ka)

- Kimberley, Western Australia. Highly stylized human figures with elaborate dress. Dating breakthrough: carbon in mud-wasp nests bracketing the paintings.
- Paper: Finch et al. (2020), *Science Advances* 6:eaay3922 — DOI: 10.1126/sciadv.aay3922
- Wikipedia: https://en.wikipedia.org/wiki/Gwion_Gwion_rock_paintings

## Net for the visualization

Symbolic behavior is **not** the marker of a single dispersal pulse out of Africa. It is already in place in Africa before the successful dispersal (Blombos, Diepkloof, Pinnacle Point), present in contemporary Neanderthals in Europe (Hoffmann 2018), and full-blown figurative art is present in Wallacea at least as early as in Europe (Sulawesi, Borneo). The expansion of *sapiens* carried an existing symbolic toolkit; it didn't *acquire* one in Europe.

---

# Cross-cutting layer C — Faces, bones, and what they looked like

Iconic skeletons and (where known) ancient-DNA-based pigmentation predictions. Some entries are also referenced in Migration Sections 1–15 above; the angle here is **what the person was like and what we can show of them.**

> **Reconstructions are interpretive.** The same skull, given to Élisabeth Daynès, Tom Björklund, John Gurche, the Kennis brothers (Adrie & Alfons), Mikhail Gerasimov, Cícero Moraes, or Maayan Harel, will yield visibly different faces. Soft-tissue depth tables, hair, skin tone, expression, eye color, and styling are educated extrapolations — not data. Always credit the reconstructor and the institution holding the rights.

## Australopithecus / pre-Homo (background)

### Lucy (AL 288-1) — ~3.2 Ma

- Hadar, Afar, Ethiopia (~11.13°N, 40.58°E). *Australopithecus afarensis*. ~40% of one female skeleton; ~1.05 m tall, ~28 kg. Small ape-sized braincase + bipedal post-cranium; arms still relatively long, fingers curved (some arboreal capacity). Far too old for DNA.
- Wikipedia: https://en.wikipedia.org/wiki/Lucy_(Australopithecus)
- Reconstruction: John Gurche (Cleveland Museum of Natural History; Smithsonian Hall of Human Origins); Élisabeth Daynès also has one.

### Selam / Dikika child (DIK-1/1) — ~3.3 Ma

- Dikika, Afar, Ethiopia. Juvenile *A. afarensis*; ~3 years old. Hyoid bone preserved. Mosaic morphology — modern human-like lower body, ape-like upper body and shoulder blade.
- Paper: Alemseged et al. (2006), *Nature* 443:296 — DOI: 10.1038/nature05047
- Wikipedia: https://en.wikipedia.org/wiki/Selam_(Australopithecus)

## Early *Homo*

### Turkana Boy / Nariokotome Boy (KNM-WT 15000) — ~1.5–1.6 Ma

- Nariokotome, west of Lake Turkana, Kenya. *H. erectus* / *H. ergaster*; ~8–12 years old. Most complete early *Homo* skeleton (108 bones). Already ~1.6 m tall as an adolescent, projected adult ~1.85 m. Linear, tropical body proportions; cranial capacity ~880 cc.
- Paper: Brown, Harris, Leakey & Walker (1985), *Nature* 316:788 — https://www.nature.com/articles/316788a0
- Wikipedia: https://en.wikipedia.org/wiki/Turkana_Boy
- Reconstruction: Élisabeth Daynès; John Gurche.

### Dmanisi Skull 5 — ~1.77–1.85 Ma

- Dmanisi, Georgia. Small braincase (~546 cc), large prognathic face. Five Dmanisi individuals together show enormous variation, supporting the argument that early African + Asian *Homo* fossils may belong to a single evolving species.
- Paper: Lordkipanidze et al. (2013), *Science* 342:326 — DOI: 10.1126/science.1238484
- Wikipedia: https://en.wikipedia.org/wiki/Dmanisi_skull_5
- Reconstruction: Élisabeth Daynès at the Georgian National Museum, Tbilisi.

## Middle Pleistocene

### Sima de los Huesos (Atapuerca) — ~430 ka

- Sierra de Atapuerca, Spain. ≥28 individuals at the bottom of a 13 m shaft. Robust, large-faced, large-browed; cranial capacities approaching modern range. Nuclear DNA places the population on the **Neanderthal lineage** after the split from Denisovans.
- Paper: Meyer et al. (2016), *Nature* 531:504 — DOI: 10.1038/nature17405
- Wikipedia: https://en.wikipedia.org/wiki/Sima_de_los_Huesos
- Reconstruction: Élisabeth Daynès at Museo de la Evolución Humana, Burgos.

### Kabwe / Broken Hill (Kabwe 1) — 299 ± 25 ka

- Kabwe, Zambia. Massive cranium with the biggest brow ridges of any known hominin and modern dental cavities. Variously called *H. heidelbergensis* / *H. rhodesiensis*. Redating implies multiple hominin lineages co-existed in late-Middle-Pleistocene Africa.
- Paper: Grün et al. (2020), *Nature* 580:372 — DOI: 10.1038/s41586-020-2165-4
- Wikipedia: https://en.wikipedia.org/wiki/Broken_Hill_1

## Neanderthals — iconic finds

### La Chapelle-aux-Saints "Old Man" (LCS-1) — ~50 ka

- Corrèze, France. Older adult, severe arthritis, missing most teeth. Famously misreconstructed by Marcellin Boule (1911–13) as stooped and ape-like — Straus & Cave (1957) showed posture was essentially modern, with Boule's distortion partly due to the individual's osteoarthritis.
- Wikipedia: https://en.wikipedia.org/wiki/La_Chapelle-aux-Saints_1
- Reconstruction: Kennis brothers; Daynès.

### Shanidar 1 / Shanidar 4 / Shanidar Z — ~45–65 ka

- Zagros Mountains, Iraqi Kurdistan. Shanidar 1 is the famous "disabled survivor" — fused right elbow (likely amputated forearm), crushed left orbit (probably blind in left eye), healed fractures — yet lived to ~40–50, suggesting group support. Shanidar 4 is the contested "flower burial." Shanidar Z (excavated 2018) gave new articulated upper-body remains.
- Paper: Pomeroy et al. (2020), *Antiquity* 94:11 — DOI: 10.15184/aqy.2019.207
- Wikipedia: https://en.wikipedia.org/wiki/Shanidar_Cave
- Reconstruction: Shanidar Z facial reconstruction by the Kennis brothers, featured in Netflix's "Secrets of the Neanderthals" (2024).

### Gibraltar 1 (Forbes' Quarry) — ~50–70+ ka

- Gibraltar. Adult female Neanderthal cranium. **First adult Neanderthal skull ever found** — presented 1848, eight years before the Neander Valley type specimen. Significance was missed for decades.
- Paper: Bokelmann et al. (2019), *PNAS* 116:15610, "A genetic analysis of the Gibraltar Neanderthals" — DOI: 10.1073/pnas.1903984116
- Wikipedia: https://en.wikipedia.org/wiki/Gibraltar_1

### Spy 1 & Spy 2 — ~44.2–40.6 ka (recent redate)

- Namur, Belgium. Two partial skeletons (Spy 1 likely female, Spy 2 young male), found 1886 — among the first recognized Neanderthal post-cranial skeletons. Recent redate stripped glue contamination.
- Paper: Devièse et al. (2021), *PNAS* 118:e2022466118 — https://www.pnas.org/doi/10.1073/pnas.2022466118
- Wikipedia: https://en.wikipedia.org/wiki/Spy_Cave
- Reconstruction: Kennis brothers ("Wilma" / Spy bust) at the Royal Belgian Institute of Natural Sciences.

### Altamura Man — ~150 ka

- Lamalunga Cave, Apulia, Italy. Near-complete skeleton encased in cave-coral calcite — cannot be removed; studied in situ. Yielded oldest Neanderthal mtDNA fragment at the time.
- Paper: Lari et al. (2015), *J. Hum. Evol.* 82:88 — DOI: 10.1016/j.jhevol.2015.02.007
- Wikipedia: https://en.wikipedia.org/wiki/Altamura_Man

## Denisovans

### Denisova 3 finger bone — ~50–76 ka

- Denisova Cave, Altai. Distal phalanx of a young female. Morphologically nondescript — famous because mtDNA, then nuclear DNA, revealed an entirely new sister lineage to Neanderthals.
- Paper: Krause et al. (2010), *Nature* 464:894 — DOI: 10.1038/nature08976

### Xiahe mandible (Baishiya Karst Cave) — ≥160 ka

- Tibetan Plateau, China; ~3,280 m elevation. Right half of a robust mandible. **First Denisovan identified outside Denisova Cave** — assigned via paleoproteomics. Confirms Denisovan high-altitude adaptation long before *sapiens* arrived (relevant to modern Tibetan EPAS1 introgression).
- Paper: Chen et al. (2019), *Nature* 569:409 — DOI: 10.1038/s41586-019-1139-x
- Wikipedia: https://en.wikipedia.org/wiki/Xiahe_mandible

### Cobra Cave / Tam Ngu Hao 2 molar — 164–131 ka

- Annamite Mountains, northern Laos. Single lower molar; paleoproteomics indicate a young female Denisovan. **First Denisovan find in Southeast Asia** — extends the known range to tropical Asia, consistent with Denisovan ancestry in Papuans and Aboriginal Australians.
- Paper: Demeter et al. (2022), *Nature Communications* 13:2557 — DOI: 10.1038/s41467-022-29923-z

### Denisovan facial reconstruction from DNA methylation

- Methylation maps from Denisova 3 → predicted skeletal phenotype → reconstructed face. Predictions matched Xiahe mandible morphology when it came into view.
- Paper: Gokhman et al. (2019), *Cell* 179:180 — DOI: 10.1016/j.cell.2019.09.001
- Reconstruction: Maayan Harel — widely-circulated portrait of a juvenile female Denisovan. AAAS People's Choice 2019.

## Early *H. sapiens* in Africa

### Jebel Irhoud — 315 ± 34 ka

- Already covered. Appearance angle: **modern face** (small, retracted, sapiens-like dental and facial morphology) but **archaic braincase** (long, low, not yet globular). By ~300 ka, modern face had appeared but the rounded modern braincase had not.
- Reconstruction: Philipp Gunz / MPI-EVA digital reconstruction; Kennis brothers facial reconstruction widely reproduced.

### Omo Kibish I — ≥230 ka

- Already covered. Already gracile, modern-looking; high rounded vault, weak brows, distinct chin. The cleanest pre-200-ka anatomically modern *H. sapiens*.

### Florisbad — ~259 ± 35 ka

- Already covered. Brain volume ~1,440 cc. Mosaic: frontal curvature within modern range, anterior cranial fossa wide like Neanderthals, parietal endocranial features more archaic.

## Out-of-Africa *H. sapiens* with iconic skeletons

### Skhul V / Qafzeh 9 (Levant) — ~130–90 ka

- Already covered. Among the earliest anatomically modern humans outside Africa. High vertical forehead, rounded cranium, no occipital bun; lighter build than contemporary Levantine Neanderthals. Pierced *Nassarius* shell beads at Skhul = early symbolic ornaments.
- Reconstruction: Élisabeth Daynès Skhul V reconstruction.

### Mungo Man (LM3) / Mungo Lady (LM1) — ~40 ± 2 ka

- Lake Mungo, Willandra Lakes, NSW, Australia. LM1 — earliest known cremation. LM3 — ritual ochre burial of an adult male, hands crossed in lap, body sprinkled with red ochre, ~50 years old. Earlier sensational mtDNA claims (Adcock 2001) were rejected as contamination. Repatriated to Aboriginal custody.
- Paper: Bowler et al. (2003), *Nature* 421:837 — DOI: 10.1038/nature01383
- Wikipedia: https://en.wikipedia.org/wiki/Lake_Mungo_remains
- Reconstruction: not done — culturally sensitive.

### Cro-Magnon 1 ("Old Man of Cro-Magnon") — ~28 ka ¹⁴C BP

- Abri de Cro-Magnon, Dordogne, France. Adult male, found 1868. Type specimen of "Cro-Magnon"; tall, robust modern-human morphology, broad face and rectangular orbits; associated with Aurignacian tools. Popular shorthand for "European Upper Paleolithic *H. sapiens*."
- Wikipedia: https://en.wikipedia.org/wiki/Cro-Magnon_rock_shelter
- Reconstruction: Élisabeth Daynès for the Musée de l'Homme / Musée de Préhistoire.

### Sungir burials — ~30–34 ka cal BP

- near Vladimir, Russia. Adult male covered with ~3,000 mammoth-ivory beads, 12 pierced fox canines, 25 ivory armbands. Two children buried head-to-head with >10,000 ivory beads, ivory armbands, ~300 fox teeth, 16 ivory mammoth-tusk spears. Spectacular evidence of UP clothing, ornament, and ritual.
- Wikipedia: https://en.wikipedia.org/wiki/Sungir
- Reconstruction: Mikhail Gerasimov (Soviet sculptor-anthropologist) of Sungir 1; clothing/bead reconstructions by O. Soffer.

### Dolní Věstonice (Pavlovian) — ~26–29 ka BP

- South Moravia, Czech Republic. Multiple Gravettian/Pavlovian burials including a triple burial. DV3 — a young woman with facial asymmetry from a possible developmental disorder; her face appears engraved on a small ivory plaque (one of the earliest portraits). Site holds the **earliest known fired-ceramic figurines**, including the Venus of Dolní Věstonice.
- Wikipedia: https://en.wikipedia.org/wiki/Doln%C3%AD_V%C4%9Bstonice_(archaeological_site)
- Reconstruction: Daynès reconstruction of the DV3 woman.

### Tianyuan Man — ~40 ka

- Already covered. Genome-wide data: an early East Asian closely related to ancestors of present-day Asians and Native Americans, but already diverged from the lineage leading to Europeans. Carries detectable Neanderthal but no excess Denisovan ancestry. Surprising affinity to a 35-ka European (Goyet Q116-1).

### Ust'-Ishim Man — ~45 ka

- Bank of the Irtysh, western Siberia. Single femur. **Oldest high-coverage modern-human genome** at time of publication. Carries ~2% Neanderthal ancestry in long unbroken segments — places the Neanderthal-sapiens admixture pulse 7,000–13,000 years before he lived (so ~50–60 ka).
- Paper: Fu et al. (2014), *Nature* 514:445 — DOI: 10.1038/nature13810
- Wikipedia: https://en.wikipedia.org/wiki/Ust%27-Ishim_man

### Kostenki 14 / Markina Gora — ~38.7–36.2 ka

- Voronezh Oblast, Russia. Near-complete skeleton, flexed burial. Genome shows Kostenki 14 was already part of the meta-population ancestral to later Europeans — establishing European genetic continuity stretching back >36 ka, with early gene flow with Near Eastern populations.
- Paper: Seguin-Orlando et al. (2014), *Science* 346:1113 — DOI: 10.1126/science.aaa0114
- Reconstruction: Mikhail Gerasimov produced a famous bust ("Markina Gora") in the 1950s — an early example of skull-based facial reconstruction.

### Goyet Q116-1 — ~35,160–34,430 BP

- Goyet Caves, Belgium. Humerus fragment yielding genome-wide data. The "Goyet cluster" he typifies contributed ancestry to most later Europeans. Surprising affinity to Tianyuan Man hints at deep population structure across Eurasia in the early UP.
- Paper: Fu et al. (2016), *Nature* 534:200 — https://www.nature.com/articles/nature17993

### Zlatý kůň — >45 ka

- Bohemian Karst, Czech Republic. Adult female skull. Genome carries ~3% Neanderthal ancestry in unusually long blocks. Belongs to a population that **left no descendants in present-day humans** — a very early dispersal that did not survive. Distantly related to the Ranis individuals.
- Paper: Prüfer et al. (2021), *Nature Ecology & Evolution* 5:820 — DOI: 10.1038/s41559-021-01443-x
- Wikipedia: https://en.wikipedia.org/wiki/Zlat%C3%BD_k%C5%AF%C5%88_(skull)
- Reconstruction: Cícero Moraes 3D facial approximation circulated 2021–22.

### Ranis (Ilsenhöhle) — ~45 ka

- Thuringia, Germany. Multiple individuals. Same small isolated population as Zlatý kůň. Their lineage represents the **deepest known split from the surviving Out-of-Africa branch.** Carries Neanderthal segments from the single shared admixture event of all non-Africans, dated to ~45–49 ka — places modern humans in northern Europe alongside Neanderthals at the same time.
- Papers: Sümer et al. (2025), *Nature* 638:711 — DOI: 10.1038/s41586-024-08420-x; Mylopotamitaki et al. (2024), *Nature* 626:341 — DOI: 10.1038/s41586-023-06923-7
- Reconstruction: Tom Björklund painting commissioned for MPI-EVA, 2024.

## Mesolithic & early Holocene "what they looked like" stars

These are too late for the strict Out-of-Africa story, but iconic for **ancient-DNA-based appearance** and important for the visualization's honesty about modern preconceptions.

### Cheddar Man — ~10,000 BP

- Gough's Cave, Somerset, England. Near-complete skeleton, found 1903. 2018 ancient-DNA inference: **dark-to-black skin, blue/green eyes, dark curly hair** — typical of Western European Mesolithic hunter-gatherers, who had not yet acquired the SLC24A5/SLC45A2 light-skin variants that swept Europe in the Neolithic and Bronze Age.
- Paper: Brace et al. (2019), *Nature Ecology & Evolution* 3:765 — DOI: 10.1038/s41559-019-0871-9
- Wikipedia: https://en.wikipedia.org/wiki/Cheddar_Man
- Reconstruction: Adrie & Alfons Kennis (commissioned by NHM London, 2018).

### La Braña 1 — ~7,000 BP

- León, Spain. Mesolithic male hunter-gatherer. Genome shows **dark skin and blue eyes** — same combination as Cheddar Man.
- Paper: Olalde et al. (2014), *Nature* 507:225 — DOI: 10.1038/nature12960
- Wikipedia: https://en.wikipedia.org/wiki/La_Bra%C3%B1a_1
- Reconstruction: Élisabeth Daynès reconstruction widely circulated.

### Loschbour man — ~8,000 BP

- Heffingen, Luxembourg. Mesolithic male, near-complete skeleton. Same dark-skin + blue-eye allele combination. Genome co-published with Stuttgart Neolithic farmer in Lazaridis 2014 — established the three-ancestry model of Europeans (WHG + EEF + later ANE/Steppe).
- Paper: Lazaridis et al. (2014), *Nature* 513:409 — DOI: 10.1038/nature13673
- Wikipedia: https://en.wikipedia.org/wiki/Loschbour_man

### Kennewick Man / "The Ancient One" — ~8,500–9,000 cal BP

- Columbia River, Washington, USA. Initially controversial because of "Caucasoid"-described cranial morphology. Genome-wide ancient DNA showed Kennewick Man is closer to **modern Native Americans** than to any other living population — particularly to the Confederated Tribes of the Colville Reservation. Repatriated and reburied 2017.
- Paper: Rasmussen et al. (2015), *Nature* 523:455 — DOI: 10.1038/nature14625
- Wikipedia: https://en.wikipedia.org/wiki/Kennewick_Man

### Naia (Hoyo Negro) — ~12,000–13,000 BP

- Sac Actun cave system, Yucatán, Mexico (~40 m underwater). ~15–16-year-old female. Among the most complete early-Americas skeletons. mtDNA haplogroup D1 — a Beringian-derived founding lineage. Resolves the apparent "different cranial morphology vs. Asian-derived ancestry" puzzle.
- Paper: Chatters et al. (2014), *Science* 344:750 — https://www.science.org/doi/10.1126/science.1252619
- Wikipedia: https://en.wikipedia.org/wiki/Hoyo_Negro

## Ancient-DNA pigmentation overview

- **Cheddar Man / Loschbour / La Braña** (Brace 2019, Lazaridis 2014, Olalde 2014): the **dark-skin + light-eye** combination was widespread across **Western European Mesolithic hunter-gatherers**.
- **SLC24A5** derived ("light-skin") allele was already at high frequency in **Anatolian Neolithic farmers** (~9–8 ka) and rose to ~0.9 in Early Neolithic Europe primarily by **migration**, not local selection.
- **SLC45A2** lightening swept Europe more recently, ~5–8 ka.
- **Lactase persistence** (LCT/MCM6 -13910*T) was still rare through the Bronze Age — even after dairy farming had been practiced for thousands of years.
- **HERC2/OCA2 blue-eye allele** is detected in WHG individuals before light-skin alleles fixed.
- Reference: Mathieson et al. (2015), *Nature* 528:499 — DOI: 10.1038/nature16152.

**Takeaway for the visualization:** the medieval-art image of pale, fair-haired Europeans is a Bronze-Age-and-later phenomenon. Pre-Neolithic Europeans were dark-skinned. Light skin in Europe is recent and arrived largely via migration from Anatolia and the Eurasian Steppe. **This must be visible in the visualization, not buried in a footnote.**

---

## Notes for the data schema

Every milestone should carry a **`confidence`** field — `well-established` / `debated` / `contested` — because the strength of evidence varies enormously across the list. Madjedbebe and Chiquihuite cannot be displayed identically. The visualization must show the difference.

Suggested per-milestone fields:

`id`, `title`, `category` (`fossil` / `branch` / `admixture` / `tool` / `art` / `climate` / `settlement`), `date_min`, `date_max`, `lat`, `lon`, `region`, `confidence`, `description`, `paper_doi`, `wikipedia_url`, `video_url`, `appearance` (optional, per DESIGN.md schema), `notes`.

Source channels recommended:

- **Reputable for general audiences:** PBS Eons, Stefan Milo, Royal Institution, Crash Course, university lectures, BBC, Smithsonian.
- **Avoid:** Survive the Jive (ideological framing leaks into otherwise-academic content). Other speculative pop channels are case-by-case.
