# NLP Cheat Sheet: spaCy POS, DEP, and TAG

```markdown
| Type   | Code      | Meaning                               | Example                     |
|--------|-----------|---------------------------------------|-----------------------------|
| POS    | NOUN      | Common noun                           | theory, scientist           |
| POS    | PROPN     | Proper noun                           | Darwin, Newton              |
| POS    | VERB      | Main verb                             | discover, evolve            |
| POS    | AUX       | Auxiliary verb                        | is, was                     |
| POS    | ADJ       | Adjective                             | natural, famous             |
| POS    | ADV       | Adverb                                | quickly, very               |
| POS    | ADP       | Preposition                           | in, by, of                  |
| POS    | CCONJ     | Coordinating conjunction              | and, or                     |
| POS    | SCONJ     | Subordinating conjunction             | although, because           |
| POS    | DET       | Determiner                            | the, a, this                |
| POS    | PRON      | Pronoun                               | he, it                      |
| POS    | NUM       | Number                                | three, first                |
| POS    | PART      | Particle                              | to (in 'to go')             |
| POS    | PUNCT     | Punctuation                           | ., !, ?                     |
| POS    | SYM       | Symbol                                | $, %, §                     |
| POS    | X         | Other / unknown                       | —                           |
| DEP    | nsubj     | Nominal subject                       | Darwin discovered gravity   |
| DEP    | nsubjpass | Passive subject                       | Theory was proposed         |
| DEP    | dobj      | Direct object                         | discovered laws             |
| DEP    | iobj      | Indirect object                       | gave students the answer    |
| DEP    | pobj      | Object of preposition                 | evolution by selection      |
| DEP    | attr      | Attribute of subject                  | Darwin was a scientist      |
| DEP    | acomp     | Adjectival complement                 | is famous                   |
| DEP    | prep      | Prepositional modifier                | laws of motion              |
| DEP    | conj      | Conjunct in coordination              | physicist and mathematician |
| DEP    | cc        | Coordinating conjunction              | and, or                     |
| DEP    | amod      | Adjectival modifier                   | natural selection           |
| DEP    | compound  | Compound noun modifier                | cell membrane               |
| DEP    | appos     | Apposition                            | Darwin, a scientist         |
| DEP    | relcl     | Relative clause modifier              | scientist who discovered    |
| DEP    | mark      | Marker (subordinators)                | although, if                |
| DEP    | xcomp     | Open clausal complement               | help explain                |
| TAG    | NN        | Noun, singular                        | scientist                   |
| TAG    | NNS       | Noun, plural                          | laws                        |
| TAG    | NNP       | Proper noun, singular                 | Newton                      |
| TAG    | VB        | Verb, base form                       | discover                    |
| TAG    | VBD       | Verb, past tense                      | discovered                  |
| TAG    | VBG       | Verb, gerund/present participle       | developing                  |
| TAG    | VBN       | Verb, past participle                 | discovered                  |
| TAG    | VBP       | Verb, non-3rd person singular present | discover                    |
| TAG    | VBZ       | Verb, 3rd person singular present     | discovers                   |
| TAG    | JJ        | Adjective                             | natural                     |
| TAG    | RB        | Adverb                                | quickly                     |
| TAG    | IN        | Preposition or sub-conjunction        | of, by, although            |
| TAG    | CC        | Coordinating conjunction              | and                         |
```