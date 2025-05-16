-- Attributes (Properties)
CREATE TABLE attributes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    data_type TEXT NOT NULL, -- e.g. integer, float, string, boolean, date, array
    allowed_values TEXT,     -- comma-separated or JSON string for enums
    unit TEXT
);

-- Nodes
CREATE TABLE nodes (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    is_instance INTEGER DEFAULT 0
);

-- Relation Types (Semantics)
CREATE TABLE relation_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    inverse_name TEXT,
    is_symmetric INTEGER DEFAULT 0,
    is_transitive INTEGER DEFAULT 0,
    description TEXT
);

-- Relations (Edges)
CREATE TABLE relations (
    id INTEGER PRIMARY KEY,
    source_node_id INTEGER NOT NULL,
    target_node_id INTEGER NOT NULL,
    relation_type_id INTEGER NOT NULL,
    modality TEXT,
    subject_quantifier TEXT, 
    object_quantifier TEXT,
    FOREIGN KEY(source_node_id) REFERENCES nodes(id),
    FOREIGN KEY(target_node_id) REFERENCES nodes(id),
    FOREIGN KEY(relation_type_id) REFERENCES relation_types(id)
);

-- Node Attributes: links nodes to attributes and stores values
CREATE TABLE node_attributes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id INTEGER NOT NULL,
    attribute_id INTEGER NOT NULL,
    value TEXT,
    modality TEXT,
    quantifier TEXT, -- e.g. all, some, none
    FOREIGN KEY(node_id) REFERENCES nodes(id),
    FOREIGN KEY(attribute_id) REFERENCES attributes(id)
);

CREATE TABLE IF NOT EXISTS possible_node_attributes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id INTEGER NOT NULL,
    attribute_id INTEGER NOT NULL,
    FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE,
    UNIQUE(node_id, attribute_id) -- prevents duplicates
);

-- Add the qualifier field to nodes table
ALTER TABLE nodes ADD COLUMN qualifier TEXT;

-- Create a uniqueness constraint over (title, qualifier)
CREATE UNIQUE INDEX idx_nodes_title_qualifier ON nodes(title, qualifier);


-- Insert commonly used relations
INSERT INTO relation_types (name, inverse_name, is_symmetric, is_transitive, description) VALUES
('is_part_of', 'has_part', 'no', 'no', 'Indicates that an entity is a component of a larger entity. Example: An electron is_part_of an atom.'),
('has_part', 'is_part_of', 'no', 'no', 'Indicates that an entity contains a component. Example: An atom has_part an electron.'),
('causes', 'is_caused_by', 'no', 'no', 'Describes a causal relationship between events or phenomena. Example: A force causes acceleration.'),
('is_caused_by', 'causes', 'no', 'no', 'Indicates an event or phenomenon resulting from a cause. Example: Acceleration is_caused_by a force.'),
('interacts_with', 'interacts_with', 'yes', 'no', 'Represents an interaction between two entities. Example: A protein interacts_with another protein in a signaling pathway.'),
('depends_on', 'is_depended_on', 'no', 'yes', 'Shows dependency of one entity on another. Example: A chemical reaction depends_on a catalyst.'),
('is_depended_on', 'depends_on', 'no', 'yes', 'Indicates an entity that others depend on. Example: A catalyst is_depended_on by a chemical reaction.'),
('is_a', 'is_a_type_of', 'no', 'yes', 'Denotes a classification or type relationship. Example: A mammal is_a vertebrate.'),
('is_a_type_of', 'is_a', 'no', 'yes', 'Indicates a category that an entity belongs to. Example: A vertebrate is_a_type_of animal.'),
('relates_to', 'relates_to', 'yes', 'no', 'A general relationship between concepts with shared context. Example: Calculus relates_to physics in motion studies.'),
('produces', 'is_produced_by', 'no', 'no', 'Shows that an entity creates another. Example: A nuclear reaction produces energy.'),
('is_produced_by', 'produces', 'no', 'no', 'Indicates an entity created by another. Example: Energy is_produced_by a nuclear reaction.'),
('contains', 'is_contained_in', 'no', 'no', 'Describes containment of one entity within another. Example: A cell contains a nucleus.'),
('is_contained_in', 'contains', 'no', 'no', 'Indicates an entity is within another. Example: A nucleus is_contained_in a cell.'),
('is_similar_to', 'is_similar_to', 'yes', 'no', 'Denotes similarity between entities. Example: A wave in physics is_similar_to a wave in mathematics.'),
('influences', 'is_influenced_by', 'no', 'no', 'Indicates an entity affects another. Example: A magnetic field influences charged particles.'),
('is_influenced_by', 'influences', 'no', 'no', 'Shows an entity affected by another. Example: Charged particles is_influenced_by a magnetic field.'),
('encodes', 'is_encoded_by', 'no', 'no', 'Indicates a gene encodes a protein. Example: The insulin gene encodes the insulin protein.'),
('is_encoded_by', 'encodes', 'no', 'no', 'Shows a protein is produced from a gene. Example: The insulin protein is_encoded_by the insulin gene.'),
('regulates', 'is_regulated_by', 'no', 'no', 'Describes a molecule controlling a biological process. Example: A transcription factor regulates gene expression.'),
('is_regulated_by', 'regulates', 'no', 'no', 'Indicates a process controlled by a molecule. Example: Gene expression is_regulated_by a transcription factor.'),
('is_homologous_to', 'is_homologous_to', 'yes', 'no', 'Denotes evolutionary similarity between genes or proteins. Example: Human hemoglobin is_homologous_to chimpanzee hemoglobin.'),
('expresses', 'is_expressed_in', 'no', 'no', 'Shows a gene being expressed in a tissue. Example: The opsin gene expresses in retinal cells.'),
('is_expressed_in', 'expresses', 'no', 'no', 'Indicates a tissue where a gene is active. Example: Retinal cells is_expressed_in by the opsin gene.'),
('mutates_to', 'is_mutated_from', 'no', 'no', 'Describes a gene changing to a variant. Example: A normal BRCA1 gene mutates_to a mutant BRCA1 gene.'),
('is_mutated_from', 'mutates_to', 'no', 'no', 'Shows a variant gene derived from an original. Example: A mutant BRCA1 gene is_mutated_from a normal BRCA1 gene.'),
('governs', 'is_governed_by', 'no', 'no', 'Indicates a law or principle controlling a phenomenon. Example: Newton''s second law governs acceleration.'),
('is_governed_by', 'governs', 'no', 'no', 'Shows a phenomenon controlled by a law. Example: Acceleration is_governed_by Newton''s second law.'),
('propagates_through', 'is_propagated_by', 'no', 'no', 'Describes a wave moving through a medium. Example: Light propagates_through a vacuum.'),
('is_propagated_by', 'propagates_through', 'no', 'no', 'Indicates a medium allowing wave movement. Example: A vacuum is_propagated_by light.'),
('induces', 'is_induced_by', 'no', 'no', 'Shows a field causing an effect. Example: A magnetic field induces an electric current.'),
('is_induced_by', 'induces', 'no', 'no', 'Indicates an effect caused by a field. Example: An electric current is_induced_by a magnetic field.'),
('conserves', 'is_conserved_by', 'no', 'yes', 'Denotes a quantity preserved in a system. Example: Energy conserves in an isolated system.'),
('is_conserved_by', 'conserves', 'no', 'yes', 'Shows a system preserving a quantity. Example: An isolated system is_conserved_by energy.'),
('bonds_with', 'is_bonded_to', 'yes', 'no', 'Indicates atoms forming a chemical bond. Example: Hydrogen bonds_with oxygen in water.'),
('is_bonded_to', 'bonds_with', 'yes', 'no', 'Shows an atom connected via a bond. Example: Oxygen is_bonded_to hydrogen in water.'),
('catalyzes', 'is_catalyzed_by', 'no', 'no', 'Describes an enzyme speeding up a reaction. Example: Catalase catalyzes hydrogen peroxide decomposition.'),
('is_catalyzed_by', 'catalyzes', 'no', 'no', 'Indicates a reaction sped up by an enzyme. Example: Hydrogen peroxide decomposition is_catalyzed_by catalase.'),
('reacts_with', 'reacts_with', 'yes', 'no', 'Shows substances undergoing a chemical reaction. Example: Sodium reacts_with chlorine to form sodium chloride.'),
('is_oxidized_by', 'reduces', 'no', 'no', 'Denotes a substance losing electrons. Example: Iron is_oxidized_by oxygen in rusting.'),
('reduces', 'is_oxidized_by', 'no', 'no', 'Indicates a substance gaining electrons. Example: Oxygen reduces iron in rusting.');

INSERT INTO attributes (name, data_type, allowed_values, unit, description) VALUES
('mass', 'float', '', 'kilogram (kg)', 'Measures the amount of matter in an object. Example: A planet has a mass of 5.972 × 10^24 kg.'),
('velocity', 'float', '', 'meters per second (m/s)', 'Describes the rate of change of position. Example: A car has a velocity of 20 m/s.'),
('energy', 'float', '', 'joule (J)', 'Quantifies the capacity to do work. Example: A photon carries energy of 2.0 × 10^-19 J.'),
('charge', 'float', '', 'coulomb (C)', 'Measures electric charge. Example: An electron has a charge of -1.602 × 10^-19 C.'),
('temperature', 'float', '', 'kelvin (K)', 'Indicates thermal energy level. Example: Water boils at a temperature of 373.15 K at standard pressure.'),
('concentration', 'float', '', 'moles per liter (mol/L)', 'Measures solute amount per unit volume. Example: A saline solution has a concentration of 0.9 mol/L NaCl.'),
('pH', 'float', '0 to 14', '', 'Measures acidity or basicity. Example: Lemon juice has a pH of 2.0.'),
('wavelength', 'float', '', 'nanometer (nm)', 'Distance between wave peaks. Example: Blue light has a wavelength of 450 nm.'),
('frequency', 'float', '', 'hertz (Hz)', 'Number of wave cycles per second. Example: A radio wave has a frequency of 100 MHz.'),
('volume', 'float', '', 'cubic meter (m³)', 'Measures space occupied. Example: A container has a volume of 0.001 m³.'),
('density', 'float', '', 'kilogram per cubic meter (kg/m³)', 'Mass per unit volume. Example: Water has a density of 1000 kg/m³.'),
('atomic_number', 'integer', '', 'none', 'Number of protons in an atom’s nucleus. Example: Carbon has an atomic_number of 6.'),
('molecular_weight', 'float', '', 'grams per mole (g/mol)', 'Mass of one mole of a substance. Example: Water has a molecular_weight of 18.015 g/mol.'),
('gene_length', 'integer', '', 'base pairs (bp)', 'Number of nucleotide base pairs in a gene. Example: The CFTR gene has a gene_length of 250,000 bp.'),
('expression_level', 'float', '', 'none', 'Quantifies gene or protein activity. Example: A gene has an expression_level of 5.2 in liver cells.'),
('cardinality', 'integer', '', 'none', 'Number of elements in a set. Example: The set {1, 2, 3} has a cardinality of 3.'),
('dimension', 'integer', '', 'none', 'Number of independent coordinates. Example: A cube has a dimension of 3.'),
('area', 'float', '', 'square meter (m²)', 'Measures surface extent. Example: A rectangle has an area of 12 m².'),
('angle', 'float', '', 'radian (rad)', 'Measures rotation between two rays. Example: A right angle has an angle of π/2 rad.'),
('entropy', 'float', '', 'joules per kelvin (J/K)', 'Measures disorder or uncertainty. Example: A gas system has an entropy of 50 J/K.'),
('mutation_rate', 'float', '', 'mutations per generation', 'Frequency of genetic mutations. Example: A gene has a mutation_rate of 10^-8 mutations per generation.'),
('cell_size', 'float', '', 'micrometer (µm)', 'Physical size of a cell. Example: A red blood cell has a cell_size of 7 µm in diameter.'),
('replication_rate', 'float', '', 'cells per hour', 'Rate of cell division. Example: E. coli has a replication_rate of 2 cells per hour under optimal conditions.'),
('photosynthetic_efficiency', 'float', '0 to 1', 'none', 'Fraction of light energy converted to chemical energy. Example: A plant has a photosynthetic_efficiency of 0.06.'),
('metabolic_rate', 'float', '', 'watts (W)', 'Rate of energy expenditure. Example: A human has a metabolic_rate of 100 W at rest.'),
('chromosome_number', 'integer', '', 'none', 'Number of chromosomes in a cell. Example: Humans have a chromosome_number of 46.'),
('electronegativity', 'float', '', 'none', 'Tendency to attract electrons. Example: Fluorine has an electronegativity of 3.98.'),
('boiling_point', 'float', '', 'kelvin (K)', 'Temperature at which a substance boils. Example: Water has a boiling_point of 373.15 K.'),
('solubility', 'float', '', 'grams per liter (g/L)', 'Amount of solute that dissolves in a solvent. Example: NaCl has a solubility of 360 g/L in water.'),
('reaction_rate', 'float', '', 'moles per liter per second (mol/L/s)', 'Speed of a chemical reaction. Example: A reaction has a reaction_rate of 0.01 mol/L/s.'),
('bond_dissociation_energy', 'float', '', 'kilojoules per mole (kJ/mol)', 'Energy required to break a bond. Example: The C-H bond has a bond_dissociation_energy of 413 kJ/mol.'),
('elevation', 'float', '', 'meters (m)', 'Height above sea level. Example: Mount Everest has an elevation of 8,848 m.'),
('latitude', 'float', '-90 to 90', 'degrees (°)', 'Angular distance north or south of the equator. Example: New York City has a latitude of 40.7128° N.'),
('longitude', 'float', '-180 to 180', 'degrees (°)', 'Angular distance east or west of the prime meridian. Example: New York City has a longitude of 74.0060° W.'),
('precipitation', 'float', '', 'millimeters per year (mm/yr)', 'Amount of rainfall or snowfall. Example: The Amazon rainforest has a precipitation of 2,000 mm/yr.'),
('surface_area', 'float', '', 'square kilometer (km²)', 'Extent of a surface. Example: Lake Superior has a surface_area of 82,100 km².'),
('population_density', 'float', '', 'people per square kilometer (people/km²)', 'Number of people per unit area. Example: Tokyo has a population_density of 6,224 people/km².'),
('soil_ph', 'float', '0 to 14', '', 'Acidity or basicity of soil. Example: A farmland has a soil_ph of 6.5.'),
('tectonic_plate_velocity', 'float', '', 'centimeters per year (cm/yr)', 'Speed of plate movement. Example: The Pacific Plate has a tectonic_plate_velocity of 7 cm/yr.');
