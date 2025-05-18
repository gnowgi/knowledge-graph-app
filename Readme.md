# Knowledge Graph App

## Overview

**Knowledge Graph App** is an open,  inter-operable, interactive tool for building, visualizing, and editing scientific and semantic knowledge as a graph of propositions encoded in an open standard (RDF). It is evolving as a **learning studio**, enabling learners to think like a scientist.  It is intended to be used by neo-literates to experts. Designed for clarity (rigor), and modularity without loosing expressiveness.  it enables users to construct, inspect, and extend both binary relations (connections between concepts) and attribute-value assignments (key-value properties), all using a user-friendly visual interface built with React and Blockly with an extensible graph-based backend. &#x20;

**Why?**
Because scientific knowledge is best represented as *composable propositions*—not just entities and links, but also statements about those entities, their attributes, and their relationships. This tool supports building knowledge that is both human-readable and machine-actionable.

---

## Key Features

* **Modular Propositions:**
  Every piece of knowledge is a proposition—either a relation (subject–predicate–object) or an attribute assignment (subject–attribute–value).

* **Node-Centric Composition:**
  Clicking a node presents a full, readable stack of everything known about it: all its relations (grouped by type), all its attribute-value pairs, and all quantifiers or qualifiers: "All -  human beings - belong to → living creatures"; "Isaac Newton - date of birth → 1643-01-04.

* **Grouped Relations:**
  If a node has several outgoing edges of the same relation type, they’re grouped visually for clarity—e.g.,
  “Isaac Newton -  member of → Human being, Scientist, Mathematician”
  appears as one grouped block.

\[Image Placeholder]

* **Custom Attribute Blocks:**
  Attribute values are input and displayed using fields that match their data type (number, boolean, enum, date, etc.), ensuring semantic correctness and clean data export.

* **Backend Sync:**
  All propositions are stored and retrieved via a Python (Flask/SQLite) backend, so what you see in the UI is what is stored in the knowledge base.

* **Block-Based UI:**
  Built on Blockly, every proposition is an editable, draggable block—no clutter, no hidden magic.

---

## Tech Stack

* **Frontend:** React, Blockly, modern JavaScript
* **Backend:** Python (Flask), SQLite
* **APIs:** REST endpoints for nodes, relations, attributes, and node-attribute assignments

---

## How It Works

1. **Add Nodes:**
   Create concepts or entities/individuals (e.g., “Water”, “Cell”, “Einstein”).

2. **Add Relations:**
   Link nodes via named relations (“is a”, “part of”, “member of”, etc.), with group support for one-to-many relations.

3. **Add Attributes:**
   Assign data-rich properties to nodes (e.g., “boiling point: 100°C”), with full type and value validation.

4. **Compose Node Profiles:**
   Clicking a node injects a compose block with:

   * The node
   * All its outgoing relations, grouped by type
   * All its attribute-value blocks

5. **Visual Edit and Export:**
   Drag, reorder, or edit blocks. Export the entire proposition stack for backend updates or downstream tools.

---

## Example

A knowledge profile for **Water** might look like:

* **\[Water]**

  * *is a* → \[Compound]
  *  *part of of* → \[Hydrosphere], \[Hydrologic Cycle]
  * *boiling point*: 100\* \*
* {at room temperature} \[Water]

  * state: liquid

A summary of the node is parsed and structured according to POS (parts of speech), verb phrases, prepositions, logical connectives and so on, helping learners to bring meaning to the foreground.  &#x20;

---

## Philosophy

Words acquire meaning from its relationship with others, and not by themselves, basing on a sound **network theory of meaning.** This app is inspired by the needs of scientific reasoning, education, and semantic interoperability—where **knowledge is always a web of claims, not just disconnected nodes or edges**.
We build for **clarity (rigor), modularity, and extensibility**.

---

## Getting Started (for developers)

The App is not ready for end users as yet.

1. **Clone the repo:**

   ```
   git clone https://github.com/gnowgi/knowledge-graph-app.git
   cd knowledge-graph-app
   ```

2. **Install dependencies and run:**

   * Backend: `cd backend && pip install -r requirements.txt && python app.py`
   * Frontend: `cd frontend && npm install && npm start`

3. **Open **[**http://localhost:8080**](http://localhost:8080)** in your browser.**

---

## Roadmap

* Full proposition extraction/export in a controlled natural language (CNL)
* Saving visualizations in SVG and other image formats.
* A quantitative rubric to compute knowledge base profile
* Support for

  * &#x20;Process Modeling using Petri Nets
  * Procedural Knowledge (Scratch/Logo)
  * Concept Mapping
  * Logic:

    * first order and second order calculus
  * model based reasoning
  * data analysis and visualization
  * collaboration

\*(Coming soon)  \*

---

## License

AGPL v3

---

*For issues, suggestions, or contributions, please open an issue or submit a pull request*
