-- Attributes (Properties)
CREATE TABLE attributes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    data_type TEXT NOT NULL, -- e.g. integer, float, string, boolean, date, array
    allowed_values TEXT,     -- comma-separated or JSON string for enums
    unit TEXT,
    applicable_nodes TEXT    -- JSON array of page IDs (nodes that can have this attribute)
);

-- Pages (Nodes)
CREATE TABLE pages (
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
    source_page_id INTEGER NOT NULL,
    target_page_id INTEGER NOT NULL,
    relation_type_id INTEGER NOT NULL,
    FOREIGN KEY(source_page_id) REFERENCES pages(id),
    FOREIGN KEY(target_page_id) REFERENCES pages(id),
    FOREIGN KEY(relation_type_id) REFERENCES relation_types(id)
);

-- Node Attributes: links nodes to attributes and stores values
CREATE TABLE node_attributes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id INTEGER NOT NULL,
    attribute_id INTEGER NOT NULL,
    value TEXT,
    quantifier TEXT, -- e.g. all, some, none
    FOREIGN KEY(node_id) REFERENCES pages(id),
    FOREIGN KEY(attribute_id) REFERENCES attributes(id)
);
-- Sample data
INSERT INTO pages (id, title) VALUES (1, 'Photosynthesis'), (2, 'Biology'), (3, 'Life Sciences');
INSERT INTO relation_types (id, name, is_symmetric, is_transitive) VALUES (1, 'is part of', 0, 1);
INSERT INTO relations (source_page_id, target_page_id, relation_type_id) VALUES
    (1, 2, 1),
    (2, 3, 1);
