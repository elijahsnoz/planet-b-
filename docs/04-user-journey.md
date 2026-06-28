# 04 · User Journey

## The emotional arc (the spine of the whole experience)
The brief names it; this is how we stage it on the homepage scroll:

| Stage | Trigger on screen | Feeling |
|---|---|---|
| **Silence** | A dark frame; a slowly breathing Earth; faint ambient sound (muted by default, invited on) | Stillness, arrival |
| **Curiosity** | A single line: *Because there is no Planet B.* The eye opens. | "What is this?" |
| **Wonder** | Scroll: discarded materials drift, assemble, become artworks | Awe |
| **Reflection** | A quote from an artist; a damaged watch ticking | "This is about us" |
| **Connection** | Faces of the 15 founders surface | "These are real people" |
| **Responsibility** | The Yoruba proverb; the planet watching back | "It rests in our hands" |
| **Hope** | Garbage → grace; a butterfly on a hand of waste | "It isn't too late" |
| **Action** | One clear invitation (explore the chapter / join / verify) | Movement |

Every scroll segment is skippable; the arc must also survive `prefers-reduced-motion` as a quiet, readable sequence.

## Journeys by visitor type

**The Curious Visitor (first-time public)**
Home threshold → emotional scroll → "Meet the founders" → one artist profile → one artwork up close → Origin Story → leaves moved, maybe shares. *Goal: feel something true in under 90 seconds.*

**The Artist (current founder)**
Direct link to their own profile → sees themselves treated as a museum subject → their certificate → shares the permanent URL. *Goal: pride and ownership.*

**The Artist (future applicant)**
Genesis Chapter → Artist Registry → "How it worked" → Community/Apply. *Goal: "I want to be in the next chapter."*

**The Researcher / Educator**
Arrives deep (cited link or search) → breadcrumb orientation → structured record with materials, dates, dimensions, sources → Research page → downloads catalogue/data, cites stable URL. *Goal: trust and citability.*

**The Partner / Embassy / Sponsor**
Partners page → their organization's role → the chapter they enabled → impact → shares proudly. *Goal: reflected prestige.*

**The Journalist**
Press room → kit, high-res assets, fact sheet, contact → existing coverage. *Goal: everything needed to publish accurately.*

## First 5 seconds (the make-or-break)
No header, no menu, no cookie wall covering content. Just the breathing Earth, the line, and the sound invitation. The institution earns attention before it asks for anything.

---

## Appendix — Founding People (source: catalogue). For [10 schema](10-database-schema.md) & [11 CMS](11-cms-structure.md).

**Diplomatic (Royal Norwegian Embassy, Abuja)**
- H. E. Mr. Svein Bæra — *Ambassador*
- Ms. Solveig Andresen — *Counsellor, Trade & Cultural Affairs* (also Organizing Committee)
- Ingrid Rollag Fosker — *Organizing Committee*

**Host (Nike Art Gallery / Foundation)**
- Chief Mrs. Nike Okundaye, Dr. Arts (h.c.) — *Founder/Director ("Mama Nike")*

**Workshop & Curatorial Team**
- Yusuf Durodola — *Lead Facilitator / Workshop Director*; Creative Director, YD Studio & Trash To Treasure Movement; Guinness World Record holder; Founder, Artegun Foundation
- Temitope Oladeji — *Co-Facilitator / Workshop Coordinator*; Project Lead, The Art Exential; panel **Moderator**
- Caroline Useh — *Co-Facilitator*; multidisciplinary artist (Delta State)
- Katurag Chinyio — *Asst. Workshop Director*
- Abdullahi Ibrahim — *IT Manager / Logistics Coordinator*; Graphics/Layout
- Lavender Onyenah — *Organizing Committee*

**Media & Documentation**
- Edge Media — *Media Team* · NTA — *broadcast documentation*
- Benjamin Oladapo — *Performance Photography*

**Panelists (Panel Discussion)**
- Temitope Oladeji — Moderator
- Ikechi Chris Ebuka — Programs Officer, Plogging Nigeria
- Zainab Mustapha Umara — Asst. Director, Environmental Quality Control, NESREA HQ Abuja
- Christianah Imoleayo Owoeye — CEO, Trash Monger Limited
- Yusuf Durodola — Panelist

**The 15 Founding Artists & their works** (all *Discarded items assemblage, 61×61cm, 2026* unless noted)
1. Udie Undie — *Reframing Rubbish*
2. **Ajayi Elijah Snoz — *The Watchful Eye*** (brand seed)
3. Abel Naomi Ufedo-Ojo — *Survival Spoon*
4. Abduljabbar Hasheem Saidu — *The Only Address*
5. Jesse Ojatta Ameje — *The Treasure Found*
6. Kaynan Peter — *Adorn Her, Grass to Grace*
7. Ngozi Akande (PhD) — *Starrs Everywhere*
8. Ahmed Michael — *Man, and His Environment*
9. Sadiq Abimbola Rukayat — *The Sum of Us*
10. Joel Friday — *Safe House*
11. Samuel Ilori — *A Call to Build*
12. Olowa Emmanuel Akorede — *Mai Kayan Marmari*
13. Buhari Sani Junaid — *Garbage to Grace*
14. Mbaya Aisha — *Gwarzo*
15. *(One additional selected artist — confirm name/work from full catalogue plates before publish.)*
+ Facilitator works exhibited: Caroline Useh — *Tomorrow* (cotton bias tapes on canvas/board); Yusuf Durodola — *Top Up* (discarded items assemblage & ink on board).

**Performance — *Òdàlè Dà'lẹ̀*** (curated by Temitope Oladeji; photo: Benjamin Oladapo)
- Yusuf Durodola (lead) · co-performers: Caroline Useh, Jesse Ojatta Ameje, Olowa Emmanuel Akorede, Shedrach Gabriel

### Elijah Snoz — multi-role profile (per founder's direction)
Ajayi Elijah Snoz is documented not simply as "MC" but with his full standing in the movement. His profile carries these roles and is built to **evolve as Planet B grows, without structural change** (the schema's multi-role model + an open-ended title set make this automatic):
- **Artist** — founding artist; *The Watchful Eye* (the brand-seed work)
- **Storyteller** & **Founding Narrator** — the MC/storyteller voice of the Genesis Chapter
- **Creative Technologist** — architect/builder of the Planet B platform
- **Future Founder of Planet B**

As his contributions grow, new roles are appended to the same `people` row (no new entity, no migration). He belongs to the **Founding Council** under both `founding_artist` and `key_collaborator` categories.

> **Consent note:** every profile is published only where "repository materials and permissions allow." Track a permission flag (`consent_status`) per person (see schema). No contributor becomes invisible ([Principle IV](00-PRINCIPLES.md)); visibility is gated only by consent, never hierarchy.
